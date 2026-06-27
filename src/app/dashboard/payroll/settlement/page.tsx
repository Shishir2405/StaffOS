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
import {
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  FileText,
  Clock,
  Wallet,
} from "lucide-react";
import { toast } from "@/components/ui/custom-toast";
import { format } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface Settlement {
  id: number;
  employeeId: number;
  employeeName?: string | null;
  employeeCode?: string | null;
  designation?: string | null;
  lastWorkingDay: string;
  noticePeriodDays: number;
  leaveEncashment: number;
  gratuity: number;
  pendingSalary: number;
  bonusPayable: number;
  deductions: number;
  netSettlement: number;
  status: string;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

const emptyForm = {
  employeeId: "",
  lastWorkingDay: "",
  noticePeriodDays: "0",
  leaveEncashment: "",
  gratuity: "",
  pendingSalary: "",
  bonusPayable: "",
  deductions: "",
  remarks: "",
};

export default function SettlementPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Settlement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [viewing, setViewing] = useState<Settlement | null>(null);

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
      const res = await fetch("/api/final-settlements", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load settlements");
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
      // non-fatal
    }
  }

  // Live computed net settlement preview (server recomputes authoritatively).
  const computedNet =
    (Number(form.leaveEncashment) || 0) +
    (Number(form.gratuity) || 0) +
    (Number(form.pendingSalary) || 0) +
    (Number(form.bonusPayable) || 0) -
    (Number(form.deductions) || 0);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || !form.lastWorkingDay) {
      toast.error("Employee and last working day are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/final-settlements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          employeeId: Number(form.employeeId),
          lastWorkingDay: form.lastWorkingDay,
          noticePeriodDays: Number(form.noticePeriodDays || 0),
          leaveEncashment: Number(form.leaveEncashment || 0),
          gratuity: Number(form.gratuity || 0),
          pendingSalary: Number(form.pendingSalary || 0),
          bonusPayable: Number(form.bonusPayable || 0),
          deductions: Number(form.deductions || 0),
          remarks: form.remarks || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      toast.success("Settlement created");
      setOpen(false);
      setForm({ ...emptyForm });
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      const res = await fetch(`/api/final-settlements?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Settlement deleted");
      load();
    } catch {
      toast.error("Failed to delete settlement");
    }
  }

  const statusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "paid":
        return "default" as const;
      case "draft":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const fmtDate = (d?: string | null) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "—" : format(dt, "MMM dd, yyyy");
  };
  const money = (n: unknown) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const totalSettlements = items.length;
  const pendingDraft = items.filter(
    (i) => i.status === "Draft" || i.status === "Approved",
  ).length;
  const totalPaid = items
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + Number(i.netSettlement || 0), 0);

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
              Final Settlement (F&amp;F)
            </h1>
            <p className="text-muted-foreground">
              Compute full and final settlements for exiting employees
            </p>
          </div>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setForm({ ...emptyForm });
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Settlement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Final Settlement</DialogTitle>
                <DialogDescription>
                  Calculate the net payable on an employee&apos;s exit
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
                    <Label htmlFor="lastWorkingDay">Last Working Day</Label>
                    <Input
                      id="lastWorkingDay"
                      type="date"
                      value={form.lastWorkingDay}
                      onChange={(e) =>
                        setForm({ ...form, lastWorkingDay: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="noticePeriodDays">Notice Period (days)</Label>
                    <Input
                      id="noticePeriodDays"
                      type="number"
                      placeholder="0"
                      value={form.noticePeriodDays}
                      onChange={(e) =>
                        setForm({ ...form, noticePeriodDays: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leaveEncashment">Leave Encashment (₹)</Label>
                    <Input
                      id="leaveEncashment"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={form.leaveEncashment}
                      onChange={(e) =>
                        setForm({ ...form, leaveEncashment: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gratuity">Gratuity (₹)</Label>
                    <Input
                      id="gratuity"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={form.gratuity}
                      onChange={(e) =>
                        setForm({ ...form, gratuity: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pendingSalary">Pending Salary (₹)</Label>
                    <Input
                      id="pendingSalary"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={form.pendingSalary}
                      onChange={(e) =>
                        setForm({ ...form, pendingSalary: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bonusPayable">Bonus Payable (₹)</Label>
                    <Input
                      id="bonusPayable"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={form.bonusPayable}
                      onChange={(e) =>
                        setForm({ ...form, bonusPayable: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deductions">Deductions (₹)</Label>
                    <Input
                      id="deductions"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={form.deductions}
                      onChange={(e) =>
                        setForm({ ...form, deductions: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks (optional)</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Any notes about this settlement"
                    value={form.remarks}
                    onChange={(e) =>
                      setForm({ ...form, remarks: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                {/* Live computed net settlement */}
                <div className="flex items-center justify-between rounded-md border bg-muted p-4">
                  <div>
                    <p className="text-sm font-medium">Net Settlement</p>
                    <p className="text-xs text-muted-foreground">
                      Encashment + Gratuity + Pending Salary + Bonus − Deductions
                    </p>
                  </div>
                  <p className="text-2xl font-bold">{money(computedNet)}</p>
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
                    {saving ? "Saving..." : "Create Settlement"}
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
                Total Settlements
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalSettlements}</div>
              <p className="text-xs text-muted-foreground mt-1">records</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending / Draft
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingDraft}</div>
              <p className="text-xs text-muted-foreground mt-1">
                not yet paid
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Paid
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{money(totalPaid)}</div>
              <p className="text-xs text-muted-foreground mt-1">disbursed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main table */}
        <Card>
          <CardHeader>
            <CardTitle>Settlements</CardTitle>
            <CardDescription>
              Full and final settlements for exiting employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Last Working Day</TableHead>
                  <TableHead>Net Settlement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      No settlements recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.employeeName ?? `Employee #${s.employeeId}`}
                        {s.employeeCode && (
                          <div className="text-xs text-muted-foreground">
                            {s.employeeCode}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{fmtDate(s.lastWorkingDay)}</TableCell>
                      <TableCell className="font-semibold">
                        {money(s.netSettlement)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(s.status)}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewing(s)}
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(s.id)}
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

      {/* View details dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Settlement Details</DialogTitle>
            <DialogDescription>
              {viewing?.employeeName ?? `Employee #${viewing?.employeeId}`}
              {viewing?.employeeCode ? ` · ${viewing.employeeCode}` : ""}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Last Working Day</p>
                  <p className="font-medium">
                    {fmtDate(viewing.lastWorkingDay)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Notice Period</p>
                  <p className="font-medium">
                    {viewing.noticePeriodDays} days
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={statusVariant(viewing.status)}>
                    {viewing.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{fmtDate(viewing.createdAt)}</p>
                </div>
              </div>

              <div className="rounded-md border divide-y">
                <div className="flex justify-between p-2.5 text-sm">
                  <span className="text-muted-foreground">Leave Encashment</span>
                  <span>{money(viewing.leaveEncashment)}</span>
                </div>
                <div className="flex justify-between p-2.5 text-sm">
                  <span className="text-muted-foreground">Gratuity</span>
                  <span>{money(viewing.gratuity)}</span>
                </div>
                <div className="flex justify-between p-2.5 text-sm">
                  <span className="text-muted-foreground">Pending Salary</span>
                  <span>{money(viewing.pendingSalary)}</span>
                </div>
                <div className="flex justify-between p-2.5 text-sm">
                  <span className="text-muted-foreground">Bonus Payable</span>
                  <span>{money(viewing.bonusPayable)}</span>
                </div>
                <div className="flex justify-between p-2.5 text-sm">
                  <span className="text-muted-foreground">Deductions</span>
                  <span>− {money(viewing.deductions)}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-muted font-semibold">
                  <span>Net Settlement</span>
                  <span>{money(viewing.netSettlement)}</span>
                </div>
              </div>

              {viewing.remarks && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Remarks</p>
                  <p>{viewing.remarks}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
