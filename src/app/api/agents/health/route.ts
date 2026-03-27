import { NextRequest, NextResponse } from "next/server";
import { getWorkoutSuggestion, getMealSuggestion, analyzeMentalHealth } from "@/lib/agents/healthAgent";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { type } = await req.json();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (type === "workout") {
      const workouts = await prisma.workout.findMany({
        where: { date: { gte: sevenDaysAgo } },
        orderBy: { date: "desc" },
      });
      const raw = await getWorkoutSuggestion({
        recentWorkouts: workouts.map((w) => ({
          date: w.date.toDateString(),
          exercises: w.exercises,
          duration: w.duration,
        })),
      });
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }

    if (type === "meal") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const meals = await prisma.meal.findMany({
        where: { date: { gte: today, lt: tomorrow } },
      });
      const raw = await getMealSuggestion({
        todayMeals: meals.map((m) => ({
          name: m.name,
          calories: m.calories ?? undefined,
          protein: m.protein ?? undefined,
          carbs: m.carbs ?? undefined,
          fats: m.fats ?? undefined,
          mealType: m.mealType,
        })),
      });
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }

    if (type === "mental") {
      const checkins = await prisma.mentalHealthCheckin.findMany({
        where: { date: { gte: sevenDaysAgo } },
        orderBy: { date: "asc" },
      });
      const raw = await analyzeMentalHealth({
        checkins: checkins.map((c) => ({
          date: c.date.toDateString(),
          totalScore: c.totalScore,
        })),
      });
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Health agent error:", error);
    return NextResponse.json({ error: "Health agent failed" }, { status: 500 });
  }
}
