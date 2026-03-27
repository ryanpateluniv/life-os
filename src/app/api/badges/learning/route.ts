import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndAwardLearningBadges } from "@/lib/badges";

export async function GET() {
  const badges = await prisma.learningBadge.findMany({
    orderBy: { earnedAt: "desc" },
  });
  return NextResponse.json(badges);
}

export async function POST() {
  const awarded = await checkAndAwardLearningBadges();
  return NextResponse.json({ awarded });
}
