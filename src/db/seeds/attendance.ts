import { db } from "@/db";
import { attendance } from "@/db/schema";

async function main() {
  const sampleAttendance = [];

  // Generate dates for the last 7 days
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }

  // Generate attendance for employees 1-10 for each of the last 7 days
  for (const date of dates) {
    for (let employeeId = 1; employeeId <= 10; employeeId++) {
      const random = Math.random();
      const timestamp = new Date().toISOString();

      if (random < 0.7) {
        // 70% Present - Full day attendance
        const checkInDateTime = `${date}T09:00:00.000Z`;
        const checkOutDateTime = `${date}T18:00:00.000Z`;
        const geofenceId = employeeId % 2 === 0 ? 1 : 3;
        const isHeadOffice = geofenceId === 1;

        sampleAttendance.push({
          employeeId: employeeId,
          date: date,
          checkInTime: checkInDateTime,
          checkOutTime: checkOutDateTime,
          checkInGeofenceId: geofenceId,
          checkOutGeofenceId: geofenceId,
          checkInLatitude: isHeadOffice ? 37.7749 : 37.3861,
          checkInLongitude: isHeadOffice ? -122.4194 : -122.0839,
          checkOutLatitude: isHeadOffice ? 37.7749 : 37.3861,
          checkOutLongitude: isHeadOffice ? -122.4194 : -122.0839,
          status: "Present",
          workingHours: 9.0,
          isAutoCheckIn: false,
          isAutoCheckOut: false,
          notes: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      } else if (random < 0.8) {
        // 10% Late - Came late but worked full hours
        const checkInDateTime = `${date}T09:45:00.000Z`;
        const checkOutDateTime = `${date}T18:00:00.000Z`;
        const geofenceId = employeeId % 2 === 0 ? 1 : 3;
        const isHeadOffice = geofenceId === 1;

        sampleAttendance.push({
          employeeId: employeeId,
          date: date,
          checkInTime: checkInDateTime,
          checkOutTime: checkOutDateTime,
          checkInGeofenceId: geofenceId,
          checkOutGeofenceId: geofenceId,
          checkInLatitude: isHeadOffice ? 37.7749 : 37.3861,
          checkInLongitude: isHeadOffice ? -122.4194 : -122.0839,
          checkOutLatitude: isHeadOffice ? 37.7749 : 37.3861,
          checkOutLongitude: isHeadOffice ? -122.4194 : -122.0839,
          status: "Late",
          workingHours: 8.25,
          isAutoCheckIn: false,
          isAutoCheckOut: false,
          notes: "Arrived 45 minutes late due to traffic",
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      } else if (random < 0.9) {
        // 10% Half Day - Worked only half day
        const checkInDateTime = `${date}T09:00:00.000Z`;
        const checkOutDateTime = `${date}T13:00:00.000Z`;
        const geofenceId = employeeId % 2 === 0 ? 1 : 3;
        const isHeadOffice = geofenceId === 1;

        sampleAttendance.push({
          employeeId: employeeId,
          date: date,
          checkInTime: checkInDateTime,
          checkOutTime: checkOutDateTime,
          checkInGeofenceId: geofenceId,
          checkOutGeofenceId: geofenceId,
          checkInLatitude: isHeadOffice ? 37.7749 : 37.3861,
          checkInLongitude: isHeadOffice ? -122.4194 : -122.0839,
          checkOutLatitude: isHeadOffice ? 37.7749 : 37.3861,
          checkOutLongitude: isHeadOffice ? -122.4194 : -122.0839,
          status: "Half Day",
          workingHours: 4.0,
          isAutoCheckIn: false,
          isAutoCheckOut: false,
          notes: "Half day - personal work",
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      } else if (random < 0.95) {
        // 5% Absent - Did not come to work
        sampleAttendance.push({
          employeeId: employeeId,
          date: date,
          checkInTime: null,
          checkOutTime: null,
          checkInGeofenceId: null,
          checkOutGeofenceId: null,
          checkInLatitude: null,
          checkInLongitude: null,
          checkOutLatitude: null,
          checkOutLongitude: null,
          status: "Absent",
          workingHours: null,
          isAutoCheckIn: false,
          isAutoCheckOut: false,
          notes: "Absent without notice",
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      } else {
        // 5% On Leave - Approved leave
        sampleAttendance.push({
          employeeId: employeeId,
          date: date,
          checkInTime: null,
          checkOutTime: null,
          checkInGeofenceId: null,
          checkOutGeofenceId: null,
          checkInLatitude: null,
          checkInLongitude: null,
          checkOutLatitude: null,
          checkOutLongitude: null,
          status: "On Leave",
          workingHours: null,
          isAutoCheckIn: false,
          isAutoCheckOut: false,
          notes: "Annual leave",
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    }
  }

  await db.insert(attendance).values(sampleAttendance);

  console.log("✅ Attendance seeder completed successfully");
}

main().catch((error) => {
  console.error("❌ Seeder failed:", error);
});
