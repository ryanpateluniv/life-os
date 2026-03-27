"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Heart,
  Dumbbell,
  UtensilsCrossed,
  Moon,
  Brain,
  Plus,
  Trash2,
  Loader2,
  Zap,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import BadgeShowcase from "@/components/BadgeShowcase";

type Workout = {
  id: string;
  date: string;
  exercises: string;
  notes?: string;
  duration: number;
};

type Meal = {
  id: string;
  name: string;
  mealType: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  time?: string;
  date: string;
};

type SleepLog = {
  id: string;
  bedtime: string;
  wakeTime: string;
  duration: number;
  quality: number;
  notes?: string;
  date: string;
};

type Checkin = {
  id: string;
  totalScore: number;
  date: string;
};

type HealthBadge = {
  id: string;
  badgeKey: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
};

const MENTAL_QUESTIONS = [
  { id: "focus", text: "How easy was it to focus on things today?" },
  { id: "energy", text: "How would you describe your energy levels?" },
  { id: "meals", text: "Did you enjoy your meals today?" },
  { id: "social", text: "Did you feel like connecting with others?" },
  { id: "accomplishment", text: "Did you feel like you got things done today?" },
];

export default function HealthPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [badges, setBadges] = useState<HealthBadge[]>([]);
  const [todayCheckin, setTodayCheckin] = useState<Checkin | null>(null);

  // Forms
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);
  const [showSleepForm, setShowSleepForm] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // AI suggestions
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);

  // Workout form
  const [workoutForm, setWorkoutForm] = useState({
    exercises: [{ name: "", sets: "", reps: "", weight: "" }],
    notes: "",
    duration: "60",
    date: new Date().toISOString().split("T")[0],
  });

  // Meal form
  const [mealForm, setMealForm] = useState({
    name: "",
    mealType: "breakfast",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    time: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Sleep form
  const [sleepForm, setSleepForm] = useState({
    bedtime: "",
    wakeTime: "",
    quality: "7",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Mental health checkin answers
  const [checkinAnswers, setCheckinAnswers] = useState<Record<string, number>>(
    Object.fromEntries(MENTAL_QUESTIONS.map((q) => [q.id, 3]))
  );

  const loadData = useCallback(async () => {
    const [wRes, mRes, sRes, cRes, bRes] = await Promise.all([
      fetch("/api/workouts?days=7"),
      fetch("/api/meals?days=1"),
      fetch("/api/sleep?days=14"),
      fetch("/api/checkins?days=30"),
      fetch("/api/badges/health"),
    ]);
    const [w, m, s, cData, b] = await Promise.all([
      wRes.json(),
      mRes.json(),
      sRes.json(),
      cRes.json(),
      bRes.json(),
    ]);
    setWorkouts(w);
    setMeals(m);
    setSleepLogs(s);
    setCheckins(cData.checkins || []);
    setBadges(b);

    const today = new Date().toDateString();
    const todayC = (cData.checkins || []).find(
      (c: Checkin) => new Date(c.date).toDateString() === today
    );
    setTodayCheckin(todayC || null);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Health score
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayWorkout = workouts.find(
    (w) => new Date(w.date).toDateString() === today.toDateString()
  );
  const todayMeals = meals.filter(
    (m) => new Date(m.date).toDateString() === today.toDateString()
  );
  const todaySleep = sleepLogs.find(
    (s) => new Date(s.date).toDateString() === today.toDateString()
  );
  let healthScore = 0;
  if (todayWorkout) healthScore += 25;
  if (todayMeals.length >= 2) healthScore += 25;
  if (todaySleep) healthScore += 25;
  if (todayCheckin) healthScore += 25;

  async function addWorkout() {
    const validExercises = workoutForm.exercises.filter((e) => e.name);
    if (validExercises.length === 0) {
      toast.error("Add at least one exercise");
      return;
    }
    setSubmitting(true);
    await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exercises: validExercises,
        notes: workoutForm.notes,
        duration: workoutForm.duration,
        date: workoutForm.date,
      }),
    });
    const { awarded } = await (
      await fetch("/api/badges/health", { method: "POST" })
    ).json();
    if (awarded?.length > 0)
      toast.success(`🏆 Badge: ${awarded.join(", ")}!`);
    setShowWorkoutForm(false);
    setWorkoutForm({
      exercises: [{ name: "", sets: "", reps: "", weight: "" }],
      notes: "",
      duration: "60",
      date: new Date().toISOString().split("T")[0],
    });
    await loadData();
    toast.success("Workout logged!");
    setSubmitting(false);
  }

  async function addMeal() {
    if (!mealForm.name) {
      toast.error("Enter a meal name");
      return;
    }
    setSubmitting(true);
    await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mealForm),
    });
    setShowMealForm(false);
    setMealForm((p) => ({ ...p, name: "", calories: "", protein: "", carbs: "", fats: "" }));
    await loadData();
    toast.success("Meal logged!");
    setSubmitting(false);
  }

  async function addSleep() {
    if (!sleepForm.bedtime || !sleepForm.wakeTime) {
      toast.error("Enter bedtime and wake time");
      return;
    }
    setSubmitting(true);
    await fetch("/api/sleep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sleepForm),
    });
    const { awarded } = await (
      await fetch("/api/badges/health", { method: "POST" })
    ).json();
    if (awarded?.length > 0)
      toast.success(`🏆 Badge: ${awarded.join(", ")}!`);
    setShowSleepForm(false);
    await loadData();
    toast.success("Sleep logged!");
    setSubmitting(false);
  }

  async function submitCheckin() {
    setSubmitting(true);
    const answers = MENTAL_QUESTIONS.map((q) => ({
      questionId: q.id,
      value: checkinAnswers[q.id],
    }));
    await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    setShowCheckin(false);
    await loadData();
    toast.success("Check-in saved!");
    setSubmitting(false);
  }

  async function getAISuggestion(type: string) {
    setLoadingAI(type);
    setAiSuggestion(null);
    try {
      const res = await fetch("/api/agents/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      setAiSuggestion(JSON.stringify(data, null, 2));
    } catch {
      toast.error("AI suggestion failed");
    } finally {
      setLoadingAI(null);
    }
  }

  // Chart data
  const sleepChartData = sleepLogs
    .slice(0, 7)
    .reverse()
    .map((s) => ({
      date: new Date(s.date).toLocaleDateString("en-US", { weekday: "short" }),
      hours: s.duration,
      quality: s.quality,
    }));

  const mentalChartData = checkins
    .slice(0, 14)
    .reverse()
    .map((c) => ({
      date: new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: c.totalScore,
    }));

  const todayCalories = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const todayProtein = todayMeals.reduce((s, m) => s + (m.protein || 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-400" />
            Health OS
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Today&apos;s score: {healthScore}/100
          </p>
        </div>
      </div>

      {/* Daily Score */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Workout", done: !!todayWorkout, icon: Dumbbell, action: () => setShowWorkoutForm(true) },
          { label: "Nutrition", done: todayMeals.length >= 2, icon: UtensilsCrossed, action: () => setShowMealForm(true) },
          { label: "Sleep", done: !!todaySleep, icon: Moon, action: () => setShowSleepForm(true) },
          { label: "Check-in", done: !!todayCheckin, icon: Brain, action: () => !todayCheckin && setShowCheckin(true) },
        ].map(({ label, done, icon: Icon, action }) => (
          <button
            key={label}
            onClick={action}
            className={`p-4 rounded-xl border text-center transition-all ${
              done
                ? "border-rose-500/30 bg-rose-500/10 cursor-default"
                : "border-border bg-card hover:border-primary/30 cursor-pointer"
            }`}
          >
            <Icon className={`w-5 h-5 mx-auto mb-2 ${done ? "text-rose-400" : "text-muted-foreground"}`} />
            <p className="text-xs font-medium">{label}</p>
            <p className={`text-[10px] mt-0.5 ${done ? "text-rose-400" : "text-muted-foreground"}`}>
              {done ? "✓ Done" : "+ Log"}
            </p>
          </button>
        ))}
      </div>

      <Tabs defaultValue="workouts">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
          <TabsTrigger value="mental">Mental</TabsTrigger>
          <TabsTrigger value="ai">AI Coach</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
        </TabsList>

        {/* WORKOUTS */}
        <TabsContent value="workouts" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">{workouts.length} workouts this week</p>
            <Button size="sm" onClick={() => setShowWorkoutForm(true)} className="gap-1">
              <Plus className="w-4 h-4" /> Log Workout
            </Button>
          </div>
          {workouts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No workouts this week. Let&apos;s go!</p>
            </div>
          ) : (
            workouts.map((w) => {
              const exs = JSON.parse(w.exercises) as Array<{ name: string; sets?: string; reps?: string; weight?: string }>;
              return (
                <div key={w.id} className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(w.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">{w.duration} minutes</p>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch("/api/workouts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: w.id }) });
                        await loadData();
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {exs.map((ex, i) => (
                      <span
                        key={i}
                        className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded"
                      >
                        {ex.name}
                        {ex.sets && ex.reps ? ` ${ex.sets}×${ex.reps}` : ""}
                        {ex.weight ? ` @ ${ex.weight}kg` : ""}
                      </span>
                    ))}
                  </div>
                  {w.notes && (
                    <p className="text-xs text-muted-foreground mt-2">{w.notes}</p>
                  )}
                </div>
              );
            })
          )}
        </TabsContent>

        {/* NUTRITION */}
        <TabsContent value="nutrition" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Today: {todayCalories} kcal · {todayProtein.toFixed(0)}g protein</p>
              <div className="flex gap-4 mt-1">
                <span className="text-xs text-muted-foreground">
                  <Progress value={Math.min(100, (todayCalories / 2200) * 100)} className="h-1 w-16 inline-block mr-1" />
                  {Math.round((todayCalories / 2200) * 100)}% of goal
                </span>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowMealForm(true)} className="gap-1">
              <Plus className="w-4 h-4" /> Log Meal
            </Button>
          </div>
          {todayMeals.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No meals logged today.</p>
            </div>
          ) : (
            todayMeals.map((m) => (
              <div key={m.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.name}</span>
                    <span className="text-xs text-muted-foreground capitalize bg-secondary px-1.5 py-0.5 rounded">
                      {m.mealType}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    {m.calories && <span>{m.calories} kcal</span>}
                    {m.protein && <span>{m.protein}g protein</span>}
                    {m.carbs && <span>{m.carbs}g carbs</span>}
                    {m.fats && <span>{m.fats}g fats</span>}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await fetch("/api/meals", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: m.id }) });
                    await loadData();
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </TabsContent>

        {/* SLEEP */}
        <TabsContent value="sleep" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">
              Avg:{" "}
              {sleepLogs.length > 0
                ? (sleepLogs.slice(0, 7).reduce((s, l) => s + l.duration, 0) / Math.min(sleepLogs.length, 7)).toFixed(1)
                : "—"}h/night
            </p>
            <Button size="sm" onClick={() => setShowSleepForm(true)} className="gap-1">
              <Plus className="w-4 h-4" /> Log Sleep
            </Button>
          </div>
          {sleepChartData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-medium mb-3">Sleep Duration (hours)</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={sleepChartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis domain={[0, 12]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }} />
                  <Bar dataKey="hours" fill="#818cf8" radius={4} name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {sleepLogs.slice(0, 7).map((log) => (
            <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{log.duration}h</span>
                  <span className="text-xs text-muted-foreground">
                    Quality: {log.quality}/10
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(log.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* MENTAL */}
        <TabsContent value="mental" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Wellbeing Trend</p>
              <p className="text-xs text-muted-foreground">
                {todayCheckin
                  ? `Today: ${todayCheckin.totalScore}/100`
                  : "No check-in today yet"}
              </p>
            </div>
            {!todayCheckin && (
              <Button size="sm" onClick={() => setShowCheckin(true)} className="gap-1">
                <Brain className="w-4 h-4" /> Check In
              </Button>
            )}
          </div>
          {mentalChartData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-medium mb-3">Wellbeing Score (last 14 days)</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={mentalChartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 3 }} name="Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
            <p className="text-xs text-muted-foreground">
              🔒 All check-in scores are private. The quiz measures wellbeing through indirect proxy questions — no clinical diagnosis.
            </p>
          </div>
        </TabsContent>

        {/* AI COACH */}
        <TabsContent value="ai" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { type: "workout", label: "Workout Suggestion", icon: Dumbbell, color: "text-rose-400" },
              { type: "meal", label: "Meal Suggestion", icon: UtensilsCrossed, color: "text-amber-400" },
              { type: "mental", label: "Mental Health Insight", icon: Brain, color: "text-purple-400" },
            ].map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => getAISuggestion(type)}
                disabled={loadingAI === type}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all text-left"
              >
                {loadingAI === type ? (
                  <Loader2 className={`w-5 h-5 animate-spin ${color} mb-2`} />
                ) : (
                  <Icon className={`w-5 h-5 ${color} mb-2`} />
                )}
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {loadingAI === type ? "Analyzing..." : "Get AI advice →"}
                </p>
              </button>
            ))}
          </div>
          {aiSuggestion && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">AI Coach</span>
              </div>
              <pre className="text-xs text-foreground whitespace-pre-wrap font-mono overflow-auto max-h-64">
                {aiSuggestion}
              </pre>
            </div>
          )}
        </TabsContent>

        {/* BADGES */}
        <TabsContent value="badges" className="mt-4">
          <BadgeShowcase
            badges={badges.map((b) => ({ ...b, type: "health" as const }))}
            emptyText="Log workouts, meals, and sleep consistently to earn badges!"
          />
        </TabsContent>
      </Tabs>

      {/* Workout Form Dialog */}
      <Dialog open={showWorkoutForm} onOpenChange={setShowWorkoutForm}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Exercises</Label>
              {workoutForm.exercises.map((ex, i) => (
                <div key={i} className="grid grid-cols-4 gap-2">
                  <Input
                    className="col-span-4 sm:col-span-2"
                    placeholder="Exercise name"
                    value={ex.name}
                    onChange={(e) => {
                      const updated = [...workoutForm.exercises];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setWorkoutForm((p) => ({ ...p, exercises: updated }));
                    }}
                  />
                  <Input
                    placeholder="Sets"
                    value={ex.sets}
                    onChange={(e) => {
                      const updated = [...workoutForm.exercises];
                      updated[i] = { ...updated[i], sets: e.target.value };
                      setWorkoutForm((p) => ({ ...p, exercises: updated }));
                    }}
                  />
                  <Input
                    placeholder="Reps"
                    value={ex.reps}
                    onChange={(e) => {
                      const updated = [...workoutForm.exercises];
                      updated[i] = { ...updated[i], reps: e.target.value };
                      setWorkoutForm((p) => ({ ...p, exercises: updated }));
                    }}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setWorkoutForm((p) => ({
                    ...p,
                    exercises: [
                      ...p.exercises,
                      { name: "", sets: "", reps: "", weight: "" },
                    ],
                  }))
                }
              >
                + Add Exercise
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={workoutForm.duration}
                  onChange={(e) =>
                    setWorkoutForm((p) => ({ ...p, duration: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={workoutForm.date}
                  onChange={(e) =>
                    setWorkoutForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="How did it go?"
                value={workoutForm.notes}
                onChange={(e) =>
                  setWorkoutForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowWorkoutForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={addWorkout} disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Workout"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meal Form Dialog */}
      <Dialog open={showMealForm} onOpenChange={setShowMealForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Meal Name *</Label>
              <Input placeholder="e.g. Chicken & Rice" value={mealForm.name} onChange={(e) => setMealForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={mealForm.mealType} onValueChange={(v) => setMealForm((p) => ({ ...p, mealType: v ?? p.mealType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Calories</Label>
                <Input type="number" placeholder="kcal" value={mealForm.calories} onChange={(e) => setMealForm((p) => ({ ...p, calories: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Protein (g)</Label>
                <Input type="number" value={mealForm.protein} onChange={(e) => setMealForm((p) => ({ ...p, protein: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Carbs (g)</Label>
                <Input type="number" value={mealForm.carbs} onChange={(e) => setMealForm((p) => ({ ...p, carbs: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fats (g)</Label>
                <Input type="number" value={mealForm.fats} onChange={(e) => setMealForm((p) => ({ ...p, fats: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowMealForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={addMeal} disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Meal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sleep Form Dialog */}
      <Dialog open={showSleepForm} onOpenChange={setShowSleepForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Sleep</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Bedtime</Label>
                <Input type="datetime-local" value={sleepForm.bedtime} onChange={(e) => setSleepForm((p) => ({ ...p, bedtime: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Wake Time</Label>
                <Input type="datetime-local" value={sleepForm.wakeTime} onChange={(e) => setSleepForm((p) => ({ ...p, wakeTime: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Sleep Quality (1-10): {sleepForm.quality}</Label>
              <input
                type="range"
                min="1"
                max="10"
                value={sleepForm.quality}
                onChange={(e) => setSleepForm((p) => ({ ...p, quality: e.target.value }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Terrible</span>
                <span>Amazing</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input placeholder="e.g. woke up twice" value={sleepForm.notes} onChange={(e) => setSleepForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSleepForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={addSleep} disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Sleep"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mental Health Check-in Dialog */}
      <Dialog open={showCheckin} onOpenChange={setShowCheckin}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Daily Check-in</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground">
              Answer honestly — this is private. Rate from 1 (not at all) to 5 (absolutely yes).
            </p>
            {MENTAL_QUESTIONS.map((q) => (
              <div key={q.id} className="space-y-2">
                <p className="text-sm font-medium">{q.text}</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      onClick={() => setCheckinAnswers((p) => ({ ...p, [q.id]: v }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        checkinAnswers[q.id] === v
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCheckin(false)} className="flex-1">Skip</Button>
              <Button onClick={submitCheckin} disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
