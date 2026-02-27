import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { departments, employees } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session?.user) {
    return { error: { message: 'Unauthorized - Please login', status: 401 } };
  }
  
  return { user: session.user };
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Validate ID
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      // Get single department with employees
      const department = await db.select()
        .from(departments)
        .where(eq(departments.id, parseInt(id)))
        .limit(1);

      if (department.length === 0) {
        return NextResponse.json({ 
          error: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND' 
        }, { status: 404 });
      }

      // Get all employees in this department
      const departmentEmployees = await db.select()
        .from(employees)
        .where(eq(employees.department, department[0].code))
        .orderBy(employees.designation);

      return NextResponse.json({
        success: true,
        data: {
          ...department[0],
          employees: departmentEmployees,
          employeeCount: departmentEmployees.length
        }
      });
    }

    // List all departments with employee count
    const allDepartments = await db.select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
      headId: departments.headId,
      description: departments.description,
      createdAt: departments.createdAt,
      employeeCount: sql<number>`(
        SELECT COUNT(*) 
        FROM ${employees} 
        WHERE ${employees.department} = ${departments.code}
      )`
    })
    .from(departments);

    return NextResponse.json({ success: true, data: allDepartments });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
    }
    
    const { user } = authResult;

    // Only admin and HR can create departments
    if (user.role !== 'admin' && user.role !== 'hr') {
      return NextResponse.json(
        { error: 'Forbidden - Only admin and HR can create departments', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, code, description, headId } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: "Name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ 
        error: "Code is required",
        code: "MISSING_CODE" 
      }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ 
        error: "Description is required",
        code: "MISSING_DESCRIPTION" 
      }, { status: 400 });
    }

    // Validate headId if provided
    if (headId !== undefined && headId !== null) {
      if (isNaN(parseInt(headId))) {
        return NextResponse.json({ 
          error: "Head ID must be a valid employee ID",
          code: "INVALID_HEAD_ID" 
        }, { status: 400 });
      }

      // Check if employee exists
      const employeeExists = await db.select()
        .from(employees)
        .where(eq(employees.id, parseInt(headId)))
        .limit(1);

      if (employeeExists.length === 0) {
        return NextResponse.json({ 
          error: "Employee with provided head ID does not exist",
          code: "HEAD_NOT_FOUND" 
        }, { status: 400 });
      }
    }

    // Check for unique name
    const existingName = await db.select()
      .from(departments)
      .where(eq(departments.name, name.trim()))
      .limit(1);

    if (existingName.length > 0) {
      return NextResponse.json({ 
        error: "Department name already exists",
        code: "DUPLICATE_NAME" 
      }, { status: 400 });
    }

    // Check for unique code
    const existingCode = await db.select()
      .from(departments)
      .where(eq(departments.code, code.trim().toUpperCase()))
      .limit(1);

    if (existingCode.length > 0) {
      return NextResponse.json({ 
        error: "Department code already exists",
        code: "DUPLICATE_CODE" 
      }, { status: 400 });
    }

    // Create new department
    const newDepartment = await db.insert(departments)
      .values({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        headId: headId ? parseInt(headId) : null,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newDepartment[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
    }
    
    const { user } = authResult;

    // Only admin and HR can update departments
    if (user.role !== 'admin' && user.role !== 'hr') {
      return NextResponse.json(
        { error: 'Forbidden - Only admin and HR can update departments', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if department exists
    const existing = await db.select()
      .from(departments)
      .where(eq(departments.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Department not found',
        code: 'DEPARTMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, code, description, headId } = body;

    // Validate headId if provided
    if (headId !== undefined && headId !== null) {
      if (isNaN(parseInt(headId))) {
        return NextResponse.json({ 
          error: "Head ID must be a valid employee ID",
          code: "INVALID_HEAD_ID" 
        }, { status: 400 });
      }

      // Check if employee exists
      const employeeExists = await db.select()
        .from(employees)
        .where(eq(employees.id, parseInt(headId)))
        .limit(1);

      if (employeeExists.length === 0) {
        return NextResponse.json({ 
          error: "Employee with provided head ID does not exist",
          code: "HEAD_NOT_FOUND" 
        }, { status: 400 });
      }
    }

    // Check for unique name if updating name
    if (name && name.trim() !== existing[0].name) {
      const existingName = await db.select()
        .from(departments)
        .where(eq(departments.name, name.trim()))
        .limit(1);

      if (existingName.length > 0) {
        return NextResponse.json({ 
          error: "Department name already exists",
          code: "DUPLICATE_NAME" 
        }, { status: 400 });
      }
    }

    // Check for unique code if updating code
    if (code && code.trim().toUpperCase() !== existing[0].code) {
      const existingCode = await db.select()
        .from(departments)
        .where(eq(departments.code, code.trim().toUpperCase()))
        .limit(1);

      if (existingCode.length > 0) {
        return NextResponse.json({ 
          error: "Department code already exists",
          code: "DUPLICATE_CODE" 
        }, { status: 400 });
      }
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (code !== undefined) updates.code = code.trim().toUpperCase();
    if (description !== undefined) updates.description = description.trim();
    if (headId !== undefined) updates.headId = headId ? parseInt(headId) : null;

    // Update department
    const updated = await db.update(departments)
      .set(updates)
      .where(eq(departments.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
    }
    
    const { user } = authResult;

    // Only admin can delete departments
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only admin can delete departments', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if department exists
    const existing = await db.select()
      .from(departments)
      .where(eq(departments.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Department not found',
        code: 'DEPARTMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete department
    const deleted = await db.delete(departments)
      .where(eq(departments.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Department deleted successfully',
      department: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}