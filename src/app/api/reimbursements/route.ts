import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reimbursements, employees } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const VALID_STATUSES = ["Pending", "Approved", "Rejected", "Paid"];

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const rid = parseInt(id);
      if (isNaN(rid))
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );
      const row = await db
        .select()
        .from(reimbursements)
        .where(eq(reimbursements.id, rid))
        .limit(1);
      if (!row.length)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(row[0]);
    }

    const rows = await db
      .select({
        id: reimbursements.id,
        employeeId: reimbursements.employeeId,
        category: reimbursements.category,
        amount: reimbursements.amount,
        claimDate: reimbursements.claimDate,
        billDate: reimbursements.billDate,
        description: reimbursements.description,
        billUrl: reimbursements.billUrl,
        status: reimbursements.status,
        approvedBy: reimbursements.approvedBy,
        createdAt: reimbursements.createdAt,
        updatedAt: reimbursements.updatedAt,
        firstName: employees.firstName,
        lastName: employees.lastName,
        employeeCode: employees.employeeCode,
      })
      .from(reimbursements)
      .leftJoin(employees, eq(reimbursements.employeeId, employees.id))
      .orderBy(desc(reimbursements.id));

    const data = rows.map((r) => ({
      ...r,
      employeeName: r.firstName
        ? `${r.firstName} ${r.lastName ?? ""}`.trim()
        : "Unknown",
    }));
    return NextResponse.json(data);
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
      category,
      amount,
      claimDate,
      billDate,
      description,
      billUrl,
      status,
    } = body;

    if (!employeeId || isNaN(parseInt(String(employeeId))))
      return NextResponse.json(
        { error: "employeeId is required", code: "MISSING_EMPLOYEE" },
        { status: 400 },
      );
    if (!category || typeof category !== "string" || !category.trim())
      return NextResponse.json(
        { error: "category is required", code: "MISSING_CATEGORY" },
        { status: 400 },
      );
    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0)
      return NextResponse.json(
        { error: "A valid amount is required", code: "MISSING_AMOUNT" },
        { status: 400 },
      );
    if (!claimDate || typeof claimDate !== "string")
      return NextResponse.json(
        { error: "claimDate is required", code: "MISSING_CLAIM_DATE" },
        { status: 400 },
      );

    const now = new Date().toISOString();
    const created = await db
      .insert(reimbursements)
      .values({
        employeeId: parseInt(String(employeeId)),
        category: category.trim(),
        amount: Number(amount),
        claimDate,
        billDate: billDate || null,
        description: description || null,
        billUrl: billUrl || null,
        status: status && VALID_STATUSES.includes(status) ? status : "Pending",
        approvedBy: null,
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
    const rid = parseInt(id);

    const existing = await db
      .select()
      .from(reimbursements)
      .where(eq(reimbursements.id, rid))
      .limit(1);
    if (!existing.length)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status))
        return NextResponse.json(
          { error: "Invalid status", code: "INVALID_STATUS" },
          { status: 400 },
        );
      updates.status = body.status;
      updates.approvedBy =
        (user as any).employeeId ?? body.approvedBy ?? null;
    }
    if (body.category !== undefined) updates.category = body.category;
    if (body.amount !== undefined) updates.amount = Number(body.amount);
    if (body.description !== undefined) updates.description = body.description;

    const updated = await db
      .update(reimbursements)
      .set(updates)
      .where(eq(reimbursements.id, rid))
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
    const rid = parseInt(id);

    const deleted = await db
      .delete(reimbursements)
      .where(eq(reimbursements.id, rid))
      .returning();
    if (!deleted.length)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ message: "Deleted", deleted: deleted[0] });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 },
    );
  }
}
