/**
 * Server-side export generators for StaffOS.
 *
 * Produces CSV / XLSX / PDF / JSON from a uniform
 * `columns: {key,label}[]` + `rows: object[]` shape so every report and
 * generic export in the app can share one pipeline.
 *
 * NOTE: This module is server-only (it uses `exceljs` + `pdf-lib`, which are
 * not browser-safe). Import it from API route handlers only.
 */
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

export type ExportFormat = "csv" | "xlsx" | "pdf" | "json";

export interface ExportColumn {
  key: string;
  label: string;
}

export type ExportRow = Record<string, unknown>;

export interface XlsxOptions {
  /** Optional title rendered as a merged bold row above the header. */
  title?: string;
  /** Optional subtitle (e.g. period / generated date) under the title. */
  subtitle?: string;
}

export interface PdfTableOptions {
  /** Optional subtitle line under the main title. */
  subtitle?: string;
  /** Page orientation. Defaults to portrait. */
  orientation?: "portrait" | "landscape";
}

/* ──────────────────────────────────────────────────────────────────────
   Value helpers
   ────────────────────────────────────────────────────────────────────── */

/** Coerce any cell value into a safe display string. */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toISOString();
  try {
    return String(value);
  } catch {
    return "";
  }
}

/* ──────────────────────────────────────────────────────────────────────
   CSV
   ────────────────────────────────────────────────────────────────────── */

/** Escape a single CSV field per RFC 4180 (quote when needed, double inner quotes). */
function escapeCsv(value: unknown): string {
  const str = cellToString(value);
  if (str === "") return "";
  // Quote if it contains a comma, quote, CR or LF, or leading/trailing space.
  if (/[",\r\n]/.test(str) || /^\s|\s$/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build a CSV string from columns + rows.
 * Prepends a UTF-8 BOM so Excel opens unicode (₹, names) correctly.
 */
export function toCSV(columns: ExportColumn[], rows: ExportRow[]): string {
  const BOM = "﻿";
  const header = columns.map((c) => escapeCsv(c.label)).join(",");
  const lines = (rows ?? []).map((row) =>
    columns.map((c) => escapeCsv(row?.[c.key])).join(","),
  );
  return BOM + [header, ...lines].join("\r\n");
}

/* ──────────────────────────────────────────────────────────────────────
   XLSX (exceljs)
   ────────────────────────────────────────────────────────────────────── */

/**
 * Build an XLSX workbook (single sheet) and return it as a Buffer.
 * - Header row is bold with a light grey fill.
 * - Column widths auto-size from header + content (capped).
 * - Optional title / subtitle rows merged across all columns.
 */
export async function toXLSX(
  sheetName: string,
  columns: ExportColumn[],
  rows: ExportRow[],
  opts: XlsxOptions = {},
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "StaffOS";
  workbook.created = new Date();

  // Sheet names are limited to 31 chars and cannot contain : \ / ? * [ ]
  const safeName = (sheetName || "Sheet1").replace(/[:\\/?*[\]]/g, " ").slice(0, 31) || "Sheet1";
  const sheet = workbook.addWorksheet(safeName);

  const colCount = Math.max(columns.length, 1);
  let headerRowIndex = 1;

  // Optional title / subtitle banner.
  if (opts.title) {
    const titleRow = sheet.addRow([opts.title]);
    sheet.mergeCells(titleRow.number, 1, titleRow.number, colCount);
    titleRow.getCell(1).font = { bold: true, size: 14 };
    titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
    headerRowIndex = titleRow.number + 1;
  }
  if (opts.subtitle) {
    const subRow = sheet.addRow([opts.subtitle]);
    sheet.mergeCells(subRow.number, 1, subRow.number, colCount);
    subRow.getCell(1).font = { italic: true, size: 10, color: { argb: "FF6B7280" } };
    headerRowIndex = subRow.number + 1;
  }

  // Header row.
  const headerRow = sheet.addRow(columns.map((c) => c.label));
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });
  headerRowIndex = headerRow.number;

  // Data rows.
  for (const row of rows ?? []) {
    sheet.addRow(columns.map((c) => normalizeXlsxCell(row?.[c.key])));
  }

  // Auto column widths (header label + sampled content), capped to a sane range.
  columns.forEach((col, i) => {
    let maxLen = col.label ? col.label.length : 10;
    for (const row of rows ?? []) {
      const len = cellToString(row?.[col.key]).length;
      if (len > maxLen) maxLen = len;
    }
    sheet.getColumn(i + 1).width = Math.min(Math.max(maxLen + 2, 10), 50);
  });

  // Freeze the header row for easier scrolling.
  sheet.views = [{ state: "frozen", ySplit: headerRowIndex }];

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer as ArrayBuffer);
}

/** Keep numbers/booleans as native cell types; everything else -> string. */
function normalizeXlsxCell(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value;
  return cellToString(value);
}

/* ──────────────────────────────────────────────────────────────────────
   PDF (pdf-lib) — simple grid table with page breaks
   ────────────────────────────────────────────────────────────────────── */

const A4 = { width: 595.28, height: 841.89 }; // points

/**
 * Build a multi-page A4 PDF table and return it as a Uint8Array.
 * Robust for many rows: paginates, repeats the header on each page,
 * truncates over-long cells, and distributes column widths evenly.
 */
