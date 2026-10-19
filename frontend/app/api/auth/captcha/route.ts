import { NextResponse } from 'next/server';

// Generates a random alphanumeric captcha code
export async function GET() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Create an encoded token or return code with a sign
  const res = NextResponse.json({
    captchaId: 'cap_' + Math.random().toString(36).substring(2, 9),
    code: code,
  });

  // Store captcha code in a short-lived HTTP cookie
  res.cookies.set('smart_captcha_val', code.toLowerCase(), {
    httpOnly: true,
    maxAge: 300, // 5 minutes
    path: '/',
    sameSite: 'lax',
  });

  return res;
}
