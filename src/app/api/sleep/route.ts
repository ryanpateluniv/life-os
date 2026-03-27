import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "14");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.sleepLog.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const { bedtime, wakeTime, quality, notes, date } = await req.json();
  const bed = new Date(bedtime);
  const wake = new Date(wakeTime);
  const duration =
    (wake.getTime() - bed.getTime()) / (1000 * 60 * 60);

  const log = await prisma.sleepLog.create({
    data: {
      bedtime: bed,
      wakeTime: wake,
      duration: Math.round(duration * 10) / 10,
      quality: parseInt(quality),
      notes: notes || null,
      date: date ? new Date(date) : new Date(),
    },
  });
  return NextResponse.json(log);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.sleepLog.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
