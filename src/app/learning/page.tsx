"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Loader2,
  Zap,
  ExternalLink,
  Play,
  Trophy,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BadgeShowcase from "@/components/BadgeShowcase";

const CS_TOPICS = [
  "DSA", "Algorithms", "Operating Systems", "Networking", "Databases",
  "Machine Learning", "Web Development", "Computer Architecture", "Discrete Math",
  "Linear Algebra", "Statistics", "System Design", "Compilers", "Security",
  "Distributed Systems", "Concurrency", "Software Engineering", "Other",
];

const PLATFORMS = [
  "YouTube", "Coursera", "Udemy", "MIT OCW", "Stanford Online",
  "freeCodeCamp", "CS50", "LeetCode", "Codecademy", "Book", "Blog", "Other",
];

const RESOURCE_TYPES = ["course", "book", "video", "article", "podcast", "practice"];

type Resource = {
  id: string;
  title: string;
  type: string;
  url?: string;
  platform?: string;
  topicTags: string;
  progress: number;
  notes?: string;
  totalHours: number;
  lastStudied?: string;
  completed: boolean;
};

type StudySession = {
  id: string;
  resourceId: string;
  duration: number;
  topicsCovered?: string;
  notes?: string;
  date: string;
};

type LearningBadge = {
  id: string;
  badgeKey: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
};

