import { db } from '@/db';
import { payrollRuns } from '@/db/schema';

async function main() {
    try {
        const samplePayrollRuns = [
            {
                runDate: '2024-12-31',
                periodStart: '2024-12-01',
                periodEnd: '2024-12-31',
                status: 'completed',
                totalEmployees: 5,
                totalAmount: 399647.00,
                createdBy: 3,
                createdAt: '2024-12-31T10:00:00.000Z',
                processedAt: '2024-12-31T16:30:00.000Z',
            }
        ];

        const result = await db.insert(payrollRuns).values(samplePayrollRuns).execute();
        
        console.log('✅ Payroll runs seeder completed successfully');
        console.log(`📊 Inserted ${samplePayrollRuns.length} payroll run(s)`);
        console.log('Result:', result);
    } catch (error) {
        console.error('❌ Seeder failed with error:', error);
        throw error;
    }
}

main().catch((error) => {
    console.error('❌ Fatal error in seeder:', error);
    process.exit(1);
});