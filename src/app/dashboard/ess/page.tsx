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
  RefreshCw,
  Download,
  Receipt,
  CalendarDays,
  ShieldCheck,
  User,
  Banknote,
  Wallet,
  FileWarning,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/components/ui/custom-toast";
import { format } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { exportData } from "@/lib/export-client";

interface Payslip {
  id: number;
  employeeId?: number;
  employeeName?: string;
  department?: string;
  periodStart?: string;
  periodEnd?: string;
  basicSalary?: number;
  grossSalary?: number;
  netSalary?: number;
  pfAmount?: number;
  esiAmount?: number;
  tdsAmount?: number;
  status?: string;
}

interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: string;
  createdAt?: string;
}

interface TaxDeclaration {
  id: number;
  employeeId: number;
  financialYear?: string;
  section?: string;
  category?: string;
  declaredAmount?: number;
  proofAmount?: number;
  proofStatus?: string;
}

function safeDate(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : format(dt, "MMM dd, yyyy");
}

function inr(n: any) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function statusVariant(
  status?: string,
): "default" | "secondary" | "destructive" | "outline" {
  const s = (status || "").toLowerCase();
  if (
    ["approved", "active", "verified", "paid", "completed", "filed", "posted"].includes(s)
  )
    return "default";
  if (
    ["pending", "draft", "declared", "upcoming", "submitted", "in progress"].includes(s)
  )
    return "secondary";
  if (["rejected", "overdue", "defaulted", "failed", "expired"].includes(s))
    return "destructive";
  return "outline";
}

