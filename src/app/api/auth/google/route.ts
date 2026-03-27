import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/googleAuth";

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local" },
      { status: 400 }
    );
  }
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
