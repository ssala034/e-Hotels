import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userCookie = request.cookies.get('user')?.value;
  
  let user = null;
  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch (e) {
      // Invalid user cookie
    }
  }

  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/', '/login', '/register', '/about', '/contact', '/search'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/rooms/'));

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based route protection
  if (pathname.startsWith('/admin') && user?.role !== 'Admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/employee') && user?.role !== 'Employee' && user?.role !== 'Admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/profile') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
