import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function middleware(request: any) {
  const session = await auth();
  
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
