import { auth } from "@/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const protectedPrefixes = ["/dashboard", "/transactions", "/invoices", "/reports", "/analytics", "/settings"];
  const isProtectedRoute = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  let hasSession = false;

  try {
    const session = await auth();
    hasSession = Boolean(session?.user);
  } catch {
    const response = NextResponse.next();
    response.cookies.set("authjs.session-token", "", { maxAge: 0, path: "/" });
    response.cookies.set("__Secure-authjs.session-token", "", { maxAge: 0, path: "/" });
    return response;
  }

  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
