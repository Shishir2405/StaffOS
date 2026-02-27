import { db } from "@/db";
import { leaveRequests } from "@/db/schema";

async function main() {
  const now = new Date();

  const getDaysAgo = (days: number): string => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };

  const getDaysFuture = (days: number): string => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  };

  const sampleLeaveRequests = [
    {
      employeeId: 1,
      leaveType: "Sick Leave",
      startDate: getDaysAgo(3),
      endDate: getDaysAgo(1),
      totalDays: 3.0,
      reason: "Severe flu and fever",
      status: "Approved",
      approvedBy: 5,
      approvedAt: getDaysAgo(4),
      createdAt: getDaysAgo(4),
      updatedAt: getDaysAgo(4),
    },
    {
      employeeId: 7,
      leaveType: "Casual Leave",
      startDate: getDaysFuture(5),
      endDate: getDaysFuture(7),
      totalDays: 3.0,
      reason: "Family wedding ceremony",
      status: "Pending",
      approvedBy: null,
      approvedAt: null,
      createdAt: now.toISOString().split("T")[0],
      updatedAt: now.toISOString().split("T")[0],
    },
    {
      employeeId: 12,
      leaveType: "Paid Leave",
      startDate: getDaysFuture(1),
      endDate: getDaysFuture(3),
      totalDays: 3.0,
      reason: "Personal vacation trip",
      status: "Rejected",
      approvedBy: 6,
      approvedAt: getDaysAgo(1),
      createdAt: getDaysAgo(2),
      updatedAt: getDaysAgo(1),
    },
    {
      employeeId: 20,
      leaveType: "Paid Leave",
      startDate: getDaysAgo(10),
      endDate: getDaysAgo(8),
      totalDays: 3.0,
      reason: "Pre-planned family vacation",
      status: "Approved",
      approvedBy: 18,
      approvedAt: getDaysAgo(15),
      createdAt: getDaysAgo(20),
      updatedAt: getDaysAgo(15),
    },
    {
      employeeId: 28,
      leaveType: "Unpaid Leave",
      startDate: getDaysFuture(14),
      endDate: getDaysFuture(28),
      totalDays: 15.0,
      reason: "Extended personal matter",
      status: "Pending",
      approvedBy: null,
      approvedAt: null,
      createdAt: now.toISOString().split("T")[0],
      updatedAt: now.toISOString().split("T")[0],
    },
  ];

  await db.insert(leaveRequests).values(sampleLeaveRequests);

  console.log("✅ Leave requests seeder completed successfully");
}

main().catch((error) => {
  console.error("❌ Seeder failed:", error);
});
