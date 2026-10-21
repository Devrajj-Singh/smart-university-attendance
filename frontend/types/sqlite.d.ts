declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(location: string, options?: any);
    prepare(sql: string): {
      all(...params: any[]): any[];
      get(...params: any[]): any;
      run(...params: any[]): { changes: number | bigint; lastInsertRowid?: number | bigint };
    };
    close(): void;
    exec(sql: string): void;
  }
}
