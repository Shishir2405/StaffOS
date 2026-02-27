import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { employees } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// Helper function to get authenticated user and check authorization
async function getAuthenticatedUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session?.user) {
    return { error: { message: 'Unauthorized - Please login', status: 401 } };
  }
  
  return { user: session.user };
}

// Helper function to check if user can access employee data
function canAccessEmployeeData(userRole: string, userEmployeeId: number | null, targetEmployeeId: number) {
  // Admin and HR can access all employee data
  if (userRole === 'admin' || userRole === 'hr') {
    return true;
  }
  
  // Regular users can only access their own data
  return userEmployeeId === targetEmployeeId;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
    }
    
    const { user } = authResult;
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single employee by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const targetEmployeeId = parseInt(id);

      // Check authorization
      if (!canAccessEmployeeData(user.role, user.employeeId, targetEmployeeId)) {
        return NextResponse.json(
          { error: 'Forbidden - You can only access your own data', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      const employee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, targetEmployeeId))
        .limit(1);

      if (employee.length === 0) {
        return NextResponse.json(
          { error: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: employee[0] }, { status: 200 });
    }

    // List employees with filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const employmentStatus = searchParams.get('employmentStatus');
    const employmentType = searchParams.get('employmentType');

    let query = db.select().from(employees);

    // Build filter conditions
    const conditions = [];

    // Role-based filtering: Regular users can only see their own data
    if (user.role !== 'admin' && user.role !== 'hr') {
      if (!user.employeeId) {
        return NextResponse.json(
          { error: 'No employee record linked to your account', code: 'NO_EMPLOYEE_LINK' },
          { status: 400 }
        );
      }
      conditions.push(eq(employees.id, user.employeeId));
    }

    if (search) {
      conditions.push(
        or(
          like(employees.firstName, `%${search}%`),
          like(employees.lastName, `%${search}%`),
          like(employees.email, `%${search}%`),
          like(employees.employeeCode, `%${search}%`)
        )
      );
    }

    if (department) {
      conditions.push(eq(employees.department, department));
    }

    if (employmentStatus) {
      conditions.push(eq(employees.employmentStatus, employmentStatus));
    }

    if (employmentType) {
      conditions.push(eq(employees.employmentType, employmentType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(employees.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ success: true, data: results }, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
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

    // Only admin and HR can create employees
    if (user.role !== 'admin' && user.role !== 'hr') {
      return NextResponse.json(
        { error: 'Forbidden - Only admin and HR can create employees', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'employeeCode',
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'gender',
      'maritalStatus',
      'address',
      'city',
      'state',
      'postalCode',
      'country',
      'department',
      'designation',
      'role',
      'employmentType',
      'employmentStatus',
      'dateOfJoining',
      'salary',
      'emergencyContactName',
      'emergencyContactPhone',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            error: `${field} is required`,
            code: 'MISSING_REQUIRED_FIELD',
          },
          { status: 400 }
        );
      }
    }

    // Check for duplicate employee code
    const existingEmployeeCode = await db
      .select()
      .from(employees)
      .where(eq(employees.employeeCode, body.employeeCode.trim()))
      .limit(1);

    if (existingEmployeeCode.length > 0) {
      return NextResponse.json(
        {
          error: 'Employee code already exists',
          code: 'DUPLICATE_EMPLOYEE_CODE',
        },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existingEmail = await db
      .select()
      .from(employees)
      .where(eq(employees.email, body.email.toLowerCase().trim()))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json(
        {
          error: 'Email already exists',
          code: 'DUPLICATE_EMAIL',
        },
        { status: 400 }
      );
    }

    // Validate managerId if provided
    if (body.managerId) {
      const manager = await db
        .select()
        .from(employees)
        .where(eq(employees.id, parseInt(body.managerId)))
        .limit(1);

      if (manager.length === 0) {
        return NextResponse.json(
          {
            error: 'Manager not found',
            code: 'MANAGER_NOT_FOUND',
          },
          { status: 400 }
        );
      }
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData = {
      employeeCode: body.employeeCode.trim(),
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone.trim(),
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      maritalStatus: body.maritalStatus,
      address: body.address.trim(),
      city: body.city.trim(),
      state: body.state.trim(),
      postalCode: body.postalCode.trim(),
      country: body.country.trim(),
      department: body.department,
      designation: body.designation.trim(),
      role: body.role,
      managerId: body.managerId ? parseInt(body.managerId) : null,
      employmentType: body.employmentType,
      employmentStatus: body.employmentStatus,
      dateOfJoining: body.dateOfJoining,
      dateOfLeaving: body.dateOfLeaving || null,
      salary: parseFloat(body.salary),
      bankAccountNumber: body.bankAccountNumber?.trim() || null,
      bankName: body.bankName?.trim() || null,
      emergencyContactName: body.emergencyContactName.trim(),
      emergencyContactPhone: body.emergencyContactPhone.trim(),
      avatarUrl: body.avatarUrl?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    const newEmployee = await db
      .insert(employees)
      .values(insertData)
      .returning();

    return NextResponse.json(newEmployee[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const targetEmployeeId = parseInt(id);

    // Check authorization
    if (!canAccessEmployeeData(user.role, user.employeeId, targetEmployeeId)) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own data', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Check if employee exists
    const existingEmployee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, targetEmployeeId))
      .limit(1);

    if (existingEmployee.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Regular employees can only update limited fields
    const allowedFields = user.role === 'admin' || user.role === 'hr' 
      ? Object.keys(body) 
      : ['phone', 'address', 'city', 'state', 'postalCode', 'emergencyContactName', 'emergencyContactPhone', 'avatarUrl'];

    // Check for duplicate employee code if provided
    if (body.employeeCode) {
      const duplicateCode = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.employeeCode, body.employeeCode.trim()),
            eq(employees.id, targetEmployeeId)
          )
        )
        .limit(1);

      if (duplicateCode.length === 0) {
        const existingCode = await db
          .select()
          .from(employees)
          .where(eq(employees.employeeCode, body.employeeCode.trim()))
          .limit(1);

        if (existingCode.length > 0) {
          return NextResponse.json(
            {
              error: 'Employee code already exists',
              code: 'DUPLICATE_EMPLOYEE_CODE',
            },
            { status: 400 }
          );
        }
      }
    }

    // Check for duplicate email if provided
    if (body.email) {
      const duplicateEmail = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.email, body.email.toLowerCase().trim()),
            eq(employees.id, targetEmployeeId)
          )
        )
        .limit(1);

      if (duplicateEmail.length === 0) {
        const existingEmail = await db
          .select()
          .from(employees)
          .where(eq(employees.email, body.email.toLowerCase().trim()))
          .limit(1);

        if (existingEmail.length > 0) {
          return NextResponse.json(
            {
              error: 'Email already exists',
              code: 'DUPLICATE_EMAIL',
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate managerId if provided
    if (body.managerId) {
      const manager = await db
        .select()
        .from(employees)
        .where(eq(employees.id, parseInt(body.managerId)))
        .limit(1);

      if (manager.length === 0) {
        return NextResponse.json(
          {
            error: 'Manager not found',
            code: 'MANAGER_NOT_FOUND',
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only include allowed fields
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        switch (field) {
          case 'employeeCode':
            updateData.employeeCode = body.employeeCode.trim();
            break;
          case 'firstName':
            updateData.firstName = body.firstName.trim();
            break;
          case 'lastName':
            updateData.lastName = body.lastName.trim();
            break;
          case 'email':
            updateData.email = body.email.toLowerCase().trim();
            break;
          case 'phone':
            updateData.phone = body.phone.trim();
            break;
          case 'address':
            updateData.address = body.address.trim();
            break;
          case 'city':
            updateData.city = body.city.trim();
            break;
          case 'state':
            updateData.state = body.state.trim();
            break;
          case 'postalCode':
            updateData.postalCode = body.postalCode.trim();
            break;
          case 'emergencyContactName':
            updateData.emergencyContactName = body.emergencyContactName.trim();
            break;
          case 'emergencyContactPhone':
            updateData.emergencyContactPhone = body.emergencyContactPhone.trim();
            break;
          case 'avatarUrl':
            updateData.avatarUrl = body.avatarUrl?.trim() || null;
            break;
        }
      }
    }

    const updatedEmployee = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, targetEmployeeId))
      .returning();

    return NextResponse.json(updatedEmployee[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
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

    // Only admin can delete employees
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only admin can delete employees', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if employee exists
    const existingEmployee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, parseInt(id)))
      .limit(1);

    if (existingEmployee.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deletedEmployee = await db
      .delete(employees)
      .where(eq(employees.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Employee deleted successfully',
        employee: deletedEmployee[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}