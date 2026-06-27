import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { backups } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const VALID_TYPES = ["Manual", "Auto", "Scheduled"];
const VALID_STATUSES = ["Completed", "Failed", "In Progress"];

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
        .from(backups)
        .where(eq(backups.id, parseInt(id)))
        .limit(1);
      if (!row.length)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(row[0]);
    }

    const rows = await db
      .select()
      .from(backups)
      .orderBy(desc(backups.createdAt), desc(backups.id));
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
    const now = new Date().toISOString();
    const fileName =
      body.fileName && String(body.fileName).trim() !== ""
        ? String(body.fileName).trim()
        : `staffos-backup-${now}.sql`;

    const created = await db
      .insert(backups)
      .values({
        fileName,
        sizeBytes: Number.isFinite(Number(body.sizeBytes))
          ? Math.max(0, Math.round(Number(body.sizeBytes)))
          : 0,
        type: VALID_TYPES.includes(body.type) ? body.type : "Manual",
        status: VALID_STATUSES.includes(body.status) ? body.status : "Completed",
        notes: body.notes ?? null,
        createdBy:
          body.createdBy ?? (user as any).name ?? (user as any).email ?? null,
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
      .delete(backups)
      .where(eq(backups.id, parseInt(id)))
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
