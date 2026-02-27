import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salaryComponents, employees } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const employeeId = searchParams.get("employeeId");
    const componentType = searchParams.get("componentType");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Single record by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
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
        .from(salaryComponents)
        .where(eq(salaryComponents.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          {
            error: "Salary component not found",
            code: "NOT_FOUND",
          },
          { status: 404 },
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    const conditions = [];

    if (employeeId) {
      if (isNaN(parseInt(employeeId))) {
        return NextResponse.json(
          {
            error: "Valid employee ID is required",
            code: "INVALID_EMPLOYEE_ID",
          },
          { status: 400 },
        );
      }
      conditions.push(eq(salaryComponents.employeeId, parseInt(employeeId)));
    }

    if (componentType) {
      if (!["basic", "allowance", "deduction"].includes(componentType)) {
        return NextResponse.json(
          {
            error: "Component type must be one of: basic, allowance, deduction",
            code: "INVALID_COMPONENT_TYPE",
          },
          { status: 400 },
        );
      }
      conditions.push(eq(salaryComponents.componentType, componentType));
    }

    const results = await db
      .select()
      .from(salaryComponents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(salaryComponents.createdAt))
      .limit(limit)
      .offset(offset);
      
    return NextResponse.json(results, { status: 200 });
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
    const body = await request.json();
    const {
      employeeId,
      componentType,
      componentName,
      amount,
      isPercentage,
      isStatutory,
    } = body;

    // Validate required fields
    if (!employeeId) {
      return NextResponse.json(
        {
          error: "Employee ID is required",
          code: "MISSING_EMPLOYEE_ID",
        },
        { status: 400 },
      );
    }

    if (!componentType) {
      return NextResponse.json(
        {
          error: "Component type is required",
          code: "MISSING_COMPONENT_TYPE",
        },
        { status: 400 },
      );
    }

    if (!componentName) {
      return NextResponse.json(
        {
          error: "Component name is required",
          code: "MISSING_COMPONENT_NAME",
        },
        { status: 400 },
      );
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        {
          error: "Amount is required",
          code: "MISSING_AMOUNT",
        },
        { status: 400 },
      );
    }

    // Validate componentType
    if (!["basic", "allowance", "deduction"].includes(componentType)) {
      return NextResponse.json(
        {
          error: "Component type must be one of: basic, allowance, deduction",
          code: "INVALID_COMPONENT_TYPE",
        },
        { status: 400 },
      );
    }

    // Validate amount is positive
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        {
          error: "Amount must be a positive number",
          code: "INVALID_AMOUNT",
        },
        { status: 400 },
      );
    }

    // Validate employeeId exists
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (employee.length === 0) {
      return NextResponse.json(
        {
          error: "Employee not found",
          code: "EMPLOYEE_NOT_FOUND",
        },
        { status: 400 },
      );
    }

    // Create salary component
    const newComponent = await db
      .insert(salaryComponents)
      .values({
        employeeId,
        componentType,
        componentName: componentName.trim(),
        amount,
        isPercentage: isPercentage ?? false,
        isStatutory: isStatutory ?? false,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newComponent[0], { status: 201 });
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
    const { searchParams } = new URL(request.url);
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
      .from(salaryComponents)
      .where(eq(salaryComponents.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          error: "Salary component not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { componentType, componentName, amount, isPercentage, isStatutory } =
      body;

    // Validate componentType if provided
    if (
      componentType &&
      !["basic", "allowance", "deduction"].includes(componentType)
    ) {
      return NextResponse.json(
        {
          error: "Component type must be one of: basic, allowance, deduction",
          code: "INVALID_COMPONENT_TYPE",
        },
        { status: 400 },
      );
    }

    // Validate amount if provided
    if (amount !== undefined && amount !== null) {
      if (typeof amount !== "number" || amount <= 0) {
        return NextResponse.json(
          {
            error: "Amount must be a positive number",
            code: "INVALID_AMOUNT",
          },
          { status: 400 },
        );
      }
    }

    // Build update object
    const updates: any = {};
    if (componentType !== undefined) updates.componentType = componentType;
    if (componentName !== undefined)
      updates.componentName = componentName.trim();
    if (amount !== undefined) updates.amount = amount;
    if (isPercentage !== undefined) updates.isPercentage = isPercentage;
    if (isStatutory !== undefined) updates.isStatutory = isStatutory;

    // Update record
    const updated = await db
      .update(salaryComponents)
      .set(updates)
      .where(eq(salaryComponents.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
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
    const { searchParams } = new URL(request.url);
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
      .from(salaryComponents)
      .where(eq(salaryComponents.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          error: "Salary component not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    // Delete record
    const deleted = await db
      .delete(salaryComponents)
      .where(eq(salaryComponents.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: "Salary component deleted successfully",
        data: deleted[0],
      },
      { status: 200 },
    );
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
