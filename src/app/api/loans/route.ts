import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { loans, employees } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const VALID_STATUSES = ["Active", "Closed", "Defaulted", "Pending"];

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const loanId = parseInt(id);
      if (isNaN(loanId))
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );
      const row = await db
        .select()
        .from(loans)
        .where(eq(loans.id, loanId))
        .limit(1);
      if (!row.length)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(row[0]);
    }

    const rows = await db
      .select({
        id: loans.id,
        employeeId: loans.employeeId,
        loanType: loans.loanType,
        principalAmount: loans.principalAmount,
        interestRate: loans.interestRate,
        tenureMonths: loans.tenureMonths,
        emiAmount: loans.emiAmount,
        amountPaid: loans.amountPaid,
        outstandingAmount: loans.outstandingAmount,
        startDate: loans.startDate,
        status: loans.status,
        approvedBy: loans.approvedBy,
        createdAt: loans.createdAt,
        updatedAt: loans.updatedAt,
        firstName: employees.firstName,
        lastName: employees.lastName,
        employeeCode: employees.employeeCode,
      })
      .from(loans)
      .leftJoin(employees, eq(loans.employeeId, employees.id))
      .orderBy(desc(loans.id));

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
      loanType,
      principalAmount,
      interestRate,
      tenureMonths,
      emiAmount,
      amountPaid,
      outstandingAmount,
      startDate,
      status,
      approvedBy,
    } = body;

    if (!employeeId || isNaN(parseInt(String(employeeId))))
      return NextResponse.json(
        { error: "employeeId is required", code: "MISSING_EMPLOYEE" },
        { status: 400 },
      );
    if (!loanType || typeof loanType !== "string" || !loanType.trim())
      return NextResponse.json(
        { error: "loanType is required", code: "MISSING_LOAN_TYPE" },
        { status: 400 },
      );
    if (principalAmount === undefined || isNaN(Number(principalAmount)))
      return NextResponse.json(
        { error: "principalAmount is required", code: "MISSING_PRINCIPAL" },
        { status: 400 },
      );
    if (!tenureMonths || isNaN(parseInt(String(tenureMonths))))
      return NextResponse.json(
        { error: "tenureMonths is required", code: "MISSING_TENURE" },
        { status: 400 },
      );

    const principal = Number(principalAmount);
    const rate = interestRate !== undefined ? Number(interestRate) : 0;
    const tenure = parseInt(String(tenureMonths));
    const computedEmi =
      emiAmount !== undefined && !isNaN(Number(emiAmount))
        ? Number(emiAmount)
        : tenure > 0
          ? (principal + (principal * rate * tenure) / 100 / 12) / tenure
          : 0;
    const outstanding =
      outstandingAmount !== undefined && !isNaN(Number(outstandingAmount))
        ? Number(outstandingAmount)
        : principal;

    const now = new Date().toISOString();
    const created = await db
      .insert(loans)
      .values({
        employeeId: parseInt(String(employeeId)),
        loanType: loanType.trim(),
        principalAmount: principal,
        interestRate: rate,
        tenureMonths: tenure,
        emiAmount: Math.round(computedEmi * 100) / 100,
        amountPaid:
          amountPaid !== undefined && !isNaN(Number(amountPaid))
            ? Number(amountPaid)
            : 0,
        outstandingAmount: outstanding,
        startDate: startDate || now.split("T")[0],
        status: status && VALID_STATUSES.includes(status) ? status : "Active",
        approvedBy: approvedBy ? parseInt(String(approvedBy)) : null,
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
    const loanId = parseInt(id);

    const existing = await db
      .select()
      .from(loans)
      .where(eq(loans.id, loanId))
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
    }
    if (body.loanType !== undefined) updates.loanType = body.loanType;
    if (body.interestRate !== undefined)
      updates.interestRate = Number(body.interestRate);
    if (body.emiAmount !== undefined) updates.emiAmount = Number(body.emiAmount);
    if (body.amountPaid !== undefined)
      updates.amountPaid = Number(body.amountPaid);
    if (body.outstandingAmount !== undefined)
      updates.outstandingAmount = Number(body.outstandingAmount);
    if (body.approvedBy !== undefined)
      updates.approvedBy = body.approvedBy
        ? parseInt(String(body.approvedBy))
        : null;

    const updated = await db
      .update(loans)
      .set(updates)
      .where(eq(loans.id, loanId))
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
    const loanId = parseInt(id);

    const deleted = await db
      .delete(loans)
      .where(eq(loans.id, loanId))
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
