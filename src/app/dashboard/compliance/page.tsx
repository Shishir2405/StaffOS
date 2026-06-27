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
import { toast } from "@/components/ui/custom-toast";
import { format } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Plus,
  RefreshCw,
  Trash2,
  Landmark,
  ShieldCheck,
  FileWarning,
  CheckCircle,
  Wallet,
} from "lucide-react";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

interface StatutoryContribution {
  id: number;
  employeeId: number;
  type: string;
  month: number;
  year: number;
  wageBase: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  createdAt: string;
}

interface Challan {
  id: number;
  type: string;
  period: string;
  totalAmount: number;
  employeeCount: number;
  referenceNumber?: string | null;
  status: string;
  dueDate?: string | null;
  filedDate?: string | null;
  createdAt: string;
}

const CONTRIBUTION_TYPES = ["PF", "ESI", "PT", "LWF"];
const CHALLAN_TYPES = ["ECR", "EPFO", "ESIC", "PT", "TDS"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear - 1, currentYear - 2];

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function safeDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : format(dt, "MMM dd, yyyy");
}

function challanStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case "filed":
    case "paid":
      return "default";
    case "pending":
    case "generated":
      return "secondary";
    case "overdue":
      return "destructive";
    default:
      return "outline";
  }
}

// Standard statutory rate computation (client-side preview)
function computeContribution(type: string, wageBase: number) {
  const wb = Number(wageBase) || 0;
  let employee = 0;
  let employer = 0;
  switch (type) {
    case "PF": {
      const capped = Math.min(wb, 15000);
      employee = capped * 0.12;
      employer = capped * 0.12;
      break;
    }
    case "ESI": {
      if (wb <= 21000) {
        employee = wb * 0.0075;
        employer = wb * 0.0325;
      }
      break;
    }
    case "PT": {
      employee = 200;
      employer = 0;
      break;
    }
    case "LWF": {
      // Small flat contribution (varies by state); using a common slab
      employee = 25;
      employer = 50;
      break;
    }
  }
  return {
    employee,
    employer,
    total: employee + employer,
  };
}

