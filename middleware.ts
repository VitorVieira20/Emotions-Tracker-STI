import { getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    const isAuthenticated = !!token;

    const { pathname } = req.nextUrl;

    if (!isAuthenticated && pathname.startsWith('/quiz')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (isAuthenticated) {
      const onboardingCompleted = token.onboardingCompleted || false;


      if (onboardingCompleted && pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      if (!onboardingCompleted && pathname !== '/onboarding') {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
      
      if (onboardingCompleted && pathname === '/onboarding') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      if (onboardingCompleted && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ['/', '/quiz/:path*', '/dashboard/:path*', '/onboarding'],
};
