import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const classes = await prisma.classSchedule.findMany({ orderBy: { startTime: "asc" } });
  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  const { courseName, daysOfWeek, startTime, endTime, location, color } = await req.json();
  const cls = await prisma.classSchedule.create({
    data: {
      courseName,
      daysOfWeek: JSON.stringify(daysOfWeek),
      startTime,
      endTime,
      location: location || null,
      color: color || "#6366f1",
    },
  });
  return NextResponse.json(cls);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.classSchedule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
