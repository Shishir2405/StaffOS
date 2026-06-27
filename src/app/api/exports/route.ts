import { NextRequest, NextResponse } from "next/server";
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

const VALID_FORMATS: ExportFormat[] = ["csv", "xlsx", "pdf", "json"];

/**
 * Generic export endpoint.
 *
 * Body:
 *   {
 *     format: "csv" | "xlsx" | "pdf" | "json",
 *     filename: string,                 // without extension
 *     title?: string,                   // used for xlsx banner / pdf title
 *     columns: { key, label }[],
 *     rows: object[]
 *   }
 *
 * Returns the generated file as an attachment.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const format = body?.format as ExportFormat;
    const filenameRaw = (body?.filename as string) || "export";
    const title = (body?.title as string) || undefined;
    const columns = (body?.columns as ExportColumn[]) || [];
    const rows = (body?.rows as ExportRow[]) || [];

    if (!format || !VALID_FORMATS.includes(format)) {
      return NextResponse.json(
        {
          error: `Invalid format. Must be one of: ${VALID_FORMATS.join(", ")}`,
          code: "INVALID_FORMAT",
        },
        { status: 400 },
      );
    }

    // JSON export does not require columns; the others do.
    if (format !== "json" && (!Array.isArray(columns) || columns.length === 0)) {
      return NextResponse.json(
        { error: "columns array is required", code: "MISSING_COLUMNS" },
        { status: 400 },
      );
    }

    // Sanitize filename to avoid header injection / odd characters.
    const safeFilename =
      filenameRaw.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").slice(0, 120) || "export";
    const downloadName = `${safeFilename}.${fileExt(format)}`;

    let payload: Buffer | Uint8Array | string;

    switch (format) {
      case "csv":
        payload = toCSV(columns, rows);
        break;
      case "xlsx":
        payload = await toXLSX(title || safeFilename, columns, rows, { title });
        break;
      case "pdf":
        payload = await toPDFTable(title || safeFilename, columns, rows);
        break;
      case "json":
        // Stringify rows (per contract). If columns are supplied we still emit raw rows.
        payload = toJSON(rows);
        break;
      default:
        return NextResponse.json(
          { error: "Unsupported format", code: "UNSUPPORTED_FORMAT" },
          { status: 400 },
        );
    }

    const bodyOut: BodyInit =
      typeof payload === "string"
        ? payload
        : new Uint8Array(payload instanceof Buffer ? payload : payload);

    return new NextResponse(bodyOut, {
      status: 200,
      headers: {
        "Content-Type": contentType(format),
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("EXPORTS POST error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error },
      { status: 500 },
    );
  }
}
