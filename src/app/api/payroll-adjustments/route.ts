import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payrollAdjustments, employees } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

// Enrich an adjustment row with employee name/code for display.
async function withEmployee(row: typeof payrollAdjustments.$inferSelect) {
  if (!row?.employeeId) return row;
  const emp = await db
    .select({ firstName: employees.firstName, lastName: employees.lastName, employeeCode: employees.employeeCode })
    .from(employees)
    .where(eq(employees.id, row.employeeId))
    .limit(1);
  const e = emp[0];
  return {
    ...row,
    employeeName: e ? `${e.firstName} ${e.lastName}` : null,
    employeeCode: e ? e.employeeCode : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json({ error: "Valid ID is required", code: "INVALID_ID" }, { status: 400 });
      }
      const row = await db.select().from(payrollAdjustments).where(eq(payrollAdjustments.id, parsedId)).limit(1);
      if (!row.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(await withEmployee(row[0]));
    }

    const rows = await db.select().from(payrollAdjustments).orderBy(desc(payrollAdjustments.id));
    const enriched = await Promise.all(rows.map((r) => withEmployee(r)));
    return NextResponse.json(enriched);
  } catch (e) {
    return NextResponse.json({ error: "Internal server error: " + e }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const employeeId = parseInt(body.employeeId);
    const type = (body.type ?? "").toString().trim();
    const description = (body.description ?? "").toString().trim();

    if (!employeeId || isNaN(employeeId)) {
      return NextResponse.json({ error: "Employee is required", code: "MISSING_EMPLOYEE" }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: "Type is required", code: "MISSING_TYPE" }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ error: "Description is required", code: "MISSING_DESCRIPTION" }, { status: 400 });
    }
    if (body.amount === undefined || isNaN(Number(body.amount))) {
      return NextResponse.json({ error: "Valid amount is required", code: "MISSING_AMOUNT" }, { status: 400 });
    }
    if (!body.effectiveMonth) {
      return NextResponse.json({ error: "Effective month is required", code: "MISSING_MONTH" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const created = await db
      .insert(payrollAdjustments)
      .values({
        employeeId,
        type,
        description,
        amount: Number(body.amount),
        effectiveMonth: body.effectiveMonth,
        isCredit: body.isCredit !== undefined ? Boolean(body.isCredit) : true,
        status: body.status ?? "Pending",
        approvedBy: body.approvedBy ? parseInt(body.approvedBy) : null,
        createdAt: now,
      })
      .returning();

    return NextResponse.json(await withEmployee(created[0]), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error: " + e }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "Valid ID is required", code: "INVALID_ID" }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.type !== undefined) updates.type = body.type;
    if (body.description !== undefined) updates.description = body.description.toString().trim();
    if (body.amount !== undefined) updates.amount = Number(body.amount);
    if (body.effectiveMonth !== undefined) updates.effectiveMonth = body.effectiveMonth;
    if (body.isCredit !== undefined) updates.isCredit = Boolean(body.isCredit);
    if (body.status !== undefined) updates.status = body.status;
    if (body.approvedBy !== undefined) updates.approvedBy = body.approvedBy ? parseInt(body.approvedBy) : null;

    const updated = await db.update(payrollAdjustments).set(updates).where(eq(payrollAdjustments.id, parseInt(id))).returning();
    if (!updated.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(await withEmployee(updated[0]));
  } catch (e) {
    return NextResponse.json({ error: "Internal server error: " + e }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "Valid ID is required", code: "INVALID_ID" }, { status: 400 });
    }

    const deleted = await db.delete(payrollAdjustments).where(eq(payrollAdjustments.id, parseInt(id))).returning();
    if (!deleted.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted", deleted: deleted[0] });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error: " + e }, { status: 500 });
  }
}
