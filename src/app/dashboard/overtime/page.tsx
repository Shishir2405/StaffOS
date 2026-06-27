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
  Timer,
  Clock,
  IndianRupee,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react";

interface OvertimeRecord {
  id: number;
  employeeId: number;
  date: string;
  hours: number;
  rateMultiplier: number;
  hourlyRate: number;
  amount: number;
  reason?: string | null;
  status: string;
  approvedBy?: number | null;
  createdAt: string;
  updatedAt: string;
  employeeName?: string | null;
  employeeCode?: string | null;
}

interface EmployeeOption {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
  salary?: number;
}

function safeFormat(d?: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return format(date, "MMM dd, yyyy");
}

function inr(n?: number | null) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function getStatusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
    case "paid":
      return "default" as const;
    case "pending":
      return "secondary" as const;
    case "rejected":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export default function OvertimePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const sessionUser = session?.user as any;
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [employeeList, setEmployeeList] = useState<EmployeeOption[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    date: "",
    hours: "",
    rateMultiplier: "1.5",
    hourlyRate: "",
    reason: "",
  });

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      load();
      loadEmployees();
    }
  }, [session]);

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("bearer_token") : "";

  async function load() {
    setIsFetching(true);
    try {
      const res = await fetch("/api/overtime", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load overtime records");
    } finally {
      setIsFetching(false);
    }
  }

  async function loadEmployees() {
    try {
      const res = await fetch("/api/employees?limit=100", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await res.json();
      const arr = Array.isArray(d) ? d : (d.data ?? d.employees ?? []);
      setEmployeeList(arr);
    } catch {
      // select stays empty
    }
  }

  function onEmployeeChange(v: string) {
    const emp = employeeList.find((e) => String(e.id) === v);
    let nextRate = form.hourlyRate;
    if (emp?.salary && (!form.hourlyRate || Number(form.hourlyRate) === 0)) {
      nextRate = String(Math.round(Number(emp.salary) / (12 * 30 * 8)));
    }
    setForm({ ...form, employeeId: v, hourlyRate: nextRate });
  }

  const previewAmount =
    (Number(form.hours) || 0) *
    (Number(form.hourlyRate) || 0) *
    (Number(form.rateMultiplier) || 0);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || !form.date || !form.hours) {
      toast.error("Please fill in employee, date and hours");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/overtime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          employeeId: parseInt(form.employeeId),
          date: form.date,
          hours: Number(form.hours),
          rateMultiplier: Number(form.rateMultiplier) || 1.5,
          hourlyRate: Number(form.hourlyRate) || 0,
          reason: form.reason || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Overtime recorded");
      setOpen(false);
      setForm({
        employeeId: "",
        date: "",
        hours: "",
        rateMultiplier: "1.5",
        hourlyRate: "",
        reason: "",
      });
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to record overtime");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: number, status: "Approved" | "Rejected" | "Paid") {
    try {
      const res = await fetch(`/api/overtime?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success(`Overtime ${status.toLowerCase()}`);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to update overtime");
    }
  }

  async function remove(id: number) {
    try {
      const res = await fetch(`/api/overtime?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Overtime deleted");
      load();
    } catch {
      toast.error("Failed to delete overtime");
    }
  }

  const isAdminOrHR =
    sessionUser?.role === "admin" || sessionUser?.role === "hr";

  const totalHours = records.reduce((sum, r) => sum + Number(r.hours || 0), 0);
  const pendingCount = records.filter((r) => r.status === "Pending").length;
  const totalAmount = records.reduce(
    (sum, r) => sum + Number(r.amount || 0),
    0,
  );

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
              Overtime Tracking
            </h1>
            <p className="text-muted-foreground">
              Record and approve employee overtime
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Overtime
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record Overtime</DialogTitle>
                <DialogDescription>
                  Log overtime hours for an employee
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={save} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <Select
                      value={form.employeeId}
                      onValueChange={onEmployeeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeList.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>
                            {e.firstName} {e.lastName} ({e.employeeCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="e.g. 3"
                      value={form.hours}
                      onChange={(e) =>
                        setForm({ ...form, hours: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      min="0"
                      placeholder="e.g. 200"
                      value={form.hourlyRate}
                      onChange={(e) =>
                        setForm({ ...form, hourlyRate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rateMultiplier">Rate Multiplier</Label>
                    <Input
                      id="rateMultiplier"
                      type="number"
                      min="1"
                      step="0.1"
                      value={form.rateMultiplier}
                      onChange={(e) =>
                        setForm({ ...form, rateMultiplier: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="rounded-lg border bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Computed Overtime Amount
                    </span>
                    <span className="text-2xl font-bold">
                      {inr(previewAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Number(form.hours) || 0} hrs ×{" "}
                    {inr(Number(form.hourlyRate) || 0)} ×{" "}
                    {Number(form.rateMultiplier) || 0}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Reason for overtime"
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
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
                    {saving ? "Saving..." : "Record Overtime"}
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
                Total OT Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">
                  {totalHours.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">hours logged</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{pendingCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total OT Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{inr(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overtime Records</CardTitle>
            <CardDescription>
              All logged overtime with approval status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      No overtime records found
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium">
                        {rec.employeeName || `#${rec.employeeId}`}
                        {rec.employeeCode && (
                          <div className="text-xs text-muted-foreground">
                            {rec.employeeCode}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{safeFormat(rec.date)}</TableCell>
                      <TableCell>{rec.hours}</TableCell>
                      <TableCell>{rec.rateMultiplier}x</TableCell>
                      <TableCell>{inr(rec.hourlyRate)}</TableCell>
                      <TableCell className="font-medium">
                        {inr(rec.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(rec.status)}>
                          {rec.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdminOrHR && rec.status === "Pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => setStatus(rec.id, "Approved")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setStatus(rec.id, "Rejected")}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {isAdminOrHR && rec.status === "Approved" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setStatus(rec.id, "Paid")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => remove(rec.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
