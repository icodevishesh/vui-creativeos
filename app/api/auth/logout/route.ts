import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

/**
 * POST /api/auth/logout
 * Clears the auth_token cookie and invalidates the session.
 */
export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });

  // Expire the cookie immediately
  const cookie = serialize('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.headers.set('Set-Cookie', cookie);
  return response;
}
