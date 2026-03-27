import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get("resourceId");
  const days = parseInt(searchParams.get("days") || "30");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const sessions = await prisma.studySession.findMany({
    where: {
      ...(resourceId ? { resourceId } : {}),
      date: { gte: since },
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const { resourceId, duration, topicsCovered, notes, date } = await req.json();

  const [session] = await Promise.all([
    prisma.studySession.create({
      data: {
        resourceId,
        duration: parseInt(duration),
        topicsCovered: topicsCovered || null,
        notes: notes || null,
        date: date ? new Date(date) : new Date(),
      },
    }),
    // Update resource totalHours and lastStudied
    prisma.resource.update({
      where: { id: resourceId },
      data: {
        totalHours: {
          increment: parseInt(duration) / 60,
        },
        lastStudied: new Date(),
      },
    }),
  ]);

  return NextResponse.json(session);
}
