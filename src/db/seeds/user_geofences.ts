import { db } from '@/db';
import { userGeofences, user } from '@/db/schema';
import { eq, ne } from 'drizzle-orm';

// Helper function to generate timestamp within last 30 days
function getRandomDateWithinLast30Days(): string {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now.setDate(now.getDate() - daysAgo));
    return date.toISOString();
}

async function main() {
    // Step 1: Query admin user
    const adminUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, 'admin@staffos.com'))
        .limit(1);

    if (!adminUser.length) {
        throw new Error('Admin user not found. Please run user/auth seeders first.');
    }

    const adminId = adminUser[0].id;

    // Step 2: Query employee users (non-admin users)
    const employeeUsers = await db
        .select({ id: user.id })
        .from(user)
        .where(ne(user.role, 'admin'))
        .limit(10);

    if (employeeUsers.length === 0) {
        throw new Error('No employee users found. Please run user/auth seeders first.');
    }

    // Get user IDs
    const userIds = employeeUsers.map(u => u.id);

    // Step 3: Create assignment records
    const assignments = [];

    // 4-5 users assigned to Head Office (geofence_id: 1)
    for (let i = 0; i < Math.min(5, userIds.length); i++) {
        assignments.push({
            userId: userIds[i],
            geofenceId: 1,
            assignedAt: getRandomDateWithinLast30Days(),
            assignedBy: adminId,
        });
    }

    // 2-3 users assigned to Branch Office LA (geofence_id: 2)
    const branchOfficeCount = Math.min(3, userIds.length - 5);
    for (let i = 0; i < branchOfficeCount; i++) {
        const userIndex = 5 + i;
        if (userIndex < userIds.length) {
            assignments.push({
                userId: userIds[userIndex],
                geofenceId: 2,
                assignedAt: getRandomDateWithinLast30Days(),
                assignedBy: adminId,
            });
        }
    }

    // 3-4 users assigned to Remote Work Zone (geofence_id: 3)
    const remoteZoneStart = 5 + branchOfficeCount;
    const remoteZoneCount = Math.min(4, userIds.length - remoteZoneStart);
    for (let i = 0; i < remoteZoneCount; i++) {
        const userIndex = remoteZoneStart + i;
        if (userIndex < userIds.length) {
            assignments.push({
                userId: userIds[userIndex],
                geofenceId: 3,
                assignedAt: getRandomDateWithinLast30Days(),
                assignedBy: adminId,
            });
        }
    }

    // 2-3 users assigned to multiple geofences
    const multiAssignCount = Math.min(3, Math.floor(userIds.length / 2));
    for (let i = 0; i < multiAssignCount; i++) {
        const userIndex = i * 2;
        if (userIndex < userIds.length) {
            // Assign same user to Head Office and Remote Work Zone
            assignments.push({
                userId: userIds[userIndex],
                geofenceId: 1,
                assignedAt: getRandomDateWithinLast30Days(),
                assignedBy: adminId,
            });
            assignments.push({
                userId: userIds[userIndex],
                geofenceId: 3,
                assignedAt: getRandomDateWithinLast30Days(),
                assignedBy: adminId,
            });
        }
    }

    // Step 4: Insert all assignments
    await db.insert(userGeofences).values(assignments);

    console.log(`✅ User geofences seeder completed successfully - Created ${assignments.length} assignments`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
});