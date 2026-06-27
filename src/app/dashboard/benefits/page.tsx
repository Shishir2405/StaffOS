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
  Banknote,
  Wallet,
  ShieldCheck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "@/components/ui/custom-toast";
import { format } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

interface Loan {
  id: number;
  employeeId: number;
  loanType: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  amountPaid: number;
  outstandingAmount: number;
  startDate: string;
  status: string;
  createdAt: string;
}

interface Reimbursement {
  id: number;
  employeeId: number;
  category: string;
  amount: number;
  claimDate: string;
  billDate?: string | null;
  description?: string | null;
  status: string;
  createdAt: string;
}

interface InsurancePolicy {
  id: number;
  employeeId: number;
  policyType: string;
  provider: string;
  policyNumber?: string | null;
  coverageAmount: number;
  premium: number;
  employeeShare: number;
  employerShare: number;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  createdAt: string;
}

const money = (n: number | null | undefined) =>
  `₹${Number(n || 0).toLocaleString("en-IN")}`;

const safeDate = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : format(dt, "MMM dd, yyyy");
};

const statusVariant = (
  status: string,
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Approved":
    case "Active":
    case "Verified":
    case "Paid":
    case "Completed":
    case "Filed":
    case "Posted":
      return "default";
    case "Pending":
    case "Draft":
    case "Declared":
    case "Upcoming":
    case "Submitted":
    case "In Progress":
      return "secondary";
    case "Rejected":
    case "Overdue":
    case "Defaulted":
    case "Failed":
    case "Expired":
    case "Cancelled":
      return "destructive";
    default:
      return "outline";
  }
};

