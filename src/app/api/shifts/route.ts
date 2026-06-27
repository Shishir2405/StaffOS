import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shifts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const shiftId = parseInt(id);
      if (isNaN(shiftId))
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );

      const row = await db
        .select()
        .from(shifts)
        .where(eq(shifts.id, shiftId))
        .limit(1);
      if (!row.length)
        return NextResponse.json(
          { error: "Not found", code: "NOT_FOUND" },
          { status: 404 },
        );
      return NextResponse.json(row[0]);
    }

    const rows = await db.select().from(shifts).orderBy(desc(shifts.id));
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      name,
      code,
      startTime,
      endTime,
      breakMinutes,
      workingHours,
      weekOff,
      graceMinutes,
      isActive,
    } = body;

    if (!name || name.trim() === "")
      return NextResponse.json(
        { error: "Name is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    if (!code || code.trim() === "")
      return NextResponse.json(
        { error: "Code is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    if (!startTime || !TIME_REGEX.test(startTime))
      return NextResponse.json(
        { error: "Start time must be in HH:MM format", code: "INVALID_TIME" },
        { status: 400 },
      );
    if (!endTime || !TIME_REGEX.test(endTime))
      return NextResponse.json(
        { error: "End time must be in HH:MM format", code: "INVALID_TIME" },
        { status: 400 },
      );

    const existing = await db
      .select()
      .from(shifts)
      .where(eq(shifts.code, code.trim()))
      .limit(1);
    if (existing.length)
      return NextResponse.json(
        { error: "Shift code already exists", code: "DUPLICATE_CODE" },
        { status: 400 },
      );

    const now = new Date().toISOString();
    const created = await db
      .insert(shifts)
      .values({
        name: name.trim(),
        code: code.trim(),
        startTime,
        endTime,
        breakMinutes:
          breakMinutes !== undefined && breakMinutes !== null
            ? parseInt(String(breakMinutes))
            : 0,
        workingHours:
          workingHours !== undefined && workingHours !== null
            ? parseFloat(String(workingHours))
            : 8,
        weekOff: weekOff?.trim() || null,
        graceMinutes:
          graceMinutes !== undefined && graceMinutes !== null
            ? parseInt(String(graceMinutes))
            : 0,
        isActive: isActive === undefined ? true : Boolean(isActive),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(created[0], { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || isNaN(parseInt(id)))
      return NextResponse.json(
        { error: "Valid ID is required", code: "INVALID_ID" },
        { status: 400 },
      );

    const shiftId = parseInt(id);
    const existing = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, shiftId))
      .limit(1);
    if (!existing.length)
      return NextResponse.json(
        { error: "Not found", code: "NOT_FOUND" },
        { status: 404 },
      );

    const body = await request.json();
    const {
      name,
      code,
      startTime,
      endTime,
      breakMinutes,
      workingHours,
      weekOff,
      graceMinutes,
      isActive,
    } = body;

    const updates: any = { updatedAt: new Date().toISOString() };

    if (name !== undefined) updates.name = name;
    if (code !== undefined && code.trim() !== existing[0].code) {
      const dup = await db
        .select()
        .from(shifts)
        .where(eq(shifts.code, code.trim()))
        .limit(1);
      if (dup.length)
        return NextResponse.json(
          { error: "Shift code already exists", code: "DUPLICATE_CODE" },
          { status: 400 },
        );
      updates.code = code.trim();
    }
    if (startTime !== undefined) {
      if (!TIME_REGEX.test(startTime))
        return NextResponse.json(
          { error: "Start time must be in HH:MM format", code: "INVALID_TIME" },
          { status: 400 },
        );
      updates.startTime = startTime;
    }
    if (endTime !== undefined) {
      if (!TIME_REGEX.test(endTime))
        return NextResponse.json(
          { error: "End time must be in HH:MM format", code: "INVALID_TIME" },
          { status: 400 },
        );
      updates.endTime = endTime;
    }
    if (breakMinutes !== undefined)
      updates.breakMinutes = parseInt(String(breakMinutes));
    if (workingHours !== undefined)
      updates.workingHours = parseFloat(String(workingHours));
    if (weekOff !== undefined) updates.weekOff = weekOff || null;
    if (graceMinutes !== undefined)
      updates.graceMinutes = parseInt(String(graceMinutes));
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const updated = await db
      .update(shifts)
      .set(updates)
      .where(eq(shifts.id, shiftId))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || isNaN(parseInt(id)))
      return NextResponse.json(
        { error: "Valid ID is required", code: "INVALID_ID" },
        { status: 400 },
      );

    const shiftId = parseInt(id);
    const deleted = await db
      .delete(shifts)
      .where(eq(shifts.id, shiftId))
      .returning();

    if (!deleted.length)
      return NextResponse.json(
        { error: "Not found", code: "NOT_FOUND" },
        { status: 404 },
      );

    return NextResponse.json({ message: "Deleted", deleted: deleted[0] });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 },
    );
  }
}