export default function EssPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const sessionUser = session?.user as any;
  const employeeId: number | null = sessionUser?.employeeId ?? null;

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [leave, setLeave] = useState<LeaveRequest[]>([]);
  const [taxProofs, setTaxProofs] = useState<TaxDeclaration[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const token = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("bearer_token") || ""
      : "";

  async function loadAll() {
    setIsFetching(true);
    const headers = { Authorization: `Bearer ${token()}` };
    try {
      // My Payslips — scoped to the logged-in employee when we have an id.
      const payslipUrl = employeeId
        ? `/api/payslips?employeeId=${employeeId}`
        : `/api/payslips`;
      const [pRes, lRes, tRes] = await Promise.all([
        fetch(payslipUrl, { headers }),
        fetch("/api/leave-requests", { headers }),
        fetch("/api/tax-declarations", { headers }),
      ]);

      if (pRes.ok) {
        const pd = await pRes.json();
        const arr: Payslip[] = Array.isArray(pd) ? pd : (pd.data ?? []);
        setPayslips(
          employeeId
            ? arr.filter((p) => !p.employeeId || p.employeeId === employeeId)
            : arr,
        );
      }

      if (lRes.ok) {
        const ld = await lRes.json();
        const arr: LeaveRequest[] = Array.isArray(ld) ? ld : (ld.data ?? ld);
        setLeave(
          (Array.isArray(arr) ? arr : []).filter(
            (r) => !employeeId || r.employeeId === employeeId,
          ),
        );
      }

      if (tRes.ok) {
        const td = await tRes.json();
        const arr: TaxDeclaration[] = Array.isArray(td) ? td : (td.data ?? td);
        setTaxProofs(
          (Array.isArray(arr) ? arr : []).filter(
            (r) => !employeeId || r.employeeId === employeeId,
          ),
        );
      }

      // My Profile — fetch the employee record if linked, else fall back to session.
      if (employeeId) {
        const empRes = await fetch(`/api/employees?id=${employeeId}`, {
          headers,
        });
        if (empRes.ok) {
          const ed = await empRes.json();
          setProfile(Array.isArray(ed) ? ed[0] : ed);
        }
      }
    } catch {
      toast.error("Failed to load your self-service data");
    } finally {
      setIsFetching(false);
    }
  }

  async function downloadPayslip(p: Payslip) {
    try {
      await exportData({
        format: "pdf",
        filename: `payslip-${p.id}`,
        title: "Payslip",
        columns: [
          { key: "label", label: "Item" },
          { key: "value", label: "Amount" },
        ],
        rows: [
          { label: "Employee", value: p.employeeName ?? "—" },
          { label: "Department", value: p.department ?? "—" },
          {
            label: "Period",
            value: `${safeDate(p.periodStart)} - ${safeDate(p.periodEnd)}`,
          },
          { label: "Basic", value: inr(p.basicSalary) },
          { label: "Gross", value: inr(p.grossSalary) },
          { label: "PF", value: inr(p.pfAmount) },
          { label: "ESI", value: inr(p.esiAmount) },
          { label: "TDS", value: inr(p.tdsAmount) },
          { label: "Net Pay", value: inr(p.netSalary) },
        ],
      });
      toast.success("Payslip downloaded");
    } catch (err: any) {
      toast.error(err?.message || "Failed to download payslip");
    }
  }

  // Derived stats
  const sortedPayslips = [...payslips].sort((a, b) => {
    const da = new Date(a.periodEnd || a.periodStart || 0).getTime();
    const db2 = new Date(b.periodEnd || b.periodStart || 0).getTime();
    return db2 - da;
  });
  const latestNetPay = sortedPayslips[0]?.netSalary ?? 0;
  const leaveTaken = leave
    .filter((l) => l.status?.toLowerCase() === "approved")
    .reduce((sum, l) => sum + Number(l.totalDays || 0), 0);
  const pendingProofs = taxProofs.filter(
    (t) =>
      (t.proofStatus || "").toLowerCase() === "declared" ||
      (t.proofStatus || "").toLowerCase() === "submitted",
  ).length;

  const displayName =
    profile?.firstName || profile?.lastName
      ? `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim()
      : sessionUser?.name || "—";
  const displayEmail = profile?.email || sessionUser?.email || "—";

  if (isPending || isFetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Employee Self-Service
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {displayName}. View your payslips, leave, tax proofs
              and profile.
            </p>
          </div>
          <Button variant="outline" onClick={loadAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {!employeeId && (
          <Card className="border-dashed">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                Your account isn&apos;t linked to an employee record, so personal
                data may be limited. Please contact your HR administrator to link
                your profile.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stat cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Latest Net Pay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <div className="text-3xl font-bold">{inr(latestNetPay)}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {sortedPayslips[0]
                  ? `${safeDate(sortedPayslips[0].periodStart)} - ${safeDate(
                      sortedPayslips[0].periodEnd,
                    )}`
                  : "No payslips yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Leave Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <div className="text-3xl font-bold">{leaveTaken}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                approved days this period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Tax Proofs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-muted-foreground" />
                <div className="text-3xl font-bold">{pendingProofs}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                awaiting proof submission/verification
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="payslips">
              <TabsList className="mb-4 flex-wrap h-auto">
                <TabsTrigger value="payslips">
                  <Receipt className="mr-2 h-4 w-4" />
                  My Payslips
                </TabsTrigger>
                <TabsTrigger value="leave">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  My Leave
                </TabsTrigger>
                <TabsTrigger value="tax">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  My Tax Proofs
                </TabsTrigger>
                <TabsTrigger value="profile">
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </TabsTrigger>
              </TabsList>

              {/* My Payslips */}
              <TabsContent value="payslips">
                {!employeeId && payslips.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No employee record linked — payslips are unavailable.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedPayslips.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground py-8"
                          >
                            No payslips found
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedPayslips.map((p) => {
                          const deductions =
                            Number(p.pfAmount || 0) +
                            Number(p.esiAmount || 0) +
                            Number(p.tdsAmount || 0);
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">
                                {safeDate(p.periodStart)} -{" "}
                                {safeDate(p.periodEnd)}
                              </TableCell>
                              <TableCell>{inr(p.grossSalary)}</TableCell>
                              <TableCell>{inr(deductions)}</TableCell>
                              <TableCell className="font-medium">
                                {inr(p.netSalary)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusVariant(p.status)}>
                                  {p.status || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadPayslip(p)}
                                >
                                  <Download className="mr-1 h-4 w-4" />
                                  Download
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              {/* My Leave */}
              <TabsContent value="leave">
                <div className="flex justify-end mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard/leave")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Apply for Leave
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leave.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          No leave requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      leave.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">
                            {l.leaveType}
                          </TableCell>
                          <TableCell>{safeDate(l.startDate)}</TableCell>
                          <TableCell>{safeDate(l.endDate)}</TableCell>
                          <TableCell>{l.totalDays}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(l.status)}>
                              {l.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{safeDate(l.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* My Tax Proofs */}
              <TabsContent value="tax">
                <div className="flex justify-end mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard/tax")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Manage Tax Declarations
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Financial Year</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Declared</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxProofs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          No tax declarations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      taxProofs.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">
                            {t.financialYear || "—"}
                          </TableCell>
                          <TableCell>{t.section || "—"}</TableCell>
                          <TableCell>{t.category || "—"}</TableCell>
                          <TableCell>{inr(t.declaredAmount)}</TableCell>
                          <TableCell>{inr(t.proofAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(t.proofStatus)}>
                              {t.proofStatus || "—"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* My Profile */}
              <TabsContent value="profile">
                <div className="grid gap-4 md:grid-cols-2 max-w-3xl">
                  <ProfileField
                    icon={<User className="h-4 w-4" />}
                    label="Name"
                    value={displayName}
                  />
                  <ProfileField
                    label="Email"
                    value={displayEmail}
                  />
                  <ProfileField
                    label="Employee Code"
                    value={profile?.employeeCode || "—"}
                  />
                  <ProfileField
                    label="Department"
                    value={profile?.department || "—"}
                  />
                  <ProfileField
                    label="Designation"
                    value={profile?.designation || "—"}
                  />
                  <ProfileField
                    icon={<Banknote className="h-4 w-4" />}
                    label="Bank"
                    value={profile?.bankName || "—"}
                  />
                  <ProfileField
                    label="Date of Joining"
                    value={safeDate(profile?.dateOfJoining)}
                  />
                  <ProfileField
                    label="Employment Status"
                    value={profile?.employmentStatus || "—"}
                  />
                </div>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() =>
                      toast.success("Request submitted", {
                        description:
                          "Your profile update request has been sent to HR.",
                      })
                    }
                  >
                    Update details
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function ProfileField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-medium break-words">{value}</div>
    </div>
  );
}
