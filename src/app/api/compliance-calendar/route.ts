import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { complianceCalendar } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const VALID_CATEGORIES = ["PF", "ESI", "PT", "TDS", "LWF", "GST", "Other"];
const VALID_FREQUENCIES = ["Monthly", "Quarterly", "Annual", "One-time"];
const VALID_STATUSES = ["Upcoming", "Completed", "Overdue"];

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const row = await db
        .select()
        .from(complianceCalendar)
        .where(eq(complianceCalendar.id, parseInt(id)))
        .limit(1);
      if (!row.length)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(row[0]);
    }

    // Soonest due dates first
    const rows = await db
      .select()
      .from(complianceCalendar)
      .orderBy(asc(complianceCalendar.dueDate));
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
    if (!body.title || String(body.title).trim() === "") {
      return NextResponse.json(
        { error: "Title is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    }
    if (!body.dueDate) {
      return NextResponse.json(
        { error: "Due date is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    }
    const category = VALID_CATEGORIES.includes(body.category)
      ? body.category
      : "Other";
    const frequency = VALID_FREQUENCIES.includes(body.frequency)
      ? body.frequency
      : "Monthly";

    const now = new Date().toISOString();
    const created = await db
      .insert(complianceCalendar)
      .values({
        title: String(body.title).trim(),
        category,
        dueDate: body.dueDate,
        frequency,
        status: VALID_STATUSES.includes(body.status)
          ? body.status
          : "Upcoming",
        description: body.description ?? null,
        completedAt: null,
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

// PUT → update status (mark Completed sets completedAt)
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Valid ID is required", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const updates: any = {};

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          {
            error: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
            code: "INVALID_STATUS",
          },
          { status: 400 },
        );
      }
      updates.status = body.status;
      updates.completedAt =
        body.status === "Completed"
          ? (body.completedAt ?? new Date().toISOString())
          : null;
    }
    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.category !== undefined) updates.category = body.category;
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate;
    if (body.frequency !== undefined) updates.frequency = body.frequency;
    if (body.description !== undefined) updates.description = body.description;

    const updated = await db
      .update(complianceCalendar)
      .set(updates)
      .where(eq(complianceCalendar.id, parseInt(id)))
      .returning();
    if (!updated.length)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Valid ID is required", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const deleted = await db
      .delete(complianceCalendar)
      .where(eq(complianceCalendar.id, parseInt(id)))
      .returning();
    if (!deleted.length)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted", deleted: deleted[0] });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 },
    );
  }
}
