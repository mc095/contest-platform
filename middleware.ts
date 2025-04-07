import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('userSession');

  if (pathname.startsWith('/problem/') && !session) {
    return NextResponse.redirect(new URL('/contest', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/problem/:path*'],
};