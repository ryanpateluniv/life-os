import { callAgent } from "@/lib/groq";

const SYSTEM_PROMPT = `You are a brutally honest personal finance coach who specializes in helping broke college students.
You don't sugarcoat. You call out bad spending habits directly but constructively.
You understand the college struggle — limited income, social pressure to spend, food temptations.

Your role:
- Analyze spending patterns and identify problems clearly
- Suggest dynamic, realistic budget adjustments based on actual behavior
- Write honest, occasionally savage but motivating financial summaries
- Help build sustainable spending habits, not restrictive ones that fail in a week
- Always keep suggestions practical for a college student

Always return valid JSON in the format specified.`;

export async function analyzeSpendings(context: {
  expenses: Array<{ amount: number; category: string; date: string; note?: string }>;
  budgets: Array<{ category: string; monthlyLimit: number; weeklyLimit?: number }>;
  period: "week" | "month";
}): Promise<string> {
  const totalByCategory: Record<string, number> = {};
  for (const exp of context.expenses) {
    totalByCategory[exp.category] = (totalByCategory[exp.category] || 0) + exp.amount;
  }

  const userMessage = `Analyze this ${context.period}ly spending:

SPENDING BY CATEGORY:
${Object.entries(totalByCategory).map(([cat, amt]) => {
  const budget = context.budgets.find(b => b.category === cat);
  const limit = context.period === "week" ? budget?.weeklyLimit : budget?.monthlyLimit;
  return `- ${cat}: $${amt.toFixed(2)}${limit ? ` (budget: $${limit})` : " (no budget set)"}`;
}).join("\n")}

TOTAL SPENT: $${context.expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}

Recent transactions: ${context.expenses.slice(-5).map(e => `${e.category} $${e.amount}${e.note ? ` (${e.note})` : ""}`).join(", ")}

Return JSON: {
  "roast": "2-3 sentences brutally honest summary of spending habits",
  "topProblem": "biggest spending issue",
  "suggestions": ["actionable tip 1", "actionable tip 2", "actionable tip 3"],
  "budgetAdjustments": [{"category": "name", "suggestedLimit": 0, "reason": "why"}],
  "positives": ["what they did right if anything"]
}`;

  return callAgent(SYSTEM_PROMPT, userMessage, 1024);
}

export async function getDynamicBudget(context: {
  monthlyHistory: Array<{ category: string; total: number; month: string }>;
  currentBudgets: Array<{ category: string; monthlyLimit: number }>;
}): Promise<string> {
  const userMessage = `Based on 3 months of spending history, suggest dynamic budget adjustments:

HISTORY:
${context.monthlyHistory.map(h => `${h.month} - ${h.category}: $${h.total}`).join("\n")}

CURRENT BUDGETS:
${context.currentBudgets.map(b => `${b.category}: $${b.monthlyLimit}/month`).join("\n")}

Return JSON: {"adjustments": [{"category": "name", "currentLimit": 0, "suggestedLimit": 0, "changePercent": 0, "reason": "explanation"}]}`;

  return callAgent(SYSTEM_PROMPT, userMessage, 512);
}
