import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndAwardHealthBadges } from "@/lib/badges";

export async function GET() {
  const badges = await prisma.healthBadge.findMany({
    orderBy: { earnedAt: "desc" },
  });
  return NextResponse.json(badges);
}

export async function POST() {
  const awarded = await checkAndAwardHealthBadges();
  return NextResponse.json({ awarded });
}
