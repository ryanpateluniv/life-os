import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "7");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const workouts = await prisma.workout.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(workouts);
}

export async function POST(req: NextRequest) {
  const { exercises, notes, duration, date } = await req.json();
  const workout = await prisma.workout.create({
    data: {
      exercises: JSON.stringify(exercises),
      notes: notes || null,
      duration: parseInt(duration) || 0,
      date: date ? new Date(date) : new Date(),
    },
  });
  return NextResponse.json(workout);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.workout.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
