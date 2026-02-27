import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, employees } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const statusFilter = searchParams.get('status');

    let query = db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        firstName: employees.firstName,
        lastName: employees.lastName,
        employeeCode: employees.employeeCode,
        department: employees.department,
        designation: employees.designation,
        employmentStatus: employees.employmentStatus,
      })
      .from(user)
      .leftJoin(employees, eq(user.employeeId, employees.id));

    const conditions = [];

    if (roleFilter) {
      conditions.push(eq(user.role, roleFilter));
    }

    if (statusFilter) {
      if (statusFilter === 'active') {
        conditions.push(eq(employees.employmentStatus, 'Active'));
      } else if (statusFilter === 'inactive') {
        conditions.push(eq(employees.employmentStatus, 'Inactive'));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const users = await query.orderBy(desc(user.createdAt));

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, role, employeeId } = body;

    if (!email || !password || !name || !role || !employeeId) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, password, name, role, employeeId',
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    const validRoles = ['admin', 'hr', 'manager', 'employee'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be one of: admin, hr, manager, employee',
        code: 'INVALID_ROLE' 
      }, { status: 400 });
    }

    const employeeExists = await db.select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (employeeExists.length === 0) {
      return NextResponse.json({ 
        error: 'Employee not found',
        code: 'EMPLOYEE_NOT_FOUND' 
      }, { status: 404 });
    }

    const existingEmail = await db.select()
      .from(user)
      .where(eq(user.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json({ 
        error: 'Email already exists',
        code: 'DUPLICATE_EMAIL' 
      }, { status: 400 });
    }

    const existingEmployeeLink = await db.select()
      .from(user)
      .where(eq(user.employeeId, employeeId))
      .limit(1);

    if (existingEmployeeLink.length > 0) {
      return NextResponse.json({ 
        error: 'Employee is already linked to another user account',
        code: 'EMPLOYEE_ALREADY_LINKED' 
      }, { status: 400 });
    }

    const signUpResponse = await auth.api.signUpEmail({
      body: {
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
      },
    });

    if (!signUpResponse || !signUpResponse.user) {
      return NextResponse.json({ 
        error: 'Failed to create user account',
        code: 'USER_CREATION_FAILED' 
      }, { status: 500 });
    }

    const updatedUser = await db.update(user)
      .set({
        role,
        employeeId,
        updatedAt: new Date(),
      })
      .where(eq(user.id, signUpResponse.user.id))
      .returning();

    const userWithEmployee = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        firstName: employees.firstName,
        lastName: employees.lastName,
        employeeCode: employees.employeeCode,
        department: employees.department,
        designation: employees.designation,
        employmentStatus: employees.employmentStatus,
      })
      .from(user)
      .leftJoin(employees, eq(user.employeeId, employees.id))
      .where(eq(user.id, signUpResponse.user.id))
      .limit(1);

    return NextResponse.json(userWithEmployee[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'User ID is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { role, employeeId } = body;

    if (!role) {
      return NextResponse.json({ 
        error: 'Role is required',
        code: 'MISSING_ROLE' 
      }, { status: 400 });
    }

    const validRoles = ['admin', 'hr', 'manager', 'employee'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be one of: admin, hr, manager, employee',
        code: 'INVALID_ROLE' 
      }, { status: 400 });
    }

    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    const updateData: any = {
      role,
      updatedAt: new Date(),
    };

    if (employeeId !== undefined) {
      if (employeeId !== null) {
        const employeeExists = await db.select()
          .from(employees)
          .where(eq(employees.id, employeeId))
          .limit(1);

        if (employeeExists.length === 0) {
          return NextResponse.json({ 
            error: 'Employee not found',
            code: 'EMPLOYEE_NOT_FOUND' 
          }, { status: 404 });
        }

        const existingEmployeeLink = await db.select()
          .from(user)
          .where(and(
            eq(user.employeeId, employeeId),
            eq(user.id, id)
          ))
          .limit(1);

        if (existingEmployeeLink.length === 0) {
          const otherUserWithEmployee = await db.select()
            .from(user)
            .where(eq(user.employeeId, employeeId))
            .limit(1);

          if (otherUserWithEmployee.length > 0) {
            return NextResponse.json({ 
              error: 'Employee is already linked to another user account',
              code: 'EMPLOYEE_ALREADY_LINKED' 
            }, { status: 400 });
          }
        }
      }

      updateData.employeeId = employeeId;
    }

    const updatedUser = await db.update(user)
      .set(updateData)
      .where(eq(user.id, id))
      .returning();

    const userWithEmployee = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        firstName: employees.firstName,
        lastName: employees.lastName,
        employeeCode: employees.employeeCode,
        department: employees.department,
        designation: employees.designation,
        employmentStatus: employees.employmentStatus,
      })
      .from(user)
      .leftJoin(employees, eq(user.employeeId, employees.id))
      .where(eq(user.id, id))
      .limit(1);

    return NextResponse.json(userWithEmployee[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'User ID is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    const userRecord = existingUser[0];

    await db.update(user)
      .set({
        emailVerified: false,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id));

    if (userRecord.employeeId) {
      await db.update(employees)
        .set({
          employmentStatus: 'Inactive',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(employees.id, userRecord.employeeId));
    }

    const deactivatedUser = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        firstName: employees.firstName,
        lastName: employees.lastName,
        employeeCode: employees.employeeCode,
        department: employees.department,
        designation: employees.designation,
        employmentStatus: employees.employmentStatus,
      })
      .from(user)
      .leftJoin(employees, eq(user.employeeId, employees.id))
      .where(eq(user.id, id))
      .limit(1);

    return NextResponse.json({
      message: 'User account deactivated successfully',
      user: deactivatedUser[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}