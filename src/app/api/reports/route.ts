import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  payslips,
  employees,
  statutoryContributions,
  payrollRuns,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  toCSV,
  toXLSX,
  toPDFTable,
  toJSON,
  contentType,
  fileExt,
  type ExportColumn,
  type ExportFormat,
  type ExportRow,
} from "@/lib/exporters";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

/* ──────────────────────────────────────────────────────────────────────
   Formatting helpers
   ────────────────────────────────────────────────────────────────────── */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function money(n: unknown): number {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
}

function fmtDate(d?: string | null): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return `${MONTHS[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")}, ${date.getFullYear()}`;
}

function periodLabel(start?: string | null, end?: string | null): string {
  const s = fmtDate(start);
  const e = fmtDate(end);
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

function monthYearLabel(month?: number | null, year?: number | null): string {
  const m = Number(month);
  const y = Number(year);
  const mLabel = m >= 1 && m <= 12 ? MONTHS[m - 1] : "";
  if (mLabel && y) return `${mLabel} ${y}`;
  if (y) return String(y);
  return "";
}

/** Build an employees lookup map keyed by id. */
async function loadEmployeeMap() {
  const rows = await db.select().from(employees);
  const map = new Map<number, (typeof rows)[number]>();
  for (const e of rows) map.set(e.id, e);
  return map;
}

/* A descriptor for each report's output. */
interface ReportResult {
  format: ExportFormat;
  filename: string; // without extension
  title: string;
  payload: Buffer | Uint8Array | string;
}

/* ──────────────────────────────────────────────────────────────────────
   Report builders
   ────────────────────────────────────────────────────────────────────── */

async function buildSalaryRegister(format: ExportFormat): Promise<ReportResult | null> {
  if (!["csv", "xlsx", "pdf"].includes(format)) return null;

  const rows = await db.select().from(payslips).orderBy(desc(payslips.createdAt));

  const columns: ExportColumn[] = [
    { key: "employee", label: "Employee" },
    { key: "department", label: "Department" },
    { key: "designation", label: "Designation" },
    { key: "period", label: "Period" },
    { key: "basic", label: "Basic" },
    { key: "allowances", label: "Allowances" },
    { key: "deductions", label: "Deductions" },
    { key: "gross", label: "Gross" },
    { key: "pf", label: "PF" },
    { key: "esi", label: "ESI" },
    { key: "tds", label: "TDS" },
    { key: "net", label: "Net" },
  ];

  const data: ExportRow[] = rows.map((p) => ({
    employee: p.employeeName,
    department: p.department,
    designation: p.designation,
    period: periodLabel(p.periodStart, p.periodEnd),
    basic: money(p.basicSalary),
    allowances: money(p.totalAllowances),
    deductions: money(p.totalDeductions),
    gross: money(p.grossSalary),
    pf: money(p.pfAmount),
    esi: money(p.esiAmount),
    tds: money(p.tdsAmount),
    net: money(p.netSalary),
  }));

  const title = "Salary Register";
  return {
    format,
    filename: "salary-register",
    title,
    payload: await render(format, title, columns, data),
  };
}

async function buildBankTransfer(format: ExportFormat): Promise<ReportResult | null> {
  if (!["csv", "xlsx"].includes(format)) return null;

  const rows = await db.select().from(payslips).orderBy(desc(payslips.createdAt));
  const empMap = await loadEmployeeMap();

  const columns: ExportColumn[] = [
    { key: "employee", label: "Employee" },
    { key: "bank", label: "Bank" },
    { key: "accountNo", label: "Account No" },
    { key: "netAmount", label: "Net Amount" },
  ];

  // Include all rows; blank account number when missing (per contract).
  const data: ExportRow[] = rows.map((p) => {
    const emp = empMap.get(p.employeeId);
    return {
      employee: p.employeeName,
      bank: emp?.bankName ?? "",
      accountNo: emp?.bankAccountNumber ?? "",
      netAmount: money(p.netSalary),
    };
  });

  const title = "Bank Transfer Advice";
  return {
    format,
    filename: "bank-transfer",
    title,
    payload: await render(format, title, columns, data),
  };
}

async function buildEsic(format: ExportFormat): Promise<ReportResult | null> {
  if (format !== "xlsx") return null;

  const rows = await db
    .select()
    .from(statutoryContributions)
    .where(eq(statutoryContributions.type, "ESI"))
    .orderBy(desc(statutoryContributions.createdAt));
  const empMap = await loadEmployeeMap();

  // Mirrors the ESIC monthly-contribution Excel upload layout.
  const columns: ExportColumn[] = [
    { key: "ipNumber", label: "IP Number" },
    { key: "ipName", label: "IP Name" },
    { key: "noOfDays", label: "No of Days" },
    { key: "totalWages", label: "Total Monthly Wages" },
    { key: "reasonCode", label: "Reason Code for Zero workings days" },
    { key: "lastWorkingDay", label: "Last Working Day" },
  ];

  const data: ExportRow[] = rows.map((c) => {
    const emp = empMap.get(c.employeeId);
    return {
      ipNumber: emp?.employeeCode ?? "",
      ipName: emp ? `${emp.firstName} ${emp.lastName}` : "",
      noOfDays: 26, // placeholder working days
      totalWages: money(c.wageBase),
      reasonCode: "",
      lastWorkingDay: "",
    };
  });

  const period = rows.length
    ? monthYearLabel(rows[0].month, rows[0].year)
    : "";
  const title = "ESIC Monthly Contribution";
  return {
    format,
    filename: "esic-contribution",
    title,
    payload: await toXLSX("ESIC", columns, data, {
      title,
      subtitle: period ? `Contribution Period: ${period}` : undefined,
    }),
  };
}

async function buildEpfEcr(format: ExportFormat): Promise<ReportResult | null> {
  if (format !== "json") return null;

  const rows = await db
    .select()
    .from(statutoryContributions)
    .where(eq(statutoryContributions.type, "PF"))
    .orderBy(desc(statutoryContributions.createdAt));
  const empMap = await loadEmployeeMap();

  const records = rows.map((c) => {
    const emp = empMap.get(c.employeeId);
    const wage = money(c.wageBase);
    return {
      uan: "",
      memberName: emp ? `${emp.firstName} ${emp.lastName}` : "",
      grossWages: wage,
      epfWages: wage,
      epsWages: wage,
      edliWages: wage,
      epfContri: money(c.employeeContribution),
      epsContri: money(c.employerContribution),
      edliContri: 0,
      ncpDays: 0,
      refundOfAdvances: 0,
    };
  });

  const period = rows.length ? monthYearLabel(rows[0].month, rows[0].year) : "";
  const obj = {
    period,
    generatedAt: new Date().toISOString(),
    records,
  };

  return {
    format,
    filename: "epf-ecr",
    title: "EPF ECR",
    payload: toJSON(obj),
  };
}

async function buildEpfExit(format: ExportFormat): Promise<ReportResult | null> {
  if (format !== "json") return null;

  const all = await db.select().from(employees);
  const exited = all.filter((e) => e.dateOfLeaving);

  const records = exited.map((e) => ({
    memberName: `${e.firstName} ${e.lastName}`,
    employeeCode: e.employeeCode,
    dateOfJoining: e.dateOfJoining,
    dateOfExit: e.dateOfLeaving,
    reasonOfExit: "Resignation",
  }));

  const obj = {
    generatedAt: new Date().toISOString(),
    records,
  };

  return {
    format,
    filename: "epf-exit",
    title: "EPF Exit",
    payload: toJSON(obj),
  };
}

async function buildPayrollSummary(format: ExportFormat): Promise<ReportResult | null> {
  if (!["pdf", "xlsx"].includes(format)) return null;

  const runs = await db.select().from(payrollRuns).orderBy(desc(payrollRuns.createdAt));

  const columns: ExportColumn[] = [
    { key: "id", label: "Run ID" },
    { key: "period", label: "Period" },
    { key: "status", label: "Status" },
    { key: "totalEmployees", label: "Employees" },
    { key: "totalAmount", label: "Total Amount" },
  ];

  const data: ExportRow[] = runs.map((r) => ({
    id: r.id,
    period: periodLabel(r.periodStart, r.periodEnd),
    status: r.status,
    totalEmployees: Number(r.totalEmployees ?? 0),
    totalAmount: money(r.totalAmount),
  }));

  const title = "Payroll Summary";
  return {
    format,
    filename: "payroll-summary",
    title,
    payload: await render(format, title, columns, data),
  };
}

/** Render columns+rows into the requested binary/text format. */
async function render(
  format: ExportFormat,
  title: string,
  columns: ExportColumn[],
  rows: ExportRow[],
): Promise<Buffer | Uint8Array | string> {
  switch (format) {
    case "csv":
      return toCSV(columns, rows);
    case "xlsx":
      return await toXLSX(title, columns, rows, { title });
    case "pdf":
      return await toPDFTable(title, columns, rows, {
        orientation: columns.length > 6 ? "landscape" : "portrait",
      });
    case "json":
      return toJSON(rows);
    default:
      return toCSV(columns, rows);
  }
}

const REPORT_BUILDERS: Record<
  string,
  (format: ExportFormat) => Promise<ReportResult | null>
> = {
  "salary-register": buildSalaryRegister,
  "bank-transfer": buildBankTransfer,
  esic: buildEsic,
  "epf-ecr": buildEpfEcr,
  "epf-exit": buildEpfExit,
  "payroll-summary": buildPayrollSummary,
};

/* ──────────────────────────────────────────────────────────────────────
   Route
   ────────────────────────────────────────────────────────────────────── */

/**
 * Generate a statutory / payroll report and return it as a downloadable file.
 *
 *   POST /api/reports?type=<t>&format=<f>
 *
 * Supported (type → formats):
 *   salary-register → csv | xlsx | pdf
 *   bank-transfer   → csv | xlsx
 *   esic            → xlsx
 *   epf-ecr         → json
 *   epf-exit        → json
 *   payroll-summary → pdf | xlsx
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const format = (searchParams.get("format") || "") as ExportFormat;

    if (!type || !REPORT_BUILDERS[type]) {
      return NextResponse.json(
        {
          error: `Unsupported report type. Supported: ${Object.keys(REPORT_BUILDERS).join(", ")}`,
          code: "UNSUPPORTED_TYPE",
        },
        { status: 400 },
      );
    }

    if (!["csv", "xlsx", "pdf", "json"].includes(format)) {
      return NextResponse.json(
        {
          error: "Invalid format. Must be one of: csv, xlsx, pdf, json",
          code: "INVALID_FORMAT",
        },
        { status: 400 },
      );
    }

    const result = await REPORT_BUILDERS[type](format);
    if (!result) {
      return NextResponse.json(
        {
          error: `Format '${format}' is not supported for report '${type}'`,
          code: "UNSUPPORTED_FORMAT_FOR_TYPE",
        },
        { status: 400 },
      );
    }

    const date = new Date().toISOString().slice(0, 10);
    const downloadName = `${result.filename}-${date}.${fileExt(format)}`;

    const bodyOut: BodyInit =
      typeof result.payload === "string"
        ? result.payload
        : new Uint8Array(
            result.payload instanceof Buffer ? result.payload : result.payload,
          );

    return new NextResponse(bodyOut, {
      status: 200,
      headers: {
        "Content-Type": contentType(format),
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("REPORTS POST error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error },
      { status: 500 },
    );
  }
}