export default function LearningPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [badges, setBadges] = useState<LearningBadge[]>([]);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // AI state
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [selectedForPlan, setSelectedForPlan] = useState<string>("");

  const [resourceForm, setResourceForm] = useState({
    title: "",
    type: "course",
    url: "",
    platform: "YouTube",
    topicTags: [] as string[],
    notes: "",
  });

  const [sessionForm, setSessionForm] = useState({
    resourceId: "",
    duration: "60",
    topicsCovered: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  const loadData = useCallback(async () => {
    const [rRes, sRes, bRes] = await Promise.all([
      fetch("/api/resources"),
      fetch("/api/study-sessions?days=30"),
      fetch("/api/badges/learning"),
    ]);
    const [r, s, b] = await Promise.all([rRes.json(), sRes.json(), bRes.json()]);
    setResources(r);
    setSessions(s);
    setBadges(b);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function addResource() {
    if (!resourceForm.title) {
      toast.error("Enter a resource title");
      return;
    }
    setSubmitting(true);
    await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resourceForm),
    });

    const { awarded } = await (
      await fetch("/api/badges/learning", { method: "POST" })
    ).json();
    if (awarded?.length > 0) toast.success(`🏆 Badge: ${awarded.join(", ")}!`);

    setShowResourceForm(false);
    setResourceForm({
      title: "",
      type: "course",
      url: "",
      platform: "YouTube",
      topicTags: [],
      notes: "",
    });
    await loadData();
    toast.success("Resource added!");
    setSubmitting(false);
  }

  async function logSession() {
    if (!sessionForm.resourceId || !sessionForm.duration) {
      toast.error("Select a resource and enter duration");
      return;
    }
    setSubmitting(true);
    await fetch("/api/study-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionForm),
    });

    const { awarded } = await (
      await fetch("/api/badges/learning", { method: "POST" })
    ).json();
    if (awarded?.length > 0) toast.success(`🏆 Badge: ${awarded.join(", ")}!`);

    setShowSessionForm(false);
    setSessionForm((p) => ({ ...p, duration: "60", topicsCovered: "", notes: "" }));
    await loadData();
    toast.success("Study session logged!");
    setSubmitting(false);
  }

  async function updateProgress(id: string, progress: number) {
    await fetch("/api/resources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, progress }),
    });
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, progress } : r))
    );

    if (progress === 100) {
      const { awarded } = await (
        await fetch("/api/badges/learning", { method: "POST" })
      ).json();
      if (awarded?.length > 0) toast.success(`🏆 Badge: ${awarded.join(", ")}!`);
    }
  }

  async function deleteResource(id: string) {
    await fetch("/api/resources", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setResources((prev) => prev.filter((r) => r.id !== id));
    toast.success("Resource removed");
  }

  async function getAISuggestion(type: string, resourceId?: string) {
    setLoadingAI(type);
    setAiResult(null);
    try {
      const res = await fetch("/api/agents/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, resourceId }),
      });
      const data = await res.json();
      setAiResult(JSON.stringify(data, null, 2));
    } catch {
      toast.error("AI suggestion failed. Check GROQ_API_KEY.");
    } finally {
      setLoadingAI(null);
    }
  }

  function generateNotebookLMPrompt(resource: Resource) {
    const tags: string[] = JSON.parse(resource.topicTags);
    return `I'm studying "${resource.title}" (${resource.type} from ${resource.platform || "unknown platform"}).
Topics covered: ${tags.join(", ")}.
I'm currently at ${resource.progress}% completion.

Please create a comprehensive study guide for this resource including:
1. Key concepts summary
2. Important questions to test understanding
3. Connections to other CS topics
4. Practice problems or exercises
5. What to focus on based on my progress level`;
  }

  const totalHours = resources.reduce((s, r) => s + r.totalHours, 0);
  const weekSessions = sessions.filter((s) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(s.date) >= weekAgo;
  });
  const weekHours = weekSessions.reduce((s, sess) => s + sess.duration / 60, 0);

  const active = resources.filter((r) => !r.completed);
  const completed = resources.filter((r) => r.completed);

  function toggleTopic(topic: string) {
    setResourceForm((p) => ({
      ...p,
      topicTags: p.topicTags.includes(topic)
        ? p.topicTags.filter((t) => t !== topic)
        : [...p.topicTags, topic],
    }));
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            CS Learning
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {totalHours.toFixed(1)}h total · {weekHours.toFixed(1)}h this week · {resources.length} resources
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSessionForm(true)} className="gap-1">
            <Play className="w-4 h-4" /> Log Session
          </Button>
          <Button onClick={() => setShowResourceForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Resource
          </Button>
        </div>
      </div>

      <Tabs defaultValue="resources">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="ai">AI Coach</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
        </TabsList>

        {/* RESOURCES */}
        <TabsContent value="resources" className="mt-4 space-y-4">
          {active.length === 0 && completed.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No resources yet. Add a course, book, or video!</p>
            </div>
          ) : (
            <>
              {active.map((r) => {
                const tags: string[] = (() => {
                  try { return JSON.parse(r.topicTags); } catch { return []; }
                })();
                return (
                  <div key={r.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{r.title}</span>
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded capitalize">
                            {r.type}
                          </span>
                          {r.platform && (
                            <span className="text-xs text-muted-foreground">{r.platform}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {tags.map((t) => (
                            <span key={t} className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => deleteResource(r.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-emerald-400">{r.progress}%</span>
                      </div>
                      <Progress value={r.progress} className="h-2 [&>div]:bg-emerald-400" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={r.progress}
                        onChange={(e) => updateProgress(r.id, parseInt(e.target.value))}
                        className="w-full accent-emerald-400 opacity-0 hover:opacity-100 transition-opacity h-0.5"
                        title="Drag to update progress"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {r.totalHours.toFixed(1)}h logged
                      </span>
                      {r.lastStudied && (
                        <span>
                          Last: {new Date(r.lastStudied).toLocaleDateString("en-US", {
                            month: "short", day: "numeric"
                          })}
                        </span>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSessionForm((p) => ({ ...p, resourceId: r.id }));
                            setShowSessionForm(true);
                          }}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          + Log
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generateNotebookLMPrompt(r));
                            toast.success("NotebookLM prompt copied!");
                          }}
                          className="text-primary hover:text-primary/80"
                        >
                          📓 NLM
                        </button>
                        <button
                          onClick={() => {
                            setSelectedForPlan(r.id);
                            getAISuggestion("study-plan", r.id);
                          }}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          🧠 Plan
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {completed.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground font-medium mb-2">
                    ✓ Completed ({completed.length})
                  </p>
                  {completed.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-through text-muted-foreground">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.totalHours.toFixed(1)}h total</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* SESSIONS */}
        <TabsContent value="sessions" className="mt-4 space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No study sessions logged yet.</p>
            </div>
          ) : (
            sessions.map((s) => {
              const resource = resources.find((r) => r.id === s.resourceId);
              return (
                <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {resource?.title || "Unknown resource"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.duration}min · {new Date(s.date).toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric"
                      })}
                    </p>
                    {s.topicsCovered && (
                      <p className="text-xs text-muted-foreground mt-0.5">{s.topicsCovered}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* AI COACH */}
        <TabsContent value="ai" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => getAISuggestion("knowledge-gaps")}
              disabled={loadingAI === "knowledge-gaps"}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all text-left"
            >
              {loadingAI === "knowledge-gaps" ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary mb-2" />
              ) : (
                <Brain className="w-5 h-5 text-purple-400 mb-2" />
              )}
              <p className="text-sm font-medium">Knowledge Gaps</p>
              <p className="text-xs text-muted-foreground mt-0.5">Find what you&apos;re missing</p>
            </button>
            <button
              onClick={() => getAISuggestion("reminders")}
              disabled={loadingAI === "reminders"}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all text-left"
            >
              {loadingAI === "reminders" ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary mb-2" />
              ) : (
                <Clock className="w-5 h-5 text-amber-400 mb-2" />
              )}
              <p className="text-sm font-medium">Review Reminders</p>
              <p className="text-xs text-muted-foreground mt-0.5">Spaced repetition suggestions</p>
            </button>
            <div className="p-4 rounded-xl border border-border bg-card">
              <Zap className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="text-sm font-medium">Study Plan</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                Click 🧠 Plan on any resource
              </p>
            </div>
          </div>

          {loadingAI && (
            <div className="flex items-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}

          {aiResult && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">AI Result</span>
              </div>
              <pre className="text-xs text-foreground whitespace-pre-wrap font-mono overflow-auto max-h-96">
                {aiResult}
              </pre>
            </div>
          )}
        </TabsContent>

        {/* BADGES */}
        <TabsContent value="badges" className="mt-4">
          <BadgeShowcase
            badges={badges.map((b) => ({ ...b, type: "learning" as const }))}
            emptyText="Add resources and log study sessions to earn badges!"
          />
        </TabsContent>
      </Tabs>

      {/* Add Resource Dialog */}
      <Dialog open={showResourceForm} onOpenChange={setShowResourceForm}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Learning Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="e.g. CS50x - Intro to CS" value={resourceForm.title} onChange={(e) => setResourceForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={resourceForm.type} onValueChange={(v) => setResourceForm((p) => ({ ...p, type: v ?? p.type }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={resourceForm.platform} onValueChange={(v) => setResourceForm((p) => ({ ...p, platform: v ?? p.platform }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>URL (optional)</Label>
              <Input placeholder="https://..." value={resourceForm.url} onChange={(e) => setResourceForm((p) => ({ ...p, url: e.target.value }))} />
            </div>
            <div>
              <Label className="block mb-2">Topic Tags</Label>
              <div className="flex flex-wrap gap-2">
                {CS_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`text-xs px-2 py-1 rounded-md transition-all ${
                      resourceForm.topicTags.includes(topic)
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Why are you studying this?" value={resourceForm.notes} onChange={(e) => setResourceForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowResourceForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={addResource} disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Resource"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Session Dialog */}
      <Dialog open={showSessionForm} onOpenChange={setShowSessionForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Study Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Resource *</Label>
              <Select value={sessionForm.resourceId} onValueChange={(v) => setSessionForm((p) => ({ ...p, resourceId: v ?? p.resourceId }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resource" />
                </SelectTrigger>
                <SelectContent>
                  {resources.filter((r) => !r.completed).map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duration (min) *</Label>
                <Input type="number" min="5" value={sessionForm.duration} onChange={(e) => setSessionForm((p) => ({ ...p, duration: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={sessionForm.date} onChange={(e) => setSessionForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Topics Covered</Label>
              <Input placeholder="e.g. Binary trees, recursion" value={sessionForm.topicsCovered} onChange={(e) => setSessionForm((p) => ({ ...p, topicsCovered: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="What did you learn?" value={sessionForm.notes} onChange={(e) => setSessionForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSessionForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={logSession} disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Session"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
