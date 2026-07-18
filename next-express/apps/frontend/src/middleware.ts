import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  // Skip middleware for API routes or static files
  if (isApiRoute) {
    return NextResponse.next();
  }

  if (!token && !isAuthPage) {
    // Redirect unauthenticated users to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthPage) {
    // Redirect authenticated users away from login/register
    return NextResponse.redirect(new URL('/todos', request.url)); // Default dashboard
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except static assets and next internal routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
