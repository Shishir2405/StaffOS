/**
 * Client-side export helpers for StaffOS.
 *
 * These run in the browser: they POST to the export/report API routes with the
 * bearer token from localStorage, receive a file blob, and trigger a download.
 *
 * On failure they throw an Error with a human-readable message; calling pages
 * are expected to `catch` and surface it via `toast.error(...)`.
 */

export type ExportFormat = "csv" | "xlsx" | "pdf" | "json";

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportDataOptions {
  format: ExportFormat;
  filename: string;
  title?: string;
  columns: ExportColumn[];
  rows: any[];
}

export interface ReportTypeInfo {
  type: string;
  label: string;
  formats: string[];
  description: string;
}

/** Available server-side reports, used by the Reports page to render buttons. */
export const REPORT_TYPES: ReportTypeInfo[] = [
  {
    type: "salary-register",
    label: "Salary Register",
    formats: ["csv", "xlsx", "pdf"],
    description:
      "Full salary register of all generated payslips with earnings, statutory deductions and net pay.",
  },
  {
    type: "bank-transfer",
    label: "Bank Transfer Advice",
    formats: ["csv", "xlsx"],
    description:
      "Bank-wise transfer sheet with employee account numbers and net amounts for salary disbursal.",
  },
  {
    type: "esic",
    label: "ESIC Monthly Contribution",
    formats: ["xlsx"],
    description:
      "ESIC monthly contribution sheet (IP number, IP name, days and wages) ready for the ESIC portal.",
  },
  {
    type: "epf-ecr",
    label: "EPF ECR (Electronic Challan)",
    formats: ["json"],
    description:
      "EPF ECR data with member-wise EPF/EPS/EDLI wages and contributions for ECR upload.",
  },
  {
    type: "epf-exit",
    label: "EPF Exit / Member Exit",
    formats: ["json"],
    description:
      "Exited employees with date of joining/exit and reason, for marking exits on the EPFO portal.",
  },
  {
    type: "payroll-summary",
    label: "Payroll Summary",
    formats: ["pdf", "xlsx"],
    description:
      "Summary of all payroll runs with period, status, headcount and total disbursed amount.",
  },
];

/** Read the bearer token saved by the auth client. */
function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("bearer_token") ?? "";
}

/** Pull a filename out of a Content-Disposition header, if present. */
function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  // Try RFC 5987 form first, then the plain quoted form.
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      /* fall through */
    }
  }
  const quoted = /filename="?([^"]+)"?/i.exec(header);
  return quoted?.[1] ?? null;
}

/** Trigger a browser download for a blob via a temporary anchor element. */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the click has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Best-effort extraction of an error message from a failed JSON response. */
async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.clone().json();
    if (data?.error) return String(data.error);
  } catch {
    /* not JSON */
  }
  return `${fallback} (HTTP ${res.status})`;
}

/**
 * Build a file from arbitrary columns/rows on the server and download it.
 * POSTs to `/api/exports`.
 */
export async function exportData({
  format,
  filename,
  title,
  columns,
  rows,
}: ExportDataOptions): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("You must be signed in to export data.");

  let res: Response;
  try {
    res = await fetch("/api/exports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ format, filename, title, columns, rows }),
    });
  } catch {
    throw new Error("Network error while generating the export.");
  }

  if (!res.ok) {
    throw new Error(await readError(res, "Failed to generate export"));
  }

  const blob = await res.blob();
  const name =
    filenameFromDisposition(res.headers.get("Content-Disposition")) ||
    `${filename}.${format}`;
  triggerDownload(blob, name);
}

/**
 * Generate a server-side report and download it.
 * POSTs to `/api/reports?type=&format=`.
 *
 * The optional `token` argument is accepted for compatibility with callers that
 * pass it explicitly; when omitted, the bearer token is read from localStorage.
 */
export async function downloadReport(
  type: string,
  format: string,
  token?: string,
): Promise<void> {
  const authToken = token ?? getToken();
  if (!authToken) throw new Error("You must be signed in to download reports.");

  const url = `/api/reports?type=${encodeURIComponent(type)}&format=${encodeURIComponent(format)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  } catch {
    throw new Error("Network error while generating the report.");
  }

  if (!res.ok) {
    throw new Error(await readError(res, "Failed to generate report"));
  }

  const blob = await res.blob();
  const date = new Date().toISOString().slice(0, 10);
  const name =
    filenameFromDisposition(res.headers.get("Content-Disposition")) ||
    `${type}-${date}.${format}`;
  triggerDownload(blob, name);
}
