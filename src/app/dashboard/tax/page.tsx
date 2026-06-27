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
import { toast } from "@/components/ui/custom-toast";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  Receipt,
  FileCheck,
  Clock,
  Calculator,
} from "lucide-react";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

interface TaxDeclaration {
  id: number;
  employeeId: number;
  financialYear: string;
  section: string;
  category: string;
  declaredAmount: number;
  proofAmount: number;
  proofStatus: string;
  verifiedBy?: number | null;
  remarks?: string | null;
  createdAt: string;
}

interface TaxComputation {
  id: number;
  employeeId: number;
  financialYear: string;
  regime: string;
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxLiability: number;
  cess: number;
  tdsDeducted: number;
  tdsBalance: number;
  createdAt: string;
}

const FINANCIAL_YEARS = ["2023-24", "2024-25", "2025-26", "2026-27"];
const SECTIONS = [
  "80C",
  "80D",
  "80CCD",
  "80E",
  "80G",
  "80TTA",
  "HRA",
  "Home Loan",
  "Standard Deduction",
];

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case "verified":
      return "default";
    case "declared":
    case "submitted":
      return "secondary";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

// Simple New-regime slab tax (FY 2023-24 onward style preview)
function computeNewRegimeTax(taxable: number): {
  liability: number;
  cess: number;
  total: number;
} {
  let tax = 0;
  const slabs: [number, number, number][] = [
    [0, 300000, 0],
    [300000, 600000, 0.05],
    [600000, 900000, 0.1],
    [900000, 1200000, 0.15],
    [1200000, 1500000, 0.2],
  ];
  for (const [from, to, rate] of slabs) {
    if (taxable > from) {
      tax += (Math.min(taxable, to) - from) * rate;
    }
  }
  if (taxable > 1500000) {
    tax += (taxable - 1500000) * 0.3;
  }
  const cess = tax * 0.04;
  return { liability: tax, cess, total: tax + cess };
}

