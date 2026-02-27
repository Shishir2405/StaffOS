import { db } from '@/db';
import { leaveRequests } from '@/db/schema';

async function main() {
    const now = new Date();
    
    const getDaysAgo = (days: number): string => {
        const date = new Date(now);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    };
    
    const getDaysFuture = (days: number): string => {
        const date = new Date(now);
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    };

    const sampleLeaveRequests = [
        {
            employee_id: 1,
            leave_type: 'Sick Leave',
            start_date: getDaysAgo(3),
            end_date: getDaysAgo(1),
            total_days: 3.0,
            reason: 'Severe flu and fever',
            status: 'Approved',
            approved_by: 5,
            approved_at: getDaysAgo(4),
            created_at: getDaysAgo(4),
            updated_at: getDaysAgo(4),
        },
        {
            employee_id: 7,
            leave_type: 'Casual Leave',
            start_date: getDaysFuture(5),
            end_date: getDaysFuture(7),
            total_days: 3.0,
            reason: 'Family wedding ceremony',
            status: 'Pending',
            approved_by: null,
            approved_at: null,
            created_at: now.toISOString().split('T')[0],
            updated_at: now.toISOString().split('T')[0],
        },
        {
            employee_id: 12,
            leave_type: 'Paid Leave',
            start_date: getDaysFuture(1),
            end_date: getDaysFuture(3),
            total_days: 3.0,
            reason: 'Personal vacation trip',
            status: 'Rejected',
            approved_by: 6,
            approved_at: getDaysAgo(1),
            created_at: getDaysAgo(2),
            updated_at: getDaysAgo(1),
        },
        {
            employee_id: 20,
            leave_type: 'Paid Leave',
            start_date: getDaysAgo(10),
            end_date: getDaysAgo(8),
            total_days: 3.0,
            reason: 'Pre-planned family vacation',
            status: 'Approved',
            approved_by: 18,
            approved_at: getDaysAgo(15),
            created_at: getDaysAgo(20),
            updated_at: getDaysAgo(15),
        },
        {
            employee_id: 28,
            leave_type: 'Unpaid Leave',
            start_date: getDaysFuture(14),
            end_date: getDaysFuture(28),
            total_days: 15.0,
            reason: 'Extended personal matter',
            status: 'Pending',
            approved_by: null,
            approved_at: null,
            created_at: now.toISOString().split('T')[0],
            updated_at: now.toISOString().split('T')[0],
        },
    ];

    await db.insert(leaveRequests).values(sampleLeaveRequests);
    
    console.log('✅ Leave requests seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});