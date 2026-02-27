import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payrollRuns, payslips, employees, salaryComponents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface AttendanceData {
  [employeeId: string]: number;
}

interface RequestBody {
  payrollRunId: number;
  attendanceData?: AttendanceData;
}

interface SalaryComponent {
  id: number;
  employeeId: number;
  componentType: string;
  componentName: string;
  amount: number;
  isPercentage: boolean;
  isStatutory: boolean;
  createdAt: string;
}

interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  department: string;
  designation: string;
  role: string;
  managerId: number | null;
  employmentType: string;
  employmentStatus: string;
  dateOfJoining: string;
  dateOfLeaving: string | null;
  salary: number;
  bankAccountNumber: string | null;
  bankName: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PayslipData {
  id: number;
  employeeId: number;
  employeeName: string;
  netSalary: number;
  status: string;
  basicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  grossSalary: number;
  pfAmount: number;
  esiAmount: number;
  tdsAmount: number;
}

interface FailedEmployee {
  employeeId: number;
  employeeName: string;
  error: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { payrollRunId, attendanceData } = body;

    // Validation: payrollRunId is required
    if (!payrollRunId) {
      return NextResponse.json({ 
        error: "Payroll run ID is required",
        code: "MISSING_PAYROLL_RUN_ID" 
      }, { status: 400 });
    }

    // Validate payrollRunId is a valid number
    if (isNaN(payrollRunId)) {
      return NextResponse.json({ 
        error: "Invalid payroll run ID",
        code: "INVALID_PAYROLL_RUN_ID" 
      }, { status: 400 });
    }

    // Validate attendance data if provided
    if (attendanceData) {
      for (const [employeeId, days] of Object.entries(attendanceData)) {
        if (isNaN(parseInt(employeeId))) {
          return NextResponse.json({ 
            error: `Invalid employee ID: ${employeeId}`,
            code: "INVALID_EMPLOYEE_ID" 
          }, { status: 400 });
        }
        if (typeof days !== 'number' || days < 0 || days > 31) {
          return NextResponse.json({ 
            error: `Attendance days must be between 0 and 31 for employee ${employeeId}`,
            code: "INVALID_ATTENDANCE_DAYS" 
          }, { status: 400 });
        }
      }
    }

    // Fetch payroll run
    const payrollRunResult = await db.select()
      .from(payrollRuns)
      .where(eq(payrollRuns.id, payrollRunId))
      .limit(1);

    if (payrollRunResult.length === 0) {
      return NextResponse.json({ 
        error: "Payroll run not found",
        code: "PAYROLL_RUN_NOT_FOUND" 
      }, { status: 404 });
    }

    const payrollRun = payrollRunResult[0];

    // Check payroll run status
    if (payrollRun.status !== 'draft' && payrollRun.status !== 'processing') {
      return NextResponse.json({ 
        error: `Payroll run cannot be processed. Current status: ${payrollRun.status}`,
        code: "INVALID_PAYROLL_STATUS" 
      }, { status: 400 });
    }

    // Update payroll run status to processing
    await db.update(payrollRuns)
      .set({ 
        status: 'processing',
      })
      .where(eq(payrollRuns.id, payrollRunId));

