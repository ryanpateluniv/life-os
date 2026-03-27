import { prisma } from "@/lib/prisma";

// ─── FINANCE BADGES ─────────────────────────────────────────────
export const FINANCE_BADGES = [
  {
    key: "first_expense",
    name: "First Log",
    description: "Logged your first expense",
    icon: "💰",
    check: async () => {
      const count = await prisma.expense.count();
      return count >= 1;
    },
  },
  {
    key: "week_under_budget",
    name: "Budget Warrior",
    description: "Stayed under budget for a full week",
    icon: "🛡️",
    check: async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const [expenses, budgets] = await Promise.all([
        prisma.expense.groupBy({
          by: ["category"],
          where: { date: { gte: weekStart } },
          _sum: { amount: true },
        }),
        prisma.budget.findMany(),
      ]);
      if (budgets.length === 0) return false;
      return budgets.every((b) => {
        const spent =
          expenses.find((e) => e.category === b.category)?._sum?.amount ?? 0;
        const limit = b.weeklyLimit ?? b.monthlyLimit / 4;
        return spent <= limit;
      });
    },
  },
  {
    key: "saved_50",
    name: "Saver",
    description: "Saved $50 under your monthly budget",
    icon: "🏦",
    check: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [expenses, budgets] = await Promise.all([
        prisma.expense.groupBy({
          by: ["category"],
          where: { date: { gte: monthStart } },
          _sum: { amount: true },
        }),
        prisma.budget.findMany(),
      ]);
      const totalSpent = expenses.reduce((s, e) => s + (e._sum?.amount ?? 0), 0);
      const totalBudget = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
      return totalBudget - totalSpent >= 50;
    },
  },
  {
    key: "no_impulse_7d",
    name: "Discipline King",
    description: "7 days with no Entertainment or Shopping purchases",
    icon: "👑",
    check: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const count = await prisma.expense.count({
        where: {
          date: { gte: sevenDaysAgo },
          category: { in: ["Entertainment", "Shopping"] },
        },
      });
      return count === 0;
    },
  },
  {
    key: "budget_master_30",
    name: "Budget Master",
    description: "30 consecutive days under budget",
    icon: "🏆",
    check: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const [expenses, budgets] = await Promise.all([
        prisma.expense.groupBy({
          by: ["category"],
          where: { date: { gte: thirtyDaysAgo } },
          _sum: { amount: true },
        }),
        prisma.budget.findMany(),
      ]);
      if (budgets.length === 0) return false;
      return budgets.every((b) => {
        const spent =
          expenses.find((e) => e.category === b.category)?._sum?.amount ?? 0;
        return spent <= b.monthlyLimit;
      });
    },
  },
];

// ─── HEALTH BADGES ─────────────────────────────────────────────
export const HEALTH_BADGES = [
  {
    key: "first_workout",
    name: "First Sweat",
    description: "Logged your first workout",
    icon: "💪",
    check: async () => {
      const count = await prisma.workout.count();
      return count >= 1;
    },
  },
  {
    key: "workout_streak_7",
    name: "Grind Mode",
    description: "7-day workout streak",
    icon: "🔥",
    check: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const workouts = await prisma.workout.findMany({
        where: { date: { gte: sevenDaysAgo } },
        orderBy: { date: "asc" },
      });
      const days = new Set(workouts.map((w) => w.date.toDateString()));
      return days.size >= 7;
    },
  },
  {
    key: "sleep_champion",
    name: "Sleep Champion",
    description: "7 nights of quality sleep (7+ hours, 7+ quality)",
    icon: "😴",
    check: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const logs = await prisma.sleepLog.findMany({
        where: { date: { gte: sevenDaysAgo } },
      });
      if (logs.length < 7) return false;
      return logs.every((l) => l.duration >= 7 && l.quality >= 7);
    },
  },
  {
    key: "clean_eater_week",
    name: "Clean Eater",
    description: "Logged 3+ meals every day for 7 days",
    icon: "🥗",
    check: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const meals = await prisma.meal.findMany({
        where: { date: { gte: sevenDaysAgo } },
      });
      const byDay: Record<string, number> = {};
      meals.forEach((m) => {
        const day = m.date.toDateString();
        byDay[day] = (byDay[day] || 0) + 1;
      });
      const days = Object.values(byDay);
      return days.length >= 7 && days.every((count) => count >= 3);
    },
  },
];

// ─── LEARNING BADGES ─────────────────────────────────────────────
export const LEARNING_BADGES = [
  {
    key: "first_resource",
    name: "Scholar",
    description: "Added your first learning resource",
    icon: "📚",
    check: async () => {
      const count = await prisma.resource.count();
      return count >= 1;
    },
  },
  {
    key: "hours_10",
    name: "10 Hours In",
    description: "Logged 10+ total study hours",
    icon: "⏰",
    check: async () => {
      const sessions = await prisma.studySession.aggregate({
        _sum: { duration: true },
      });
      return (sessions._sum?.duration ?? 0) >= 600; // 10 hours in minutes
    },
  },
  {
    key: "hours_50",
    name: "Grind Scholar",
    description: "Logged 50+ total study hours",
    icon: "🎓",
    check: async () => {
      const sessions = await prisma.studySession.aggregate({
        _sum: { duration: true },
      });
      return (sessions._sum?.duration ?? 0) >= 3000;
    },
  },
  {
    key: "first_complete",
    name: "Finisher",
    description: "Completed your first course/resource",
    icon: "✅",
    check: async () => {
      const count = await prisma.resource.count({ where: { completed: true } });
      return count >= 1;
    },
  },
  {
    key: "topics_5",
    name: "Well Rounded",
    description: "Studied 5+ different CS topics",
    icon: "🌐",
    check: async () => {
      const resources = await prisma.resource.findMany({
        select: { topicTags: true },
      });
      const topics = new Set(
        resources.flatMap((r) => {
          try {
            return JSON.parse(r.topicTags) as string[];
          } catch {
            return [] as string[];
          }
        })
      );
      return topics.size >= 5;
    },
  },
];

// ─── AWARD CHECKER ───────────────────────────────────────────────
export async function checkAndAwardFinanceBadges() {
  const awarded: string[] = [];
  for (const badge of FINANCE_BADGES) {
    const existing = await prisma.financeBadge.findUnique({
      where: { badgeKey: badge.key },
    });
    if (existing) continue;
    const earned = await badge.check();
    if (earned) {
      await prisma.financeBadge.create({
        data: {
          badgeKey: badge.key,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
        },
      });
      awarded.push(badge.name);
    }
  }
  return awarded;
}

export async function checkAndAwardHealthBadges() {
  const awarded: string[] = [];
  for (const badge of HEALTH_BADGES) {
    const existing = await prisma.healthBadge.findUnique({
      where: { badgeKey: badge.key },
    });
    if (existing) continue;
    const earned = await badge.check();
    if (earned) {
      await prisma.healthBadge.create({
        data: {
          badgeKey: badge.key,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
        },
      });
      awarded.push(badge.name);
    }
  }
  return awarded;
}

export async function checkAndAwardLearningBadges() {
  const awarded: string[] = [];
  for (const badge of LEARNING_BADGES) {
    const existing = await prisma.learningBadge.findUnique({
      where: { badgeKey: badge.key },
    });
    if (existing) continue;
    const earned = await badge.check();
    if (earned) {
      await prisma.learningBadge.create({
        data: {
          badgeKey: badge.key,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
        },
      });
      awarded.push(badge.name);
    }
  }
  return awarded;
}
