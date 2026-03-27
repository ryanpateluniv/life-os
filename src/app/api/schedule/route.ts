import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  if (!dateStr) return NextResponse.json({ blocks: [] });

  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const plan = await prisma.scheduledPlan.findFirst({
    where: { date: { gte: date, lt: nextDay }, approved: true },
    include: { blocks: true },
  });

  return NextResponse.json({ blocks: plan?.blocks ?? [] });
}

export async function POST(req: NextRequest) {
  const { date, blocks, aiSummary } = await req.json();

  const planDate = new Date(date);
  planDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(planDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Delete existing plan for today
  await prisma.scheduledPlan.deleteMany({
    where: { date: { gte: planDate, lt: nextDay } },
  });

  const plan = await prisma.scheduledPlan.create({
    data: {
      date: planDate,
      approved: true,
      aiSummary,
      blocks: {
        create: blocks.map(
          (b: {
            title: string;
            startTime: string;
            endTime: string;
            type: string;
            taskId?: string;
            color?: string;
            notes?: string;
          }) => ({
            title: b.title,
            startTime: b.startTime,
            endTime: b.endTime,
            type: b.type,
            taskId: b.taskId || null,
            color: b.color || null,
          })
        ),
      },
    },
    include: { blocks: true },
  });

  return NextResponse.json(plan);
}