    try {
      // Fetch all active employees
      const activeEmployees = await db.select()
        .from(employees)
        .where(eq(employees.employmentStatus, 'Active'));

      if (activeEmployees.length === 0) {
        await db.update(payrollRuns)
          .set({ 
            status: 'draft',
          })
          .where(eq(payrollRuns.id, payrollRunId));

        return NextResponse.json({ 
          error: "No active employees found to process payroll",
          code: "NO_ACTIVE_EMPLOYEES" 
        }, { status: 400 });
      }

      const generatedPayslips: PayslipData[] = [];
      const failedEmployees: FailedEmployee[] = [];
      let totalNetAmount = 0;

      // Process each employee
      for (const employee of activeEmployees) {
        try {
          // Get attendance days from attendanceData or default to 26
          const attendanceDays = attendanceData?.[employee.id.toString()] ?? 26;
          const workingDays = 26;

          // Fetch salary components for the employee
          const components = await db.select()
            .from(salaryComponents)
            .where(eq(salaryComponents.employeeId, employee.id));

          // Calculate salary
          const basicSalary = employee.salary;
          const dailyRate = basicSalary / workingDays;
          const proRatedBasicSalary = dailyRate * attendanceDays;

          let totalAllowances = 0;
          let totalDeductions = 0;
          let pfAmount = 0;
          let esiAmount = 0;
          let tdsAmount = 0;

          // Process allowances and deductions
          for (const component of components) {
            let componentAmount = component.amount;

            // If percentage, calculate based on basic salary
            if (component.isPercentage) {
              componentAmount = (proRatedBasicSalary * component.amount) / 100;
            } else {
              // Pro-rate fixed amounts based on attendance
              componentAmount = (component.amount / workingDays) * attendanceDays;
            }

            if (component.componentType === 'allowance') {
              totalAllowances += componentAmount;
            } else if (component.componentType === 'deduction') {
              totalDeductions += componentAmount;

              // Track statutory deductions
              const componentNameLower = component.componentName.toLowerCase();
              if (componentNameLower.includes('pf') || componentNameLower.includes('provident')) {
                pfAmount += componentAmount;
              } else if (componentNameLower.includes('esi') || componentNameLower.includes('insurance')) {
                esiAmount += componentAmount;
              } else if (componentNameLower.includes('tds') || componentNameLower.includes('tax')) {
                tdsAmount += componentAmount;
              }
            }
          }

          // Calculate gross and net salary
          const grossSalary = proRatedBasicSalary + totalAllowances;
          const netSalary = grossSalary - totalDeductions;

          // Create payslip record
          const payslipData = {
            payrollRunId: payrollRunId,
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            department: employee.department,
            designation: employee.designation,
            periodStart: payrollRun.periodStart,
            periodEnd: payrollRun.periodEnd,
            basicSalary: Math.round(proRatedBasicSalary * 100) / 100,
            totalAllowances: Math.round(totalAllowances * 100) / 100,
            totalDeductions: Math.round(totalDeductions * 100) / 100,
            grossSalary: Math.round(grossSalary * 100) / 100,
            netSalary: Math.round(netSalary * 100) / 100,
            pfAmount: Math.round(pfAmount * 100) / 100,
            esiAmount: Math.round(esiAmount * 100) / 100,
            tdsAmount: Math.round(tdsAmount * 100) / 100,
            status: 'generated',
            generatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };

          const newPayslip = await db.insert(payslips)
            .values(payslipData)
            .returning();

          if (newPayslip.length > 0) {
            generatedPayslips.push(newPayslip[0] as PayslipData);
            totalNetAmount += netSalary;
          }

        } catch (employeeError) {
          console.error(`Error processing employee ${employee.id}:`, employeeError);
          failedEmployees.push({
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            error: employeeError instanceof Error ? employeeError.message : 'Unknown error'
          });
        }
      }

      // Update payroll run with completion details
      const processedAt = new Date().toISOString();
      await db.update(payrollRuns)
        .set({ 
          status: 'completed',
          totalEmployees: generatedPayslips.length,
          totalAmount: Math.round(totalNetAmount * 100) / 100,
          processedAt: processedAt,
        })
        .where(eq(payrollRuns.id, payrollRunId));

      const response: any = {
        message: 'Payroll processed successfully',
        payrollRunId: payrollRunId,
        summary: {
          totalEmployees: generatedPayslips.length,
          totalAmount: Math.round(totalNetAmount * 100) / 100,
          processedAt: processedAt,
          status: 'completed'
        },
        payslips: generatedPayslips
      };

      // Include failed employees if any
      if (failedEmployees.length > 0) {
        response.failedEmployees = failedEmployees;
        response.message = `Payroll processed with ${failedEmployees.length} failures`;
      }

      return NextResponse.json(response, { status: 200 });

    } catch (processingError) {
      console.error('Payroll processing error:', processingError);
      
      // Rollback payroll run status to draft
      await db.update(payrollRuns)
        .set({ 
          status: 'draft',
        })
        .where(eq(payrollRuns.id, payrollRunId));

      return NextResponse.json({ 
        error: 'Error during payroll processing: ' + (processingError instanceof Error ? processingError.message : 'Unknown error'),
        code: "PROCESSING_ERROR" 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}