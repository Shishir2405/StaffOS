import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attendance, employees } from '@/db/schema';
import { eq, and, gte, lte, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate required parameters
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required', code: 'MISSING_EMPLOYEE_ID' },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required', code: 'MISSING_START_DATE' },
        { status: 400 }
      );
    }

    if (!endDate) {
      return NextResponse.json(
        { error: 'End date is required', code: 'MISSING_END_DATE' },
        { status: 400 }
      );
    }

    // Validate employee ID format
    const empId = parseInt(employeeId);
    if (isNaN(empId)) {
      return NextResponse.json(
        { error: 'Valid employee ID is required', code: 'INVALID_EMPLOYEE_ID' },
        { status: 400 }
      );
    }

    // Validate date formats (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
      return NextResponse.json(
        { error: 'Start date must be in YYYY-MM-DD format', code: 'INVALID_START_DATE_FORMAT' },
        { status: 400 }
      );
    }

    if (!dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'End date must be in YYYY-MM-DD format', code: 'INVALID_END_DATE_FORMAT' },
        { status: 400 }
      );
    }

    // Validate date range
    if (new Date(endDate) < new Date(startDate)) {
      return NextResponse.json(
        { error: 'End date cannot be before start date', code: 'INVALID_DATE_RANGE' },
        { status: 400 }
      );
    }

    // Authorization check
    const userRole = session.user.role;
    const userEmployeeId = session.user.employeeId;

    // Admin and HR can view all employees, regular users can only view their own data
    if (userRole !== 'admin' && userRole !== 'hr') {
      if (!userEmployeeId || userEmployeeId !== empId) {
        return NextResponse.json(
          { error: 'Forbidden - You can only view your own attendance data', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }

    // Fetch employee details
    const employeeRecord = await db
      .select()
      .from(employees)
      .where(eq(employees.id, empId))
      .limit(1);

    if (employeeRecord.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const employee = employeeRecord[0];
    const employeeName = `${employee.firstName} ${employee.lastName}`;

    // Fetch all attendance records for the employee within the date range
    const attendanceRecords = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeId, empId),
          gte(attendance.date, startDate),
          lte(attendance.date, endDate)
        )
      )
      .orderBy(asc(attendance.date), asc(attendance.checkInTime));

    // Group attendance records by date
    const attendanceByDate: Record<string, typeof attendanceRecords> = {};
    for (const record of attendanceRecords) {
      if (!attendanceByDate[record.date]) {
        attendanceByDate[record.date] = [];
      }
      attendanceByDate[record.date].push(record);
    }

    // Generate calendar for all dates in range
    const calendar = [];
    const currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    while (currentDate <= finalDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayRecords = attendanceByDate[dateStr] || [];

      // Calculate total working hours using check-in/check-out pairing logic
      let totalHours = 0;
      const checkIns: typeof attendanceRecords = [];
      const checkOuts: typeof attendanceRecords = [];

      // Separate check-ins and check-outs
      for (const record of dayRecords) {
        if (record.checkInTime) {
          checkIns.push(record);
        }
        if (record.checkOutTime) {
          checkOuts.push(record);
        }
      }

      // Pair check-ins with check-outs and calculate duration
      const pairs = Math.min(checkIns.length, checkOuts.length);
      for (let i = 0; i < pairs; i++) {
        const checkInRecord = checkIns[i];
        const checkOutRecord = checkOuts[i];

        if (checkInRecord.checkInTime && checkOutRecord.checkOutTime) {
          // Parse times in Indian timezone context
          const checkInDateTime = new Date(checkInRecord.checkInTime);
          const checkOutDateTime = new Date(checkOutRecord.checkOutTime);

          // Calculate duration in milliseconds and convert to hours
          const durationMs = checkOutDateTime.getTime() - checkInDateTime.getTime();
          const durationHours = durationMs / (1000 * 60 * 60);

          if (durationHours > 0) {
            totalHours += durationHours;
          }
        }
      }

      // Round to 2 decimal places
      totalHours = Math.round(totalHours * 100) / 100;

      // Determine status
      const status = totalHours > 0 ? 'present' : 'absent';

      calendar.push({
        date: dateStr,
        status,
        totalHours,
        checkInCount: checkIns.length,
        checkOutCount: checkOuts.length,
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Return response
    return NextResponse.json({
      employeeId: empId,
      employeeName,
      startDate,
      endDate,
      calendar,
    });
  } catch (error) {
    console.error('GET attendance calendar error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}