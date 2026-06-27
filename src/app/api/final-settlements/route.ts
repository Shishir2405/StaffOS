import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { finalSettlements, employees } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

// netSettlement = leaveEncashment + gratuity + pendingSalary + bonusPayable - deductions
function computeNet(v: {
  leaveEncashment?: unknown;
  gratuity?: unknown;
  pendingSalary?: unknown;
  bonusPayable?: unknown;
  deductions?: unknown;
}) {
  const num = (x: unknown) => Number(x ?? 0) || 0;
  return (
    num(v.leaveEncashment) +
    num(v.gratuity) +
    num(v.pendingSalary) +
    num(v.bonusPayable) -
    num(v.deductions)
  );
}

async function withEmployee(row: typeof finalSettlements.$inferSelect) {
  if (!row?.employeeId) return row;
  const emp = await db
    .select({ firstName: employees.firstName, lastName: employees.lastName, employeeCode: employees.employeeCode, designation: employees.designation })
    .from(employees)
    .where(eq(employees.id, row.employeeId))
    .limit(1);
  const e = emp[0];
  return {
    ...row,
    employeeName: e ? `${e.firstName} ${e.lastName}` : null,
    employeeCode: e ? e.employeeCode : null,
    designation: e ? e.designation : null,
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
      const row = await db.select().from(finalSettlements).where(eq(finalSettlements.id, parsedId)).limit(1);
      if (!row.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(await withEmployee(row[0]));
    }

    const rows = await db.select().from(finalSettlements).orderBy(desc(finalSettlements.id));
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

    if (!employeeId || isNaN(employeeId)) {
      return NextResponse.json({ error: "Employee is required", code: "MISSING_EMPLOYEE" }, { status: 400 });
    }
    if (!body.lastWorkingDay) {
      return NextResponse.json({ error: "Last working day is required", code: "MISSING_LWD" }, { status: 400 });
    }

    const leaveEncashment = Number(body.leaveEncashment ?? 0) || 0;
    const gratuity = Number(body.gratuity ?? 0) || 0;
    const pendingSalary = Number(body.pendingSalary ?? 0) || 0;
    const bonusPayable = Number(body.bonusPayable ?? 0) || 0;
    const deductions = Number(body.deductions ?? 0) || 0;

    // Always compute server-side; never trust client netSettlement.
    const netSettlement = computeNet({ leaveEncashment, gratuity, pendingSalary, bonusPayable, deductions });

    const now = new Date().toISOString();
    const created = await db
      .insert(finalSettlements)
      .values({
        employeeId,
        lastWorkingDay: body.lastWorkingDay,
        noticePeriodDays: Number(body.noticePeriodDays ?? 0) || 0,
        leaveEncashment,
        gratuity,
        pendingSalary,
        bonusPayable,
        deductions,
        netSettlement,
        status: body.status ?? "Draft",
        remarks: body.remarks ?? null,
        createdAt: now,
        updatedAt: now,
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
    const parsedId = parseInt(id);

    const existingRows = await db.select().from(finalSettlements).where(eq(finalSettlements.id, parsedId)).limit(1);
    if (!existingRows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const existing = existingRows[0];

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.lastWorkingDay !== undefined) updates.lastWorkingDay = body.lastWorkingDay;
    if (body.noticePeriodDays !== undefined) updates.noticePeriodDays = Number(body.noticePeriodDays) || 0;
    if (body.leaveEncashment !== undefined) updates.leaveEncashment = Number(body.leaveEncashment) || 0;
    if (body.gratuity !== undefined) updates.gratuity = Number(body.gratuity) || 0;
    if (body.pendingSalary !== undefined) updates.pendingSalary = Number(body.pendingSalary) || 0;
    if (body.bonusPayable !== undefined) updates.bonusPayable = Number(body.bonusPayable) || 0;
    if (body.deductions !== undefined) updates.deductions = Number(body.deductions) || 0;
    if (body.status !== undefined) updates.status = body.status;
    if (body.remarks !== undefined) updates.remarks = body.remarks;

    // Recompute netSettlement from merged values whenever any money field changes.
    const moneyTouched = ["leaveEncashment", "gratuity", "pendingSalary", "bonusPayable", "deductions"].some(
      (k) => body[k] !== undefined,
    );
    if (moneyTouched) {
      updates.netSettlement = computeNet({
        leaveEncashment: updates.leaveEncashment ?? existing.leaveEncashment,
        gratuity: updates.gratuity ?? existing.gratuity,
        pendingSalary: updates.pendingSalary ?? existing.pendingSalary,
        bonusPayable: updates.bonusPayable ?? existing.bonusPayable,
        deductions: updates.deductions ?? existing.deductions,
      });
    }

    updates.updatedAt = new Date().toISOString();

    const updated = await db.update(finalSettlements).set(updates).where(eq(finalSettlements.id, parsedId)).returning();
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

    const deleted = await db.delete(finalSettlements).where(eq(finalSettlements.id, parseInt(id))).returning();
    if (!deleted.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted", deleted: deleted[0] });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error: " + e }, { status: 500 });
  }
}
