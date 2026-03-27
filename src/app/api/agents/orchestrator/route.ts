import { NextRequest, NextResponse } from "next/server";
import { getMorningBriefing } from "@/lib/agents/orchestratorAgent";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const budgets = await prisma.budget.findMany();
    const monthExpenses = await prisma.expense.groupBy({
      by: ["category"],
      where: { date: { gte: monthStart } },
      _sum: { amount: true },
    });

    const budgetStatus = budgets.map((b) => {
      const spent =
        monthExpenses.find((e) => e.category === b.category)?._sum?.amount ?? 0;
      return { category: b.category, spent, limit: b.monthlyLimit };
    });

    const mentalCheckins = await prisma.mentalHealthCheckin.findMany({
      orderBy: { date: "desc" },
      take: 14,
    });
    const recentScores = mentalCheckins.map((c) => c.totalScore);
    const trend =
      recentScores.length >= 3
        ? recentScores[0] > recentScores[recentScores.length - 1]
          ? "improving"
          : recentScores[0] < recentScores[recentScores.length - 1]
          ? "declining"
          : "stable"
        : "stable";

    const raw = await getMorningBriefing({
      date: today.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      pendingTasks: body.pendingTasks,
      highPriorityTasks: body.highPriorityTasks,
      budgetStatus,
      todayHealthScore: body.healthScore,
      currentLearningResource: body.currentResource,
      learningHoursThisWeek: body.weekStudyHours,
      mentalHealthTrend: trend as "improving" | "stable" | "declining",
    });

    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const briefing = JSON.parse(jsonMatch[0]);

    return NextResponse.json(briefing);
  } catch (error) {
    console.error("Orchestrator agent error:", error);
    return NextResponse.json(
      { error: "Failed to generate briefing" },
      { status: 500 }
    );
  }
}
