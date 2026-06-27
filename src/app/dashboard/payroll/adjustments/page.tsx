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
import { Switch } from "@/components/ui/switch";
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
import {
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
} from "lucide-react";
import { toast } from "@/components/ui/custom-toast";
import { format } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface Adjustment {
  id: number;
  employeeId: number;
  employeeName?: string | null;
  employeeCode?: string | null;
  type: string;
  description: string;
  amount: number;
  effectiveMonth: string;
  isCredit: boolean;
  status: string;
  approvedBy?: number | null;
  createdAt: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

const TYPES = ["Arrears", "Bonus", "Adjustment", "Incentive"];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdjustmentsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const sessionUser = session?.user as any;
  const isAdminOrHR =
    sessionUser?.role === "admin" || sessionUser?.role === "hr";

  const [items, setItems] = useState<Adjustment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    type: "Arrears",
    description: "",
    amount: "",
    effectiveMonth: currentMonth(),
    isCredit: true,
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
      const res = await fetch("/api/payroll-adjustments", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load adjustments");
    } finally {
      setIsFetching(false);
    }
  }

  async function loadEmployees() {
    try {
      const res = await fetch("/api/employees", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await res.json();
      const arr = Array.isArray(d) ? d : d.data ?? d.employees ?? [];
      setEmployees(arr);
    } catch {
      // non-fatal; select will just be empty
    }
  }

  function resetForm() {
    setForm({
      employeeId: "",
      type: "Arrears",
      description: "",
      amount: "",
      effectiveMonth: currentMonth(),
      isCredit: true,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || !form.description.trim() || !form.amount) {
      toast.error("Employee, description and amount are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/payroll-adjustments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          employeeId: Number(form.employeeId),
          type: form.type,
          description: form.description,
          amount: Number(form.amount),
          effectiveMonth: form.effectiveMonth,
          isCredit: form.isCredit,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      toast.success("Adjustment created");
      setOpen(false);
      resetForm();
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function approve(id: number) {
    try {
      const res = await fetch(`/api/payroll-adjustments?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          status: "Approved",
          approvedBy: sessionUser?.employeeId ?? null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Adjustment approved");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve");
    }
  }

  async function remove(id: number) {
    try {
      const res = await fetch(`/api/payroll-adjustments?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Adjustment deleted");
      load();
    } catch {
      toast.error("Failed to delete adjustment");
    }
  }

  const statusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "processed":
        return "default" as const;
      case "pending":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const totalCredits = items
    .filter((i) => i.isCredit)
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalDebits = items
    .filter((i) => !i.isCredit)
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const pendingCount = items.filter((i) => i.status === "Pending").length;

  const fmtMonth = (m: string) => {
    if (!m) return "—";
    const d = new Date(`${m}-01T00:00:00`);
    return isNaN(d.getTime()) ? m : format(d, "MMM yyyy");
  };

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
              Arrears, Bonus &amp; Adjustments
            </h1>
            <p className="text-muted-foreground">
              Record one-off credits and debits applied to payroll runs
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
                New Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Adjustment</DialogTitle>
                <DialogDescription>
                  Add an arrear, bonus, incentive or correction for an employee
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={save} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <Select
                      value={form.employeeId}
                      onValueChange={(v) =>
                        setForm({ ...form, employeeId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>
                            {e.firstName} {e.lastName} ({e.employeeCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        {TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={form.amount}
                      onChange={(e) =>
                        setForm({ ...form, amount: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="effectiveMonth">Effective Month</Label>
                    <Input
                      id="effectiveMonth"
                      type="month"
                      value={form.effectiveMonth}
                      onChange={(e) =>
                        setForm({ ...form, effectiveMonth: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Reason for this adjustment"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label htmlFor="isCredit">Credit (add to pay)</Label>
                    <p className="text-xs text-muted-foreground">
                      Turn off for a debit (deduct from pay)
                    </p>
                  </div>
                  <Switch
                    id="isCredit"
                    checked={form.isCredit}
                    onCheckedChange={(v) => setForm({ ...form, isCredit: v })}
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
                    {saving ? "Saving..." : "Create Adjustment"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Credits
              </CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ₹{totalCredits.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                added to payroll
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Debits
              </CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ₹{totalDebits.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                deducted from payroll
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main table */}
        <Card>
          <CardHeader>
            <CardTitle>Adjustments</CardTitle>
            <CardDescription>
              All recorded arrears, bonuses and corrections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Effective Month</TableHead>
                  <TableHead>Credit/Debit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      No adjustments recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.employeeName ?? `Employee #${a.employeeId}`}
                        {a.employeeCode && (
                          <div className="text-xs text-muted-foreground">
                            {a.employeeCode}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{a.type}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {a.description}
                      </TableCell>
                      <TableCell>
                        ₹{Number(a.amount || 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>{fmtMonth(a.effectiveMonth)}</TableCell>
                      <TableCell>
                        <Badge variant={a.isCredit ? "default" : "destructive"}>
                          {a.isCredit ? "Credit" : "Debit"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(a.status)}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isAdminOrHR && a.status === "Pending" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => approve(a.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(a.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
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
