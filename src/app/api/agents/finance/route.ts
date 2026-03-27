import { NextRequest, NextResponse } from "next/server";
import { analyzeSpendings } from "@/lib/agents/financeAgent";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { period } = await req.json();
    const now = new Date();
    const start =
      period === "week"
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
        : new Date(now.getFullYear(), now.getMonth(), 1);

    const [expenses, budgets] = await Promise.all([
      prisma.expense.findMany({ where: { date: { gte: start } } }),
      prisma.budget.findMany(),
    ]);

    const raw = await analyzeSpendings({
      expenses: expenses.map((e) => ({
        amount: e.amount,
        category: e.category,
        date: e.date.toISOString().split("T")[0],
        note: e.note ?? undefined,
      })),
      budgets: budgets.map((b) => ({
        category: b.category,
        monthlyLimit: b.monthlyLimit,
        weeklyLimit: b.weeklyLimit ?? undefined,
      })),
      period: period as "week" | "month",
    });

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Finance agent error:", error);
    return NextResponse.json(
      { error: "Failed to analyze spending" },
      { status: 500 }
    );
  }
}
