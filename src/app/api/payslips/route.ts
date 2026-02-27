import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payslips, payrollRuns, employees } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return { error: { message: "Unauthorized - Please login", status: 401 } };
  }

  return { user: session.user };
}

// Helper function to check if user can access payslip data
function canAccessPayslipData(
  userRole: string,
  userEmployeeId: number | null,
  targetEmployeeId: number,
) {
  // Admin and HR can access all payslips
  if (userRole === "admin" || userRole === "hr") {
    return true;
  }

  // Regular users can only access their own payslips
  return userEmployeeId === targetEmployeeId;
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const employeeId = searchParams.get("employeeId");
    const payrollRunId = searchParams.get("payrollRunId");
    const status = searchParams.get("status");
    const periodStart = searchParams.get("periodStart");
    const periodEnd = searchParams.get("periodEnd");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Single record fetch
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          {
            error: "Valid ID is required",
            code: "INVALID_ID",
          },
          { status: 400 },
        );
      }

      const record = await db
        .select()
        .from(payslips)
        .where(eq(payslips.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          {
            error: "Payslip not found",
            code: "PAYSLIP_NOT_FOUND",
          },
          { status: 404 },
        );
      }

      // Check authorization
      if (
        !canAccessPayslipData(
          user.role ?? "",
          (user as any).employeeId ?? null,
          record[0].employeeId,
        )
      ) {
        return NextResponse.json(
          {
            error: "Forbidden - You can only access your own payslips",
            code: "FORBIDDEN",
          },
          { status: 403 },
        );
      }

      return NextResponse.json(record[0]);
    }

    // List with filters
    let query = db.select().from(payslips);
    const conditions = [];

    // Role-based filtering: Regular users can only see their own payslips
    if (user.role !== "admin" && user.role !== "hr") {
      if (!user.employeeId) {
        return NextResponse.json(
          {
            error: "No employee record linked to your account",
            code: "NO_EMPLOYEE_LINK",
          },
          { status: 400 },
        );
      }
      conditions.push(eq(payslips.employeeId, user.employeeId));
    } else if (employeeId) {
      // Admin/HR can filter by specific employee
      if (isNaN(parseInt(employeeId))) {
        return NextResponse.json(
          {
            error: "Valid employeeId is required",
            code: "INVALID_EMPLOYEE_ID",
          },
          { status: 400 },
        );
      }
      conditions.push(eq(payslips.employeeId, parseInt(employeeId)));
    }

    if (payrollRunId) {
      if (isNaN(parseInt(payrollRunId))) {
        return NextResponse.json(
          {
            error: "Valid payrollRunId is required",
            code: "INVALID_PAYROLL_RUN_ID",
          },
          { status: 400 },
        );
      }
      conditions.push(eq(payslips.payrollRunId, parseInt(payrollRunId)));
    }

    if (status) {
      const validStatuses = ["draft", "generated", "sent"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            error: "Invalid status. Must be one of: draft, generated, sent",
            code: "INVALID_STATUS",
          },
          { status: 400 },
        );
      }
      conditions.push(eq(payslips.status, status));
    }

    if (periodStart) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(periodStart)) {
        return NextResponse.json(
          {
            error: "periodStart must be in YYYY-MM-DD format",
            code: "INVALID_PERIOD_START_FORMAT",
          },
          { status: 400 },
        );
      }
      conditions.push(gte(payslips.periodStart, periodStart));
    }

    if (periodEnd) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(periodEnd)) {
        return NextResponse.json(
          {
            error: "periodEnd must be in YYYY-MM-DD format",
            code: "INVALID_PERIOD_END_FORMAT",
          },
          { status: 400 },
        );
      }
      conditions.push(lte(payslips.periodEnd, periodEnd));
    }

    const results = await db
      .select()
      .from(payslips)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(payslips.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      {
        error: "Internal server error: " + error,
      },
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

    // Only admin and HR can create payslips
    if (user.role !== "admin" && user.role !== "hr") {
      return NextResponse.json(
        {
          error: "Forbidden - Only admin and HR can create payslips",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { payrollRunId, payslips: payslipsData } = body;

    // Validate required fields
    if (!payrollRunId) {
      return NextResponse.json(
        {
          error: "payrollRunId is required",
          code: "MISSING_PAYROLL_RUN_ID",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(payslipsData) || payslipsData.length === 0) {
      return NextResponse.json(
        {
          error: "payslips array is required and must not be empty",
          code: "MISSING_PAYSLIPS_DATA",
        },
        { status: 400 },
      );
    }

    // Validate payrollRunId exists
    const payrollRunExists = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.id, payrollRunId))
      .limit(1);

    if (payrollRunExists.length === 0) {
      return NextResponse.json(
        {
          error: "Payroll run not found",
          code: "PAYROLL_RUN_NOT_FOUND",
        },
        { status: 400 },
      );
    }

    // Batch insert all payslips
    const createdPayslips = [];
    for (const payslipData of payslipsData) {
      const result = await db
        .insert(payslips)
        .values({
          ...payslipData,
          payrollRunId,
          createdAt: new Date().toISOString(),
        })
        .returning();
      createdPayslips.push(result[0]);
    }

    return NextResponse.json(createdPayslips, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      {
        error: "Internal server error: " + error,
      },
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

    // Only admin and HR can update payslips
    if (user.role !== "admin" && user.role !== "hr") {
      return NextResponse.json(
        {
          error: "Forbidden - Only admin and HR can update payslips",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: "Valid ID is required",
          code: "INVALID_ID",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { status, generatedAt } = body;

    // Check if record exists
    const existing = await db
      .select()
      .from(payslips)
      .where(eq(payslips.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          error: "Payslip not found",
          code: "PAYSLIP_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    const updates: any = {};

    // Validate and update status
    if (status !== undefined) {
      const validStatuses = ["draft", "generated", "sent"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            error: "Invalid status. Must be one of: draft, generated, sent",
            code: "INVALID_STATUS",
          },
          { status: 400 },
        );
      }
      updates.status = status;

      // Auto-set generatedAt if status changes to 'generated' or 'sent'
      if ((status === "generated" || status === "sent") && !generatedAt) {
        updates.generatedAt = new Date().toISOString();
      }
    }

    // Update generatedAt if provided
    if (generatedAt !== undefined) {
      updates.generatedAt = generatedAt;
    }

    // If no fields to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          error: "No fields to update",
          code: "NO_FIELDS_TO_UPDATE",
        },
        { status: 400 },
      );
    }

    const updated = await db
      .update(payslips)
      .set(updates)
      .where(eq(payslips.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      {
        error: "Internal server error: " + error,
      },
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

    // Only admin can delete payslips
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          error: "Forbidden - Only admin can delete payslips",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: "Valid ID is required",
          code: "INVALID_ID",
        },
        { status: 400 },
      );
    }

    // Check if record exists
    const existing = await db
      .select()
      .from(payslips)
      .where(eq(payslips.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          error: "Payslip not found",
          code: "PAYSLIP_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    // Only allow deletion if status is 'draft'
    if (existing[0].status !== "draft") {
      return NextResponse.json(
        {
          error: "Only payslips with 'draft' status can be deleted",
          code: "CANNOT_DELETE_NON_DRAFT",
        },
        { status: 400 },
      );
    }

    const deleted = await db
      .delete(payslips)
      .where(eq(payslips.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: "Payslip deleted successfully",
      data: deleted[0],
    });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      {
        error: "Internal server error: " + error,
      },
      { status: 500 },
    );
  }
}
