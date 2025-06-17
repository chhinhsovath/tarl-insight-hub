import { NextRequest, NextResponse } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/unauthorized'
];

// Define route patterns that don't require authentication
const publicRoutePatterns = [
  /^\/training\/session\/\d+\/materials$/,
  /^\/training\/session\/\d+\/register$/,
  /^\/training\/session\/\d+\/attendance$/,
  /^\/training\/session\/\d+\/feedback$/,
  /^\/training\/register$/,
  /^\/training\/materials$/,
  /^\/training\/attendance$/,
  /^\/training\/public-feedback$/,
  /^\/training\/qr\/\w+$/
];

// Define API routes that should be excluded from middleware
const apiExcludeRoutes = [
  '/api/auth',
  '/api/_next',
  '/_next',
  '/api/training/public',
  '/api/training/sessions/'
];

// Static file extensions to skip
const staticExtensions = [
  '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
  '.css', '.js', '.map', '.woff', '.woff2', '.ttf', '.eot'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for Next.js internal routes
  if (pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // Skip middleware for static files
  if (staticExtensions.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow public route patterns (training materials, registration, etc.)
  if (publicRoutePatterns.some(pattern => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // Skip middleware for excluded API routes (especially auth routes)
  if (apiExcludeRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // For API routes, let individual handlers manage their own authentication
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check for session token for app routes only
  const sessionToken = request.cookies.get('session-token')?.value;

  if (!sessionToken) {
    // Redirect to login if no session token for app routes
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Let the app route proceed - PermissionProtectedRoute will handle permissions
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};