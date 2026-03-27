"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, GraduationCap, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CLASS_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];

type ClassEntry = {
  id: string;
  courseName: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  location?: string;
  color: string;
};

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [semesterStart, setSemesterStart] = useState("");
  const [semesterEnd, setSemesterEnd] = useState("");
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const [newClass, setNewClass] = useState({
    courseName: "",
    daysOfWeek: [] as string[],
    startTime: "09:00",
    endTime: "10:30",
    location: "",
    color: CLASS_COLORS[0],
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(({ settings, classes: cls }) => {
        if (settings) {
          setName(settings.name || "");
          setSemesterStart(
            settings.semesterStart ? settings.semesterStart.split("T")[0] : ""
          );
          setSemesterEnd(
            settings.semesterEnd ? settings.semesterEnd.split("T")[0] : ""
          );
        }
        if (cls) {
          setClasses(
            cls.map((c: ClassEntry & { daysOfWeek: string }) => ({
              ...c,
              daysOfWeek:
                typeof c.daysOfWeek === "string"
                  ? JSON.parse(c.daysOfWeek)
                  : c.daysOfWeek,
            }))
          );
        }
      });
  }, []);

  async function saveSettings() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, semesterStart, semesterEnd }),
    });
    setSaving(false);
    toast.success("Settings saved!");
  }

  function toggleDay(day: string) {
    setNewClass((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  }

  async function addClass() {
    if (!newClass.courseName || newClass.daysOfWeek.length === 0) {
      toast.error("Enter course name and select at least one day");
      return;
    }
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newClass),
    });
    const cls = await res.json();
    setClasses((prev) => [
      ...prev,
      { ...cls, daysOfWeek: JSON.parse(cls.daysOfWeek) },
    ]);
    setNewClass({
      courseName: "",
      daysOfWeek: [],
      startTime: "09:00",
      endTime: "10:30",
      location: "",
      color: CLASS_COLORS[Math.floor(Math.random() * CLASS_COLORS.length)],
    });
    toast.success("Class added!");
  }

  async function deleteClass(id: string) {
    await fetch("/api/classes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setClasses((prev) => prev.filter((c) => c.id !== id));
    toast.success("Class removed");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your profile and class schedule
        </p>
      </div>

      {/* Profile */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 font-semibold">
          <User className="w-4 h-4 text-primary" />
          Profile
        </div>
        <div className="space-y-2">
          <Label>Your Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Semester Start</Label>
            <Input
              type="date"
              value={semesterStart}
              onChange={(e) => setSemesterStart(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Semester End</Label>
            <Input
              type="date"
              value={semesterEnd}
              onChange={(e) => setSemesterEnd(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </Card>

      {/* Class Schedule Builder */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 font-semibold">
          <GraduationCap className="w-4 h-4 text-primary" />
          Class Schedule
        </div>

        {/* Existing classes */}
        {classes.length > 0 && (
          <div className="space-y-2">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cls.color }}
                  />
                  <div>
                    <p className="text-sm font-medium">{cls.courseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {cls.daysOfWeek.join(", ")} · {cls.startTime} – {cls.endTime}
                      {cls.location ? ` · ${cls.location}` : ""}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => deleteClass(cls.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new class */}
        <div className="space-y-3 pt-2 border-t border-border">
          <p className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Add Class
          </p>
          <Input
            placeholder="Course name (e.g. Data Structures)"
            value={newClass.courseName}
            onChange={(e) =>
              setNewClass((p) => ({ ...p, courseName: e.target.value }))
            }
          />
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    newClass.daysOfWeek.includes(day)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Start Time</Label>
              <Input
                type="time"
                value={newClass.startTime}
                onChange={(e) =>
                  setNewClass((p) => ({ ...p, startTime: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Time</Label>
              <Input
                type="time"
                value={newClass.endTime}
                onChange={(e) =>
                  setNewClass((p) => ({ ...p, endTime: e.target.value }))
                }
              />
            </div>
          </div>
          <Input
            placeholder="Location (optional)"
            value={newClass.location}
            onChange={(e) =>
              setNewClass((p) => ({ ...p, location: e.target.value }))
            }
          />
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Color</Label>
            <div className="flex gap-2">
              {CLASS_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewClass((p) => ({ ...p, color }))}
                  className={`w-6 h-6 rounded-full transition-all ${
                    newClass.color === color
                      ? "ring-2 ring-offset-2 ring-offset-card ring-white scale-110"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <Button onClick={addClass} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Add Class
          </Button>
        </div>
      </Card>

      {/* API Keys notice */}
      <Card className="p-5 space-y-2 border-primary/20 bg-primary/5">
        <p className="text-sm font-semibold text-primary">API Keys Required</p>
        <p className="text-xs text-muted-foreground">
          Add your <code className="bg-secondary px-1 rounded">GROQ_API_KEY</code> to{" "}
          <code className="bg-secondary px-1 rounded">.env.local</code> to enable AI
          features. Get a free key at console.groq.com
        </p>
      </Card>
    </div>
  );
}
