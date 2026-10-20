import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyPassword, signToken, AuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { loginId, password, captchaInput, portalRole } = body;

    if (!loginId || !password) {
      return NextResponse.json(
        { error: 'Login ID and Password are required.' },
        { status: 400 }
      );
    }

    const cleanLoginId = loginId.trim();

    // Verify Captcha if provided
    if (captchaInput !== undefined && captchaInput !== null) {
      const storedCaptcha = req.cookies.get('smart_captcha_val')?.value;
      if (storedCaptcha && captchaInput.trim().toLowerCase() !== storedCaptcha) {
        return NextResponse.json(
          { error: 'Security Captcha code is incorrect or expired. Please refresh and try again.' },
          { status: 400 }
        );
      }
    }

    let user: AuthUser | null = null;

    // Check Admins first if portalRole is ADMIN or loginId starts with ADM
    if (portalRole === 'ADMIN' || cleanLoginId.toUpperCase().startsWith('ADM')) {
      const admin = await queryOne<any>(
        'SELECT * FROM admins WHERE login_id = ? OR user_id = ? OR email = ?',
        [cleanLoginId, cleanLoginId, cleanLoginId]
      );

      if (admin) {
        const isMatch = await verifyPassword(password, admin.password_hash);
        if (isMatch) {
          user = {
            userId: admin.user_id,
            loginId: admin.login_id || admin.user_id,
            name: admin.name,
            email: admin.email,
            role: 'ADMIN',
            department: admin.access_level,
          };
        }
      }
    }

    // Check Faculty if user not found yet
    if (!user) {
      const faculty = await queryOne<any>(
        'SELECT * FROM faculty WHERE login_id = ? OR user_id = ? OR email = ? OR employee_code = ?',
        [cleanLoginId, cleanLoginId, cleanLoginId, cleanLoginId]
      );

      if (faculty) {
        const isMatch = await verifyPassword(password, faculty.password_hash);
        if (isMatch) {
          user = {
            userId: faculty.user_id,
            loginId: faculty.login_id || faculty.user_id,
            name: faculty.name,
            email: faculty.email,
            role: 'FACULTY',
            department: faculty.department,
          };
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid login credentials or account not found.' },
        { status: 401 }
      );
    }

    // Sign JWT
    const token = await signToken(user);

    const redirectPath = user.role === 'ADMIN' ? '/admin' : '/dashboard';

    const res = NextResponse.json({
      success: true,
      user,
      redirectTo: redirectPath,
      message: `Welcome back, ${user.name}!`,
    });

    res.cookies.set('smart_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return res;
  } catch (err: any) {
    console.error('[API/LOGIN] Error:', err);
    return NextResponse.json(
      { error: err?.message ? `Authentication service error: ${err.message}` : 'An unexpected server error occurred during authentication.' },
      { status: 500 }
    );
  }
}
