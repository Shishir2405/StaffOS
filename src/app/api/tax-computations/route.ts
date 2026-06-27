import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { taxComputations } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const VALID_REGIMES = ["Old", "New"];

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const employeeId = searchParams.get("employeeId");
    const financialYear = searchParams.get("financialYear");

    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId))
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );
      const row = await db
        .select()
        .from(taxComputations)
        .where(eq(taxComputations.id, parsedId))
        .limit(1);
      if (!row.length)
        return NextResponse.json(
          { error: "Tax computation not found" },
          { status: 404 },
        );
      return NextResponse.json(row[0]);
    }

    const conditions = [];
    if (employeeId && !isNaN(parseInt(employeeId)))
      conditions.push(eq(taxComputations.employeeId, parseInt(employeeId)));
    if (financialYear)
      conditions.push(eq(taxComputations.financialYear, financialYear));

    const rows =
      conditions.length > 0
        ? await db
            .select()
            .from(taxComputations)
            .where(and(...conditions))
            .orderBy(desc(taxComputations.id))
        : await db
            .select()
            .from(taxComputations)
            .orderBy(desc(taxComputations.id));

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
      financialYear,
      regime,
      grossIncome,
      totalDeductions,
      taxableIncome,
      taxLiability,
      cess,
      tdsDeducted,
      tdsBalance,
    } = body;

    if (!employeeId || isNaN(parseInt(String(employeeId))))
      return NextResponse.json(
        { error: "Employee is required", code: "MISSING_EMPLOYEE" },
        { status: 400 },
      );
    if (!financialYear)
      return NextResponse.json(
        { error: "Financial year is required", code: "MISSING_FY" },
        { status: 400 },
      );
    if (regime && !VALID_REGIMES.includes(regime))
      return NextResponse.json(
        {
          error: `Invalid regime. Must be one of: ${VALID_REGIMES.join(", ")}`,
          code: "INVALID_REGIME",
        },
        { status: 400 },
      );

    const now = new Date().toISOString();
    const created = await db
      .insert(taxComputations)
      .values({
        employeeId: parseInt(String(employeeId)),
        financialYear,
        regime: regime || "New",
        grossIncome: Number(grossIncome) || 0,
        totalDeductions: Number(totalDeductions) || 0,
        taxableIncome: Number(taxableIncome) || 0,
        taxLiability: Number(taxLiability) || 0,
        cess: Number(cess) || 0,
        tdsDeducted: Number(tdsDeducted) || 0,
        tdsBalance: Number(tdsBalance) || 0,
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
    const parsedId = parseInt(id);

    const existing = await db
      .select()
      .from(taxComputations)
      .where(eq(taxComputations.id, parsedId))
      .limit(1);
    if (!existing.length)
      return NextResponse.json(
        { error: "Tax computation not found" },
        { status: 404 },
      );

    const body = await request.json();
    const {
      financialYear,
      regime,
      grossIncome,
      totalDeductions,
      taxableIncome,
      taxLiability,
      cess,
      tdsDeducted,
      tdsBalance,
    } = body;

    const updates: any = { updatedAt: new Date().toISOString() };
    if (financialYear !== undefined) updates.financialYear = financialYear;
    if (regime !== undefined) {
      if (!VALID_REGIMES.includes(regime))
        return NextResponse.json(
          {
            error: `Invalid regime. Must be one of: ${VALID_REGIMES.join(", ")}`,
            code: "INVALID_REGIME",
          },
          { status: 400 },
        );
      updates.regime = regime;
    }
    if (grossIncome !== undefined)
      updates.grossIncome = Number(grossIncome) || 0;
    if (totalDeductions !== undefined)
      updates.totalDeductions = Number(totalDeductions) || 0;
    if (taxableIncome !== undefined)
      updates.taxableIncome = Number(taxableIncome) || 0;
    if (taxLiability !== undefined)
      updates.taxLiability = Number(taxLiability) || 0;
    if (cess !== undefined) updates.cess = Number(cess) || 0;
    if (tdsDeducted !== undefined)
      updates.tdsDeducted = Number(tdsDeducted) || 0;
    if (tdsBalance !== undefined) updates.tdsBalance = Number(tdsBalance) || 0;

    const updated = await db
      .update(taxComputations)
      .set(updates)
      .where(eq(taxComputations.id, parsedId))
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
      .delete(taxComputations)
      .where(eq(taxComputations.id, parsedId))
      .returning();

    if (!deleted.length)
      return NextResponse.json(
        { error: "Tax computation not found" },
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
