import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attendance, employees } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    // Validate required date parameters - check both null and undefined
    if (!startDate || !endDate || startDate === '' || endDate === '') {
      return NextResponse.json({
        error: 'Start date and end date are required in YYYY-MM-DD format',
        code: 'MISSING_DATE_RANGE'
      }, { status: 400 });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json({
        error: 'Invalid date format. Dates must be in YYYY-MM-DD format',
        code: 'INVALID_DATE_FORMAT'
      }, { status: 400 });
    }

    // Build conditions for query
    const conditions = [
      gte(attendance.date, startDate),
      lte(attendance.date, endDate)
    ];

    if (employeeId) {
      const empId = parseInt(employeeId);
      if (!isNaN(empId)) {
        conditions.push(eq(attendance.employeeId, empId));
      }
    }

    if (status) {
      conditions.push(eq(attendance.status, status));
    }

    // Fetch all attendance records with employee details
    const records = await db
      .select({
        attendanceId: attendance.id,
        employeeId: attendance.employeeId,
        date: attendance.date,
        status: attendance.status,
        workingHours: attendance.workingHours,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        employeeCode: employees.employeeCode,
        firstName: employees.firstName,
        lastName: employees.lastName,
        department: employees.department,
      })
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .where(and(...conditions));

    // Calculate overall summary
    const totalRecords = records.length;
    const totalPresent = records.filter(r => r.status === 'Present').length;
    const totalAbsent = records.filter(r => r.status === 'Absent').length;
    const totalLate = records.filter(r => r.status === 'Late').length;
    const totalHalfDay = records.filter(r => r.status === 'Half Day').length;
    const totalOnLeave = records.filter(r => r.status === 'On Leave').length;

    const workingHoursRecords = records.filter(r => r.workingHours !== null && r.workingHours !== undefined);
    const totalWorkingHours = workingHoursRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0);
    const averageWorkingHours = workingHoursRecords.length > 0 
      ? totalWorkingHours / workingHoursRecords.length 
      : 0;

    // Daily breakdown
    const dailyMap = new Map<string, {
      date: string;
      present: number;
      absent: number;
      late: number;
      halfDay: number;
      onLeave: number;
    }>();

    records.forEach(record => {
      if (!dailyMap.has(record.date)) {
        dailyMap.set(record.date, {
          date: record.date,
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          onLeave: 0
        });
      }

      const daily = dailyMap.get(record.date)!;
      switch (record.status) {
        case 'Present':
          daily.present++;
          break;
        case 'Absent':
          daily.absent++;
          break;
        case 'Late':
          daily.late++;
          break;
        case 'Half Day':
          daily.halfDay++;
          break;
        case 'On Leave':
          daily.onLeave++;
          break;
      }
    });

    const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    // Employee statistics
    const employeeMap = new Map<number, {
      employeeId: number;
      employeeCode: string;
      fullName: string;
      department: string;
      presentDays: number;
      absentDays: number;
      lateDays: number;
      totalWorkingHours: number;
      workingHoursCount: number;
    }>();

    records.forEach(record => {
      if (!employeeMap.has(record.employeeId)) {
        employeeMap.set(record.employeeId, {
          employeeId: record.employeeId,
          employeeCode: record.employeeCode,
          fullName: `${record.firstName} ${record.lastName}`,
          department: record.department,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          totalWorkingHours: 0,
          workingHoursCount: 0
        });
      }

      const empStat = employeeMap.get(record.employeeId)!;
      
      if (record.status === 'Present') {
        empStat.presentDays++;
      } else if (record.status === 'Absent') {
        empStat.absentDays++;
      } else if (record.status === 'Late') {
        empStat.lateDays++;
      }

      if (record.workingHours !== null && record.workingHours !== undefined) {
        empStat.totalWorkingHours += record.workingHours;
        empStat.workingHoursCount++;
      }
    });

    const employeeStats = Array.from(employeeMap.values())
      .map(emp => ({
        employeeId: emp.employeeId,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        department: emp.department,
        presentDays: emp.presentDays,
        absentDays: emp.absentDays,
        lateDays: emp.lateDays,
        totalWorkingHours: parseFloat(emp.totalWorkingHours.toFixed(2)),
        averageWorkingHours: emp.workingHoursCount > 0 
          ? parseFloat((emp.totalWorkingHours / emp.workingHoursCount).toFixed(2))
          : 0
      }))
      .sort((a, b) => b.presentDays - a.presentDays);

    return NextResponse.json({
      summary: {
        totalRecords,
        totalPresent,
        totalAbsent,
        totalLate,
        totalHalfDay,
        totalOnLeave,
        averageWorkingHours: parseFloat(averageWorkingHours.toFixed(2)),
        totalWorkingHours: parseFloat(totalWorkingHours.toFixed(2))
      },
      dailyBreakdown,
      employeeStats
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}