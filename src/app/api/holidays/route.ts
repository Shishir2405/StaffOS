import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { holidays } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

const VALID_TYPES = ["Public", "Optional", "Restricted"];

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const year = searchParams.get("year");

    if (id) {
      const holidayId = parseInt(id);
      if (isNaN(holidayId))
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );

      const row = await db
        .select()
        .from(holidays)
        .where(eq(holidays.id, holidayId))
        .limit(1);
      if (!row.length)
        return NextResponse.json(
          { error: "Not found", code: "NOT_FOUND" },
          { status: 404 },
        );
      return NextResponse.json(row[0]);
    }

    const conditions = [];
    if (year && !isNaN(parseInt(year))) {
      conditions.push(eq(holidays.year, parseInt(year)));
    }

    const rows = conditions.length
      ? await db
          .select()
          .from(holidays)
          .where(and(...conditions))
          .orderBy(desc(holidays.date))
      : await db.select().from(holidays).orderBy(desc(holidays.date));

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
    const { name, date, type, description, year, isActive } = body;

    if (!name || name.trim() === "")
      return NextResponse.json(
        { error: "Name is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    if (!date || !isValidDate(date))
      return NextResponse.json(
        { error: "Date must be in YYYY-MM-DD format", code: "INVALID_DATE" },
        { status: 400 },
      );
    if (type && !VALID_TYPES.includes(type))
      return NextResponse.json(
        {
          error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`,
          code: "INVALID_TYPE",
        },
        { status: 400 },
      );

    const resolvedYear =
      year !== undefined && year !== null && !isNaN(parseInt(String(year)))
        ? parseInt(String(year))
        : new Date(date).getFullYear();

    const now = new Date().toISOString();
    const created = await db
      .insert(holidays)
      .values({
        name: name.trim(),
        date,
        type: type || "Public",
        description: description?.trim() || null,
        year: resolvedYear,
        isActive: isActive === undefined ? true : Boolean(isActive),
        createdAt: now,
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

    const holidayId = parseInt(id);
    const existing = await db
      .select()
      .from(holidays)
      .where(eq(holidays.id, holidayId))
      .limit(1);
    if (!existing.length)
      return NextResponse.json(
        { error: "Not found", code: "NOT_FOUND" },
        { status: 404 },
      );

    const body = await request.json();
    const { name, date, type, description, year, isActive } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (date !== undefined) {
      if (!isValidDate(date))
        return NextResponse.json(
          { error: "Date must be in YYYY-MM-DD format", code: "INVALID_DATE" },
          { status: 400 },
        );
      updates.date = date;
    }
    if (type !== undefined) {
      if (!VALID_TYPES.includes(type))
        return NextResponse.json(
          {
            error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`,
            code: "INVALID_TYPE",
          },
          { status: 400 },
        );
      updates.type = type;
    }
    if (description !== undefined) updates.description = description || null;
    if (year !== undefined) updates.year = parseInt(String(year));
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const updated = await db
      .update(holidays)
      .set(updates)
      .where(eq(holidays.id, holidayId))
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

    const holidayId = parseInt(id);
    const deleted = await db
      .delete(holidays)
      .where(eq(holidays.id, holidayId))
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
