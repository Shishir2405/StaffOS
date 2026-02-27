import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attendance, employees } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

    const { user } = session;
    const searchParams = request.nextUrl.searchParams;
    const employeeIdParam = searchParams.get('employeeId');
    const dateParam = searchParams.get('date');

    // Validate required parameters
    if (!employeeIdParam) {
      return NextResponse.json(
        { error: 'employeeId is required', code: 'MISSING_EMPLOYEE_ID' },
        { status: 400 }
      );
    }

    if (!dateParam) {
      return NextResponse.json(
        { error: 'date is required (YYYY-MM-DD format)', code: 'MISSING_DATE' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateParam)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD', code: 'INVALID_DATE_FORMAT' },
        { status: 400 }
      );
    }

    const requestedEmployeeId = parseInt(employeeIdParam);
    if (isNaN(requestedEmployeeId)) {
      return NextResponse.json(
        { error: 'Invalid employeeId. Must be a number', code: 'INVALID_EMPLOYEE_ID' },
        { status: 400 }
      );
    }

    // Authorization check
    const isAdminOrHR = user.role === 'admin' || user.role === 'hr';
    const isOwnData = user.employeeId === requestedEmployeeId;

    if (!isAdminOrHR && !isOwnData) {
      return NextResponse.json(
        { error: 'Forbidden. You can only view your own attendance data', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Fetch employee details
    const employeeRecord = await db
      .select()
      .from(employees)
      .where(eq(employees.id, requestedEmployeeId))
      .limit(1);

    if (employeeRecord.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const employee = employeeRecord[0];

    // Fetch all attendance records for the specified date and employee
    const attendanceRecords = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeId, requestedEmployeeId),
          eq(attendance.date, dateParam)
        )
      )
      .orderBy(attendance.checkInTime);

    // Process records to pair check-ins with check-outs
    const checkInOutPairs: Array<{
      checkInTime: string | null;
      checkOutTime: string | null;
      duration: number;
    }> = [];
    
    let totalWorkingHours = 0;

    // Helper function to parse time in Indian timezone and calculate duration
    const calculateDuration = (checkIn: string | null, checkOut: string | null): number => {
      if (!checkIn || !checkOut) return 0;
      
      try {
        // Parse ISO timestamps
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        // Calculate difference in milliseconds
        const diffMs = checkOutDate.getTime() - checkInDate.getTime();
        
        // Convert to hours with 2 decimal precision
        const hours = diffMs / (1000 * 60 * 60);
        return Math.max(0, parseFloat(hours.toFixed(2)));
      } catch (error) {
        console.error('Error calculating duration:', error);
        return 0;
      }
    };

    // Sort records by checkInTime and pair check_in with next check_out
    const sortedRecords = attendanceRecords
      .filter(record => record.checkInTime)
      .sort((a, b) => {
        if (!a.checkInTime || !b.checkInTime) return 0;
        return new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
      });

    // Pair check-ins with check-outs
    for (let i = 0; i < sortedRecords.length; i++) {
      const record = sortedRecords[i];
      
      if (record.checkInTime) {
        // Find the next check-out
        let checkOutTime = record.checkOutTime;
        
        // If current record doesn't have checkout, look for next record's checkout
        if (!checkOutTime && i + 1 < sortedRecords.length) {
          checkOutTime = sortedRecords[i + 1].checkOutTime;
        }
        
        const duration = calculateDuration(record.checkInTime, checkOutTime);
        
        checkInOutPairs.push({
          checkInTime: record.checkInTime,
          checkOutTime: checkOutTime,
          duration: duration
        });
        
        totalWorkingHours += duration;
      }
    }

    // Round total working hours to 2 decimal places
    totalWorkingHours = parseFloat(totalWorkingHours.toFixed(2));

    // Determine status
    const status = totalWorkingHours > 0 ? 'Present' : 'Absent';

    // Build response
    const response = {
      employeeId: requestedEmployeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      date: dateParam,
      checkInOut: checkInOutPairs,
      totalWorkingHours: totalWorkingHours,
      status: status
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET attendance summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}