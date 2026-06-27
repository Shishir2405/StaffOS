import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { costCenters } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

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

    if (id) {
      const cid = parseInt(id);
      if (isNaN(cid))
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );
      const row = await db
        .select()
        .from(costCenters)
        .where(eq(costCenters.id, cid))
        .limit(1);
      if (!row.length)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(row[0]);
    }

    const rows = await db
      .select()
      .from(costCenters)
      .orderBy(desc(costCenters.id));
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
    const { name, code, department, budget, spent, isActive } = body;

    if (!name || typeof name !== "string" || !name.trim())
      return NextResponse.json(
        { error: "name is required", code: "MISSING_NAME" },
        { status: 400 },
      );
    if (!code || typeof code !== "string" || !code.trim())
      return NextResponse.json(
        { error: "code is required", code: "MISSING_CODE" },
        { status: 400 },
      );

    const trimmedCode = code.trim();
    const dup = await db
      .select()
      .from(costCenters)
      .where(eq(costCenters.code, trimmedCode))
      .limit(1);
    if (dup.length)
      return NextResponse.json(
        { error: "Cost center code already exists", code: "DUPLICATE_CODE" },
        { status: 400 },
      );

    const now = new Date().toISOString();
    const created = await db
      .insert(costCenters)
      .values({
        name: name.trim(),
        code: trimmedCode,
        department: department || null,
        budget:
          budget !== undefined && !isNaN(Number(budget)) ? Number(budget) : 0,
        spent: spent !== undefined && !isNaN(Number(spent)) ? Number(spent) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
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
    const cid = parseInt(id);

    const existing = await db
      .select()
      .from(costCenters)
      .where(eq(costCenters.id, cid))
      .limit(1);
    if (!existing.length)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.code !== undefined) {
      const trimmedCode = String(body.code).trim();
      const dup = await db
        .select()
        .from(costCenters)
        .where(eq(costCenters.code, trimmedCode))
        .limit(1);
      if (dup.length && dup[0].id !== cid)
        return NextResponse.json(
          { error: "Cost center code already exists", code: "DUPLICATE_CODE" },
          { status: 400 },
        );
      updates.code = trimmedCode;
    }
    if (body.department !== undefined) updates.department = body.department;
    if (body.budget !== undefined) updates.budget = Number(body.budget);
    if (body.spent !== undefined) updates.spent = Number(body.spent);
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);

    const updated = await db
      .update(costCenters)
      .set(updates)
      .where(eq(costCenters.id, cid))
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
    const cid = parseInt(id);

    const deleted = await db
      .delete(costCenters)
      .where(eq(costCenters.id, cid))
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
