import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const budgets = await prisma.budget.findMany();
  return NextResponse.json(budgets);
}

export async function POST(req: NextRequest) {
  const { category, monthlyLimit, weeklyLimit } = await req.json();
  const budget = await prisma.budget.upsert({
    where: { category },
    update: {
      monthlyLimit: parseFloat(monthlyLimit),
      weeklyLimit: weeklyLimit ? parseFloat(weeklyLimit) : null,
    },
    create: {
      category,
      monthlyLimit: parseFloat(monthlyLimit),
      weeklyLimit: weeklyLimit ? parseFloat(weeklyLimit) : null,
    },
  });
  return NextResponse.json(budget);
}
