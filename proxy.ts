import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Routes that do NOT require authentication
const PUBLIC_PATHS = ['/', '/sign-in', '/forgot-password', '/api/auth/sign-in', '/api/auth/forgot-password'];

function isPublic(pathname: string): boolean {
  // All API routes return JSON so the client handles 401s — never redirect them
  if (pathname.startsWith('/api/')) return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always redirect /sign-up to /sign-in
  // if (pathname.startsWith('/sign-up')) {
  //   return NextResponse.redirect(new URL('/sign-in', req.url));
  // }

  // Always allow public paths and static assets
  if (isPublic(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/uploads')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(signInUrl);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    return NextResponse.next();
  } catch {
    // Token invalid or expired — clear it and redirect
    const signInUrl = new URL('/sign-in', req.url);
    const response = NextResponse.redirect(signInUrl);
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
