import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { Pool } from 'pg';
import { seedRealisticHistory } from './seedData';

const require = createRequire(import.meta.url);
let DatabaseSyncClass: any = null;
try {
  DatabaseSyncClass = require('node:sqlite').DatabaseSync;
} catch {
  // node:sqlite not present
}

let pgPool: Pool | null = null;
let sqliteDb: any = null;
let isPostgres = false;

// Check if PostgreSQL or SQLite should be used
function getDatabase() {
  if (sqliteDb || pgPool) {
    return { isPostgres, pgPool, sqliteDb };
  }

  const databaseUrl = process.env.DATABASE_URL;

  // If DATABASE_URL is explicitly set and not 'sqlite', try connecting to Postgres
  if (databaseUrl && !databaseUrl.startsWith('sqlite')) {
    try {
      pgPool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 2000,
      });
      isPostgres = true;
      return { isPostgres: true, pgPool, sqliteDb: null };
    } catch (e) {
      console.warn('[DB] PostgreSQL initialization failed, falling back to SQLite:', e);
      pgPool = null;
    }
  }

  // Find database path whether running from root or frontend directory
  let dbPath = path.resolve(process.cwd(), 'database/smart_attendance.db');
  if (!fs.existsSync(dbPath)) {
    dbPath = path.resolve(process.cwd(), '../database/smart_attendance.db');
  }
  if (!fs.existsSync(dbPath)) {
    dbPath = path.resolve(__dirname, '../../database/smart_attendance.db');
  }

  if (!DatabaseSyncClass) {
    throw new Error('SQLite driver (node:sqlite) is not supported in this Node environment and PostgreSQL is not connected.');
  }

  sqliteDb = new DatabaseSyncClass(dbPath);
  isPostgres = false;

  // Run SQLite migrations / seed checks
  migrateSqlite(sqliteDb);

  return { isPostgres: false, pgPool: null, sqliteDb };
}

