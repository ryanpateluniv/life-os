import { callAgent } from "@/lib/groq";

const SYSTEM_PROMPT = `You are an expert CS learning coach with deep knowledge of computer science curricula, pedagogy, and self-directed learning strategies.
You understand spaced repetition, active recall, project-based learning, and how CS students learn best.

Your role:
- Generate structured, realistic study plans for CS topics and courses
- Identify knowledge gaps based on what topics have been studied
- Suggest spaced repetition timing for reviewed material
- Map resources to CS concept domains
- Keep plans realistic for a student balancing classes + self-study

Always return valid JSON in the format specified. Be specific and technical.`;

export async function generateStudyPlan(context: {
  resourceTitle: string;
  resourceType: string;
  platform?: string;
  topicTags: string[];
  currentProgress: number;
  totalHoursLogged: number;
  notes?: string;
}): Promise<string> {
  const userMessage = `Generate a comprehensive study plan for:

RESOURCE: "${context.resourceTitle}"
TYPE: ${context.resourceType} | PLATFORM: ${context.platform || "Unknown"}
TOPICS: ${context.topicTags.join(", ")}
CURRENT PROGRESS: ${context.currentProgress}%
HOURS ALREADY LOGGED: ${context.totalHoursLogged}h
NOTES: ${context.notes || "None"}

Create a detailed week-by-week plan to complete this resource.

Return JSON: {
  "totalWeeks": 4,
  "weeklyHours": 5,
  "plan": [
    {
      "week": 1,
      "focus": "topic focus",
      "dailyGoals": ["Monday: topic", "Tuesday: topic"],
      "keyConcepts": ["concept1", "concept2"],
      "practiceProblems": ["LeetCode Easy: Arrays", "Build: mini project"],
      "milestone": "what you can do after this week"
    }
  ],
  "notebookLMPrompt": "A formatted prompt to paste into NotebookLM to create a study guide for this resource",
  "tips": ["study tip 1", "study tip 2"]
}`;

  return callAgent(SYSTEM_PROMPT, userMessage, 2048);
}

export async function detectKnowledgeGaps(context: {
  studiedTopics: Array<{ topic: string; hoursSpent: number; lastStudied: string }>;
  csLevel: string;
}): Promise<string> {
  const csCurriculum = [
    "Data Structures", "Algorithms", "Time/Space Complexity",
    "Operating Systems", "Computer Networks", "Databases",
    "Computer Architecture", "Discrete Mathematics", "Linear Algebra",
    "Probability & Statistics", "Machine Learning", "Web Development",
    "System Design", "Compilers", "Concurrency & Parallelism",
    "Software Engineering", "Security", "Distributed Systems"
  ];

  const studiedSet = new Set(context.studiedTopics.map(t => t.topic));
  const gaps = csCurriculum.filter(t => !studiedSet.has(t));

  const userMessage = `Identify knowledge gaps for a ${context.csLevel} CS student:

STUDIED TOPICS:
${context.studiedTopics.map(t => `- ${t.topic}: ${t.hoursSpent}h (last: ${t.lastStudied})`).join("\n") || "Nothing logged yet"}

UNSTUDIED CORE TOPICS: ${gaps.join(", ")}

Return JSON: {
  "criticalGaps": ["most important missing topics for this level"],
  "recommendations": [
    {"topic": "topic name", "priority": "critical|high|medium", "whyItMatters": "brief explanation", "suggestedResource": "resource suggestion"}
  ],
  "strengths": ["areas they are doing well"],
  "nextFocus": "single most important topic to start next"
}`;

  return callAgent(SYSTEM_PROMPT, userMessage, 1024);
}

export async function getSpacedRepetitionReminders(context: {
  resources: Array<{ title: string; lastStudied: string; progress: number }>;
}): Promise<string> {
  const today = new Date().toISOString().split("T")[0];

  const userMessage = `Today is ${today}. Based on spaced repetition principles (review at 3, 7, 14, 30 day intervals), which of these resources need review?

RESOURCES:
${context.resources.map(r => `- "${r.title}": ${r.progress}% done, last studied ${r.lastStudied}`).join("\n")}

Return JSON: {
  "dueForReview": [
    {"title": "resource title", "daysSinceStudied": 0, "urgency": "overdue|due_today|due_soon", "suggestedDuration": 30}
  ],
  "upcomingReviews": [{"title": "resource", "dueIn": "3 days"}]
}`;

  return callAgent(SYSTEM_PROMPT, userMessage, 512);
}
