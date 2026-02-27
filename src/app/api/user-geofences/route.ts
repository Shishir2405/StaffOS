import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userGeofences, user, geofences } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    const currentUser = session.user;
    const isAdminOrHR = currentUser.role === 'admin' || currentUser.role === 'hr';

    if (!isAdminOrHR && currentUser.id !== userId) {
      return NextResponse.json(
        { error: 'You can only view your own geofence assignments', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const assignments = await db
      .select({
        id: userGeofences.id,
        userId: userGeofences.userId,
        geofenceId: userGeofences.geofenceId,
        assignedAt: userGeofences.assignedAt,
        assignedBy: userGeofences.assignedBy,
        geofence: {
          id: geofences.id,
          name: geofences.name,
          description: geofences.description,
          latitude: geofences.latitude,
          longitude: geofences.longitude,
          radius: geofences.radius,
          address: geofences.address,
          isActive: geofences.isActive,
        },
      })
      .from(userGeofences)
      .leftJoin(geofences, eq(userGeofences.geofenceId, geofences.id))
      .where(eq(userGeofences.userId, userId));

    return NextResponse.json(assignments, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const currentUser = session.user;
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can assign geofences', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, geofenceIds } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    if (!geofenceIds || !Array.isArray(geofenceIds) || geofenceIds.length === 0) {
      return NextResponse.json(
        { error: 'geofenceIds must be a non-empty array', code: 'INVALID_GEOFENCE_IDS' },
        { status: 400 }
      );
    }

    const validGeofenceIds = geofenceIds.filter((id) => Number.isInteger(id));
    if (validGeofenceIds.length !== geofenceIds.length) {
      return NextResponse.json(
        { error: 'All geofenceIds must be integers', code: 'INVALID_GEOFENCE_ID_TYPE' },
        { status: 400 }
      );
    }

    const targetUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const existingGeofences = await db
      .select()
      .from(geofences)
      .where(inArray(geofences.id, validGeofenceIds));

    if (existingGeofences.length !== validGeofenceIds.length) {
      const foundIds = existingGeofences.map((g) => g.id);
      const missingIds = validGeofenceIds.filter((id) => !foundIds.includes(id));
      return NextResponse.json(
        { 
          error: `Geofences not found: ${missingIds.join(', ')}`, 
          code: 'GEOFENCES_NOT_FOUND',
          missingIds 
        },
        { status: 404 }
      );
    }

    const existingAssignments = await db
      .select()
      .from(userGeofences)
      .where(
        and(
          eq(userGeofences.userId, userId),
          inArray(userGeofences.geofenceId, validGeofenceIds)
        )
      );

    const existingGeofenceIds = existingAssignments.map((a) => a.geofenceId);
    const newGeofenceIds = validGeofenceIds.filter((id) => !existingGeofenceIds.includes(id));

    const createdAssignments = [];
    const skippedAssignments = [];

    if (newGeofenceIds.length > 0) {
      const assignmentData = newGeofenceIds.map((geofenceId) => ({
        userId,
        geofenceId,
        assignedAt: new Date().toISOString(),
        assignedBy: currentUser.id,
      }));

      const inserted = await db
        .insert(userGeofences)
        .values(assignmentData)
        .returning();

      for (const assignment of inserted) {
        const geofenceData = existingGeofences.find((g) => g.id === assignment.geofenceId);
        createdAssignments.push({
          ...assignment,
          geofence: geofenceData,
        });
      }
    }

    if (existingGeofenceIds.length > 0) {
      for (const assignment of existingAssignments) {
        const geofenceData = existingGeofences.find((g) => g.id === assignment.geofenceId);
        skippedAssignments.push({
          ...assignment,
          geofence: geofenceData,
          reason: 'Already assigned',
        });
      }
    }

    return NextResponse.json(
      {
        created: createdAssignments,
        skipped: skippedAssignments,
        summary: {
          totalRequested: validGeofenceIds.length,
          created: createdAssignments.length,
          skipped: skippedAssignments.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const currentUser = session.user;
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can remove geofence assignments', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const geofenceIdParam = searchParams.get('geofenceId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!geofenceIdParam) {
      return NextResponse.json(
        { error: 'geofenceId parameter is required', code: 'MISSING_GEOFENCE_ID' },
        { status: 400 }
      );
    }

    const geofenceId = parseInt(geofenceIdParam);
    if (isNaN(geofenceId)) {
      return NextResponse.json(
        { error: 'Valid geofenceId is required', code: 'INVALID_GEOFENCE_ID' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(userGeofences)
      .where(
        and(
          eq(userGeofences.userId, userId),
          eq(userGeofences.geofenceId, geofenceId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Geofence assignment not found', code: 'ASSIGNMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(userGeofences)
      .where(
        and(
          eq(userGeofences.userId, userId),
          eq(userGeofences.geofenceId, geofenceId)
        )
      )
      .returning();

    return NextResponse.json(
      {
        message: 'Geofence assignment removed successfully',
        deletedAssignment: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}