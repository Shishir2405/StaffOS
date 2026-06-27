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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileDown,
  Banknote,
  ShieldCheck,
  BarChart3,
  Users,
  Receipt,
  Clock,
} from "lucide-react";
import { toast } from "@/components/ui/custom-toast";
import { format } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { downloadReport, exportData, REPORT_TYPES } from "@/lib/export-client";

interface ReportType {
  type: string;
  label: string;
  formats: string[];
  description?: string;
}

// Group statutory/govt report types by their domain so the grid reads like
// a real payroll console rather than a flat list.
const SALARY_BANK_TYPES = ["salary-register", "bank-transfer"];
const STATUTORY_TYPES = ["esic", "epf-ecr", "epf-exit"];
const SUMMARY_TYPES = ["payroll-summary"];

const formatLabels: Record<string, string> = {
  csv: "CSV",
  xlsx: "Excel",
  pdf: "PDF",
  json: "JSON",
};

const groupIcons: Record<string, React.ReactNode> = {
  "Salary & Bank": <Banknote className="h-4 w-4" />,
  "Statutory (PF/ESI/EPF)": <ShieldCheck className="h-4 w-4" />,
  Summary: <BarChart3 className="h-4 w-4" />,
};

export default function ReportsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const reportTypes: ReportType[] = Array.isArray(REPORT_TYPES)
    ? (REPORT_TYPES as ReportType[])
    : [];

  // Per-card selected format and loading state, keyed by report type.
  const [selectedFormat, setSelectedFormat] = useState<Record<string, string>>(
    {},
  );
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [quickLoading, setQuickLoading] = useState<Record<string, boolean>>({});
  const [lastGenerated, setLastGenerated] = useState<{
    label: string;
    at: Date;
  } | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  const token = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("bearer_token") || ""
      : "";

  const formatForType = (rt: ReportType) =>
    selectedFormat[rt.type] || rt.formats?.[0] || "csv";

  async function handleGenerate(rt: ReportType) {
    const fmt = formatForType(rt);
    setGenerating((g) => ({ ...g, [rt.type]: true }));
    try {
      await downloadReport(rt.type, fmt, token());
      setLastGenerated({ label: `${rt.label} (${formatLabels[fmt] || fmt})`, at: new Date() });
      toast.success(`${rt.label} generated`);
    } catch (err: any) {
      toast.error(err?.message || `Failed to generate ${rt.label}`);
    } finally {
      setGenerating((g) => ({ ...g, [rt.type]: false }));
    }
  }

  async function exportEmployeeDirectory(fmt: "csv" | "xlsx") {
    const key = `emp-${fmt}`;
    setQuickLoading((q) => ({ ...q, [key]: true }));
    try {
      const res = await fetch("/api/employees", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed to load employees");
      const d = await res.json();
      const arr = Array.isArray(d) ? d : (d.data ?? d.employees ?? []);
      await exportData({
        format: fmt,
        filename: "employee-directory",
        title: "Employee Directory",
        columns: [
          { key: "employeeCode", label: "Code" },
          { key: "firstName", label: "First Name" },
          { key: "lastName", label: "Last Name" },
          { key: "email", label: "Email" },
          { key: "department", label: "Department" },
          { key: "designation", label: "Designation" },
          { key: "employmentStatus", label: "Status" },
        ],
        rows: arr.map((e: any) => ({
          employeeCode: e.employeeCode ?? "",
          firstName: e.firstName ?? "",
          lastName: e.lastName ?? "",
          email: e.email ?? "",
          department: e.department ?? "",
          designation: e.designation ?? "",
          employmentStatus: e.employmentStatus ?? "",
        })),
      });
      setLastGenerated({
        label: `Employee Directory (${formatLabels[fmt]})`,
        at: new Date(),
      });
      toast.success("Employee directory exported");
    } catch (err: any) {
      toast.error(err?.message || "Failed to export employee directory");
    } finally {
      setQuickLoading((q) => ({ ...q, [key]: false }));
    }
  }

  async function exportPayslips() {
    const key = "payslips-csv";
    setQuickLoading((q) => ({ ...q, [key]: true }));
    try {
      const res = await fetch("/api/payslips", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed to load payslips");
      const d = await res.json();
      const arr = Array.isArray(d) ? d : (d.data ?? []);
      await exportData({
        format: "csv",
        filename: "payslips",
        title: "Payslips",
        columns: [
          { key: "employeeName", label: "Employee" },
          { key: "department", label: "Department" },
          { key: "periodStart", label: "Period Start" },
          { key: "periodEnd", label: "Period End" },
          { key: "grossSalary", label: "Gross Salary" },
          { key: "netSalary", label: "Net Salary" },
        ],
        rows: arr.map((p: any) => ({
          employeeName: p.employeeName ?? "",
          department: p.department ?? "",
          periodStart: p.periodStart ?? "",
          periodEnd: p.periodEnd ?? "",
          grossSalary: Number(p.grossSalary || 0),
          netSalary: Number(p.netSalary || 0),
        })),
      });
      setLastGenerated({ label: "Payslips (CSV)", at: new Date() });
      toast.success("Payslips exported");
    } catch (err: any) {
      toast.error(err?.message || "Failed to export payslips");
    } finally {
      setQuickLoading((q) => ({ ...q, [key]: false }));
    }
  }

  const allFormats = Array.from(
    new Set(reportTypes.flatMap((r) => r.formats || [])),
  );

  const renderReportCard = (rt: ReportType) => {
    const fmt = formatForType(rt);
    const busy = !!generating[rt.type];
    return (
      <Card key={rt.type} className="flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{rt.label}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
          <CardDescription>
            {rt.description || "Generate this report for the current period."}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto flex flex-col gap-3">
          <div className="flex flex-wrap gap-1">
            {(rt.formats || []).map((f) => (
              <Badge key={f} variant="outline" className="uppercase text-[10px]">
                {formatLabels[f] || f}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={fmt}
              onValueChange={(v) =>
                setSelectedFormat((s) => ({ ...s, [rt.type]: v }))
              }
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                {(rt.formats || []).map((f) => (
                  <SelectItem key={f} value={f}>
                    {formatLabels[f] || f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="flex-1"
              onClick={() => handleGenerate(rt)}
              disabled={busy}
            >
              {busy ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {busy ? "Generating..." : "Generate"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGroup = (heading: string, types: string[]) => {
    const cards = reportTypes.filter((r) => types.includes(r.type));
    if (cards.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {groupIcons[heading]}
          <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map(renderReportCard)}
        </div>
      </div>
    );
  };

  if (isPending) {
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
              Reports &amp; Exports
            </h1>
            <p className="text-muted-foreground">
              Generate statutory filings and export payroll data in CSV, Excel,
              PDF or JSON.
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Report Types Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="text-3xl font-bold">{reportTypes.length}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                statutory &amp; payroll reports
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div className="text-lg font-semibold truncate">
                  {lastGenerated ? lastGenerated.label : "—"}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {lastGenerated
                  ? format(lastGenerated.at, "MMM dd, yyyy • HH:mm")
                  : "No reports generated yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Formats Supported
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileDown className="h-5 w-5 text-muted-foreground" />
                <div className="text-3xl font-bold">
                  {allFormats.length || 4}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(allFormats.length
                  ? allFormats
                  : ["csv", "xlsx", "pdf", "json"]
                ).map((f) => (
                  <Badge
                    key={f}
                    variant="secondary"
                    className="uppercase text-[10px]"
                  >
                    {formatLabels[f] || f}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick exports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Quick Exports
            </CardTitle>
            <CardDescription>
              Export live data directly from your records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="font-medium">Employee Directory</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Codes, names, contacts, department and employment status.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => exportEmployeeDirectory("csv")}
                    disabled={!!quickLoading["emp-csv"]}
                  >
                    {quickLoading["emp-csv"] ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => exportEmployeeDirectory("xlsx")}
                    disabled={!!quickLoading["emp-xlsx"]}
                  >
                    {quickLoading["emp-xlsx"] ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                    )}
                    Excel
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <div className="font-medium">Payslips</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  All generated payslips with gross and net pay by period.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={exportPayslips}
                    disabled={!!quickLoading["payslips-csv"]}
                  >
                    {quickLoading["payslips-csv"] ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Export CSV
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grouped statutory / govt reports */}
        {reportTypes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No report types are configured.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {renderGroup("Salary & Bank", SALARY_BANK_TYPES)}
            {renderGroup("Statutory (PF/ESI/EPF)", STATUTORY_TYPES)}
            {renderGroup("Summary", SUMMARY_TYPES)}
            {/* Any report types not covered by the known groups still render */}
            {(() => {
              const known = [
                ...SALARY_BANK_TYPES,
                ...STATUTORY_TYPES,
                ...SUMMARY_TYPES,
              ];
              const others = reportTypes.filter(
                (r) => !known.includes(r.type),
              );
              if (others.length === 0) return null;
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <h2 className="text-lg font-semibold tracking-tight">
                      Other Reports
                    </h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {others.map(renderReportCard)}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
