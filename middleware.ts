import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Exact public routes only
const PUBLIC_PATHS = [
  '/',
  '/sign-in',
  '/forgot-password',
  '/api/auth/sign-in',
  '/api/auth/forgot-password',
];


function isPublic(pathname: string): boolean {
  // Allow API routes
  if (pathname.startsWith('/api/')) return true;

  // Exact match only
  return PUBLIC_PATHS.includes(pathname);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/uploads') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Public routes
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth_token')?.value;

  // No token → redirect to sign in
  if (!token) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(signInUrl);
  }

  let userType = '';

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    userType = (payload as { userType?: string }).userType ?? '';
  } catch {
    const signInUrl = new URL('/sign-in', req.url);

    const response = NextResponse.redirect(signInUrl);

    response.cookies.set('auth_token', '', {
      maxAge: 0,
      path: '/',
    });

    return response;
  }

  const isClient =
    userType === 'CLIENT' || userType === 'CLIENT_MEMBER';

  const isAdmin =
    userType === 'ADMIN_OWNER' ||
    userType === 'ORGANIZATION_MEMBER';

  // CLIENT can access ONLY /portal/*
  if (isClient) {
    if (
      pathname !== '/portal' &&
      !pathname.startsWith('/portal/')
    ) {
      return NextResponse.redirect(
        new URL('/portal/dashboard', req.url)
      );
    }
  }

  // ADMIN cannot access portal
  if (isAdmin) {
    if (
      pathname === '/portal' ||
      pathname.startsWith('/portal/')
    ) {
      return NextResponse.redirect(
        new URL('/dashboard', req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};



// import { NextRequest, NextResponse } from 'next/server';
// import { jwtVerify } from 'jose';

// const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// // Routes that do NOT require authentication
// const PUBLIC_PATHS = ['/', '/sign-in', '/forgot-password', '/api/auth/sign-in', '/api/auth/forgot-password'];

// // Admin-only route prefixes — CLIENTs must never reach these
// const ADMIN_PREFIXES = [
//   '/dashboard',
//   '/clients',
//   '/projects',
//   '/tasks',
//   '/members',
//   '/analytics',
//   '/approvals',
//   '/calendar',
//   '/settings',
//   '/gantt',
// ];

// function isPublic(pathname: string): boolean {
//   // All API routes return JSON so the client handles 401s — never redirect them
//   if (pathname.startsWith('/api/')) return true;
//   return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
// }

// export async function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;

//   // Always allow public paths and static assets
//   if (isPublic(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/uploads')) {
//     return NextResponse.next();
//   }

//   const token = req.cookies.get('auth_token')?.value;

//   if (!token) {
//     const signInUrl = new URL('/sign-in', req.url);
//     signInUrl.searchParams.set('from', pathname);
//     return NextResponse.redirect(signInUrl);
//   }

//   let userType: string;
//   try {
//     const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
//     userType = (payload as { userType?: string }).userType ?? '';
//   } catch {
//     // Token invalid or expired — clear it and redirect
//     const signInUrl = new URL('/sign-in', req.url);
//     const response = NextResponse.redirect(signInUrl);
//     response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
//     return response;
//   }

//   const isClient = userType === 'CLIENT' || userType === 'CLIENT_MEMBER';
//   const isAdmin = userType === 'ADMIN_OWNER' || userType === 'ORGANIZATION_MEMBER';

//   // CLIENT trying to access an admin route → hard redirect to portal
//   if (isClient && ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
//     return NextResponse.redirect(new URL('/portal/dashboard', req.url));
//   }

//   // ADMIN trying to access the portal → hard redirect to dashboard
//   if (isAdmin && (pathname === '/portal' || pathname.startsWith('/portal/'))) {
//     return NextResponse.redirect(new URL('/dashboard', req.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     // Match all routes except static files
//     '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
//   ],
// };
