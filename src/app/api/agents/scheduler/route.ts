import { NextRequest, NextResponse } from "next/server";
import { generateSchedule } from "@/lib/agents/schedulerAgent";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { date } = await req.json();
    const targetDate = new Date(date);
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][targetDate.getDay()];

    const [tasks, classSchedule] = await Promise.all([
      prisma.task.findMany({
        where: { status: { not: "completed" } },
        orderBy: [{ priority: "desc" }, { deadline: "asc" }],
      }),
      prisma.classSchedule.findMany(),
    ]);

    const parsedClasses = classSchedule.map((c) => ({
      courseName: c.courseName,
      daysOfWeek: JSON.parse(c.daysOfWeek) as string[],
      startTime: c.startTime,
      endTime: c.endTime,
    }));

    const raw = await generateSchedule({
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        deadline: t.deadline?.toISOString(),
        priority: t.priority,
        estimatedMins: t.estimatedMins,
        category: t.category,
      })),
      classSchedule: parsedClasses,
      googleEvents: [],
      date: targetDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      dayOfWeek: dayName,
    });

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const schedule = JSON.parse(jsonMatch[0]);

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Scheduler agent error:", error);
    return NextResponse.json({ error: "Failed to generate schedule" }, { status: 500 });
  }
}
