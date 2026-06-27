import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

// GET → list newest first (or single by id)
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
        .from(auditLogs)
        .where(eq(auditLogs.id, parseInt(id)))
        .limit(1);
      if (!row.length)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(row[0]);
    }

    const rows = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id));
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 },
    );
  }
}

// POST → insert an audit event
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.action || String(body.action).trim() === "") {
      return NextResponse.json(
        { error: "Action is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    }
    if (!body.entity || String(body.entity).trim() === "") {
      return NextResponse.json(
        { error: "Entity is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const created = await db
      .insert(auditLogs)
      .values({
        userId: body.userId ?? (user as any).id ?? null,
        userName: body.userName ?? (user as any).name ?? (user as any).email ?? null,
        action: String(body.action).trim(),
        entity: String(body.entity).trim(),
        entityId: body.entityId != null ? String(body.entityId) : null,
        details: body.details ?? null,
        ipAddress:
          body.ipAddress ??
          request.headers.get("x-forwarded-for") ??
          request.headers.get("x-real-ip") ??
          null,
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
