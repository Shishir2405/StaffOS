import { db } from '@/db';
import { departments } from '@/db/schema';

async function main() {
    const sampleDepartments = [
        {
            name: 'Engineering',
            code: 'ENG',
            description: 'Software development and technical innovation',
            headId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Sales',
            code: 'SALES',
            description: 'Revenue generation and customer acquisition',
            headId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Marketing',
            code: 'MKT',
            description: 'Brand management and marketing campaigns',
            headId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'HR',
            code: 'HR',
            description: 'Human resources and talent management',
            headId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Finance',
            code: 'FIN',
            description: 'Financial planning and accounting',
            headId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Operations',
            code: 'OPS',
            description: 'Business operations and logistics',
            headId: null,
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(departments).values(sampleDepartments);
    
    console.log('✅ Departments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});