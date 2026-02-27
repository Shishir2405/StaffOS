import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { employees } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const managerId = searchParams.get('managerId');

    // Validate managerId is provided
    if (!managerId) {
      return NextResponse.json(
        {
          error: 'Manager ID is required',
          code: 'MISSING_MANAGER_ID'
        },
        { status: 400 }
      );
    }

    // Validate managerId is a valid integer
    const managerIdInt = parseInt(managerId);
    if (isNaN(managerIdInt)) {
      return NextResponse.json(
        {
          error: 'Manager ID must be a valid integer',
          code: 'INVALID_MANAGER_ID'
        },
        { status: 400 }
      );
    }

    // Query all employees who report to this manager
    const directReports = await db
      .select()
      .from(employees)
      .where(eq(employees.managerId, managerIdInt));

    // Return the array of direct reports (empty array if none found)
    return NextResponse.json(directReports, { status: 200 });

  } catch (error) {
    console.error('GET direct reports error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error
      },
      { status: 500 }
    );
  }
}