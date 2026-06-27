import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { overtimeRecords, employees } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

const VALID_STATUSES = ["Pending", "Approved", "Rejected", "Paid"];

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

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
      const otId = parseInt(id);
      if (isNaN(otId))
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );

      const row = await db
        .select({
          id: overtimeRecords.id,
          employeeId: overtimeRecords.employeeId,
          date: overtimeRecords.date,
          hours: overtimeRecords.hours,
          rateMultiplier: overtimeRecords.rateMultiplier,
          hourlyRate: overtimeRecords.hourlyRate,
          amount: overtimeRecords.amount,
          reason: overtimeRecords.reason,
          status: overtimeRecords.status,
          approvedBy: overtimeRecords.approvedBy,
          createdAt: overtimeRecords.createdAt,
          updatedAt: overtimeRecords.updatedAt,
          employeeFirstName: employees.firstName,
          employeeLastName: employees.lastName,
          employeeCode: employees.employeeCode,
        })
        .from(overtimeRecords)
        .leftJoin(employees, eq(overtimeRecords.employeeId, employees.id))
        .where(eq(overtimeRecords.id, otId))
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
        id: overtimeRecords.id,
        employeeId: overtimeRecords.employeeId,
        date: overtimeRecords.date,
        hours: overtimeRecords.hours,
        rateMultiplier: overtimeRecords.rateMultiplier,
        hourlyRate: overtimeRecords.hourlyRate,
        amount: overtimeRecords.amount,
        reason: overtimeRecords.reason,
        status: overtimeRecords.status,
        approvedBy: overtimeRecords.approvedBy,
        createdAt: overtimeRecords.createdAt,
        updatedAt: overtimeRecords.updatedAt,
        employeeFirstName: employees.firstName,
        employeeLastName: employees.lastName,
        employeeCode: employees.employeeCode,
      })
      .from(overtimeRecords)
      .leftJoin(employees, eq(overtimeRecords.employeeId, employees.id))
      .orderBy(desc(overtimeRecords.id));

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
    const { employeeId, date, hours, rateMultiplier, hourlyRate, reason } = body;

    if (!employeeId)
      return NextResponse.json(
        { error: "Employee is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    if (!date || !isValidDate(date))
      return NextResponse.json(
        { error: "Date must be in YYYY-MM-DD format", code: "INVALID_DATE" },
        { status: 400 },
      );
    const hoursNum = parseFloat(String(hours));
    if (isNaN(hoursNum) || hoursNum <= 0)
      return NextResponse.json(
        { error: "Hours must be a positive number", code: "INVALID_HOURS" },
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

    const multiplier =
      rateMultiplier !== undefined && rateMultiplier !== null
        ? parseFloat(String(rateMultiplier))
        : 1.5;
    const rate =
      hourlyRate !== undefined && hourlyRate !== null
        ? parseFloat(String(hourlyRate))
        : 0;
    const amount = Number((hoursNum * rate * multiplier).toFixed(2));

    const now = new Date().toISOString();
    const created = await db
      .insert(overtimeRecords)
      .values({
        employeeId: parseInt(String(employeeId)),
        date,
        hours: hoursNum,
        rateMultiplier: multiplier,
        hourlyRate: rate,
        amount,
        reason: reason?.trim() || null,
        status: "Pending",
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

    const otId = parseInt(id);
    const existing = await db
      .select()
      .from(overtimeRecords)
      .where(eq(overtimeRecords.id, otId))
      .limit(1);
    if (!existing.length)
      return NextResponse.json(
        { error: "Not found", code: "NOT_FOUND" },
        { status: 404 },
      );

    const body = await request.json();
    const { date, hours, rateMultiplier, hourlyRate, reason, status } = body;

    const updates: any = { updatedAt: new Date().toISOString() };

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status))
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
            code: "INVALID_STATUS",
          },
          { status: 400 },
        );
      if (user.role !== "admin" && user.role !== "hr")
        return NextResponse.json(
          {
            error: "Forbidden - Only admin/HR can change status",
            code: "FORBIDDEN",
          },
          { status: 403 },
        );
      updates.status = status;
      if (status === "Approved" || status === "Rejected") {
        updates.approvedBy = (user as any).employeeId;
      }
    }

    if (date !== undefined) {
      if (!isValidDate(date))
        return NextResponse.json(
          { error: "Date must be in YYYY-MM-DD format", code: "INVALID_DATE" },
          { status: 400 },
        );
      updates.date = date;
    }

    const nextHours =
      hours !== undefined ? parseFloat(String(hours)) : existing[0].hours;
    const nextMultiplier =
      rateMultiplier !== undefined
        ? parseFloat(String(rateMultiplier))
        : existing[0].rateMultiplier;
    const nextRate =
      hourlyRate !== undefined
        ? parseFloat(String(hourlyRate))
        : existing[0].hourlyRate;

    if (hours !== undefined) {
      if (isNaN(nextHours) || nextHours <= 0)
        return NextResponse.json(
          { error: "Hours must be a positive number", code: "INVALID_HOURS" },
          { status: 400 },
        );
      updates.hours = nextHours;
    }
    if (rateMultiplier !== undefined) updates.rateMultiplier = nextMultiplier;
    if (hourlyRate !== undefined) updates.hourlyRate = nextRate;
    if (reason !== undefined) updates.reason = reason || null;

    if (
      hours !== undefined ||
      rateMultiplier !== undefined ||
      hourlyRate !== undefined
    ) {
      updates.amount = Number(
        (nextHours * nextRate * nextMultiplier).toFixed(2),
      );
    }

    const updated = await db
      .update(overtimeRecords)
      .set(updates)
      .where(eq(overtimeRecords.id, otId))
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

    const otId = parseInt(id);
    const deleted = await db
      .delete(overtimeRecords)
      .where(eq(overtimeRecords.id, otId))
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
