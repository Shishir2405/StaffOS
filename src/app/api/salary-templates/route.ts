import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salaryTemplates } from "@/db/schema";
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
      const row = await db
        .select()
        .from(salaryTemplates)
        .where(eq(salaryTemplates.id, parseInt(id)))
        .limit(1);
      if (!row.length)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(row[0]);
    }

    const rows = await db
      .select()
      .from(salaryTemplates)
      .orderBy(desc(salaryTemplates.id));
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
    if (!body.name || String(body.name).trim() === "") {
      return NextResponse.json(
        { error: "Name is required", code: "MISSING_FIELD" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const created = await db
      .insert(salaryTemplates)
      .values({
        name: String(body.name).trim(),
        description: body.description ?? null,
        basicPercent: Number(body.basicPercent ?? 40),
        hraPercent: Number(body.hraPercent ?? 20),
        components: body.components ?? null,
        ctcMin: Number(body.ctcMin ?? 0),
        ctcMax: Number(body.ctcMax ?? 0),
        isActive: body.isActive !== undefined ? !!body.isActive : true,
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
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Valid ID is required", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const updates: any = {};
    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.description !== undefined) updates.description = body.description;
    if (body.basicPercent !== undefined)
      updates.basicPercent = Number(body.basicPercent);
    if (body.hraPercent !== undefined)
      updates.hraPercent = Number(body.hraPercent);
    if (body.components !== undefined) updates.components = body.components;
    if (body.ctcMin !== undefined) updates.ctcMin = Number(body.ctcMin);
    if (body.ctcMax !== undefined) updates.ctcMax = Number(body.ctcMax);
    if (body.isActive !== undefined) updates.isActive = !!body.isActive;

    const updated = await db
      .update(salaryTemplates)
      .set(updates)
      .where(eq(salaryTemplates.id, parseInt(id)))
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
      .delete(salaryTemplates)
      .where(eq(salaryTemplates.id, parseInt(id)))
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
