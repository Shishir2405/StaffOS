import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payrollRuns, employees } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

const VALID_STATUSES = ["draft", "processing", "completed", "approved"];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return { error: { message: "Unauthorized - Please login", status: 401 } };
  }

  return { user: session.user };
}

function validateDate(date: string): boolean {
  if (!DATE_REGEX.test(date)) return false;
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
}

function compareDates(date1: string, date2: string): number {
  return new Date(date1).getTime() - new Date(date2).getTime();
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error.message },
        { status: authResult.error.status },
      );
    }

    const { user } = authResult;

    // Only admin and HR can access payroll runs
    if (user.role !== "admin" && user.role !== "hr") {
      return NextResponse.json(
        {
          error: "Forbidden - Only admin and HR can access payroll runs",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const periodStart = searchParams.get("periodStart");
    const periodEnd = searchParams.get("periodEnd");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );
      }

      const record = await db
        .select()
        .from(payrollRuns)
        .where(eq(payrollRuns.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: "Payroll run not found", code: "NOT_FOUND" },
          { status: 404 },
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with filters
    const conditions = [];

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
            code: "INVALID_STATUS",
          },
          { status: 400 },
        );
      }
      conditions.push(eq(payrollRuns.status, status));
    }

    if (periodStart) {
      if (!validateDate(periodStart)) {
        return NextResponse.json(
          {
            error: "Invalid periodStart format. Use YYYY-MM-DD",
            code: "INVALID_DATE_FORMAT",
          },
          { status: 400 },
        );
      }
      conditions.push(gte(payrollRuns.periodStart, periodStart));
    }

    if (periodEnd) {
      if (!validateDate(periodEnd)) {
        return NextResponse.json(
          {
            error: "Invalid periodEnd format. Use YYYY-MM-DD",
            code: "INVALID_DATE_FORMAT",
          },
          { status: 400 },
        );
      }
      conditions.push(lte(payrollRuns.periodEnd, periodEnd));
    }

    const results = await db
      .select()
      .from(payrollRuns)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(payrollRuns.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error.message },
        { status: authResult.error.status },
      );
    }

    const { user } = authResult;

    // Only admin and HR can create payroll runs
    if (user.role !== "admin" && user.role !== "hr") {
      return NextResponse.json(
        {
          error: "Forbidden - Only admin and HR can create payroll runs",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { runDate, periodStart, periodEnd, status, createdBy } = body;

    // Validate required fields
    if (!runDate) {
      return NextResponse.json(
        { error: "runDate is required", code: "MISSING_RUN_DATE" },
        { status: 400 },
      );
    }

    if (!periodStart) {
      return NextResponse.json(
        { error: "periodStart is required", code: "MISSING_PERIOD_START" },
        { status: 400 },
      );
    }

    if (!periodEnd) {
      return NextResponse.json(
        { error: "periodEnd is required", code: "MISSING_PERIOD_END" },
        { status: 400 },
      );
    }

    // Validate date formats
    if (!validateDate(runDate)) {
      return NextResponse.json(
        {
          error: "Invalid runDate format. Use YYYY-MM-DD",
          code: "INVALID_RUN_DATE_FORMAT",
        },
        { status: 400 },
      );
    }

    if (!validateDate(periodStart)) {
      return NextResponse.json(
        {
          error: "Invalid periodStart format. Use YYYY-MM-DD",
          code: "INVALID_PERIOD_START_FORMAT",
        },
        { status: 400 },
      );
    }

    if (!validateDate(periodEnd)) {
      return NextResponse.json(
        {
          error: "Invalid periodEnd format. Use YYYY-MM-DD",
          code: "INVALID_PERIOD_END_FORMAT",
        },
        { status: 400 },
      );
    }

    // Validate periodEnd >= periodStart
    if (compareDates(periodEnd, periodStart) < 0) {
      return NextResponse.json(
        {
          error: "periodEnd must be greater than or equal to periodStart",
          code: "INVALID_PERIOD_RANGE",
        },
        { status: 400 },
      );
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
          code: "INVALID_STATUS",
        },
        { status: 400 },
      );
    }

    // Validate createdBy exists if provided
    if (createdBy) {
      const employee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, createdBy))
        .limit(1);

      if (employee.length === 0) {
        return NextResponse.json(
          {
            error: "createdBy employee does not exist",
            code: "INVALID_CREATED_BY",
          },
          { status: 400 },
        );
      }
    }

    // Create payroll run
    const newPayrollRun = await db
      .insert(payrollRuns)
      .values({
        runDate: runDate.trim(),
        periodStart: periodStart.trim(),
        periodEnd: periodEnd.trim(),
        status: status || "draft",
        totalEmployees: 0,
        totalAmount: 0,
        createdBy: createdBy || user.employeeId || null,
        createdAt: new Date().toISOString(),
        processedAt: null,
      })
      .returning();

    return NextResponse.json(newPayrollRun[0], { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error.message },
        { status: authResult.error.status },
      );
    }

    const { user } = authResult;

    // Only admin and HR can update payroll runs
    if (user.role !== "admin" && user.role !== "hr") {
      return NextResponse.json(
        {
          error: "Forbidden - Only admin and HR can update payroll runs",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Valid ID is required", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    // Check if record exists
    const existing = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Payroll run not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { status, totalEmployees, totalAmount, processedAt } = body;

    const updates: any = {};

    // Validate and add status
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
            code: "INVALID_STATUS",
          },
          { status: 400 },
        );
      }
      updates.status = status;

      // Auto-set processedAt if status changes to completed or approved
      if (
        (status === "completed" || status === "approved") &&
        !processedAt &&
        !existing[0].processedAt
      ) {
        updates.processedAt = new Date().toISOString();
      }
    }

    // Validate and add totalEmployees
    if (totalEmployees !== undefined) {
      if (typeof totalEmployees !== "number" || totalEmployees < 0) {
        return NextResponse.json(
          {
            error: "totalEmployees must be a non-negative number",
            code: "INVALID_TOTAL_EMPLOYEES",
          },
          { status: 400 },
        );
      }
      updates.totalEmployees = totalEmployees;
    }

    // Validate and add totalAmount
    if (totalAmount !== undefined) {
      if (typeof totalAmount !== "number" || totalAmount < 0) {
        return NextResponse.json(
          {
            error: "totalAmount must be a non-negative number",
            code: "INVALID_TOTAL_AMOUNT",
          },
          { status: 400 },
        );
      }
      updates.totalAmount = totalAmount;
    }

    // Add processedAt if provided
    if (processedAt !== undefined) {
      updates.processedAt = processedAt;
    }

    const updated = await db
      .update(payrollRuns)
      .set(updates)
      .where(eq(payrollRuns.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error.message },
        { status: authResult.error.status },
      );
    }

    const { user } = authResult;

    // Only admin can delete payroll runs
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          error: "Forbidden - Only admin can delete payroll runs",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Valid ID is required", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    // Check if record exists
    const existing = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Payroll run not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Only allow deletion if status is draft
    if (existing[0].status !== "draft") {
      return NextResponse.json(
        {
          error:
            "Cannot delete payroll run. Only draft payroll runs can be deleted",
          code: "INVALID_STATUS_FOR_DELETE",
        },
        { status: 400 },
      );
    }

    const deleted = await db
      .delete(payrollRuns)
      .where(eq(payrollRuns.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: "Payroll run deleted successfully",
        deleted: deleted[0],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error },
      { status: 500 },
    );
  }
}
