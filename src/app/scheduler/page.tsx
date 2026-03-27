"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  CalendarDays,
  Zap,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalendarView from "@/components/scheduler/CalendarView";
import AISchedulePanel from "@/components/scheduler/AISchedulePanel";

type Task = {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  priority: string;
  estimatedMins: number;
  category: string;
  status: string;
  completedAt?: string;
  createdAt: string;
};

const PRIORITY_CONFIG = {
  high: { label: "High", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  medium: { label: "Medium", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  low: { label: "Low", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
};

const CATEGORY_CONFIG = {
  study: "📚",
  personal: "👤",
  health: "❤️",
  work: "💼",
};

export default function SchedulerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    priority: "medium",
    estimatedMins: 60,
    category: "personal",
  });

  const loadTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function createTask() {
    if (!form.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    setSubmitting(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({
      title: "",
      description: "",
      deadline: "",
      priority: "medium",
      estimatedMins: 60,
      category: "personal",
    });
    setShowForm(false);
    await loadTasks();
    toast.success("Task added!");
    setSubmitting(false);
  }

  async function toggleComplete(task: Task) {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status: newStatus }),
    });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: newStatus } : t
      )
    );
  }

  async function deleteTask(id: string) {
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success("Task deleted");
  }

  const pending = tasks.filter((t) => t.status !== "completed");
  const completed = tasks.filter((t) => t.status === "completed");

  function isOverdue(task: Task) {
    if (!task.deadline || task.status === "completed") return false;
    return new Date(task.deadline) < new Date();
  }

  function formatDeadline(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff <= 7) return `${diff}d left`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-400" />
            Scheduler
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {pending.length} pending · {completed.length} completed
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Task List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="ai">AI Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4 mt-4">
          {/* Pending Tasks */}
          {pending.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Circle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No pending tasks. Add one above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleComplete}
                  onDelete={deleteTask}
                  isOverdue={isOverdue(task)}
                  formatDeadline={formatDeadline}
                />
              ))}
            </div>
          )}

          {/* Completed Tasks */}
          {completed.length > 0 && (
            <div className="pt-4">
              <p className="text-sm text-muted-foreground font-medium mb-2">
                ✓ Completed ({completed.length})
              </p>
              <div className="space-y-2">
                {completed.slice(0, 5).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleComplete}
                    onDelete={deleteTask}
                    isOverdue={false}
                    formatDeadline={formatDeadline}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView tasks={tasks} />
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <AISchedulePanel tasks={pending} onScheduleApproved={loadTasks} />
        </TabsContent>
      </Tabs>

      {/* Add Task Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="What needs to be done?"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && createTask()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional details..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((p) => ({ ...p, priority: v ?? p.priority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🔵 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((p) => ({ ...p, category: v ?? p.category }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study">📚 Study</SelectItem>
                    <SelectItem value="personal">👤 Personal</SelectItem>
                    <SelectItem value="health">❤️ Health</SelectItem>
                    <SelectItem value="work">💼 Work</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Est. Time (min)</Label>
                <Input
                  type="number"
                  min={5}
                  value={form.estimatedMins}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      estimatedMins: parseInt(e.target.value) || 60,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={createTask} disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  onDelete,
  isOverdue,
  formatDeadline,
}: {
  task: Task;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
  isOverdue: boolean;
  formatDeadline: (d: string) => string;
}) {
  const completed = task.status === "completed";
  const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
        completed
          ? "border-border/50 bg-card/50 opacity-60"
          : isOverdue
          ? "border-red-500/30 bg-red-500/5"
          : "border-border bg-card hover:border-primary/20"
      }`}
    >
      <button
        onClick={() => onToggle(task)}
        className="mt-0.5 shrink-0 transition-transform hover:scale-110"
      >
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-primary" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <span
            className={`text-sm font-medium ${completed ? "line-through text-muted-foreground" : ""}`}
          >
            {CATEGORY_CONFIG[task.category as keyof typeof CATEGORY_CONFIG]}{" "}
            {task.title}
          </span>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${priority?.color}`}
          >
            {priority?.label}
          </span>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          {task.deadline && (
            <span
              className={`flex items-center gap-1 text-xs ${
                isOverdue ? "text-red-400" : "text-muted-foreground"
              }`}
            >
              {isOverdue && <AlertTriangle className="w-3 h-3" />}
              <Clock className="w-3 h-3" />
              {formatDeadline(task.deadline)}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            ~{task.estimatedMins}min
          </span>
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
