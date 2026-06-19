import { NextRequest, NextResponse } from "next/server";

const PASSCODE_COOKIE = "fsi_passcode";

export function middleware(request: NextRequest) {
  const appPasscode = process.env.APP_PASSCODE;

  if (!appPasscode) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  if (
    pathname === "/passcode" ||
    pathname.startsWith("/api/passcode") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (request.cookies.get(PASSCODE_COOKIE)?.value === appPasscode) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/passcode";
  url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
