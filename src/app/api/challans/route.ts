import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { challans } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const VALID_TYPES = ["ECR", "EPFO", "ESIC", "PT", "TDS"];
const VALID_STATUSES = ["Pending", "Generated", "Filed", "Paid"];

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const period = searchParams.get("period");

    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId))
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );
      const row = await db
        .select()
        .from(challans)
        .where(eq(challans.id, parsedId))
        .limit(1);
      if (!row.length)
        return NextResponse.json(
          { error: "Challan not found" },
          { status: 404 },
        );
      return NextResponse.json(row[0]);
    }

    const conditions = [];
    if (type) conditions.push(eq(challans.type, type));
    if (status) conditions.push(eq(challans.status, status));
    if (period) conditions.push(eq(challans.period, period));

    const rows =
      conditions.length > 0
        ? await db
            .select()
            .from(challans)
            .where(and(...conditions))
            .orderBy(desc(challans.id))
        : await db.select().from(challans).orderBy(desc(challans.id));

    return NextResponse.json(rows);
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
      type,
      period,
      totalAmount,
      employeeCount,
      referenceNumber,
      status,
      dueDate,
      fileUrl,
    } = body;

    if (!type || !VALID_TYPES.includes(type))
      return NextResponse.json(
        {
          error: `Valid type is required. Must be one of: ${VALID_TYPES.join(", ")}`,
          code: "INVALID_TYPE",
        },
        { status: 400 },
      );
    if (!period)
      return NextResponse.json(
        { error: "Period is required", code: "MISSING_PERIOD" },
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

    const now = new Date().toISOString();
    const created = await db
      .insert(challans)
      .values({
        type,
        period,
        totalAmount: Number(totalAmount) || 0,
        employeeCount: parseInt(String(employeeCount)) || 0,
        referenceNumber: referenceNumber || null,
        status: status || "Pending",
        dueDate: dueDate || null,
        filedDate: null,
        fileUrl: fileUrl || null,
        createdAt: now,
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
    const parsedId = parseInt(id);

    const existing = await db
      .select()
      .from(challans)
      .where(eq(challans.id, parsedId))
      .limit(1);
    if (!existing.length)
      return NextResponse.json(
        { error: "Challan not found" },
        { status: 404 },
      );

    const body = await request.json();
    const {
      type,
      period,
      totalAmount,
      employeeCount,
      referenceNumber,
      status,
      dueDate,
      filedDate,
      fileUrl,
    } = body;

    const updates: any = {};
    if (type !== undefined) {
      if (!VALID_TYPES.includes(type))
        return NextResponse.json(
          {
            error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`,
            code: "INVALID_TYPE",
          },
          { status: 400 },
        );
      updates.type = type;
    }
    if (period !== undefined) updates.period = period;
    if (totalAmount !== undefined)
      updates.totalAmount = Number(totalAmount) || 0;
    if (employeeCount !== undefined)
      updates.employeeCount = parseInt(String(employeeCount)) || 0;
    if (referenceNumber !== undefined)
      updates.referenceNumber = referenceNumber;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (fileUrl !== undefined) updates.fileUrl = fileUrl;
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
      // Auto-set filedDate when marked Filed or Paid (unless explicitly provided)
      if (
        (status === "Filed" || status === "Paid") &&
        filedDate === undefined &&
        !existing[0].filedDate
      ) {
        updates.filedDate = new Date().toISOString();
      }
    }
    if (filedDate !== undefined) updates.filedDate = filedDate;

    const updated = await db
      .update(challans)
      .set(updates)
      .where(eq(challans.id, parsedId))
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
    const parsedId = parseInt(id);

    const deleted = await db
      .delete(challans)
      .where(eq(challans.id, parsedId))
      .returning();

    if (!deleted.length)
      return NextResponse.json(
        { error: "Challan not found" },
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
