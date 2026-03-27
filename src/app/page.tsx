import { prisma } from "@/lib/prisma";
import { getDailyQuote } from "@/lib/quotes";
import QuoteCard from "@/components/QuoteCard";
import DashboardClient from "@/components/DashboardClient";
import {
  CalendarDays,
  Wallet,
  Heart,
  BookOpen,
  Zap,
} from "lucide-react";
import Link from "next/link";

async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const [
    settings,
    pendingTasks,
    highPriorityTasks,
    weekExpenses,
    budgets,
    todayWorkout,
    todayMeals,
    todaySleep,
    todayCheckin,
    activeResources,
    weekStudy,
  ] = await Promise.all([
    prisma.userSettings.findUnique({ where: { id: "default" } }),
    prisma.task.count({ where: { status: { not: "completed" } } }),
    prisma.task.findMany({
      where: { status: { not: "completed" }, priority: "high" },
      take: 3,
      orderBy: { deadline: "asc" },
    }),
    prisma.expense.findMany({ where: { date: { gte: weekStart } } }),
    prisma.budget.findMany(),
    prisma.workout.findFirst({ where: { date: { gte: today, lt: tomorrow } } }),
    prisma.meal.findMany({ where: { date: { gte: today, lt: tomorrow } } }),
    prisma.sleepLog.findFirst({ where: { date: { gte: today, lt: tomorrow } } }),
    prisma.mentalHealthCheckin.findFirst({
      where: { date: { gte: today, lt: tomorrow } },
    }),
    prisma.resource.findMany({
      where: { completed: false },
      orderBy: { lastStudied: "desc" },
      take: 1,
    }),
    prisma.studySession.findMany({ where: { date: { gte: weekStart } } }),
  ]);

  // Calculate health score (25pts each component)
  let healthScore = 0;
  if (todayWorkout) healthScore += 25;
  if (todayMeals.length >= 2) healthScore += 25;
  if (todaySleep) healthScore += 25;
  if (todayCheckin) healthScore += 25;

  const weekTotal = weekExpenses.reduce((s, e) => s + e.amount, 0);
  const weekBudgetTotal = budgets.reduce(
    (s, b) => s + (b.weeklyLimit ?? b.monthlyLimit / 4),
    0
  );
  const weekStudyMins = weekStudy.reduce((s, sess) => s + sess.duration, 0);

  return {
    settings,
    pendingTasks,
    highPriorityTasks,
    weekTotal,
    weekBudgetTotal,
    healthScore,
    activeResource: activeResources[0] ?? null,
    weekStudyHours: Math.round((weekStudyMins / 60) * 10) / 10,
    todayCheckin: !!todayCheckin,
    todayWorkout: !!todayWorkout,
    todayMeals: todayMeals.length,
    todaySleep: !!todaySleep,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const userName = data.settings?.name || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const budgetPercent =
    data.weekBudgetTotal > 0
      ? Math.min(100, Math.round((data.weekTotal / data.weekBudgetTotal) * 100))
      : 0;

  const moduleCards = [
    {
      href: "/scheduler",
      icon: CalendarDays,
      label: "Scheduler",
      color: "text-blue-400",
      bg: "from-blue-500/10",
      stat: `${data.pendingTasks} pending`,
      sub: data.highPriorityTasks[0]?.title
        ? `Next: ${data.highPriorityTasks[0].title}`
        : "All clear today!",
    },
    {
      href: "/spend",
      icon: Wallet,
      label: "Spend Tracker",
      color: "text-amber-400",
      bg: "from-amber-500/10",
      stat: `$${data.weekTotal.toFixed(0)} this week`,
      sub:
        budgetPercent >= 100
          ? "⚠ Over budget!"
          : `${budgetPercent}% of weekly budget`,
    },
    {
      href: "/health",
      icon: Heart,
      label: "Health OS",
      color: "text-rose-400",
      bg: "from-rose-500/10",
      stat: `${data.healthScore}/100 today`,
      sub: data.healthScore === 100 ? "Perfect day! 🔥" : "Keep pushing!",
    },
    {
      href: "/learning",
      icon: BookOpen,
      label: "CS Learning",
      color: "text-emerald-400",
      bg: "from-emerald-500/10",
      stat: `${data.weekStudyHours}h this week`,
      sub: data.activeResource
        ? `Studying: ${data.activeResource.title}`
        : "Add a resource",
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, {userName} 👊
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Life OS Active</span>
        </div>
      </div>

      {/* Quote */}
      <QuoteCard />

      {/* AI Morning Briefing */}
      <DashboardClient
        pendingTasks={data.pendingTasks}
        highPriorityTasks={data.highPriorityTasks.map((t) => t.title)}
        weekTotal={data.weekTotal}
        weekBudgetTotal={data.weekBudgetTotal}
        healthScore={data.healthScore}
        weekStudyHours={data.weekStudyHours}
        currentResource={data.activeResource?.title}
      />

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {moduleCards.map(({ href, icon: Icon, label, color, bg, stat, sub }) => (
          <Link key={href} href={href}>
            <div
              className={`p-5 rounded-xl border border-border bg-gradient-to-br ${bg} via-card to-card hover:border-primary/30 transition-all cursor-pointer group`}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  View →
                </span>
              </div>
              <p className="font-semibold text-sm">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color}`}>{stat}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Daily Health Score Breakdown */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            Today&apos;s Health Score
          </p>
          <span className="text-2xl font-bold text-rose-400">
            {data.healthScore}/100
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Workout", done: data.todayWorkout },
            { label: "Nutrition", done: data.todayMeals >= 2 },
            { label: "Sleep", done: data.todaySleep },
            { label: "Check-in", done: data.todayCheckin },
          ].map(({ label, done }) => (
            <Link key={label} href="/health">
              <div
                className={`p-3 rounded-lg text-center text-xs font-medium transition-all ${
                  done
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="block text-lg mb-0.5">{done ? "✓" : "○"}</span>
                {label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
