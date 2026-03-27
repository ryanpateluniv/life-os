import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "7");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const meals = await prisma.meal.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(meals);
}

export async function POST(req: NextRequest) {
  const { name, mealType, calories, protein, carbs, fats, time, date } =
    await req.json();
  const meal = await prisma.meal.create({
    data: {
      name,
      mealType,
      calories: calories ? parseInt(calories) : null,
      protein: protein ? parseFloat(protein) : null,
      carbs: carbs ? parseFloat(carbs) : null,
      fats: fats ? parseFloat(fats) : null,
      time: time || null,
      date: date ? new Date(date) : new Date(),
    },
  });
  return NextResponse.json(meal);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.meal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
