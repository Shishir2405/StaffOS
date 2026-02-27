import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { geofences } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session?.user) {
    return { error: { message: 'Unauthorized - Please login', status: 401 } };
  }
  
  return { user: session.user };
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user - all authenticated users can read geofences
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Single geofence by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const geofence = await db
        .select()
        .from(geofences)
        .where(eq(geofences.id, parseInt(id)))
        .limit(1);

      if (geofence.length === 0) {
        return NextResponse.json(
          { error: 'Geofence not found', code: 'GEOFENCE_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: geofence[0] }, { status: 200 });
    }

    // List geofences with filtering
    let query = db.select().from(geofences);

    const conditions = [];

    // Filter by isActive
    if (isActive !== null && isActive !== undefined) {
      const isActiveBool = isActive === 'true';
      conditions.push(eq(geofences.isActive, isActiveBool));
    }

    // Search by name or address
    if (search) {
      conditions.push(
        or(
          like(geofences.name, `%${search}%`),
          like(geofences.address, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json({ success: true, data: results }, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
    }
    
    const { user } = authResult;

    // Only admin can create geofences
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only admin can create geofences', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, latitude, longitude, radius, address, isActive } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }

    if (latitude === undefined || latitude === null) {
      return NextResponse.json(
        { error: 'Latitude is required', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }

    if (longitude === undefined || longitude === null) {
      return NextResponse.json(
        { error: 'Longitude is required', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }

    if (radius === undefined || radius === null) {
      return NextResponse.json(
        { error: 'Radius is required', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }

    if (!address || address.trim() === '') {
      return NextResponse.json(
        { error: 'Address is required', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }

    // Validate latitude range
    const lat = parseFloat(latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90', code: 'INVALID_VALUE' },
        { status: 400 }
      );
    }

    // Validate longitude range
    const lng = parseFloat(longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180', code: 'INVALID_VALUE' },
        { status: 400 }
      );
    }

    // Validate radius
    const rad = parseFloat(radius);
    if (isNaN(rad) || rad <= 0) {
      return NextResponse.json(
        { error: 'Radius must be a positive number', code: 'INVALID_VALUE' },
        { status: 400 }
      );
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData = {
      name: name.trim(),
      description: description ? description.trim() : null,
      latitude: lat,
      longitude: lng,
      radius: rad,
      address: address.trim(),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdAt: now,
      updatedAt: now,
    };

    const newGeofence = await db.insert(geofences).values(insertData).returning();

    return NextResponse.json(newGeofence[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
    }
    
    const { user } = authResult;

    // Only admin can update geofences
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only admin can update geofences', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const geofenceId = parseInt(id);

    // Check if geofence exists
    const existing = await db
      .select()
      .from(geofences)
      .where(eq(geofences.id, geofenceId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Geofence not found', code: 'GEOFENCE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, latitude, longitude, radius, address, isActive } = body;

    // Prepare update data
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    // Validate and add fields to update
    if (name !== undefined) {
      if (name.trim() === '') {
        return NextResponse.json(
          { error: 'Name cannot be empty', code: 'INVALID_VALUE' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    if (latitude !== undefined) {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return NextResponse.json(
          { error: 'Latitude must be between -90 and 90', code: 'INVALID_VALUE' },
          { status: 400 }
        );
      }
      updates.latitude = lat;
    }

    if (longitude !== undefined) {
      const lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return NextResponse.json(
          { error: 'Longitude must be between -180 and 180', code: 'INVALID_VALUE' },
          { status: 400 }
        );
      }
      updates.longitude = lng;
    }

    if (radius !== undefined) {
      const rad = parseFloat(radius);
      if (isNaN(rad) || rad <= 0) {
        return NextResponse.json(
          { error: 'Radius must be a positive number', code: 'INVALID_VALUE' },
          { status: 400 }
        );
      }
      updates.radius = rad;
    }

    if (address !== undefined) {
      if (address.trim() === '') {
        return NextResponse.json(
          { error: 'Address cannot be empty', code: 'INVALID_VALUE' },
          { status: 400 }
        );
      }
      updates.address = address.trim();
    }

    if (isActive !== undefined) {
      updates.isActive = Boolean(isActive);
    }

    const updated = await db
      .update(geofences)
      .set(updates)
      .where(eq(geofences.id, geofenceId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
    }
    
    const { user } = authResult;

    // Only admin can delete geofences
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only admin can delete geofences', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const geofenceId = parseInt(id);

    // Check if geofence exists
    const existing = await db
      .select()
      .from(geofences)
      .where(eq(geofences.id, geofenceId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Geofence not found', code: 'GEOFENCE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(geofences)
      .where(eq(geofences.id, geofenceId))
      .returning();

    return NextResponse.json(
      {
        message: 'Geofence deleted successfully',
        geofence: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}