import { db } from '@/db';
import { attendance } from '@/db/schema';

async function main() {
    const sampleAttendance = [];
    
    // Generate dates for the last 7 days
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    
    // Generate attendance for employees 1-10 for each of the last 7 days
    for (const date of dates) {
        for (let employeeId = 1; employeeId <= 10; employeeId++) {
            const random = Math.random();
            const timestamp = new Date().toISOString();
            
            if (random < 0.70) {
                // 70% Present - Full day attendance
                const checkInDateTime = `${date}T09:00:00.000Z`;
                const checkOutDateTime = `${date}T18:00:00.000Z`;
                const geofenceId = employeeId % 2 === 0 ? 1 : 3;
                const isHeadOffice = geofenceId === 1;
                
                sampleAttendance.push({
                    employee_id: employeeId,
                    date: date,
                    check_in_time: checkInDateTime,
                    check_out_time: checkOutDateTime,
                    check_in_geofence_id: geofenceId,
                    check_out_geofence_id: geofenceId,
                    check_in_latitude: isHeadOffice ? 37.7749 : 37.3861,
                    check_in_longitude: isHeadOffice ? -122.4194 : -122.0839,
                    check_out_latitude: isHeadOffice ? 37.7749 : 37.3861,
                    check_out_longitude: isHeadOffice ? -122.4194 : -122.0839,
                    status: 'Present',
                    working_hours: 9.0,
                    is_auto_check_in: false,
                    is_auto_check_out: false,
                    notes: null,
                    created_at: timestamp,
                    updated_at: timestamp,
                });
            } else if (random < 0.80) {
                // 10% Late - Came late but worked full hours
                const checkInDateTime = `${date}T09:45:00.000Z`;
                const checkOutDateTime = `${date}T18:00:00.000Z`;
                const geofenceId = employeeId % 2 === 0 ? 1 : 3;
                const isHeadOffice = geofenceId === 1;
                
                sampleAttendance.push({
                    employee_id: employeeId,
                    date: date,
                    check_in_time: checkInDateTime,
                    check_out_time: checkOutDateTime,
                    check_in_geofence_id: geofenceId,
                    check_out_geofence_id: geofenceId,
                    check_in_latitude: isHeadOffice ? 37.7749 : 37.3861,
                    check_in_longitude: isHeadOffice ? -122.4194 : -122.0839,
                    check_out_latitude: isHeadOffice ? 37.7749 : 37.3861,
                    check_out_longitude: isHeadOffice ? -122.4194 : -122.0839,
                    status: 'Late',
                    working_hours: 8.25,
                    is_auto_check_in: false,
                    is_auto_check_out: false,
                    notes: 'Arrived 45 minutes late due to traffic',
                    created_at: timestamp,
                    updated_at: timestamp,
                });
            } else if (random < 0.90) {
                // 10% Half Day - Worked only half day
                const checkInDateTime = `${date}T09:00:00.000Z`;
                const checkOutDateTime = `${date}T13:00:00.000Z`;
                const geofenceId = employeeId % 2 === 0 ? 1 : 3;
                const isHeadOffice = geofenceId === 1;
                
                sampleAttendance.push({
                    employee_id: employeeId,
                    date: date,
                    check_in_time: checkInDateTime,
                    check_out_time: checkOutDateTime,
                    check_in_geofence_id: geofenceId,
                    check_out_geofence_id: geofenceId,
                    check_in_latitude: isHeadOffice ? 37.7749 : 37.3861,
                    check_in_longitude: isHeadOffice ? -122.4194 : -122.0839,
                    check_out_latitude: isHeadOffice ? 37.7749 : 37.3861,
                    check_out_longitude: isHeadOffice ? -122.4194 : -122.0839,
                    status: 'Half Day',
                    working_hours: 4.0,
                    is_auto_check_in: false,
                    is_auto_check_out: false,
                    notes: 'Half day - personal work',
                    created_at: timestamp,
                    updated_at: timestamp,
                });
            } else if (random < 0.95) {
                // 5% Absent - Did not come to work
                sampleAttendance.push({
                    employee_id: employeeId,
                    date: date,
                    check_in_time: null,
                    check_out_time: null,
                    check_in_geofence_id: null,
                    check_out_geofence_id: null,
                    check_in_latitude: null,
                    check_in_longitude: null,
                    check_out_latitude: null,
                    check_out_longitude: null,
                    status: 'Absent',
                    working_hours: null,
                    is_auto_check_in: false,
                    is_auto_check_out: false,
                    notes: 'Absent without notice',
                    created_at: timestamp,
                    updated_at: timestamp,
                });
            } else {
                // 5% On Leave - Approved leave
                sampleAttendance.push({
                    employee_id: employeeId,
                    date: date,
                    check_in_time: null,
                    check_out_time: null,
                    check_in_geofence_id: null,
                    check_out_geofence_id: null,
                    check_in_latitude: null,
                    check_in_longitude: null,
                    check_out_latitude: null,
                    check_out_longitude: null,
                    status: 'On Leave',
                    working_hours: null,
                    is_auto_check_in: false,
                    is_auto_check_out: false,
                    notes: 'Annual leave',
                    created_at: timestamp,
                    updated_at: timestamp,
                });
            }
        }
    }

    await db.insert(attendance).values(sampleAttendance);
    
    console.log('✅ Attendance seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});