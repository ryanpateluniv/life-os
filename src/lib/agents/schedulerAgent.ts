import { callAgent } from "@/lib/groq";

const SYSTEM_PROMPT = `You are an elite personal scheduling assistant and productivity optimizer.
You specialize in time-blocking, task prioritization, and smart schedule generation.

Your role:
- Analyze pending tasks, deadlines, priorities, and estimated durations
- Respect fixed commitments: class schedule and Google Calendar events (these are IMMOVABLE)
- Schedule tasks in optimal time blocks, considering cognitive load and energy patterns
- Group similar tasks, add buffer time, and ensure realistic pacing
- Suggest breaks strategically
- Handle rescheduling of overdue/missed tasks intelligently

Output format: Always return a valid JSON object with this exact structure:
{
  "summary": "One sentence about today's plan",
  "blocks": [
    {
      "title": "Block title",
      "startTime": "09:00",
      "endTime": "10:30",
      "type": "task|class|break|blocked",
      "taskId": "task_id_or_null",
      "color": "#hex_color",
      "notes": "optional note"
    }
  ],
  "rescheduleSuggestions": [
    {
      "taskId": "id",
      "reason": "why it was rescheduled",
      "suggestedDate": "tomorrow|day_after|specific_date"
    }
  ]
}`;

export async function generateSchedule(context: {
  tasks: Array<{
    id: string;
    title: string;
    deadline?: string;
    priority: string;
    estimatedMins: number;
    category: string;
  }>;
  classSchedule: Array<{
    courseName: string;
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
  }>;
  googleEvents: Array<{
    title: string;
    startTime: string;
    endTime: string;
  }>;
  date: string;
  dayOfWeek: string;
}): Promise<string> {
  const userMessage = `Generate an optimized schedule for ${context.date} (${context.dayOfWeek}).

PENDING TASKS:
${context.tasks.map(t => `- [${t.priority.toUpperCase()}] ${t.title} | Est: ${t.estimatedMins}min | Category: ${t.category}${t.deadline ? ` | Due: ${t.deadline}` : ""}`).join("\n") || "No pending tasks"}

FIXED CLASS SCHEDULE TODAY:
${context.classSchedule.filter(c => c.daysOfWeek.includes(context.dayOfWeek)).map(c => `- ${c.courseName}: ${c.startTime} - ${c.endTime}`).join("\n") || "No classes today"}

GOOGLE CALENDAR EVENTS:
${context.googleEvents.map(e => `- ${e.title}: ${e.startTime} - ${e.endTime}`).join("\n") || "No calendar events"}

Working hours: 8:00 AM - 11:00 PM. Prioritize high-priority tasks in peak morning hours. Include meal breaks. Return valid JSON only.`;

  return callAgent(SYSTEM_PROMPT, userMessage, 2048);
}

export async function suggestReschedule(overdueTask: {
  id: string;
  title: string;
  deadline?: string;
  priority: string;
}): Promise<string> {
  const userMessage = `This task was not completed: "${overdueTask.title}" (Priority: ${overdueTask.priority}${overdueTask.deadline ? `, Deadline: ${overdueTask.deadline}` : ""}).
Suggest the best time to reschedule it. Return JSON: {"suggestedSlot": "time", "reason": "why", "urgency": "critical|high|medium"}`;

  return callAgent(SYSTEM_PROMPT, userMessage, 256);
}
