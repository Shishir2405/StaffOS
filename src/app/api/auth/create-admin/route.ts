import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { employees, user, account } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select()
      .from(user)
      .where(eq(user.email, 'admin@staffos.com'))
      .limit(1);

    if (existingAdmin.length > 0) {
      return NextResponse.json({ 
        error: 'Admin account already exists',
        code: 'ADMIN_EXISTS' 
      }, { status: 400 });
    }

    // Check if admin employee already exists
    const existingEmployee = await db.select()
      .from(employees)
      .where(eq(employees.email, 'admin@staffos.com'))
      .limit(1);

    if (existingEmployee.length > 0) {
      return NextResponse.json({ 
        error: 'Admin employee record already exists',
        code: 'ADMIN_EMPLOYEE_EXISTS' 
      }, { status: 400 });
    }

    const currentDate = new Date().toISOString();

    // Step 1: Create employee record
    const newEmployee = await db.insert(employees).values({
      employeeCode: 'ADMIN-001',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@staffos.com',
      phone: '(000) 000-0000',
      dateOfBirth: '1990-01-01',
      gender: 'Other',
      maritalStatus: 'Single',
      address: 'System Generated',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'United States',
      department: 'HR',
      designation: 'System Administrator',
      role: 'System Administrator',
      managerId: null,
      employmentType: 'Full-time',
      employmentStatus: 'Active',
      dateOfJoining: currentDate.split('T')[0],
      dateOfLeaving: null,
      salary: 0,
      bankAccountNumber: null,
      bankName: null,
      emergencyContactName: 'System',
      emergencyContactPhone: '(000) 000-0000',
      avatarUrl: null,
      createdAt: currentDate,
      updatedAt: currentDate,
    }).returning();

    if (!newEmployee || newEmployee.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to create employee record',
        code: 'EMPLOYEE_CREATION_FAILED' 
      }, { status: 500 });
    }

    const employeeId = newEmployee[0].id;

    // Step 2: Create user account using Better Auth
    let createdUser;
    try {
      const signUpResult = await auth.api.signUpEmail({
        body: {
          email: 'admin@staffos.com',
          password: 'Admin@123',
          name: 'System Administrator',
        },
      });

      if (!signUpResult || !signUpResult.user) {
        throw new Error('Better Auth sign up failed');
      }

      createdUser = signUpResult.user;
    } catch (authError) {
      // Rollback: Delete the created employee record
      await db.delete(employees)
        .where(eq(employees.id, employeeId));

      console.error('Better Auth sign up error:', authError);
      return NextResponse.json({ 
        error: 'Failed to create user account: ' + authError,
        code: 'USER_CREATION_FAILED' 
      }, { status: 500 });
    }

    // Step 3: Update user record to set role and employeeId
    try {
      const updatedUser = await db.update(user)
        .set({
          role: 'admin',
          employeeId: employeeId,
          updatedAt: new Date(),
        })
        .where(eq(user.id, createdUser.id))
        .returning();

      if (!updatedUser || updatedUser.length === 0) {
        throw new Error('Failed to update user role and employee link');
      }
    } catch (updateError) {
      // Rollback: Delete both employee and user records
      await db.delete(employees)
        .where(eq(employees.id, employeeId));
      await db.delete(user)
        .where(eq(user.id, createdUser.id));
      await db.delete(account)
        .where(eq(account.userId, createdUser.id));

      console.error('User update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update user account: ' + updateError,
        code: 'USER_UPDATE_FAILED' 
      }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      message: 'Admin account created successfully',
      adminEmail: 'admin@staffos.com',
      defaultPassword: 'Admin@123',
      employeeId: employeeId,
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}