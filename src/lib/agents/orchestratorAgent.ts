import { callAgent } from "@/lib/groq";

const SYSTEM_PROMPT = `You are the master orchestrator of a personal life operating system.
You synthesize data from four domains — Schedule, Finance, Health, and Learning — into a unified, motivating daily briefing.
You see patterns across all areas of life that individual agents miss.

Your briefings are:
- Concise but impactful (not bloated)
- Motivating and direct (not preachy)
- Specific to the data (not generic advice)
- Honest about problems but forward-focused

Always return valid JSON in the format specified.`;

export async function getMorningBriefing(context: {
  date: string;
  pendingTasks: number;
  highPriorityTasks: string[];
  budgetStatus: Array<{ category: string; spent: number; limit: number }>;
  todayHealthScore: number;
  currentLearningResource?: string;
  learningHoursThisWeek: number;
  mentalHealthTrend: "improving" | "stable" | "declining";
}): Promise<string> {
  const overBudgetCategories = context.budgetStatus.filter(b => b.spent > b.limit);
  const budgetHealth = overBudgetCategories.length === 0 ? "on track" :
    `over budget in ${overBudgetCategories.map(b => b.category).join(", ")}`;

  const userMessage = `Generate today's morning briefing for ${context.date}:

SCHEDULE: ${context.pendingTasks} pending tasks. High priority: ${context.highPriorityTasks.slice(0, 3).join(", ") || "none"}
FINANCE: ${budgetHealth}. ${overBudgetCategories.length > 0 ? `Over: ${overBudgetCategories.map(b => `${b.category} by $${(b.spent - b.limit).toFixed(0)}`).join(", ")}` : "Budget looking good."}
HEALTH: Daily score ${context.todayHealthScore}/100. Mental health trend: ${context.mentalHealthTrend}
LEARNING: ${context.learningHoursThisWeek}h this week${context.currentLearningResource ? `. Currently: "${context.currentLearningResource}"` : ""}

Return JSON: {
  "greeting": "punchy personalized greeting (1 line)",
  "headline": "one sentence capturing the vibe of today",
  "schedule": "1-2 sentence schedule summary + recommendation",
  "finance": "1 sentence finance status + 1 specific action",
  "health": "1 sentence health status + 1 specific action",
  "learning": "1 sentence learning status + 1 specific action",
  "crossInsight": "1 interesting pattern spotted across domains (optional, only if real)",
  "motivationalClose": "1 punchy closing line"
}`;

  return callAgent(SYSTEM_PROMPT, userMessage, 768);
}

export async function getCrossModuleInsights(context: {
  sleepScores: Array<{ date: string; quality: number }>;
  spendingByDay: Array<{ date: string; total: number }>;
  mentalScores: Array<{ date: string; score: number }>;
  studyHoursByDay: Array<{ date: string; hours: number }>;
}): Promise<string> {
  const userMessage = `Find cross-domain patterns in this 30-day data:

SLEEP QUALITY (1-10): ${context.sleepScores.slice(-7).map(s => `${s.date}: ${s.quality}`).join(", ")}
DAILY SPENDING ($): ${context.spendingByDay.slice(-7).map(s => `${s.date}: $${s.total}`).join(", ")}
MENTAL HEALTH (0-100): ${context.mentalScores.slice(-7).map(s => `${s.date}: ${s.score}`).join(", ")}
STUDY HOURS: ${context.studyHoursByDay.slice(-7).map(s => `${s.date}: ${s.hours}h`).join(", ")}

Find real correlations only (not generic advice). Return JSON: {
  "insights": [
    {
      "pattern": "what you noticed",
      "domains": ["sleep", "spending"],
      "actionableAdvice": "what to do about it"
    }
  ]
}`;

  return callAgent(SYSTEM_PROMPT, userMessage, 512);
}
