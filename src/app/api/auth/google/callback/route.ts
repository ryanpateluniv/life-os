import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/googleAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=no_code", req.url));
  }

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);

    await prisma.userSettings.upsert({
      where: { id: "default" },
      update: {
        googleAccessToken: tokens.access_token ?? null,
        googleRefreshToken: tokens.refresh_token ?? null,
        googleTokenExpiry: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
      },
      create: {
        id: "default",
        googleAccessToken: tokens.access_token ?? null,
        googleRefreshToken: tokens.refresh_token ?? null,
        googleTokenExpiry: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
      },
    });

    return NextResponse.redirect(new URL("/settings?success=google_connected", req.url));
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(new URL("/settings?error=oauth_failed", req.url));
  }
}
