import { db } from '@/db';
import { geofences } from '@/db/schema';

async function main() {
    const sampleGeofences = [
        {
            name: 'Head Office',
            description: 'Main headquarters located in downtown San Francisco',
            latitude: 37.7749,
            longitude: -122.4194,
            radius: 100.0,
            address: '350 Market Street, San Francisco, CA 94102',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Branch Office LA',
            description: 'Los Angeles branch office in downtown area',
            latitude: 34.0522,
            longitude: -118.2437,
            radius: 150.0,
            address: '555 West 5th Street, Los Angeles, CA 90013',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Remote Work Zone',
            description: 'Virtual geofence for remote workers and work-from-home employees',
            latitude: 37.3861,
            longitude: -122.0839,
            radius: 5000.0,
            address: 'Virtual Location - Bay Area Region, CA',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(geofences).values(sampleGeofences);
    
    console.log('✅ Geofences seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});