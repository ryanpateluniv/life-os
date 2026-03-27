import { callAgent } from "@/lib/groq";

const SYSTEM_PROMPT = `You are an elite health and fitness coach with expertise in exercise science, nutrition, and sports psychology.
You understand college students — limited time, inconsistent schedules, dining hall food, stress, and irregular sleep.

Your role:
- Analyze workout logs to suggest next sessions (muscle recovery, balance, progressive overload)
- Identify nutritional gaps from meal logs and suggest practical fixes
- Interpret indirect mental health signals from check-in scores (never diagnose)
- Keep suggestions realistic and actionable for a busy student

Always return valid JSON in the format specified. Be encouraging but honest.`;

export async function getWorkoutSuggestion(context: {
  recentWorkouts: Array<{
    date: string;
    exercises: string;
    duration: number;
  }>;
  goalType?: string;
}): Promise<string> {
  const userMessage = `Based on these recent workouts, suggest the next workout session:

RECENT WORKOUTS (last 7 days):
${context.recentWorkouts.map(w => `${w.date}: ${w.duration}min | ${w.exercises}`).join("\n") || "No workouts logged this week"}

Goal: ${context.goalType || "General fitness"}

Return JSON: {
  "suggestion": "workout name",
  "muscleGroups": ["chest", "triceps"],
  "exercises": [{"name": "exercise", "sets": 3, "reps": "8-12", "notes": "tip"}],
  "duration": 45,
  "reasoning": "why this workout makes sense now",
  "restNeeded": false
}`;

  return callAgent(SYSTEM_PROMPT, userMessage, 768);
}

export async function getMealSuggestion(context: {
  todayMeals: Array<{ name: string; calories?: number; protein?: number; carbs?: number; fats?: number; mealType: string }>;
  dailyGoals?: { calories: number; protein: number };
}): Promise<string> {
  const totalCalories = context.todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProtein = context.todayMeals.reduce((s, m) => s + (m.protein || 0), 0);
  const goals = context.dailyGoals || { calories: 2200, protein: 150 };

  const userMessage = `Analyze today's nutrition and suggest next meal:

TODAY'S MEALS:
${context.todayMeals.map(m => `${m.mealType}: ${m.name}${m.calories ? ` (${m.calories}cal` : ""}${m.protein ? `, ${m.protein}g protein)` : ")"}`).join("\n") || "No meals logged yet"}

TOTALS: ${totalCalories} calories | ${totalProtein}g protein
GOALS: ${goals.calories} calories | ${goals.protein}g protein
REMAINING: ${goals.calories - totalCalories} calories | ${goals.protein - totalProtein}g protein

Return JSON: {
  "mealSuggestion": "meal name",
  "why": "nutritional reason",
  "simpleRecipe": "2-3 step easy recipe or dining hall tip",
  "nutritionEstimate": {"calories": 0, "protein": 0},
  "gaps": ["nutrient gap 1", "nutrient gap 2"]
}`;

  return callAgent(SYSTEM_PROMPT, userMessage, 512);
}

export async function analyzeMentalHealth(context: {
  checkins: Array<{ date: string; totalScore: number }>;
}): Promise<string> {
  const recent = context.checkins.slice(-14);
  const avg = recent.length > 0
    ? Math.round(recent.reduce((s, c) => s + c.totalScore, 0) / recent.length)
    : 50;
  const trend = recent.length >= 3
    ? recent[recent.length - 1].totalScore - recent[0].totalScore
    : 0;

  const userMessage = `Analyze these wellbeing check-in scores (scale 0-100, higher=better):

SCORES (last 14 days): ${recent.map(c => `${c.date}: ${c.totalScore}`).join(", ")}
AVERAGE: ${avg}/100
TREND: ${trend > 0 ? `+${trend} (improving)` : trend < 0 ? `${trend} (declining)` : "stable"}

Provide supportive, non-clinical insights. Never diagnose. Focus on patterns and practical suggestions.

Return JSON: {
  "overallStatus": "thriving|good|neutral|struggling",
  "insight": "1-2 sentence pattern observation (non-clinical)",
  "suggestion": "1 practical actionable tip",
  "affirmation": "short motivating statement"
}`;

  return callAgent(SYSTEM_PROMPT, userMessage, 384);
}