export async function toPDFTable(
  title: string,
  columns: ExportColumn[],
  rows: ExportRow[],
  opts: PdfTableOptions = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const landscape = opts.orientation === "landscape";
  const pageWidth = landscape ? A4.height : A4.width;
  const pageHeight = landscape ? A4.width : A4.height;

  const margin = 36;
  const fontSize = 8;
  const headerFontSize = 8;
  const titleFontSize = 16;
  const subtitleFontSize = 9;
  const rowHeight = 16;
  const cellPadding = 4;

  const usableWidth = pageWidth - margin * 2;
  const colCount = Math.max(columns.length, 1);
  const colWidth = usableWidth / colCount;

  let page: PDFPage = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Title.
  page.drawText(safePdfText(title || "Report"), {
    x: margin,
    y: y - titleFontSize,
    size: titleFontSize,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.12),
  });
  y -= titleFontSize + 6;

  if (opts.subtitle) {
    page.drawText(safePdfText(opts.subtitle), {
      x: margin,
      y: y - subtitleFontSize,
      size: subtitleFontSize,
      font,
      color: rgb(0.42, 0.45, 0.5),
    });
    y -= subtitleFontSize + 8;
  } else {
    y -= 4;
  }

  const drawHeaderRow = () => {
    // Background band for the header.
    page.drawRectangle({
      x: margin,
      y: y - rowHeight,
      width: usableWidth,
      height: rowHeight,
      color: rgb(0.95, 0.96, 0.98),
    });
    columns.forEach((col, i) => {
      const text = fitPdfText(col.label ?? "", fontBold, headerFontSize, colWidth - cellPadding * 2);
      page.drawText(text, {
        x: margin + i * colWidth + cellPadding,
        y: y - rowHeight + cellPadding + 1,
        size: headerFontSize,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.12),
      });
    });
    // Bottom border under header.
    page.drawLine({
      start: { x: margin, y: y - rowHeight },
      end: { x: margin + usableWidth, y: y - rowHeight },
      thickness: 0.75,
      color: rgb(0.8, 0.83, 0.87),
    });
    y -= rowHeight;
  };

  const newPage = () => {
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  drawHeaderRow();

  const dataRows = rows ?? [];
  if (dataRows.length === 0) {
    page.drawText("No records found.", {
      x: margin,
      y: y - rowHeight + cellPadding + 1,
      size: fontSize,
      font,
      color: rgb(0.5, 0.53, 0.58),
    });
    y -= rowHeight;
  }

  dataRows.forEach((row, rowIdx) => {
    // Page break: need room for at least this row + bottom margin.
    if (y - rowHeight < margin) {
      newPage();
      drawHeaderRow();
    }

    // Zebra striping for readability.
    if (rowIdx % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: y - rowHeight,
        width: usableWidth,
        height: rowHeight,
        color: rgb(0.985, 0.988, 0.992),
      });
    }

    columns.forEach((col, i) => {
      const raw = cellToString(row?.[col.key]);
      const text = fitPdfText(raw, font, fontSize, colWidth - cellPadding * 2);
      page.drawText(text, {
        x: margin + i * colWidth + cellPadding,
        y: y - rowHeight + cellPadding + 1,
        size: fontSize,
        font,
        color: rgb(0.15, 0.16, 0.2),
      });
    });

    // Row separator.
    page.drawLine({
      start: { x: margin, y: y - rowHeight },
      end: { x: margin + usableWidth, y: y - rowHeight },
      thickness: 0.25,
      color: rgb(0.9, 0.92, 0.94),
    });

    y -= rowHeight;
  });

  // Footer with page numbers + generated timestamp on every page.
  const pages = pdf.getPages();
  const total = pages.length;
  const stamp = `Generated ${new Date().toLocaleString("en-IN")} · StaffOS`;
  pages.forEach((p, idx) => {
    p.drawText(stamp, {
      x: margin,
      y: margin / 2,
      size: 7,
      font,
      color: rgb(0.6, 0.63, 0.68),
    });
    const label = `Page ${idx + 1} of ${total}`;
    const labelWidth = font.widthOfTextAtSize(label, 7);
    p.drawText(label, {
      x: pageWidth - margin - labelWidth,
      y: margin / 2,
      size: 7,
      font,
      color: rgb(0.6, 0.63, 0.68),
    });
  });

  return await pdf.save();
}

/** pdf-lib's WinAnsi fonts can't encode some unicode (e.g. ₹) — sanitize. */
function safePdfText(text: string): string {
  return (text ?? "")
    .replace(/₹/g, "Rs.")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    // Drop anything outside the basic Latin-1 range the standard font supports.
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "");
}

/** Truncate text with an ellipsis so it fits a column width. */
function fitPdfText(text: string, font: PDFFont, size: number, maxWidth: number): string {
  let str = safePdfText(text);
  if (maxWidth <= 0) return "";
  if (font.widthOfTextAtSize(str, size) <= maxWidth) return str;
  const ellipsis = "…";
  while (str.length > 0 && font.widthOfTextAtSize(str + ellipsis, size) > maxWidth) {
    str = str.slice(0, -1);
  }
  return str.length > 0 ? str + ellipsis : "";
}

/* ──────────────────────────────────────────────────────────────────────
   JSON
   ────────────────────────────────────────────────────────────────────── */

/** Pretty-printed JSON string (2-space indent). */
export function toJSON(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

/* ──────────────────────────────────────────────────────────────────────
   Format metadata helpers
   ────────────────────────────────────────────────────────────────────── */

/** MIME content type for a given export format. */
export function contentType(format: ExportFormat): string {
  switch (format) {
    case "csv":
      return "text/csv; charset=utf-8";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "pdf":
      return "application/pdf";
    case "json":
      return "application/json; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

/** File extension (no dot) for a given export format. */
export function fileExt(format: ExportFormat): string {
  switch (format) {
    case "csv":
      return "csv";
    case "xlsx":
      return "xlsx";
    case "pdf":
      return "pdf";
    case "json":
      return "json";
    default:
      return "bin";
  }
}
