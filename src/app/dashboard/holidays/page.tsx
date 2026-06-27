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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { format } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Plus,
  RefreshCw,
  CalendarDays,
  Flag,
  Star,
  Trash2,
} from "lucide-react";

interface Holiday {
  id: number;
  name: string;
  date: string;
  type: string;
  description?: string | null;
  year: number;
  isActive: boolean;
  createdAt: string;
}

const HOLIDAY_TYPES = ["Public", "Optional", "Restricted"];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

function safeFormat(d?: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return format(date, "MMM dd, yyyy");
}

function dayName(d?: string | null) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return format(date, "EEEE");
}

function getTypeVariant(type: string) {
  switch (type) {
    case "Public":
      return "default" as const;
    case "Optional":
    case "Restricted":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export default function HolidaysPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [year, setYear] = useState(String(currentYear));
  const [form, setForm] = useState({
    name: "",
    date: "",
    type: "Public",
    description: "",
  });

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) load();
  }, [session, year]);

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("bearer_token") : "";

  async function load() {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/holidays?year=${year}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setHolidays(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load holidays");
    } finally {
      setIsFetching(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.date) {
      toast.error("Please fill in name and date");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          name: form.name,
          date: form.date,
          type: form.type,
          description: form.description || undefined,
          year: new Date(form.date).getFullYear(),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Holiday added");
      setOpen(false);
      setForm({ name: "", date: "", type: "Public", description: "" });
      const addedYear = String(new Date(form.date).getFullYear());
      if (addedYear !== year) {
        setYear(addedYear);
      } else {
        load();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add holiday");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      const res = await fetch(`/api/holidays?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Holiday deleted");
      load();
    } catch {
      toast.error("Failed to delete holiday");
    }
  }

  const total = holidays.length;
  const publicCount = holidays.filter((h) => h.type === "Public").length;
  const optionalCount = holidays.filter(
    (h) => h.type === "Optional" || h.type === "Restricted",
  ).length;

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
              Holiday Calendar
            </h1>
            <p className="text-muted-foreground">
              Manage public, optional and restricted holidays
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Holiday
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Holiday</DialogTitle>
                  <DialogDescription>
                    Add a holiday to the company calendar
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={save} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Holiday Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Republic Day"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={form.date}
                        onChange={(e) =>
                          setForm({ ...form, date: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={form.type}
                        onValueChange={(v) => setForm({ ...form, type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {HOLIDAY_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Optional description"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      rows={3}
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
                      {saving ? "Saving..." : "Add Holiday"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Holidays ({year})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{total}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Public Holidays
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{publicCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Optional / Restricted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{optionalCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Holidays for {year}</CardTitle>
            <CardDescription>
              Company holiday calendar for the selected year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Holiday</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No holidays found for {year}
                    </TableCell>
                  </TableRow>
                ) : (
                  holidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium">
                        {holiday.name}
                      </TableCell>
                      <TableCell>{safeFormat(holiday.date)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {dayName(holiday.date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeVariant(holiday.type)}>
                          {holiday.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {holiday.description || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove(holiday.id)}
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