export default function CompliancePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contributions, setContributions] = useState<StatutoryContribution[]>(
    [],
  );
  const [challans, setChallans] = useState<Challan[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [contribOpen, setContribOpen] = useState(false);
  const [challanOpen, setChallanOpen] = useState(false);
  const [savingContrib, setSavingContrib] = useState(false);
  const [savingChallan, setSavingChallan] = useState(false);

  const [contribForm, setContribForm] = useState({
    employeeId: "",
    type: "",
    month: String(new Date().getMonth() + 1),
    year: String(currentYear),
    wageBase: "",
  });

  const [challanForm, setChallanForm] = useState({
    type: "",
    period: "",
    totalAmount: "",
    employeeCount: "",
    referenceNumber: "",
    dueDate: "",
  });

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) loadAll();
  }, [session]);

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("bearer_token") : "";

  async function loadAll() {
    setIsFetching(true);
    await Promise.all([loadEmployees(), loadContributions(), loadChallans()]);
    setIsFetching(false);
  }

  async function loadEmployees() {
    try {
      const res = await fetch("/api/employees", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await res.json();
      const arr = Array.isArray(d) ? d : (d.data ?? d.employees ?? []);
      setEmployees(arr);
    } catch {
      // non-fatal
    }
  }

  async function loadContributions() {
    try {
      const res = await fetch("/api/statutory-contributions", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setContributions(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load contributions");
    }
  }

  async function loadChallans() {
    try {
      const res = await fetch("/api/challans", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setChallans(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load challans");
    }
  }

  const empName = (id: number) => {
    const e = employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.lastName}` : `Employee #${id}`;
  };
  const empCode = (id: number) => {
    const e = employees.find((x) => x.id === id);
    return e?.employeeCode ?? "";
  };

  // Live preview of contribution
  const contribPreview = computeContribution(
    contribForm.type,
    Number(contribForm.wageBase) || 0,
  );

  async function saveContribution(e: React.FormEvent) {
    e.preventDefault();
    if (!contribForm.employeeId || !contribForm.type) {
      toast.error("Please select an employee and contribution type");
      return;
    }
    setSavingContrib(true);
    try {
      const res = await fetch("/api/statutory-contributions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          employeeId: parseInt(contribForm.employeeId),
          type: contribForm.type,
          month: parseInt(contribForm.month),
          year: parseInt(contribForm.year),
          wageBase: Number(contribForm.wageBase) || 0,
          employeeContribution: contribPreview.employee,
          employerContribution: contribPreview.employer,
          totalContribution: contribPreview.total,
        }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to save");
      toast.success("Contribution recorded");
      setContribOpen(false);
      setContribForm({
        employeeId: "",
        type: "",
        month: String(new Date().getMonth() + 1),
        year: String(currentYear),
        wageBase: "",
      });
      loadContributions();
    } catch (err: any) {
      toast.error(err.message || "Failed to save contribution");
    } finally {
      setSavingContrib(false);
    }
  }

  async function removeContribution(id: number) {
    try {
      const res = await fetch(`/api/statutory-contributions?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Contribution deleted");
      loadContributions();
    } catch {
      toast.error("Failed to delete contribution");
    }
  }

  async function saveChallan(e: React.FormEvent) {
    e.preventDefault();
    if (!challanForm.type || !challanForm.period) {
      toast.error("Please select a type and period");
      return;
    }
    setSavingChallan(true);
    try {
      const res = await fetch("/api/challans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          type: challanForm.type,
          period: challanForm.period,
          totalAmount: Number(challanForm.totalAmount) || 0,
          employeeCount: parseInt(challanForm.employeeCount) || 0,
          referenceNumber: challanForm.referenceNumber || null,
          dueDate: challanForm.dueDate || null,
        }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to save");
      toast.success("Challan created");
      setChallanOpen(false);
      setChallanForm({
        type: "",
        period: "",
        totalAmount: "",
        employeeCount: "",
        referenceNumber: "",
        dueDate: "",
      });
      loadChallans();
    } catch (err: any) {
      toast.error(err.message || "Failed to save challan");
    } finally {
      setSavingChallan(false);
    }
  }

  async function updateChallanStatus(id: number, status: "Filed" | "Paid") {
    try {
      const res = await fetch(`/api/challans?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to update");
      toast.success(`Challan marked ${status}`);
      loadChallans();
    } catch (err: any) {
      toast.error(err.message || "Failed to update challan");
    }
  }

  async function removeChallan(id: number) {
    try {
      const res = await fetch(`/api/challans?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Challan deleted");
      loadChallans();
    } catch {
      toast.error("Failed to delete challan");
    }
  }

  // Stat cards
  const totalPF = contributions
    .filter((c) => c.type === "PF")
    .reduce((s, c) => s + Number(c.totalContribution || 0), 0);
  const totalESI = contributions
    .filter((c) => c.type === "ESI")
    .reduce((s, c) => s + Number(c.totalContribution || 0), 0);
  const pendingChallans = challans.filter(
    (c) => c.status === "Pending" || c.status === "Generated",
  ).length;
  const totalContributions = contributions.reduce(
    (s, c) => s + Number(c.totalContribution || 0),
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Statutory Compliance
            </h1>
            <p className="text-muted-foreground">
              Manage PF / ESI / PT / LWF contributions and statutory challans
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total PF
              </CardTitle>
              <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inr(totalPF)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                provident fund
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total ESI
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inr(totalESI)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                employee state insurance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Contributions
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inr(totalContributions)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {contributions.length} records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Challans
              </CardTitle>
              <FileWarning className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingChallans}</div>
              <p className="text-xs text-muted-foreground mt-1">
                awaiting filing
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="contributions">
          <TabsList className="mb-4">
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="challans">Challans</TabsTrigger>
          </TabsList>

          {/* Contributions Tab */}
          <TabsContent value="contributions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Statutory Contributions</CardTitle>
                  <CardDescription>
                    PF / ESI / PT / LWF contributions per employee
                  </CardDescription>
                </div>
                <Dialog open={contribOpen} onOpenChange={setContribOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Contribution
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>New Statutory Contribution</DialogTitle>
                      <DialogDescription>
                        Standard rates are computed automatically from the wage
                        base
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveContribution} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Employee</Label>
                          <Select
                            value={contribForm.employeeId}
                            onValueChange={(v) =>
                              setContribForm({
                                ...contribForm,
                                employeeId: v,
                              })
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
                            value={contribForm.type}
                            onValueChange={(v) =>
                              setContribForm({ ...contribForm, type: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {CONTRIBUTION_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Month</Label>
                          <Select
                            value={contribForm.month}
                            onValueChange={(v) =>
                              setContribForm({ ...contribForm, month: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map((m, i) => (
                                <SelectItem key={m} value={String(i + 1)}>
                                  {m}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Year</Label>
                          <Select
                            value={contribForm.year}
                            onValueChange={(v) =>
                              setContribForm({ ...contribForm, year: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {YEARS.map((y) => (
                                <SelectItem key={y} value={String(y)}>
                                  {y}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Wage Base (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={contribForm.wageBase}
                            onChange={(e) =>
                              setContribForm({
                                ...contribForm,
                                wageBase: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Live preview */}
                      <div className="rounded-md border bg-muted/50 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ShieldCheck className="h-4 w-4" />
                          Computed Contribution
                          {contribForm.type && (
                            <Badge variant="outline">{contribForm.type}</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">
                            Employee Share
                          </span>
                          <span className="text-right font-medium">
                            {inr(contribPreview.employee)}
                          </span>
                          <span className="text-muted-foreground">
                            Employer Share
                          </span>
                          <span className="text-right font-medium">
                            {inr(contribPreview.employer)}
                          </span>
                          <span className="text-muted-foreground">Total</span>
                          <span className="text-right font-semibold">
                            {inr(contribPreview.total)}
                          </span>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setContribOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={savingContrib}>
                          {savingContrib ? "Saving..." : "Save Contribution"}
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
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Wage Base</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Employer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          No contributions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      contributions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">
                            {empName(c.employeeId)}
                            {empCode(c.employeeId) && (
                              <div className="text-xs text-muted-foreground">
                                {empCode(c.employeeId)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{c.type}</Badge>
                          </TableCell>
                          <TableCell>
                            {MONTHS[(c.month || 1) - 1]} {c.year}
                          </TableCell>
                          <TableCell>{inr(c.wageBase)}</TableCell>
                          <TableCell>{inr(c.employeeContribution)}</TableCell>
                          <TableCell>{inr(c.employerContribution)}</TableCell>
                          <TableCell className="font-medium">
                            {inr(c.totalContribution)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeContribution(c.id)}
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
          </TabsContent>

          {/* Challans Tab */}
          <TabsContent value="challans">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Statutory Challans</CardTitle>
                  <CardDescription>
                    Generate and track ECR / EPFO / ESIC / PT / TDS challans
                  </CardDescription>
                </div>
                <Dialog open={challanOpen} onOpenChange={setChallanOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Challan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>New Challan</DialogTitle>
                      <DialogDescription>
                        Create a statutory challan for a filing period
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveChallan} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={challanForm.type}
                            onValueChange={(v) =>
                              setChallanForm({ ...challanForm, type: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {CHALLAN_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Period (Month)</Label>
                          <Input
                            type="month"
                            value={challanForm.period}
                            onChange={(e) =>
                              setChallanForm({
                                ...challanForm,
                                period: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Total Amount (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={challanForm.totalAmount}
                            onChange={(e) =>
                              setChallanForm({
                                ...challanForm,
                                totalAmount: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Employee Count</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={challanForm.employeeCount}
                            onChange={(e) =>
                              setChallanForm({
                                ...challanForm,
                                employeeCount: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Reference Number</Label>
                          <Input
                            placeholder="Optional"
                            value={challanForm.referenceNumber}
                            onChange={(e) =>
                              setChallanForm({
                                ...challanForm,
                                referenceNumber: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Due Date</Label>
                          <Input
                            type="date"
                            value={challanForm.dueDate}
                            onChange={(e) =>
                              setChallanForm({
                                ...challanForm,
                                dueDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setChallanOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={savingChallan}>
                          {savingChallan ? "Saving..." : "Save Challan"}
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
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {challans.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-8"
                        >
                          No challans found
                        </TableCell>
                      </TableRow>
                    ) : (
                      challans.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{c.type}</Badge>
                          </TableCell>
                          <TableCell>{c.period}</TableCell>
                          <TableCell>{inr(c.totalAmount)}</TableCell>
                          <TableCell>{c.employeeCount}</TableCell>
                          <TableCell>{safeDate(c.dueDate)}</TableCell>
                          <TableCell>
                            <Badge variant={challanStatusVariant(c.status)}>
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {c.status !== "Filed" &&
                                c.status !== "Paid" && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() =>
                                      updateChallanStatus(c.id, "Filed")
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    File
                                  </Button>
                                )}
                              {c.status !== "Paid" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() =>
                                    updateChallanStatus(c.id, "Paid")
                                  }
                                >
                                  <Wallet className="h-4 w-4 mr-1" />
                                  Pay
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeChallan(c.id)}
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
