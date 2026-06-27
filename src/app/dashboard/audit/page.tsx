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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  RefreshCw,
  ScrollText,
  CalendarClock,
  Activity,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "@/components/ui/custom-toast";
import { format, isValid } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface AuditLog {
  id: number;
  userId?: string | null;
  userName?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

interface ComplianceItem {
  id: number;
  title: string;
  category: string;
  dueDate: string;
  frequency: string;
  status: string;
  description?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

function fmtDate(d?: string | null, withTime = false) {
  if (!d) return "—";
  const date = new Date(d);
  if (!isValid(date)) return "—";
  return format(date, withTime ? "MMM dd, yyyy HH:mm" : "MMM dd, yyyy");
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function AuditPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "PF",
    dueDate: "",
    frequency: "Monthly",
    description: "",
  });

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("bearer_token") : "";

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function loadAll() {
    setIsFetching(true);
    try {
      const headers = { Authorization: `Bearer ${token()}` };
      const [lRes, cRes] = await Promise.all([
        fetch("/api/audit-logs", { headers }),
        fetch("/api/compliance-calendar", { headers }),
      ]);
      const lData = await lRes.json();
      setLogs(Array.isArray(lData) ? lData : []);
      const cData = await cRes.json();
      setItems(Array.isArray(cData) ? cData : []);
    } catch {
      toast.error("Failed to load audit data");
    } finally {
      setIsFetching(false);
    }
  }

  async function refreshLogs() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/audit-logs", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
      toast.success("Audit trail refreshed");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }

  async function createCompliance(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.dueDate) {
      toast.error("Due date is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/compliance-calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category,
          dueDate: form.dueDate,
          frequency: form.frequency,
          description: form.description.trim() || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Compliance item added");
      setOpen(false);
      setForm({
        title: "",
        category: "PF",
        dueDate: "",
        frequency: "Monthly",
        description: "",
      });
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add item");
    } finally {
      setSaving(false);
    }
  }

  async function markCompleted(id: number) {
    try {
      const res = await fetch(`/api/compliance-calendar?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          status: "Completed",
          completedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Marked as completed");
      loadAll();
    } catch {
      toast.error("Failed to update");
    }
  }

  // Effective status: derive Overdue when past due and not completed
  function effectiveStatus(item: ComplianceItem): string {
    if (item.status === "Completed") return "Completed";
    if (item.dueDate && item.dueDate < todayStr()) return "Overdue";
    return item.status || "Upcoming";
  }

  function statusVariant(s: string): "default" | "secondary" | "destructive" {
    if (s === "Completed") return "default";
    if (s === "Overdue") return "destructive";
    return "secondary";
  }

  // Stats — audit
  const today = todayStr();
  const totalEvents = logs.length;
  const todayEvents = logs.filter((l) => (l.createdAt || "").startsWith(today))
    .length;

  // Stats — compliance
  const computed = items.map((i) => ({ ...i, eff: effectiveStatus(i) }));
  const upcomingCount = computed.filter((i) => i.eff === "Upcoming").length;
  const overdueCount = computed.filter((i) => i.eff === "Overdue").length;
  const completedCount = computed.filter((i) => i.eff === "Completed").length;

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Audit &amp; Compliance
            </h1>
            <p className="text-muted-foreground">
              Track system activity and stay ahead of statutory deadlines
            </p>
          </div>
        </div>

        <Tabs defaultValue="audit">
          <TabsList>
            <TabsTrigger value="audit">
              <ScrollText className="mr-2 h-4 w-4" />
              Audit Trail
            </TabsTrigger>
            <TabsTrigger value="compliance">
              <CalendarClock className="mr-2 h-4 w-4" />
              Compliance Calendar
            </TabsTrigger>
          </TabsList>

          {/* ── AUDIT TRAIL ───────────────────────────────────── */}
          <TabsContent value="audit" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Events
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalEvents}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    all recorded activity
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Today&apos;s Events
                  </CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{todayEvents}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    events logged today
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Audit Trail</CardTitle>
                  <CardDescription>
                    Immutable, read-only log of system activity (newest first).
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={refreshLogs}
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          No audit events recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="whitespace-nowrap">
                            {fmtDate(l.createdAt, true)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {l.userName || "System"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{l.action}</Badge>
                          </TableCell>
                          <TableCell>{l.entity}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {l.entityId || "—"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">
                            {l.details || "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── COMPLIANCE CALENDAR ───────────────────────────── */}
          <TabsContent value="compliance" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Upcoming
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{upcomingCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    filings due ahead
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Overdue
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{overdueCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    require attention
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completed
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{completedCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    filings done
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Compliance Calendar</CardTitle>
                  <CardDescription>
                    Statutory due dates for PF, ESI, PT, TDS and more.
                  </CardDescription>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>New Compliance Item</DialogTitle>
                      <DialogDescription>
                        Add a statutory deadline to track.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={createCompliance} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="c-title">Title *</Label>
                        <Input
                          id="c-title"
                          value={form.title}
                          onChange={(e) =>
                            setForm({ ...form, title: e.target.value })
                          }
                          placeholder="PF ECR Filing"
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="c-category">Category</Label>
                          <Select
                            value={form.category}
                            onValueChange={(v) =>
                              setForm({ ...form, category: v })
                            }
                          >
                            <SelectTrigger id="c-category">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PF">PF</SelectItem>
                              <SelectItem value="ESI">ESI</SelectItem>
                              <SelectItem value="PT">PT</SelectItem>
                              <SelectItem value="TDS">TDS</SelectItem>
                              <SelectItem value="LWF">LWF</SelectItem>
                              <SelectItem value="GST">GST</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="c-frequency">Frequency</Label>
                          <Select
                            value={form.frequency}
                            onValueChange={(v) =>
                              setForm({ ...form, frequency: v })
                            }
                          >
                            <SelectTrigger id="c-frequency">
                              <SelectValue placeholder="Frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="Quarterly">
                                Quarterly
                              </SelectItem>
                              <SelectItem value="Annual">Annual</SelectItem>
                              <SelectItem value="One-time">One-time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="c-due">Due Date *</Label>
                        <Input
                          id="c-due"
                          type="date"
                          value={form.dueDate}
                          onChange={(e) =>
                            setForm({ ...form, dueDate: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="c-desc">Description</Label>
                        <Textarea
                          id="c-desc"
                          value={form.description}
                          onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                          }
                          rows={2}
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
                          {saving ? "Adding..." : "Add Item"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {computed.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          No compliance items yet. Add one to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      computed.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell className="font-medium">
                            {i.title}
                            {i.description && (
                              <div className="text-xs text-muted-foreground">
                                {i.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{i.category}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {fmtDate(i.dueDate)}
                          </TableCell>
                          <TableCell>{i.frequency}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(i.eff)}>
                              {i.eff}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {i.eff !== "Completed" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markCompleted(i.id)}
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Mark Completed
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {fmtDate(i.completedAt)}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
