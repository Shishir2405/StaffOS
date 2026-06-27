import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { statutoryContributions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const VALID_TYPES = ["PF", "ESI", "PT", "LWF"];

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const employeeId = searchParams.get("employeeId");

    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId))
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );
      const row = await db
        .select()
        .from(statutoryContributions)
        .where(eq(statutoryContributions.id, parsedId))
        .limit(1);
      if (!row.length)
        return NextResponse.json(
          { error: "Contribution not found" },
          { status: 404 },
        );
      return NextResponse.json(row[0]);
    }

    const conditions = [];
    if (type) conditions.push(eq(statutoryContributions.type, type));
    if (month && !isNaN(parseInt(month)))
      conditions.push(eq(statutoryContributions.month, parseInt(month)));
    if (year && !isNaN(parseInt(year)))
      conditions.push(eq(statutoryContributions.year, parseInt(year)));
    if (employeeId && !isNaN(parseInt(employeeId)))
      conditions.push(
        eq(statutoryContributions.employeeId, parseInt(employeeId)),
      );

    const rows =
      conditions.length > 0
        ? await db
            .select()
            .from(statutoryContributions)
            .where(and(...conditions))
            .orderBy(desc(statutoryContributions.id))
        : await db
            .select()
            .from(statutoryContributions)
            .orderBy(desc(statutoryContributions.id));

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
      employeeId,
      payrollRunId,
      type,
      month,
      year,
      wageBase,
      employeeContribution,
      employerContribution,
      totalContribution,
    } = body;

    if (!employeeId || isNaN(parseInt(String(employeeId))))
      return NextResponse.json(
        { error: "Employee is required", code: "MISSING_EMPLOYEE" },
        { status: 400 },
      );
    if (!type || !VALID_TYPES.includes(type))
      return NextResponse.json(
        {
          error: `Valid type is required. Must be one of: ${VALID_TYPES.join(", ")}`,
          code: "INVALID_TYPE",
        },
        { status: 400 },
      );
    if (month === undefined || month === null || isNaN(parseInt(String(month))))
      return NextResponse.json(
        { error: "Month is required", code: "MISSING_MONTH" },
        { status: 400 },
      );
    if (year === undefined || year === null || isNaN(parseInt(String(year))))
      return NextResponse.json(
        { error: "Year is required", code: "MISSING_YEAR" },
        { status: 400 },
      );

    const empContrib = Number(employeeContribution) || 0;
    const empRContrib = Number(employerContribution) || 0;
    const total =
      totalContribution !== undefined && totalContribution !== null
        ? Number(totalContribution) || 0
        : empContrib + empRContrib;

    const now = new Date().toISOString();
    const created = await db
      .insert(statutoryContributions)
      .values({
        employeeId: parseInt(String(employeeId)),
        payrollRunId:
          payrollRunId !== undefined && payrollRunId !== null
            ? parseInt(String(payrollRunId))
            : null,
        type,
        month: parseInt(String(month)),
        year: parseInt(String(year)),
        wageBase: Number(wageBase) || 0,
        employeeContribution: empContrib,
        employerContribution: empRContrib,
        totalContribution: total,
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
      .from(statutoryContributions)
      .where(eq(statutoryContributions.id, parsedId))
      .limit(1);
    if (!existing.length)
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404 },
      );

    const body = await request.json();
    const {
      type,
      month,
      year,
      wageBase,
      employeeContribution,
      employerContribution,
      totalContribution,
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
    if (month !== undefined) updates.month = parseInt(String(month));
    if (year !== undefined) updates.year = parseInt(String(year));
    if (wageBase !== undefined) updates.wageBase = Number(wageBase) || 0;
    if (employeeContribution !== undefined)
      updates.employeeContribution = Number(employeeContribution) || 0;
    if (employerContribution !== undefined)
      updates.employerContribution = Number(employerContribution) || 0;
    if (totalContribution !== undefined)
      updates.totalContribution = Number(totalContribution) || 0;

    const updated = await db
      .update(statutoryContributions)
      .set(updates)
      .where(eq(statutoryContributions.id, parsedId))
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
      .delete(statutoryContributions)
      .where(eq(statutoryContributions.id, parsedId))
      .returning();

    if (!deleted.length)
      return NextResponse.json(
        { error: "Contribution not found" },
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
