import { NextRequest, NextResponse } from "next/server";

const PASSCODE_COOKIE = "fsi_passcode";
const WRONG_PASSCODE_DELAY_MS = 500;

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
      response.cookies.set(PASSCODE_COOKIE, await getPasscodeSessionValue(configuredPasscode), {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  }

  await delay(WRONG_PASSCODE_DELAY_MS);
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

async function getPasscodeSessionValue(passcode: string): Promise<string> {
  const data = new TextEncoder().encode(`fsi-passcode:${passcode}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
