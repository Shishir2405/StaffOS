"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/custom-toast";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  Timer,
  Trash2,
} from "lucide-react";

interface Shift {
  id: number;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  workingHours: number;
  weekOff?: string | null;
  graceMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ShiftsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weekOff, setWeekOff] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    code: "",
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: "60",
    workingHours: "8",
    graceMinutes: "10",
    isActive: true,
  });

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) load();
  }, [session]);

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("bearer_token") : "";

  async function load() {
    setIsFetching(true);
    try {
      const res = await fetch("/api/shifts", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setShifts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load shifts");
    } finally {
      setIsFetching(false);
    }
  }

  function toggleWeekOff(day: string) {
    setWeekOff((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function resetForm() {
    setForm({
      name: "",
      code: "",
      startTime: "09:00",
      endTime: "18:00",
      breakMinutes: "60",
      workingHours: "8",
      graceMinutes: "10",
      isActive: true,
    });
    setWeekOff([]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.code || !form.startTime || !form.endTime) {
      toast.error("Please fill in name, code and timings");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          startTime: form.startTime,
          endTime: form.endTime,
          breakMinutes: Number(form.breakMinutes) || 0,
          workingHours: Number(form.workingHours) || 0,
          graceMinutes: Number(form.graceMinutes) || 0,
          weekOff: weekOff.length ? weekOff.join(",") : undefined,
          isActive: form.isActive,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Shift created");
      setOpen(false);
      resetForm();
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to create shift");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      const res = await fetch(`/api/shifts?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Shift deleted");
      load();
    } catch {
      toast.error("Failed to delete shift");
    }
  }

  const total = shifts.length;
  const active = shifts.filter((s) => s.isActive).length;
  const avgHours = total
    ? (
        shifts.reduce((sum, s) => sum + Number(s.workingHours || 0), 0) / total
      ).toFixed(1)
    : "0";

  if (isPending || isFetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user) return null;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Shift Management
            </h1>
            <p className="text-muted-foreground">
              Configure work shifts, timings and weekly offs
            </p>
          </div>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Shift</DialogTitle>
                <DialogDescription>
                  Define a work shift with timings and breaks
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={save} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Shift Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. General Shift"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Shift Code</Label>
                    <Input
                      id="code"
                      placeholder="e.g. GEN"
                      value={form.code}
                      onChange={(e) =>
                        setForm({ ...form, code: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={form.startTime}
                      onChange={(e) =>
                        setForm({ ...form, startTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={form.endTime}
                      onChange={(e) =>
                        setForm({ ...form, endTime: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="breakMinutes">Break (mins)</Label>
                    <Input
                      id="breakMinutes"
                      type="number"
                      min="0"
                      value={form.breakMinutes}
                      onChange={(e) =>
                        setForm({ ...form, breakMinutes: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workingHours">Working Hours</Label>
                    <Input
                      id="workingHours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={form.workingHours}
                      onChange={(e) =>
                        setForm({ ...form, workingHours: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="graceMinutes">Grace (mins)</Label>
                    <Input
                      id="graceMinutes"
                      type="number"
                      min="0"
                      value={form.graceMinutes}
                      onChange={(e) =>
                        setForm({ ...form, graceMinutes: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Week Off</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        size="sm"
                        variant={
                          weekOff.includes(day) ? "default" : "outline"
                        }
                        onClick={() => toggleWeekOff(day)}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label>Active</Label>
                    <p className="text-xs text-muted-foreground">
                      Make this shift available for assignment
                    </p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) =>
                      setForm({ ...form, isActive: v })
                    }
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Create Shift"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{total}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{active}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Working Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{avgHours}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                hours per shift
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shifts</CardTitle>
            <CardDescription>All configured work shifts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead>Working Hours</TableHead>
                  <TableHead>Week Off</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      No shifts configured yet
                    </TableCell>
                  </TableRow>
                ) : (
                  shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">
                        {shift.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{shift.code}</Badge>
                      </TableCell>
                      <TableCell>
                        {shift.startTime} – {shift.endTime}
                      </TableCell>
                      <TableCell>{shift.breakMinutes} min</TableCell>
                      <TableCell>{shift.workingHours} hrs</TableCell>
                      <TableCell>
                        {shift.weekOff ? (
                          <span className="text-muted-foreground">
                            {shift.weekOff}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={shift.isActive ? "default" : "secondary"}
                        >
                          {shift.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove(shift.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