export default function TaxPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const sessionUser = session?.user as any;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [declarations, setDeclarations] = useState<TaxDeclaration[]>([]);
  const [computations, setComputations] = useState<TaxComputation[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [declOpen, setDeclOpen] = useState(false);
  const [compOpen, setCompOpen] = useState(false);
  const [savingDecl, setSavingDecl] = useState(false);
  const [savingComp, setSavingComp] = useState(false);

  const [declForm, setDeclForm] = useState({
    employeeId: "",
    financialYear: "2025-26",
    section: "",
    category: "",
    declaredAmount: "",
    proofAmount: "",
  });

  const [compForm, setCompForm] = useState({
    employeeId: "",
    financialYear: "2025-26",
    regime: "New",
    grossIncome: "",
    totalDeductions: "",
    tdsDeducted: "",
  });

  const isAdminOrHR =
    sessionUser?.role === "admin" || sessionUser?.role === "hr";

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
    await Promise.all([loadEmployees(), loadDeclarations(), loadComputations()]);
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

  async function loadDeclarations() {
    try {
      const res = await fetch("/api/tax-declarations", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setDeclarations(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load declarations");
    }
  }

  async function loadComputations() {
    try {
      const res = await fetch("/api/tax-computations", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setComputations(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load computations");
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

  async function saveDeclaration(e: React.FormEvent) {
    e.preventDefault();
    if (
      !declForm.employeeId ||
      !declForm.financialYear ||
      !declForm.section ||
      !declForm.category
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSavingDecl(true);
    try {
      const res = await fetch("/api/tax-declarations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          employeeId: parseInt(declForm.employeeId),
          financialYear: declForm.financialYear,
          section: declForm.section,
          category: declForm.category,
          declaredAmount: Number(declForm.declaredAmount) || 0,
          proofAmount: Number(declForm.proofAmount) || 0,
        }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to save");
      toast.success("Declaration added");
      setDeclOpen(false);
      setDeclForm({
        employeeId: "",
        financialYear: "2025-26",
        section: "",
        category: "",
        declaredAmount: "",
        proofAmount: "",
      });
      loadDeclarations();
    } catch (err: any) {
      toast.error(err.message || "Failed to save declaration");
    } finally {
      setSavingDecl(false);
    }
  }

  async function verifyDeclaration(
    id: number,
    proofStatus: "Verified" | "Rejected",
  ) {
    try {
      const res = await fetch(`/api/tax-declarations?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          proofStatus,
          verifiedBy: sessionUser?.employeeId ?? null,
        }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to update");
      toast.success(`Declaration ${proofStatus.toLowerCase()}`);
      loadDeclarations();
    } catch (err: any) {
      toast.error(err.message || "Failed to update declaration");
    }
  }

  async function removeDeclaration(id: number) {
    try {
      const res = await fetch(`/api/tax-declarations?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Declaration deleted");
      loadDeclarations();
    } catch {
      toast.error("Failed to delete declaration");
    }
  }

  // Live preview of computation
  const previewGross = Number(compForm.grossIncome) || 0;
  const previewDeductions = Number(compForm.totalDeductions) || 0;
  const previewTaxable = Math.max(previewGross - previewDeductions, 0);
  const previewTax = computeNewRegimeTax(previewTaxable);
  const previewTds = Number(compForm.tdsDeducted) || 0;
  const previewBalance = previewTax.total - previewTds;

  async function saveComputation(e: React.FormEvent) {
    e.preventDefault();
    if (!compForm.employeeId || !compForm.financialYear) {
      toast.error("Please select an employee and financial year");
      return;
    }
    setSavingComp(true);
    try {
      const res = await fetch("/api/tax-computations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          employeeId: parseInt(compForm.employeeId),
          financialYear: compForm.financialYear,
          regime: compForm.regime,
          grossIncome: previewGross,
          totalDeductions: previewDeductions,
          taxableIncome: previewTaxable,
          taxLiability: previewTax.liability,
          cess: previewTax.cess,
          tdsDeducted: previewTds,
          tdsBalance: previewBalance,
        }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to save");
      toast.success("Computation saved");
      setCompOpen(false);
      setCompForm({
        employeeId: "",
        financialYear: "2025-26",
        regime: "New",
        grossIncome: "",
        totalDeductions: "",
        tdsDeducted: "",
      });
      loadComputations();
    } catch (err: any) {
      toast.error(err.message || "Failed to save computation");
    } finally {
      setSavingComp(false);
    }
  }

  async function removeComputation(id: number) {
    try {
      const res = await fetch(`/api/tax-computations?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Computation deleted");
      loadComputations();
    } catch {
      toast.error("Failed to delete computation");
    }
  }

  // Stat card calculations
  const totalDeclared = declarations.reduce(
    (s, d) => s + Number(d.declaredAmount || 0),
    0,
  );
  const verifiedAmount = declarations
    .filter((d) => d.proofStatus === "Verified")
    .reduce((s, d) => s + Number(d.declaredAmount || 0), 0);
  const pendingProofs = declarations.filter(
    (d) => d.proofStatus === "Declared" || d.proofStatus === "Submitted",
  ).length;
  const totalTaxLiability = computations.reduce(
    (s, c) => s + Number(c.taxLiability || 0) + Number(c.cess || 0),
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
              Tax Management
            </h1>
            <p className="text-muted-foreground">
              Manage investment declarations, proof verification and TDS
              computation
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Declared
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inr(totalDeclared)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {declarations.length} declarations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified Amount
              </CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inr(verifiedAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                proof verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Proofs
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingProofs}</div>
              <p className="text-xs text-muted-foreground mt-1">
                awaiting verification
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tax Liability
              </CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inr(totalTaxLiability)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                across {computations.length} computations
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="declarations">
          <TabsList className="mb-4">
            <TabsTrigger value="declarations">Declarations</TabsTrigger>
            <TabsTrigger value="computation">Computation</TabsTrigger>
          </TabsList>

          {/* Declarations Tab */}
          <TabsContent value="declarations">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Investment Declarations</CardTitle>
                  <CardDescription>
                    Employee tax-saving declarations and proof verification
                  </CardDescription>
                </div>
                <Dialog open={declOpen} onOpenChange={setDeclOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Declaration
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>New Investment Declaration</DialogTitle>
                      <DialogDescription>
                        Record an investment declaration for an employee
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveDeclaration} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Employee</Label>
                          <Select
                            value={declForm.employeeId}
                            onValueChange={(v) =>
                              setDeclForm({ ...declForm, employeeId: v })
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
                          <Label>Financial Year</Label>
                          <Select
                            value={declForm.financialYear}
                            onValueChange={(v) =>
                              setDeclForm({ ...declForm, financialYear: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select FY" />
                            </SelectTrigger>
                            <SelectContent>
                              {FINANCIAL_YEARS.map((fy) => (
                                <SelectItem key={fy} value={fy}>
                                  {fy}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Section</Label>
                          <Select
                            value={declForm.section}
                            onValueChange={(v) =>
                              setDeclForm({ ...declForm, section: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                            <SelectContent>
                              {SECTIONS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Input
                            placeholder="e.g. PPF, ELSS, LIC, Mediclaim"
                            value={declForm.category}
                            onChange={(e) =>
                              setDeclForm({
                                ...declForm,
                                category: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Declared Amount (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={declForm.declaredAmount}
                            onChange={(e) =>
                              setDeclForm({
                                ...declForm,
                                declaredAmount: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Proof Amount (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={declForm.proofAmount}
                            onChange={(e) =>
                              setDeclForm({
                                ...declForm,
                                proofAmount: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDeclOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={savingDecl}>
                          {savingDecl ? "Saving..." : "Save Declaration"}
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
                      <TableHead>FY</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Declared</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {declarations.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          No declarations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      declarations.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">
                            {empName(d.employeeId)}
                            {empCode(d.employeeId) && (
                              <div className="text-xs text-muted-foreground">
                                {empCode(d.employeeId)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{d.financialYear}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{d.section}</Badge>
                          </TableCell>
                          <TableCell>{d.category}</TableCell>
                          <TableCell>{inr(d.declaredAmount)}</TableCell>
                          <TableCell>{inr(d.proofAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(d.proofStatus)}>
                              {d.proofStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {isAdminOrHR &&
                                d.proofStatus !== "Verified" && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() =>
                                      verifyDeclaration(d.id, "Verified")
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Verify
                                  </Button>
                                )}
                              {isAdminOrHR &&
                                d.proofStatus !== "Rejected" && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      verifyDeclaration(d.id, "Rejected")
                                    }
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeDeclaration(d.id)}
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

          {/* Computation Tab */}
          <TabsContent value="computation">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>TDS Computation</CardTitle>
                  <CardDescription>
                    New-regime income tax computation and TDS tracking
                  </CardDescription>
                </div>
                <Dialog open={compOpen} onOpenChange={setCompOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Computation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>New TDS Computation</DialogTitle>
                      <DialogDescription>
                        New tax regime slab computation (preview updates live)
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveComputation} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Employee</Label>
                          <Select
                            value={compForm.employeeId}
                            onValueChange={(v) =>
                              setCompForm({ ...compForm, employeeId: v })
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
                          <Label>Financial Year</Label>
                          <Select
                            value={compForm.financialYear}
                            onValueChange={(v) =>
                              setCompForm({ ...compForm, financialYear: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select FY" />
                            </SelectTrigger>
                            <SelectContent>
                              {FINANCIAL_YEARS.map((fy) => (
                                <SelectItem key={fy} value={fy}>
                                  {fy}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Tax Regime</Label>
                        <Select
                          value={compForm.regime}
                          onValueChange={(v) =>
                            setCompForm({ ...compForm, regime: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select regime" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New Regime</SelectItem>
                            <SelectItem value="Old">Old Regime</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Gross Income (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={compForm.grossIncome}
                            onChange={(e) =>
                              setCompForm({
                                ...compForm,
                                grossIncome: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Total Deductions (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={compForm.totalDeductions}
                            onChange={(e) =>
                              setCompForm({
                                ...compForm,
                                totalDeductions: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>TDS Deducted (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={compForm.tdsDeducted}
                            onChange={(e) =>
                              setCompForm({
                                ...compForm,
                                tdsDeducted: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Live preview */}
                      <div className="rounded-md border bg-muted/50 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calculator className="h-4 w-4" />
                          New Regime Preview
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">
                            Taxable Income
                          </span>
                          <span className="text-right font-medium">
                            {inr(previewTaxable)}
                          </span>
                          <span className="text-muted-foreground">
                            Tax (slabs)
                          </span>
                          <span className="text-right font-medium">
                            {inr(previewTax.liability)}
                          </span>
                          <span className="text-muted-foreground">
                            Cess (4%)
                          </span>
                          <span className="text-right font-medium">
                            {inr(previewTax.cess)}
                          </span>
                          <span className="text-muted-foreground">
                            Total Tax Liability
                          </span>
                          <span className="text-right font-semibold">
                            {inr(previewTax.total)}
                          </span>
                          <span className="text-muted-foreground">
                            TDS Balance
                          </span>
                          <span className="text-right font-medium">
                            {inr(previewBalance)}
                          </span>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCompOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={savingComp}>
                          {savingComp ? "Saving..." : "Save Computation"}
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
                      <TableHead>FY</TableHead>
                      <TableHead>Regime</TableHead>
                      <TableHead>Gross Income</TableHead>
                      <TableHead>Taxable Income</TableHead>
                      <TableHead>Tax Liability</TableHead>
                      <TableHead>TDS Deducted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {computations.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          No computations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      computations.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">
                            {empName(c.employeeId)}
                            {empCode(c.employeeId) && (
                              <div className="text-xs text-muted-foreground">
                                {empCode(c.employeeId)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{c.financialYear}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{c.regime}</Badge>
                          </TableCell>
                          <TableCell>{inr(c.grossIncome)}</TableCell>
                          <TableCell>{inr(c.taxableIncome)}</TableCell>
                          <TableCell>
                            {inr(
                              Number(c.taxLiability || 0) + Number(c.cess || 0),
                            )}
                          </TableCell>
                          <TableCell>{inr(c.tdsDeducted)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeComputation(c.id)}
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
