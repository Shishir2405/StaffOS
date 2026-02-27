import { db } from "@/db";
import { salaryComponents } from "@/db/schema";

async function main() {
  const sampleSalaryComponents = [
    // Employee 1 (High earner with TDS)
    {
      employeeId: 1,
      componentType: "earning",
      componentName: "Basic Salary",
      amount: 80000,
      isPercentage: false,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 1,
      componentType: "earning",
      componentName: "HRA",
      amount: 40,
      isPercentage: true,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 1,
      componentType: "earning",
      componentName: "Transport Allowance",
      amount: 3200,
      isPercentage: false,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 1,
      componentType: "earning",
      componentName: "Special Allowance",
      amount: 10000,
      isPercentage: false,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 1,
      componentType: "deduction",
      componentName: "PF Deduction",
      amount: 12,
      isPercentage: true,
      isStatutory: true,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 1,
      componentType: "deduction",
      componentName: "ESI Deduction",
      amount: 0.75,
      isPercentage: true,
      isStatutory: true,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 1,
      componentType: "deduction",
      componentName: "TDS",
      amount: 5000,
      isPercentage: false,
      isStatutory: true,
      createdAt: new Date("2024-01-01").toISOString(),
    },

    // Employee 2 (Medium earner)
    {
      employeeId: 2,
      componentType: "earning",
      componentName: "Basic Salary",
      amount: 50000,
      isPercentage: false,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 2,
      componentType: "earning",
      componentName: "HRA",
      amount: 40,
      isPercentage: true,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 2,
      componentType: "earning",
      componentName: "Transport Allowance",
      amount: 2400,
      isPercentage: false,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 2,
      componentType: "earning",
      componentName: "Medical Allowance",
      amount: 1250,
      isPercentage: false,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 2,
      componentType: "deduction",
      componentName: "PF Deduction",
      amount: 12,
      isPercentage: true,
      isStatutory: true,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 2,
      componentType: "deduction",
      componentName: "Professional Tax",
      amount: 200,
      isPercentage: false,
      isStatutory: true,
      createdAt: new Date("2024-01-01").toISOString(),
    },

    // Employee 3 (Medium-high earner with TDS)
    {
      employeeId: 3,
      componentType: "earning",
      componentName: "Basic Salary",
      amount: 65000,
      isPercentage: false,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 3,
      componentType: "earning",
      componentName: "HRA",
      amount: 50,
      isPercentage: true,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 3,
      componentType: "earning",
      componentName: "Transport Allowance",
      amount: 3000,
      isPercentage: false,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 3,
      componentType: "earning",
      componentName: "Special Allowance",
      amount: 8000,
      isPercentage: false,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 3,
      componentType: "deduction",
      componentName: "PF Deduction",
      amount: 12,
      isPercentage: true,
      isStatutory: true,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 3,
      componentType: "deduction",
      componentName: "ESI Deduction",
      amount: 0.75,
      isPercentage: true,
      isStatutory: true,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 3,
      componentType: "deduction",
      componentName: "TDS",
      amount: 3000,
      isPercentage: false,
      isStatutory: true,
      createdAt: new Date("2024-01-01").toISOString(),
    },

    // Employee 4 (Junior level)
    {
      employeeId: 4,
      componentType: "earning",
      componentName: "Basic Salary",
      amount: 35000,
      isPercentage: false,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 4,
      componentType: "earning",
      componentName: "HRA",
      amount: 40,
      isPercentage: true,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 4,
      componentType: "earning",
      componentName: "Transport Allowance",
      amount: 1600,
      isPercentage: false,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 4,
      componentType: "deduction",
      componentName: "PF Deduction",
      amount: 12,
      isPercentage: true,
      isStatutory: true,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 4,
      componentType: "deduction",
      componentName: "Professional Tax",
      amount: 200,
      isPercentage: false,
      isStatutory: true,
      createdAt: new Date("2024-01-01").toISOString(),
    },

    // Employee 5 (Mid-level)
    {
      employeeId: 5,
      componentType: "earning",
      componentName: "Basic Salary",
      amount: 55000,
      isPercentage: false,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 5,
      componentType: "earning",
      componentName: "HRA",
      amount: 45,
      isPercentage: true,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 5,
      componentType: "earning",
      componentName: "Transport Allowance",
      amount: 2800,
      isPercentage: false,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 5,
      componentType: "earning",
      componentName: "Special Allowance",
      amount: 5000,
      isPercentage: false,
      isStatutory: false,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 5,
      componentType: "deduction",
      componentName: "PF Deduction",
      amount: 12,
      isPercentage: true,
      isStatutory: true,
      createdAt: new Date("2024-01-01").toISOString(),
    },
    {
      employeeId: 5,
      componentType: "deduction",
      componentName: "TDS",
      amount: 1500,
      isPercentage: false,
      isStatutory: true,
      createdAt: new Date("2024-01-01").toISOString(),
    },
  ];

  try {
    const result = await db
      .insert(salaryComponents)
      .values(sampleSalaryComponents)
      .execute();
    console.log("✅ Salary components seeder completed successfully");
    console.log(
      `📊 Inserted ${sampleSalaryComponents.length} salary components for 5 employees`,
    );
    console.log("Result:", result);
  } catch (error) {
    console.error("❌ Seeder failed during insert operation:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error("❌ Seeder failed:", error);
  process.exit(1);
});
