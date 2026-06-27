import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { employeeDocuments, employees } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

const VALID_STATUSES = ["Pending", "Verified", "Rejected", "Expired"];

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const docId = parseInt(id);
      if (isNaN(docId))
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );

      const row = await db
        .select({
          id: employeeDocuments.id,
          employeeId: employeeDocuments.employeeId,
          documentType: employeeDocuments.documentType,
          documentName: employeeDocuments.documentName,
          documentNumber: employeeDocuments.documentNumber,
          fileUrl: employeeDocuments.fileUrl,
          issueDate: employeeDocuments.issueDate,
          expiryDate: employeeDocuments.expiryDate,
          status: employeeDocuments.status,
          verifiedBy: employeeDocuments.verifiedBy,
          remarks: employeeDocuments.remarks,
          createdAt: employeeDocuments.createdAt,
          updatedAt: employeeDocuments.updatedAt,
          employeeFirstName: employees.firstName,
          employeeLastName: employees.lastName,
          employeeCode: employees.employeeCode,
        })
        .from(employeeDocuments)
        .leftJoin(employees, eq(employeeDocuments.employeeId, employees.id))
        .where(eq(employeeDocuments.id, docId))
        .limit(1);

      if (!row.length)
        return NextResponse.json(
          { error: "Not found", code: "NOT_FOUND" },
          { status: 404 },
        );

      const d = row[0];
      return NextResponse.json({
        ...d,
        employeeName: d.employeeFirstName
          ? `${d.employeeFirstName} ${d.employeeLastName}`
          : null,
      });
    }

    const rows = await db
      .select({
        id: employeeDocuments.id,
        employeeId: employeeDocuments.employeeId,
        documentType: employeeDocuments.documentType,
        documentName: employeeDocuments.documentName,
        documentNumber: employeeDocuments.documentNumber,
        fileUrl: employeeDocuments.fileUrl,
        issueDate: employeeDocuments.issueDate,
        expiryDate: employeeDocuments.expiryDate,
        status: employeeDocuments.status,
        verifiedBy: employeeDocuments.verifiedBy,
        remarks: employeeDocuments.remarks,
        createdAt: employeeDocuments.createdAt,
        updatedAt: employeeDocuments.updatedAt,
        employeeFirstName: employees.firstName,
        employeeLastName: employees.lastName,
        employeeCode: employees.employeeCode,
      })
      .from(employeeDocuments)
      .leftJoin(employees, eq(employeeDocuments.employeeId, employees.id))
      .orderBy(desc(employeeDocuments.id));

    const formatted = rows.map((d) => ({
      ...d,
      employeeName: d.employeeFirstName
        ? `${d.employeeFirstName} ${d.employeeLastName}`
        : null,
    }));

    return NextResponse.json(formatted);
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      employeeId,
      documentType,
      documentName,
      documentNumber,
      fileUrl,
      issueDate,
      expiryDate,
      status,
      remarks,
    } = body;

    if (!employeeId)
      return NextResponse.json(
        { error: "Employee is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    if (!documentType || documentType.trim() === "")
      return NextResponse.json(
        { error: "Document type is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    if (!documentName || documentName.trim() === "")
      return NextResponse.json(
        { error: "Document name is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    if (status && !VALID_STATUSES.includes(status))
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
          code: "INVALID_STATUS",
        },
        { status: 400 },
      );

    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, parseInt(String(employeeId))))
      .limit(1);
    if (!employee.length)
      return NextResponse.json(
        { error: "Employee not found", code: "EMPLOYEE_NOT_FOUND" },
        { status: 400 },
      );

    const now = new Date().toISOString();
    const created = await db
      .insert(employeeDocuments)
      .values({
        employeeId: parseInt(String(employeeId)),
        documentType: documentType.trim(),
        documentName: documentName.trim(),
        documentNumber: documentNumber?.trim() || null,
        fileUrl: fileUrl?.trim() || null,
        issueDate: issueDate || null,
        expiryDate: expiryDate || null,
        status: status || "Pending",
        remarks: remarks?.trim() || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(created[0], { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || isNaN(parseInt(id)))
      return NextResponse.json(
        { error: "Valid ID is required", code: "INVALID_ID" },
        { status: 400 },
      );

    const docId = parseInt(id);
    const existing = await db
      .select()
      .from(employeeDocuments)
      .where(eq(employeeDocuments.id, docId))
      .limit(1);
    if (!existing.length)
      return NextResponse.json(
        { error: "Not found", code: "NOT_FOUND" },
        { status: 404 },
      );

    const body = await request.json();
    const {
      documentType,
      documentName,
      documentNumber,
      fileUrl,
      issueDate,
      expiryDate,
      status,
      remarks,
    } = body;

    const updates: any = { updatedAt: new Date().toISOString() };

    if (documentType !== undefined) updates.documentType = documentType;
    if (documentName !== undefined) updates.documentName = documentName;
    if (documentNumber !== undefined)
      updates.documentNumber = documentNumber || null;
    if (fileUrl !== undefined) updates.fileUrl = fileUrl || null;
    if (issueDate !== undefined) updates.issueDate = issueDate || null;
    if (expiryDate !== undefined) updates.expiryDate = expiryDate || null;
    if (remarks !== undefined) updates.remarks = remarks || null;
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status))
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
            code: "INVALID_STATUS",
          },
          { status: 400 },
        );
      updates.status = status;
      if (status === "Verified") updates.verifiedBy = (user as any).employeeId;
    }

    const updated = await db
      .update(employeeDocuments)
      .set(updates)
      .where(eq(employeeDocuments.id, docId))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || isNaN(parseInt(id)))
      return NextResponse.json(
        { error: "Valid ID is required", code: "INVALID_ID" },
        { status: 400 },
      );

    const docId = parseInt(id);
    const deleted = await db
      .delete(employeeDocuments)
      .where(eq(employeeDocuments.id, docId))
      .returning();

    if (!deleted.length)
      return NextResponse.json(
        { error: "Not found", code: "NOT_FOUND" },
        { status: 404 },
      );

    return NextResponse.json({ message: "Deleted", deleted: deleted[0] });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 },
    );
  }
}
