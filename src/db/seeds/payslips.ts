import { db } from '@/db';
import { payslips } from '@/db/schema';

async function main() {
    try {
        const samplePayslips = [
            {
                payrollRunId: 1,
                employeeId: 1,
                employeeName: 'Sarah Chen',
                department: 'Engineering',
                designation: 'VP Engineering',
                periodStart: '2024-12-01',
                periodEnd: '2024-12-31',
                basicSalary: 80000,
                totalAllowances: 45200,
                grossSalary: 125200,
                pfAmount: 9600,
                esiAmount: 939,
                tdsAmount: 5000,
                totalDeductions: 15539,
                netSalary: 109661,
                status: 'generated',
                generatedAt: '2024-12-31T16:30:00.000Z',
                createdAt: '2024-12-31T16:30:00.000Z'
            },
            {
                payrollRunId: 1,
                employeeId: 2,
                employeeName: 'James Rodriguez',
                department: 'Sales',
                designation: 'VP Sales',
                periodStart: '2024-12-01',
                periodEnd: '2024-12-31',
                basicSalary: 50000,
                totalAllowances: 23650,
                grossSalary: 73650,
                pfAmount: 6000,
                esiAmount: 0,
                tdsAmount: 0,
                totalDeductions: 6200,
                netSalary: 67450,
                status: 'generated',
                generatedAt: '2024-12-31T16:30:00.000Z',
                createdAt: '2024-12-31T16:30:00.000Z'
            },
            {
                payrollRunId: 1,
                employeeId: 3,
                employeeName: 'Emily Thompson',
                department: 'Finance',
                designation: 'CFO',
                periodStart: '2024-12-01',
                periodEnd: '2024-12-31',
                basicSalary: 65000,
                totalAllowances: 43500,
                grossSalary: 108500,
                pfAmount: 7800,
                esiAmount: 814,
                tdsAmount: 3000,
                totalDeductions: 11614,
                netSalary: 96886,
                status: 'generated',
                generatedAt: '2024-12-31T16:30:00.000Z',
                createdAt: '2024-12-31T16:30:00.000Z'
            },
            {
                payrollRunId: 1,
                employeeId: 4,
                employeeName: 'Alex Kim',
                department: 'Marketing',
                designation: 'VP Marketing',
                periodStart: '2024-12-01',
                periodEnd: '2024-12-31',
                basicSalary: 35000,
                totalAllowances: 15600,
                grossSalary: 50600,
                pfAmount: 4200,
                esiAmount: 0,
                tdsAmount: 0,
                totalDeductions: 4400,
                netSalary: 46200,
                status: 'generated',
                generatedAt: '2024-12-31T16:30:00.000Z',
                createdAt: '2024-12-31T16:30:00.000Z'
            },
            {
                payrollRunId: 1,
                employeeId: 5,
                employeeName: 'Michael Anderson',
                department: 'Engineering',
                designation: 'Engineering Director',
                periodStart: '2024-12-01',
                periodEnd: '2024-12-31',
                basicSalary: 55000,
                totalAllowances: 32550,
                grossSalary: 87550,
                pfAmount: 6600,
                esiAmount: 0,
                tdsAmount: 1500,
                totalDeductions: 8100,
                netSalary: 79450,
                status: 'generated',
                generatedAt: '2024-12-31T16:30:00.000Z',
                createdAt: '2024-12-31T16:30:00.000Z'
            }
        ];

        const result = await db.insert(payslips).values(samplePayslips).execute();
        
        console.log('✅ Payslips seeder completed successfully');
        console.log(`📊 Inserted ${samplePayslips.length} payslip records`);
        console.log(`🔍 Result:`, result);
        
    } catch (error) {
        console.error('❌ Seeder failed with error:', error);
        throw error;
    }
}

main().catch((error) => {
    console.error('❌ Fatal error in seeder:', error);
    process.exit(1);
});