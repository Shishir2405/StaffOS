import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { salaryComponents, employees } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, periodStart, periodEnd, attendanceDays } = body;

    // Validate required fields
    if (!employeeId) {
      return NextResponse.json({
        error: 'Employee ID is required',
        code: 'MISSING_EMPLOYEE_ID'
      }, { status: 400 });
    }

    if (!periodStart) {
      return NextResponse.json({
        error: 'Period start date is required',
        code: 'MISSING_PERIOD_START'
      }, { status: 400 });
    }

    if (!periodEnd) {
      return NextResponse.json({
        error: 'Period end date is required',
        code: 'MISSING_PERIOD_END'
      }, { status: 400 });
    }

    // Validate date formats (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(periodStart)) {
      return NextResponse.json({
        error: 'Period start must be in YYYY-MM-DD format',
        code: 'INVALID_PERIOD_START_FORMAT'
      }, { status: 400 });
    }

    if (!dateRegex.test(periodEnd)) {
      return NextResponse.json({
        error: 'Period end must be in YYYY-MM-DD format',
        code: 'INVALID_PERIOD_END_FORMAT'
      }, { status: 400 });
    }

    // Validate dates are valid
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (isNaN(startDate.getTime())) {
      return NextResponse.json({
        error: 'Invalid period start date',
        code: 'INVALID_PERIOD_START'
      }, { status: 400 });
    }

    if (isNaN(endDate.getTime())) {
      return NextResponse.json({
        error: 'Invalid period end date',
        code: 'INVALID_PERIOD_END'
      }, { status: 400 });
    }

    // Validate periodEnd >= periodStart
    if (endDate < startDate) {
      return NextResponse.json({
        error: 'Period end must be greater than or equal to period start',
        code: 'INVALID_DATE_RANGE'
      }, { status: 400 });
    }

    // Validate employee exists
    const employee = await db.select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (employee.length === 0) {
      return NextResponse.json({
        error: 'Employee not found',
        code: 'EMPLOYEE_NOT_FOUND'
      }, { status: 404 });
    }

    const employeeData = employee[0];

    // Fetch all salary components for the employee
    const components = await db.select()
      .from(salaryComponents)
      .where(eq(salaryComponents.employeeId, employeeId));

    if (components.length === 0) {
      return NextResponse.json({
        error: 'No salary components found for this employee',
        code: 'NO_SALARY_COMPONENTS'
      }, { status: 404 });
    }

    // Validate employee has at least one basic salary component
    const basicComponent = components.find(c => c.componentType === 'basic');
    if (!basicComponent) {
      return NextResponse.json({
        error: 'Employee must have at least one basic salary component',
        code: 'NO_BASIC_COMPONENT'
      }, { status: 400 });
    }

    // Calculate working days in the period (26 working days per month)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const workingDays = Math.min(26, daysDiff);

    // Determine attendance days
    let finalAttendanceDays = attendanceDays !== undefined ? attendanceDays : workingDays;

    // Validate attendance days
    if (finalAttendanceDays <= 0) {
      return NextResponse.json({
        error: 'Attendance days must be greater than 0',
        code: 'INVALID_ATTENDANCE_DAYS'
      }, { status: 400 });
    }

    if (finalAttendanceDays > workingDays) {
      return NextResponse.json({
        error: 'Attendance days cannot exceed working days',
        code: 'ATTENDANCE_EXCEEDS_WORKING_DAYS'
      }, { status: 400 });
    }

    // Calculate pro-rata factor
    const proRataFactor = finalAttendanceDays / workingDays;

    // Process basic salary
    const basicSalaryAmount = basicComponent.amount * proRataFactor;

    // Process allowances
    const allowanceComponents = components.filter(c => c.componentType === 'allowance');
    const allowances = allowanceComponents.map(component => {
      let amount: number;
      if (component.isPercentage) {
        // Calculate as percentage of basic salary
        amount = (basicSalaryAmount * component.amount) / 100;
      } else {
        // Use fixed amount
        amount = component.amount * proRataFactor;
      }

      return {
        name: component.componentName,
        amount: Math.round(amount * 100) / 100,
        isPercentage: component.isPercentage
      };
    });

    const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);

    // Calculate gross salary
    const grossSalary = basicSalaryAmount + totalAllowances;

    // Process deductions
    const deductionComponents = components.filter(c => c.componentType === 'deduction');
    const deductions = deductionComponents.map(component => {
      let amount: number;
      if (component.isPercentage) {
        // Calculate as percentage of gross salary
        amount = (grossSalary * component.amount) / 100;
      } else {
        // Use fixed amount
        amount = component.amount;
      }

      return {
        name: component.componentName,
        amount: Math.round(amount * 100) / 100,
        isStatutory: component.isStatutory
      };
    });

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    // Extract specific statutory deductions
    const pfAmount = deductions
      .filter(d => d.name.toLowerCase().includes('pf') || d.name.toLowerCase().includes('provident'))
      .reduce((sum, d) => sum + d.amount, 0);

    const esiAmount = deductions
      .filter(d => d.name.toLowerCase().includes('esi'))
      .reduce((sum, d) => sum + d.amount, 0);

    const tdsAmount = deductions
      .filter(d => d.name.toLowerCase().includes('tds'))
      .reduce((sum, d) => sum + d.amount, 0);

    // Calculate net salary
    const netSalary = grossSalary - totalDeductions;

    // Prepare response
    const response = {
      employeeId: employeeData.id,
      employeeName: `${employeeData.firstName} ${employeeData.lastName}`,
      department: employeeData.department,
      designation: employeeData.designation,
      periodStart,
      periodEnd,
      workingDays,
      attendanceDays: finalAttendanceDays,
      basicSalary: Math.round(basicSalaryAmount * 100) / 100,
      allowances,
      deductions,
      totalAllowances: Math.round(totalAllowances * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      grossSalary: Math.round(grossSalary * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100,
      pfAmount: Math.round(pfAmount * 100) / 100,
      esiAmount: Math.round(esiAmount * 100) / 100,
      tdsAmount: Math.round(tdsAmount * 100) / 100
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}