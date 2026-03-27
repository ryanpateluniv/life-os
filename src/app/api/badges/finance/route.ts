import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndAwardFinanceBadges } from "@/lib/badges";

export async function GET() {
  const badges = await prisma.financeBadge.findMany({
    orderBy: { earnedAt: "desc" },
  });
  return NextResponse.json(badges);
}

export async function POST() {
  const awarded = await checkAndAwardFinanceBadges();
  return NextResponse.json({ awarded });
}
