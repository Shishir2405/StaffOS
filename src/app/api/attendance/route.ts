import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attendance, employees, geofences } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session?.user) {
    return { error: { message: 'Unauthorized - Please login', status: 401 } };
  }
  
  return { user: session.user };
}

// Helper function to check if user can access attendance data
function canAccessAttendanceData(userRole: string, userEmployeeId: number | null, targetEmployeeId: number) {
  // Admin and HR can access all attendance data
  if (userRole === 'admin' || userRole === 'hr') {
    return true;
  }
  
  // Regular users can only access their own attendance
  return userEmployeeId === targetEmployeeId;
}

// Helper function to convert to Indian timezone
function toIndianTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

// Helper function to get current date in Indian timezone (YYYY-MM-DD)
function getCurrentIndianDate(): string {
  const date = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
}

// Helper function to get current timestamp in Indian timezone
function getCurrentIndianTimestamp(): string {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`;
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
    const employeeId = searchParams.get('employeeId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const checkType = searchParams.get('checkType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select({
        id: attendance.id,
        employeeId: attendance.employeeId,
        date: attendance.date,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        checkInGeofenceId: attendance.checkInGeofenceId,
        checkOutGeofenceId: attendance.checkOutGeofenceId,
        checkInLatitude: attendance.checkInLatitude,
        checkInLongitude: attendance.checkInLongitude,
        checkOutLatitude: attendance.checkOutLatitude,
        checkOutLongitude: attendance.checkOutLongitude,
        status: attendance.status,
        workingHours: attendance.workingHours,
        isAutoCheckIn: attendance.isAutoCheckIn,
        isAutoCheckOut: attendance.isAutoCheckOut,
        checkType: attendance.checkType,
        notes: attendance.notes,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
        employeeName: employees.firstName,
        employeeLastName: employees.lastName,
        employeeCode: employees.employeeCode
      })
      .from(attendance)
      .leftJoin(employees, eq(attendance.employeeId, employees.id))
      .where(eq(attendance.id, parseInt(id)))
      .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'Attendance record not found',
          code: 'ATTENDANCE_NOT_FOUND' 
        }, { status: 404 });
      }

      // Check authorization
      if (!canAccessAttendanceData(user.role, user.employeeId, record[0].employeeId)) {
        return NextResponse.json(
          { error: 'Forbidden - You can only access your own attendance', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      const formattedRecord = {
        ...record[0],
        employeeName: `${record[0].employeeName} ${record[0].employeeLastName}`,
        employeeLastName: undefined
      };
      delete formattedRecord.employeeLastName;

      return NextResponse.json({ success: true, data: formattedRecord }, { status: 200 });
    }

    let query = db.select().from(attendance);
    const conditions = [];

    // Role-based filtering: Regular users can only see their own attendance
    if (user.role !== 'admin' && user.role !== 'hr') {
      if (!user.employeeId) {
        return NextResponse.json(
          { error: 'No employee record linked to your account', code: 'NO_EMPLOYEE_LINK' },
          { status: 400 }
        );
      }
      conditions.push(eq(attendance.employeeId, user.employeeId));
    } else if (employeeId) {
      // Admin/HR can filter by specific employee
      if (isNaN(parseInt(employeeId))) {
        return NextResponse.json({ 
          error: "Valid employee ID is required",
          code: "INVALID_EMPLOYEE_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(attendance.employeeId, parseInt(employeeId)));
    }

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ 
          error: "Invalid date format. Expected YYYY-MM-DD",
          code: "INVALID_DATE" 
        }, { status: 400 });
      }
      conditions.push(eq(attendance.date, date));
    }

    if (startDate && endDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return NextResponse.json({ 
          error: "Invalid date format. Expected YYYY-MM-DD",
          code: "INVALID_DATE" 
        }, { status: 400 });
      }
      conditions.push(gte(attendance.date, startDate));
      conditions.push(lte(attendance.date, endDate));
    }

    if (status) {
      conditions.push(eq(attendance.status, status));
    }

    if (checkType) {
      if (checkType !== 'check_in' && checkType !== 'check_out') {
        return NextResponse.json({ 
          error: "Invalid checkType. Must be 'check_in' or 'check_out'",
          code: "INVALID_CHECK_TYPE" 
        }, { status: 400 });
      }
      conditions.push(eq(attendance.checkType, checkType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(attendance.date), desc(attendance.checkInTime))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ success: true, data: results }, { status: 200 });
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
    const body = await request.json();
    const { 
      employeeId, 
      date, 
      checkInTime, 
      checkInGeofenceId, 
      checkInLatitude, 
      checkInLongitude, 
      isAutoCheckIn, 
      status, 
      checkType,
      notes 
    } = body;

    if (!employeeId) {
      return NextResponse.json({ 
        error: "Employee ID is required",
        code: "MISSING_FIELD" 
      }, { status: 400 });
    }

    // Check authorization - users can only create their own attendance
    if (user.role !== 'admin' && user.role !== 'hr') {
      if (!user.employeeId || user.employeeId !== employeeId) {
        return NextResponse.json(
          { error: 'Forbidden - You can only create your own attendance', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }

    // Validate checkType
    const finalCheckType = checkType || 'check_in';
    if (finalCheckType !== 'check_in' && finalCheckType !== 'check_out') {
      return NextResponse.json({ 
        error: "checkType must be 'check_in' or 'check_out'",
        code: "INVALID_CHECK_TYPE" 
      }, { status: 400 });
    }

    // Use provided date or get current Indian date
    const finalDate = date || getCurrentIndianDate();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(finalDate)) {
      return NextResponse.json({ 
        error: "Invalid date format. Expected YYYY-MM-DD",
        code: "INVALID_DATE" 
      }, { status: 400 });
    }

    const employeeExists = await db.select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (employeeExists.length === 0) {
      return NextResponse.json({ 
        error: "Employee not found",
        code: "EMPLOYEE_NOT_FOUND" 
      }, { status: 404 });
    }

    if (checkInGeofenceId) {
      const geofenceExists = await db.select()
        .from(geofences)
        .where(eq(geofences.id, checkInGeofenceId))
        .limit(1);

      if (geofenceExists.length === 0) {
        return NextResponse.json({ 
          error: "Check-in geofence not found",
          code: "GEOFENCE_NOT_FOUND" 
        }, { status: 404 });
      }
    }

    const now = getCurrentIndianTimestamp();
    const insertData = {
      employeeId,
      date: finalDate,
      checkInTime: checkInTime || now,
      checkInGeofenceId: checkInGeofenceId || null,
      checkInLatitude: checkInLatitude || null,
      checkInLongitude: checkInLongitude || null,
      status: status || 'Present',
      checkType: finalCheckType,
      isAutoCheckIn: isAutoCheckIn !== undefined ? isAutoCheckIn : false,
      notes: notes || null,
      createdAt: now,
      updatedAt: now
    };

    const newRecord = await db.insert(attendance)
      .values(insertData)
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existingRecord = await db.select()
      .from(attendance)
      .where(eq(attendance.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Attendance record not found',
        code: 'ATTENDANCE_NOT_FOUND' 
      }, { status: 404 });
    }

    // Check authorization
    if (!canAccessAttendanceData(user.role, user.employeeId, existingRecord[0].employeeId)) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own attendance', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      checkOutTime, 
      checkOutGeofenceId, 
      checkOutLatitude, 
      checkOutLongitude, 
      isAutoCheckOut, 
      status, 
      checkType,
      notes 
    } = body;

    if (checkOutGeofenceId) {
      const geofenceExists = await db.select()
        .from(geofences)
        .where(eq(geofences.id, checkOutGeofenceId))
        .limit(1);

      if (geofenceExists.length === 0) {
        return NextResponse.json({ 
          error: "Check-out geofence not found",
          code: "GEOFENCE_NOT_FOUND" 
        }, { status: 404 });
      }
    }

    let workingHours = existingRecord[0].workingHours;

    if (checkOutTime && existingRecord[0].checkInTime) {
      const checkInDate = new Date(existingRecord[0].checkInTime);
      const checkOutDate = new Date(checkOutTime);

      if (checkOutDate < checkInDate) {
        return NextResponse.json({ 
          error: "Check-out time cannot be before check-in time",
          code: "INVALID_CHECKOUT_TIME" 
        }, { status: 400 });
      }

      const diffMs = checkOutDate.getTime() - checkInDate.getTime();
      workingHours = Math.round((diffMs / 1000 / 60 / 60) * 100) / 100;
    }

    const updates: any = {
      updatedAt: getCurrentIndianTimestamp()
    };

    if (checkOutTime !== undefined) updates.checkOutTime = checkOutTime;
    if (checkOutGeofenceId !== undefined) updates.checkOutGeofenceId = checkOutGeofenceId;
    if (checkOutLatitude !== undefined) updates.checkOutLatitude = checkOutLatitude;
    if (checkOutLongitude !== undefined) updates.checkOutLongitude = checkOutLongitude;
    if (isAutoCheckOut !== undefined) updates.isAutoCheckOut = isAutoCheckOut;
    if (status !== undefined) updates.status = status;
    if (checkType !== undefined) {
      if (checkType !== 'check_in' && checkType !== 'check_out') {
        return NextResponse.json({ 
          error: "checkType must be 'check_in' or 'check_out'",
          code: "INVALID_CHECK_TYPE" 
        }, { status: 400 });
      }
      updates.checkType = checkType;
    }
    if (notes !== undefined) updates.notes = notes;
    if (workingHours !== null && workingHours !== existingRecord[0].workingHours) {
      updates.workingHours = workingHours;
    }

    const updated = await db.update(attendance)
      .set(updates)
      .where(eq(attendance.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}