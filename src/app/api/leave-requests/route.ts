import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leaveRequests, employees } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

const VALID_LEAVE_TYPES = [
  "Sick Leave",
  "Casual Leave",
  "Paid Leave",
  "Unpaid Leave",
];
const VALID_STATUSES = ["Pending", "Approved", "Rejected"];

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return { error: { message: "Unauthorized - Please login", status: 401 } };
  }

  return { user: session.user };
}

// Helper function to check if user can access leave request data
function canAccessLeaveData(
  userRole: string,
  userEmployeeId: number | null,
  targetEmployeeId: number,
) {
  // Admin and HR can access all leave requests
  if (userRole === "admin" || userRole === "hr") {
    return true;
  }

  // Regular users can only access their own leave requests
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const leaveType = searchParams.get("leaveType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    if (id) {
      const leaveId = parseInt(id);
      if (isNaN(leaveId)) {
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );
      }

      const result = await db
        .select({
          id: leaveRequests.id,
          employeeId: leaveRequests.employeeId,
          leaveType: leaveRequests.leaveType,
          startDate: leaveRequests.startDate,
          endDate: leaveRequests.endDate,
          totalDays: leaveRequests.totalDays,
          reason: leaveRequests.reason,
          status: leaveRequests.status,
          approvedBy: leaveRequests.approvedBy,
          approvedAt: leaveRequests.approvedAt,
          createdAt: leaveRequests.createdAt,
          updatedAt: leaveRequests.updatedAt,
          employeeName: employees.firstName,
          employeeLastName: employees.lastName,
          employeeCode: employees.employeeCode,
        })
        .from(leaveRequests)
        .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
        .where(eq(leaveRequests.id, leaveId))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json(
          { error: "Leave request not found", code: "LEAVE_REQUEST_NOT_FOUND" },
          { status: 404 },
        );
      }

      const leaveRequest = result[0];

      // Check authorization
      if (
        !canAccessLeaveData(
          user.role ?? "",
          (user as any).employeeId ?? null,
          leaveRequest.employeeId,
        )
      ) {
        return NextResponse.json(
          {
            error: "Forbidden - You can only access your own leave requests",
            code: "FORBIDDEN",
          },
          { status: 403 },
        );
      }

      let approverName = null;
      let approverLastName = null;
      let approverCode = null;

      if (leaveRequest.approvedBy) {
        const approver = await db
          .select({
            firstName: employees.firstName,
            lastName: employees.lastName,
            employeeCode: employees.employeeCode,
          })
          .from(employees)
          .where(eq(employees.id, leaveRequest.approvedBy))
          .limit(1);

        if (approver.length > 0) {
          approverName = approver[0].firstName;
          approverLastName = approver[0].lastName;
          approverCode = approver[0].employeeCode;
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          ...leaveRequest,
          employeeName: `${leaveRequest.employeeName} ${leaveRequest.employeeLastName}`,
          approverName: approverName
            ? `${approverName} ${approverLastName}`
            : null,
          approverCode,
        },
      });
    }

    let query = db
      .select({
        id: leaveRequests.id,
        employeeId: leaveRequests.employeeId,
        leaveType: leaveRequests.leaveType,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        totalDays: leaveRequests.totalDays,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        approvedBy: leaveRequests.approvedBy,
        approvedAt: leaveRequests.approvedAt,
        createdAt: leaveRequests.createdAt,
        updatedAt: leaveRequests.updatedAt,
        employeeName: employees.firstName,
        employeeLastName: employees.lastName,
        employeeCode: employees.employeeCode,
      })
      .from(leaveRequests)
      .leftJoin(employees, eq(leaveRequests.employeeId, employees.id));

    const conditions = [];

    // Role-based filtering: Regular users can only see their own leave requests
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
      conditions.push(eq(leaveRequests.employeeId, user.employeeId));
    } else if (employeeId) {
      // Admin/HR can filter by specific employee
      const empId = parseInt(employeeId);
      if (!isNaN(empId)) {
        conditions.push(eq(leaveRequests.employeeId, empId));
      }
    }

    if (status) {
      conditions.push(eq(leaveRequests.status, status));
    }

    if (leaveType) {
      conditions.push(eq(leaveRequests.leaveType, leaveType));
    }

    if (startDate && isValidDate(startDate)) {
      conditions.push(gte(leaveRequests.startDate, startDate));
    }

    if (endDate && isValidDate(endDate)) {
      conditions.push(lte(leaveRequests.endDate, endDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query
      .orderBy(desc(leaveRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const formattedResults = results.map((item) => ({
      ...item,
      employeeName: `${item.employeeName} ${item.employeeLastName}`,
    }));

    return NextResponse.json({ success: true, data: formattedResults });
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
    const body = await request.json();
    const { employeeId, leaveType, startDate, endDate, totalDays, reason } =
      body;

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    }

    // Check authorization - users can only create their own leave requests
    if (user.role !== "admin" && user.role !== "hr") {
      if (!user.employeeId || user.employeeId !== employeeId) {
        return NextResponse.json(
          {
            error: "Forbidden - You can only create your own leave requests",
            code: "FORBIDDEN",
          },
          { status: 403 },
        );
      }
    }

    if (!leaveType) {
      return NextResponse.json(
        { error: "Leave type is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    }

    if (!VALID_LEAVE_TYPES.includes(leaveType)) {
      return NextResponse.json(
        {
          error: `Invalid leave type. Must be one of: ${VALID_LEAVE_TYPES.join(", ")}`,
          code: "INVALID_LEAVE_TYPE",
        },
        { status: 400 },
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: "Start date is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    }

    if (!endDate) {
      return NextResponse.json(
        { error: "End date is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    }

    if (!isValidDate(startDate)) {
      return NextResponse.json(
        {
          error: "Start date must be in YYYY-MM-DD format",
          code: "INVALID_DATE",
        },
        { status: 400 },
      );
    }

    if (!isValidDate(endDate)) {
      return NextResponse.json(
        {
          error: "End date must be in YYYY-MM-DD format",
          code: "INVALID_DATE",
        },
        { status: 400 },
      );
    }

    if (new Date(endDate) < new Date(startDate)) {
      return NextResponse.json(
        {
          error: "End date cannot be before start date",
          code: "INVALID_DATE_RANGE",
        },
        { status: 400 },
      );
    }

    if (totalDays === undefined || totalDays === null) {
      return NextResponse.json(
        { error: "Total days is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    }

    if (typeof totalDays !== "number" || totalDays <= 0) {
      return NextResponse.json(
        { error: "Total days must be a positive number", code: "INVALID_DATE" },
        { status: 400 },
      );
    }

    if (!reason || reason.trim() === "") {
      return NextResponse.json(
        { error: "Reason is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    }

    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (employee.length === 0) {
      return NextResponse.json(
        { error: "Employee not found", code: "EMPLOYEE_NOT_FOUND" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const newLeaveRequest = await db
      .insert(leaveRequests)
      .values({
        employeeId,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason: reason.trim(),
        status: "Pending",
        approvedBy: null,
        approvedAt: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newLeaveRequest[0], { status: 201 });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Valid ID is required", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const leaveId = parseInt(id);

    const existingRequest = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, leaveId))
      .limit(1);

    if (existingRequest.length === 0) {
      return NextResponse.json(
        { error: "Leave request not found", code: "LEAVE_REQUEST_NOT_FOUND" },
        { status: 404 },
      );
    }

    // Check authorization
    const canModify =
      user.role === "admin" ||
      user.role === "hr" ||
      (user.employeeId === existingRequest[0].employeeId &&
        existingRequest[0].status === "Pending");

    if (!canModify) {
      return NextResponse.json(
        {
          error: "Forbidden - You cannot modify this leave request",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      status,
      approvedBy,
      approvedAt,
      reason,
      startDate,
      endDate,
      totalDays,
      leaveType,
    } = body;

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only admin/HR can approve/reject
    if (status !== undefined) {
      if (user.role !== "admin" && user.role !== "hr") {
        return NextResponse.json(
          {
            error:
              "Forbidden - Only admin/HR can approve or reject leave requests",
            code: "FORBIDDEN",
          },
          { status: 403 },
        );
      }

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

      if (status === "Approved" || status === "Rejected") {
        updates.approvedBy = user.employeeId;
        updates.approvedAt = approvedAt || new Date().toISOString();
      }
    }

    // Regular users can only update pending requests
    if (reason !== undefined) {
      if (reason.trim() === "") {
        return NextResponse.json(
          { error: "Reason cannot be empty", code: "MISSING_FIELD" },
          { status: 400 },
        );
      }
      updates.reason = reason.trim();
    }

    if (leaveType !== undefined) {
      if (!VALID_LEAVE_TYPES.includes(leaveType)) {
        return NextResponse.json(
          {
            error: `Invalid leave type. Must be one of: ${VALID_LEAVE_TYPES.join(", ")}`,
            code: "INVALID_LEAVE_TYPE",
          },
          { status: 400 },
        );
      }
      updates.leaveType = leaveType;
    }

    if (startDate !== undefined) {
      if (!isValidDate(startDate)) {
        return NextResponse.json(
          {
            error: "Start date must be in YYYY-MM-DD format",
            code: "INVALID_DATE",
          },
          { status: 400 },
        );
      }
      updates.startDate = startDate;
    }

    if (endDate !== undefined) {
      if (!isValidDate(endDate)) {
        return NextResponse.json(
          {
            error: "End date must be in YYYY-MM-DD format",
            code: "INVALID_DATE",
          },
          { status: 400 },
        );
      }
      updates.endDate = endDate;
    }

    if (totalDays !== undefined) {
      if (typeof totalDays !== "number" || totalDays <= 0) {
        return NextResponse.json(
          {
            error: "Total days must be a positive number",
            code: "INVALID_DATE",
          },
          { status: 400 },
        );
      }
      updates.totalDays = totalDays;
    }

    const updatedRequest = await db
      .update(leaveRequests)
      .set(updates)
      .where(eq(leaveRequests.id, leaveId))
      .returning();

    return NextResponse.json(updatedRequest[0]);
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Valid ID is required", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const leaveId = parseInt(id);

    const existingRequest = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, leaveId))
      .limit(1);

    if (existingRequest.length === 0) {
      return NextResponse.json(
        { error: "Leave request not found", code: "LEAVE_REQUEST_NOT_FOUND" },
        { status: 404 },
      );
    }

    // Only allow deletion of own pending requests or admin can delete any
    if (user.role !== "admin" && user.role !== "hr") {
      if (
        user.employeeId !== existingRequest[0].employeeId ||
        existingRequest[0].status !== "Pending"
      ) {
        return NextResponse.json(
          {
            error:
              "Forbidden - You can only delete your own pending leave requests",
            code: "FORBIDDEN",
          },
          { status: 403 },
        );
      }
    }

    const deleted = await db
      .delete(leaveRequests)
      .where(eq(leaveRequests.id, leaveId))
      .returning();

    return NextResponse.json({
      message: "Leave request deleted successfully",
      deletedRequest: deleted[0],
    });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error },
      { status: 500 },
    );
  }
}
