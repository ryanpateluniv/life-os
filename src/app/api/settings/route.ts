import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.userSettings.findUnique({ where: { id: "default" } });
  const classes = await prisma.classSchedule.findMany({ orderBy: { startTime: "asc" } });
  return NextResponse.json({ settings, classes });
}

export async function POST(req: NextRequest) {
  const { name, semesterStart, semesterEnd } = await req.json();
  const settings = await prisma.userSettings.upsert({
    where: { id: "default" },
    update: {
      name,
      semesterStart: semesterStart ? new Date(semesterStart) : null,
      semesterEnd: semesterEnd ? new Date(semesterEnd) : null,
    },
    create: {
      id: "default",
      name,
      semesterStart: semesterStart ? new Date(semesterStart) : null,
      semesterEnd: semesterEnd ? new Date(semesterEnd) : null,
    },
  });
  return NextResponse.json(settings);
}
