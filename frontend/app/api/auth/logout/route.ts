import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
  res.cookies.set('smart_auth_token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return res;
}
