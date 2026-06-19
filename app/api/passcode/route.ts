import { NextRequest, NextResponse } from "next/server";

const PASSCODE_COOKIE = "fsi_passcode";

export async function POST(request: NextRequest) {
  const configuredPasscode = process.env.APP_PASSCODE;
  const formData = await request.formData();
  const submittedPasscode = String(formData.get("passcode") || "");
  const nextPath = normalizeNextPath(String(formData.get("next") || "/"));

  if (!configuredPasscode || submittedPasscode === configuredPasscode) {
    const response = NextResponse.redirect(new URL(nextPath, request.url), {
      status: 303,
    });

    if (configuredPasscode) {
      response.cookies.set(PASSCODE_COOKIE, configuredPasscode, {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  }

  const retryUrl = new URL("/passcode", request.url);
  retryUrl.searchParams.set("error", "1");
  retryUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(retryUrl, { status: 303 });
}

function normalizeNextPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}