export default function BenefitsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const sessionUser = session?.user as any;
  const isAdminOrHR =
    sessionUser?.role === "admin" || sessionUser?.role === "hr";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  const [loanOpen, setLoanOpen] = useState(false);
  const [reimbOpen, setReimbOpen] = useState(false);
  const [insOpen, setInsOpen] = useState(false);

  const [loanForm, setLoanForm] = useState({
    employeeId: "",
    loanType: "Personal",
    principalAmount: "",
    interestRate: "",
    tenureMonths: "",
  });
  const [reimbForm, setReimbForm] = useState({
    employeeId: "",
    category: "Travel",
    amount: "",
    claimDate: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [insForm, setInsForm] = useState({
    employeeId: "",
    policyType: "Health",
    provider: "",
    policyNumber: "",
    coverageAmount: "",
    premium: "",
    employeeShare: "",
    employerShare: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) loadAll();
  }, [session]);

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("bearer_token") : "";

  const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

  const empName = (id: number) => {
    const e = employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.lastName}` : `Employee #${id}`;
  };
  const empCode = (id: number) => {
    const e = employees.find((x) => x.id === id);
    return e?.employeeCode;
  };

  async function loadAll() {
    setIsFetching(true);
    try {
      const [empRes, loanRes, reimbRes, insRes] = await Promise.all([
        fetch("/api/employees", { headers: authHeaders() }),
        fetch("/api/loans", { headers: authHeaders() }),
        fetch("/api/reimbursements", { headers: authHeaders() }),
        fetch("/api/insurance", { headers: authHeaders() }),
      ]);

      const empData = await empRes.json();
      const empArr = Array.isArray(empData)
        ? empData
        : (empData.data ?? empData.employees ?? []);
      setEmployees(empArr);

      const loanData = await loanRes.json();
      setLoans(Array.isArray(loanData) ? loanData : []);

      const reimbData = await reimbRes.json();
      setReimbursements(Array.isArray(reimbData) ? reimbData : []);

      const insData = await insRes.json();
      setPolicies(Array.isArray(insData) ? insData : []);
    } catch {
      toast.error("Failed to load benefits data");
    } finally {
      setIsFetching(false);
    }
  }

  // ── EMI live preview (simple flat) ─────────────────────────────
  const emiPreview = () => {
    const p = Number(loanForm.principalAmount) || 0;
    const r = Number(loanForm.interestRate) || 0;
    const t = Number(loanForm.tenureMonths) || 0;
    if (p <= 0 || t <= 0) return 0;
    return (p + (p * r * t) / 100 / 12) / t;
  };
  const totalPayable = () => {
    const t = Number(loanForm.tenureMonths) || 0;
    return emiPreview() * t;
  };

  async function saveLoan(e: React.FormEvent) {
    e.preventDefault();
    if (
      !loanForm.employeeId ||
      !loanForm.loanType ||
      !loanForm.principalAmount ||
      !loanForm.tenureMonths
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const p = Number(loanForm.principalAmount);
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          employeeId: Number(loanForm.employeeId),
          loanType: loanForm.loanType,
          principalAmount: p,
          interestRate: Number(loanForm.interestRate) || 0,
          tenureMonths: Number(loanForm.tenureMonths),
          emiAmount: emiPreview(),
          outstandingAmount: p,
        }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to create loan");
      toast.success("Loan created");
      setLoanOpen(false);
      setLoanForm({
        employeeId: "",
        loanType: "Personal",
        principalAmount: "",
        interestRate: "",
        tenureMonths: "",
      });
      loadAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function closeLoan(id: number) {
    try {
      const res = await fetch(`/api/loans?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: "Closed", outstandingAmount: 0 }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Loan marked as closed");
      loadAll();
    } catch {
      toast.error("Failed to close loan");
    }
  }

  async function saveReimb(e: React.FormEvent) {
    e.preventDefault();
    if (!reimbForm.employeeId || !reimbForm.amount || !reimbForm.claimDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          employeeId: Number(reimbForm.employeeId),
          category: reimbForm.category,
          amount: Number(reimbForm.amount),
          claimDate: reimbForm.claimDate,
          description: reimbForm.description || null,
        }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to create claim");
      toast.success("Reimbursement claim submitted");
      setReimbOpen(false);
      setReimbForm({
        employeeId: "",
        category: "Travel",
        amount: "",
        claimDate: new Date().toISOString().split("T")[0],
        description: "",
      });
      loadAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateReimbStatus(id: number, status: string) {
    try {
      const res = await fetch(`/api/reimbursements?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Claim marked ${status.toLowerCase()}`);
      loadAll();
    } catch {
      toast.error("Failed to update claim");
    }
  }

  async function saveInsurance(e: React.FormEvent) {
    e.preventDefault();
    if (!insForm.employeeId || !insForm.policyType || !insForm.provider) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          employeeId: Number(insForm.employeeId),
          policyType: insForm.policyType,
          provider: insForm.provider,
          policyNumber: insForm.policyNumber || null,
          coverageAmount: Number(insForm.coverageAmount) || 0,
          premium: Number(insForm.premium) || 0,
          employeeShare: Number(insForm.employeeShare) || 0,
          employerShare: Number(insForm.employerShare) || 0,
          startDate: insForm.startDate || null,
          endDate: insForm.endDate || null,
        }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to create policy");
      toast.success("Insurance policy added");
      setInsOpen(false);
      setInsForm({
        employeeId: "",
        policyType: "Health",
        provider: "",
        policyNumber: "",
        coverageAmount: "",
        premium: "",
        employeeShare: "",
        employerShare: "",
        startDate: "",
        endDate: "",
      });
      loadAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removePolicy(id: number) {
    try {
      const res = await fetch(`/api/insurance?id=${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Policy removed");
      loadAll();
    } catch {
      toast.error("Failed to remove policy");
    }
  }

  // ── Stats ──────────────────────────────────────────────────────
  const totalDisbursed = loans.reduce(
    (s, l) => s + Number(l.principalAmount || 0),
    0,
  );
  const totalOutstanding = loans.reduce(
    (s, l) => s + Number(l.outstandingAmount || 0),
    0,
  );
  const activeLoans = loans.filter((l) => l.status === "Active").length;

  const pendingReimb = reimbursements
    .filter((r) => r.status === "Pending")
    .reduce((s, r) => s + Number(r.amount || 0), 0);
  const approvedReimb = reimbursements
    .filter((r) => r.status === "Approved")
    .reduce((s, r) => s + Number(r.amount || 0), 0);
  const paidReimb = reimbursements
    .filter((r) => r.status === "Paid")
    .reduce((s, r) => s + Number(r.amount || 0), 0);

  const activePolicies = policies.filter((p) => p.status === "Active").length;
  const totalCoverage = policies.reduce(
    (s, p) => s + Number(p.coverageAmount || 0),
    0,
  );

  const employeeOptions = (
    <SelectContent>
      {employees.length === 0 ? (
        <SelectItem value="none" disabled>
          No employees found
        </SelectItem>
      ) : (
        employees.map((e) => (
          <SelectItem key={e.id} value={String(e.id)}>
            {e.firstName} {e.lastName} ({e.employeeCode})
          </SelectItem>
        ))
      )}
    </SelectContent>
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
              Benefits &amp; Deductions
            </h1>
            <p className="text-muted-foreground">
              Manage employee loans, reimbursements and insurance policies
            </p>
          </div>
          <Button variant="outline" onClick={loadAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="loans">
          <TabsList className="mb-2">
            <TabsTrigger value="loans">
              <Banknote className="mr-2 h-4 w-4" />
              Loans
            </TabsTrigger>
            <TabsTrigger value="reimbursements">
              <Wallet className="mr-2 h-4 w-4" />
              Reimbursements
            </TabsTrigger>
            <TabsTrigger value="insurance">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Insurance
            </TabsTrigger>
          </TabsList>

          {/* ─────────────── LOANS TAB ─────────────── */}
          <TabsContent value="loans" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Disbursed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {money(totalDisbursed)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {loans.length} loan{loans.length === 1 ? "" : "s"} total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Outstanding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {money(totalOutstanding)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    yet to be recovered
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Loans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeLoans}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    currently being repaid
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Loans &amp; Advances</CardTitle>
                  <CardDescription>
                    Employee loans with EMI tracking
                  </CardDescription>
                </div>
                <Dialog open={loanOpen} onOpenChange={setLoanOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Loan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Loan / Advance</DialogTitle>
                      <DialogDescription>
                        EMI is computed on a simple flat-interest basis.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveLoan} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Employee</Label>
                        <Select
                          value={loanForm.employeeId}
                          onValueChange={(v) =>
                            setLoanForm({ ...loanForm, employeeId: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          {employeeOptions}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Loan Type</Label>
                        <Select
                          value={loanForm.loanType}
                          onValueChange={(v) =>
                            setLoanForm({ ...loanForm, loanType: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Personal">Personal</SelectItem>
                            <SelectItem value="Salary Advance">
                              Salary Advance
                            </SelectItem>
                            <SelectItem value="Emergency">Emergency</SelectItem>
                            <SelectItem value="Vehicle">Vehicle</SelectItem>
                            <SelectItem value="Housing">Housing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Principal (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="100000"
                            value={loanForm.principalAmount}
                            onChange={(e) =>
                              setLoanForm({
                                ...loanForm,
                                principalAmount: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Interest Rate (% p.a.)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="10"
                            value={loanForm.interestRate}
                            onChange={(e) =>
                              setLoanForm({
                                ...loanForm,
                                interestRate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Tenure (months)</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="12"
                          value={loanForm.tenureMonths}
                          onChange={(e) =>
                            setLoanForm({
                              ...loanForm,
                              tenureMonths: e.target.value,
                            })
                          }
                        />
                      </div>

                      {/* Live EMI preview */}
                      <div className="rounded-lg border bg-muted p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Estimated Monthly EMI
                          </span>
                          <span className="text-xl font-bold">
                            {money(Math.round(emiPreview()))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Total payable over tenure</span>
                          <span>{money(Math.round(totalPayable()))}</span>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setLoanOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? "Saving..." : "Create Loan"}
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
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">EMI</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-8"
                        >
                          No loans recorded yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      loans.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">
                            {empName(l.employeeId)}
                            {empCode(l.employeeId) && (
                              <div className="text-xs text-muted-foreground">
                                {empCode(l.employeeId)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{l.loanType}</TableCell>
                          <TableCell className="text-right">
                            {money(l.principalAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {money(l.emiAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {money(l.outstandingAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(l.status)}>
                              {l.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {l.status === "Active" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => closeLoan(l.id)}
                              >
                                Mark Closed
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
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

          {/* ─────────────── REIMBURSEMENTS TAB ─────────────── */}
          <TabsContent value="reimbursements" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{money(pendingReimb)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    awaiting approval
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Approved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {money(approvedReimb)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ready to pay out
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Paid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{money(paidReimb)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    settled claims
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Reimbursement Claims</CardTitle>
                  <CardDescription>
                    Expense claims submitted by employees
                  </CardDescription>
                </div>
                <Dialog open={reimbOpen} onOpenChange={setReimbOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Claim
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Submit Reimbursement Claim</DialogTitle>
                      <DialogDescription>
                        Record an expense claim for approval.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveReimb} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Employee</Label>
                        <Select
                          value={reimbForm.employeeId}
                          onValueChange={(v) =>
                            setReimbForm({ ...reimbForm, employeeId: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          {employeeOptions}
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={reimbForm.category}
                            onValueChange={(v) =>
                              setReimbForm({ ...reimbForm, category: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Travel">Travel</SelectItem>
                              <SelectItem value="Medical">Medical</SelectItem>
                              <SelectItem value="Food">Food</SelectItem>
                              <SelectItem value="Communication">
                                Communication
                              </SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Amount (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="5000"
                            value={reimbForm.amount}
                            onChange={(e) =>
                              setReimbForm({
                                ...reimbForm,
                                amount: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Claim Date</Label>
                        <Input
                          type="date"
                          value={reimbForm.claimDate}
                          onChange={(e) =>
                            setReimbForm({
                              ...reimbForm,
                              claimDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Details of the expense"
                          value={reimbForm.description}
                          onChange={(e) =>
                            setReimbForm({
                              ...reimbForm,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setReimbOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? "Saving..." : "Submit Claim"}
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
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Claim Date</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdminOrHR && (
                        <TableHead className="text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reimbursements.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={isAdminOrHR ? 6 : 5}
                          className="text-center text-muted-foreground py-8"
                        >
                          No reimbursement claims yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      reimbursements.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {empName(r.employeeId)}
                            {empCode(r.employeeId) && (
                              <div className="text-xs text-muted-foreground">
                                {empCode(r.employeeId)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{r.category}</TableCell>
                          <TableCell className="text-right">
                            {money(r.amount)}
                          </TableCell>
                          <TableCell>{safeDate(r.claimDate)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(r.status)}>
                              {r.status}
                            </Badge>
                          </TableCell>
                          {isAdminOrHR && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {r.status === "Pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() =>
                                        updateReimbStatus(r.id, "Approved")
                                      }
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        updateReimbStatus(r.id, "Rejected")
                                      }
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {r.status === "Approved" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      updateReimbStatus(r.id, "Paid")
                                    }
                                  >
                                    Mark Paid
                                  </Button>
                                )}
                                {(r.status === "Paid" ||
                                  r.status === "Rejected") && (
                                  <span className="text-xs text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─────────────── INSURANCE TAB ─────────────── */}
          <TabsContent value="insurance" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Policies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activePolicies}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {policies.length} total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {money(totalCoverage)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    across all policies
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Insurance Policies</CardTitle>
                  <CardDescription>
                    Health, life and accident cover for employees
                  </CardDescription>
                </div>
                <Dialog open={insOpen} onOpenChange={setInsOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Policy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Insurance Policy</DialogTitle>
                      <DialogDescription>
                        Register an insurance policy for an employee.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveInsurance} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Employee</Label>
                        <Select
                          value={insForm.employeeId}
                          onValueChange={(v) =>
                            setInsForm({ ...insForm, employeeId: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          {employeeOptions}
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Policy Type</Label>
                          <Select
                            value={insForm.policyType}
                            onValueChange={(v) =>
                              setInsForm({ ...insForm, policyType: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Health">Health</SelectItem>
                              <SelectItem value="Life">Life</SelectItem>
                              <SelectItem value="Accident">Accident</SelectItem>
                              <SelectItem value="Term">Term</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Provider</Label>
                          <Input
                            placeholder="e.g. Star Health"
                            value={insForm.provider}
                            onChange={(e) =>
                              setInsForm({
                                ...insForm,
                                provider: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Policy Number</Label>
                        <Input
                          placeholder="Optional"
                          value={insForm.policyNumber}
                          onChange={(e) =>
                            setInsForm({
                              ...insForm,
                              policyNumber: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Coverage (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="500000"
                            value={insForm.coverageAmount}
                            onChange={(e) =>
                              setInsForm({
                                ...insForm,
                                coverageAmount: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Premium (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="12000"
                            value={insForm.premium}
                            onChange={(e) =>
                              setInsForm({
                                ...insForm,
                                premium: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Employee Share (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={insForm.employeeShare}
                            onChange={(e) =>
                              setInsForm({
                                ...insForm,
                                employeeShare: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Employer Share (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="12000"
                            value={insForm.employerShare}
                            onChange={(e) =>
                              setInsForm({
                                ...insForm,
                                employerShare: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={insForm.startDate}
                            onChange={(e) =>
                              setInsForm({
                                ...insForm,
                                startDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={insForm.endDate}
                            onChange={(e) =>
                              setInsForm({
                                ...insForm,
                                endDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setInsOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? "Saving..." : "Add Policy"}
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
                      <TableHead>Policy Type</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead className="text-right">Coverage</TableHead>
                      <TableHead className="text-right">Premium</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-8"
                        >
                          No insurance policies yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      policies.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {empName(p.employeeId)}
                            {empCode(p.employeeId) && (
                              <div className="text-xs text-muted-foreground">
                                {empCode(p.employeeId)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{p.policyType}</TableCell>
                          <TableCell>{p.provider}</TableCell>
                          <TableCell className="text-right">
                            {money(p.coverageAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {money(p.premium)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(p.status)}>
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removePolicy(p.id)}
                            >
                              Delete
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