function migrateSqlite(db: any) {
  try {
    const facultyCols = db.prepare('PRAGMA table_info(faculty)').all() as any[];
    const colNames = facultyCols.map(c => c.name);

    if (!colNames.includes('login_id')) {
      db.prepare('ALTER TABLE faculty ADD COLUMN login_id TEXT').run();
    }
    if (!colNames.includes('password_hash')) {
      db.prepare('ALTER TABLE faculty ADD COLUMN password_hash TEXT').run();
    }
    if (!colNames.includes('role')) {
      db.prepare('ALTER TABLE faculty ADD COLUMN role TEXT DEFAULT "FACULTY"').run();
    }

    const adminCols = db.prepare('PRAGMA table_info(admins)').all() as any[];
    const adminColNames = adminCols.map(c => c.name);

    if (!adminColNames.includes('login_id')) {
      db.prepare('ALTER TABLE admins ADD COLUMN login_id TEXT').run();
    }
    if (!adminColNames.includes('password_hash')) {
      db.prepare('ALTER TABLE admins ADD COLUMN password_hash TEXT').run();
    }
    if (!adminColNames.includes('role')) {
      db.prepare('ALTER TABLE admins ADD COLUMN role TEXT DEFAULT "ADMIN"').run();
    }

    // Default password hash for 'faculty123' and 'admin123'
    const defaultFacultyHash = '$2b$10$jWdbXbgPi1EPTGIZpCYKeuG83tmbDfiInZc2eNdiowm4z.stRS8dq';
    const defaultAdminHash = '$2b$10$VP6XcXYx0JPdwPry0.Sai.6/tUpkuqocpRKRsM4XyG6Ge7ykv5vdq';

    // Populate logins and hashes if missing
    db.prepare("UPDATE faculty SET login_id = 'F001', password_hash = ? WHERE user_id = 'FAC001'").run(defaultFacultyHash);
    db.prepare("UPDATE faculty SET login_id = 'F002', password_hash = ? WHERE user_id = 'FAC002'").run(defaultFacultyHash);
    db.prepare("UPDATE faculty SET login_id = 'F003', password_hash = ? WHERE user_id = 'FAC003'").run(defaultFacultyHash);

    // Ensure Faculty 4 exists
    const f4 = db.prepare("SELECT user_id FROM faculty WHERE user_id = 'FAC004'").get();
    if (!f4) {
      db.prepare("INSERT INTO faculty (user_id, login_id, name, email, employee_code, department, password_hash, role) VALUES ('FAC004', 'F004', 'Prof. Meera Singh', 'meera.singh@university.edu', 'EMP1004', 'Computer Science', ?, 'FACULTY')").run(defaultFacultyHash);
    }

    // Ensure Admin ADM001 exists
    const admin = db.prepare("SELECT user_id FROM admins WHERE user_id = 'ADM001'").get();
    if (!admin) {
      db.prepare("INSERT INTO admins (user_id, login_id, name, email, access_level, password_hash, role) VALUES ('ADM001', 'ADM001', 'Academic Dean Office', 'dean.academics@university.edu', 'SUPER_ADMIN', ?, 'ADMIN')").run(defaultAdminHash);
    } else {
      db.prepare("UPDATE admins SET login_id = 'ADM001', password_hash = ? WHERE user_id = 'ADM001'").run(defaultAdminHash);
    }

    // Ensure attendance_sessions has pairing_token and session_type
    const sessionCols = db.prepare('PRAGMA table_info(attendance_sessions)').all() as any[];
    const sessionColNames = sessionCols.map(c => c.name);
    if (!sessionColNames.includes('pairing_token')) {
      db.prepare('ALTER TABLE attendance_sessions ADD COLUMN pairing_token TEXT').run();
    }
    if (!sessionColNames.includes('window_override')) {
      db.prepare('ALTER TABLE attendance_sessions ADD COLUMN window_override INTEGER DEFAULT 0').run();
    }

    // Ensure faculty_delegations has status, session_id, approved_by, created_at
    const delCols = db.prepare('PRAGMA table_info(faculty_delegations)').all() as any[];
    const delColNames = delCols.map(c => c.name);
    if (!delColNames.includes('status')) {
      db.prepare("ALTER TABLE faculty_delegations ADD COLUMN status TEXT DEFAULT 'PENDING'").run();
    }
    if (!delColNames.includes('session_id')) {
      db.prepare('ALTER TABLE faculty_delegations ADD COLUMN session_id TEXT').run();
    }
    if (!delColNames.includes('approved_by')) {
      db.prepare('ALTER TABLE faculty_delegations ADD COLUMN approved_by TEXT').run();
    }
    if (!delColNames.includes('created_at')) {
      db.prepare('ALTER TABLE faculty_delegations ADD COLUMN created_at TEXT').run();
    }

    // Ensure attendance_records has device_id
    const recordCols = db.prepare('PRAGMA table_info(attendance_records)').all() as any[];
    if (!recordCols.map(c => c.name).includes('device_id')) {
      db.prepare('ALTER TABLE attendance_records ADD COLUMN device_id TEXT').run();
    }

    // Ensure clean distinct student names and realistic semester attendance history
    seedRealisticHistory(db);
  } catch (err) {
    console.error('[DB] SQLite migration error:', err);
  }
}

/**
 * Execute a query returning multiple rows.
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const { isPostgres, pgPool, sqliteDb } = getDatabase();
  const safeParams = params.map(p => (p === undefined ? null : p));

  if (isPostgres && pgPool) {
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const res = await pgPool.query(pgSql, safeParams);
    return res.rows as T[];
  }

  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...safeParams) as T[];
  }

  throw new Error('No database available');
}

/**
 * Execute a query returning a single row or null.
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute an INSERT, UPDATE, or DELETE query.
 */
export async function execute(sql: string, params: any[] = []): Promise<{ changes: number }> {
  const { isPostgres, pgPool, sqliteDb } = getDatabase();
  const safeParams = params.map(p => (p === undefined ? null : p));

  if (isPostgres && pgPool) {
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const res = await pgPool.query(pgSql, safeParams);
    return { changes: res.rowCount || 0 };
  }

  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    const result = stmt.run(...safeParams);
    return { changes: Number(result.changes) };
  }

  throw new Error('No database available');
}

export function isUsingPostgres(): boolean {
  return isPostgres;
}
