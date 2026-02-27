import { db } from '@/db';
import { salaryComponents } from '@/db/schema';

async function main() {
    const sampleSalaryComponents = [
        // Employee 1 (High earner with TDS)
        {
            employee_id: 1,
            component_type: 'earning',
            component_name: 'Basic Salary',
            amount: 80000,
            is_percentage: 0,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 1,
            component_type: 'earning',
            component_name: 'HRA',
            amount: 40,
            is_percentage: 1,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 1,
            component_type: 'earning',
            component_name: 'Transport Allowance',
            amount: 3200,
            is_percentage: 0,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 1,
            component_type: 'earning',
            component_name: 'Special Allowance',
            amount: 10000,
            is_percentage: 0,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 1,
            component_type: 'deduction',
            component_name: 'PF Deduction',
            amount: 12,
            is_percentage: 1,
            is_statutory: 1,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 1,
            component_type: 'deduction',
            component_name: 'ESI Deduction',
            amount: 0.75,
            is_percentage: 1,
            is_statutory: 1,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 1,
            component_type: 'deduction',
            component_name: 'TDS',
            amount: 5000,
            is_percentage: 0,
            is_statutory: 1,
            created_at: new Date('2024-01-01').toISOString(),
        },

        // Employee 2 (Medium earner)
        {
            employee_id: 2,
            component_type: 'earning',
            component_name: 'Basic Salary',
            amount: 50000,
            is_percentage: 0,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 2,
            component_type: 'earning',
            component_name: 'HRA',
            amount: 40,
            is_percentage: 1,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 2,
            component_type: 'earning',
            component_name: 'Transport Allowance',
            amount: 2400,
            is_percentage: 0,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 2,
            component_type: 'earning',
            component_name: 'Medical Allowance',
            amount: 1250,
            is_percentage: 0,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 2,
            component_type: 'deduction',
            component_name: 'PF Deduction',
            amount: 12,
            is_percentage: 1,
            is_statutory: 1,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 2,
            component_type: 'deduction',
            component_name: 'Professional Tax',
            amount: 200,
            is_percentage: 0,
            is_statutory: 1,
            created_at: new Date('2024-01-01').toISOString(),
        },

        // Employee 3 (Medium-high earner with TDS)
        {
            employee_id: 3,
            component_type: 'earning',
            component_name: 'Basic Salary',
            amount: 65000,
            is_percentage: 0,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 3,
            component_type: 'earning',
            component_name: 'HRA',
            amount: 50,
            is_percentage: 1,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 3,
            component_type: 'earning',
            component_name: 'Transport Allowance',
            amount: 3000,
            is_percentage: 0,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 3,
            component_type: 'earning',
            component_name: 'Special Allowance',
            amount: 8000,
            is_percentage: 0,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 3,
            component_type: 'deduction',
            component_name: 'PF Deduction',
            amount: 12,
            is_percentage: 1,
            is_statutory: 1,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 3,
            component_type: 'deduction',
            component_name: 'ESI Deduction',
            amount: 0.75,
            is_percentage: 1,
            is_statutory: 1,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 3,
            component_type: 'deduction',
            component_name: 'TDS',
            amount: 3000,
            is_percentage: 0,
            is_statutory: 1,
            created_at: new Date('2024-01-01').toISOString(),
        },

        // Employee 4 (Junior level)
        {
            employee_id: 4,
            component_type: 'earning',
            component_name: 'Basic Salary',
            amount: 35000,
            is_percentage: 0,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 4,
            component_type: 'earning',
            component_name: 'HRA',
            amount: 40,
            is_percentage: 1,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 4,
            component_type: 'earning',
            component_name: 'Transport Allowance',
            amount: 1600,
            is_percentage: 0,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 4,
            component_type: 'deduction',
            component_name: 'PF Deduction',
            amount: 12,
            is_percentage: 1,
            is_statutory: 1,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 4,
            component_type: 'deduction',
            component_name: 'Professional Tax',
            amount: 200,
            is_percentage: 0,
            is_statutory: 1,
            created_at: new Date('2024-01-01').toISOString(),
        },

        // Employee 5 (Mid-level)
        {
            employee_id: 5,
            component_type: 'earning',
            component_name: 'Basic Salary',
            amount: 55000,
            is_percentage: 0,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 5,
            component_type: 'earning',
            component_name: 'HRA',
            amount: 45,
            is_percentage: 1,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 5,
            component_type: 'earning',
            component_name: 'Transport Allowance',
            amount: 2800,
            is_percentage: 0,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 5,
            component_type: 'earning',
            component_name: 'Special Allowance',
            amount: 5000,
            is_percentage: 0,
            is_statutory: 0,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 5,
            component_type: 'deduction',
            component_name: 'PF Deduction',
            amount: 12,
            is_percentage: 1,
            is_statutory: 1,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            employee_id: 5,
            component_type: 'deduction',
            component_name: 'TDS',
            amount: 1500,
            is_percentage: 0,
            is_statutory: 1,
            created_at: new Date('2024-01-01').toISOString(),
        },
    ];

    try {
        const result = await db.insert(salaryComponents).values(sampleSalaryComponents).execute();
        console.log('✅ Salary components seeder completed successfully');
        console.log(`📊 Inserted ${sampleSalaryComponents.length} salary components for 5 employees`);
        console.log('Result:', result);
    } catch (error) {
        console.error('❌ Seeder failed during insert operation:', error);
        throw error;
    }
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
});