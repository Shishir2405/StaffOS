import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payHeads } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json({ error: "Valid ID is required", code: "INVALID_ID" }, { status: 400 });
      }
      const row = await db.select().from(payHeads).where(eq(payHeads.id, parsedId)).limit(1);
      if (!row.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(row[0]);
    }

    const rows = await db.select().from(payHeads).orderBy(desc(payHeads.id));
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: "Internal server error: " + e }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const name = (body.name ?? "").toString().trim();
    const code = (body.code ?? "").toString().trim();
    const category = (body.category ?? "").toString().trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required", code: "MISSING_NAME" }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ error: "Code is required", code: "MISSING_CODE" }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: "Category is required", code: "MISSING_CATEGORY" }, { status: 400 });
    }

    // Unique code check → 400 on dup
    const existing = await db.select().from(payHeads).where(eq(payHeads.code, code)).limit(1);
    if (existing.length) {
      return NextResponse.json({ error: "A pay head with this code already exists", code: "DUPLICATE_CODE" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const created = await db
      .insert(payHeads)
      .values({
        name,
        code,
        category,
        calculationType: body.calculationType ?? "Fixed",
        value: Number(body.value ?? 0),
        baseComponent: body.baseComponent ?? null,
        isTaxable: body.isTaxable !== undefined ? Boolean(body.isTaxable) : true,
        isStatutory: body.isStatutory !== undefined ? Boolean(body.isStatutory) : false,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        displayOrder: Number(body.displayOrder ?? 0),
        createdAt: now,
      })
      .returning();

    return NextResponse.json(created[0], { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error: " + e }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "Valid ID is required", code: "INVALID_ID" }, { status: 400 });
    }
    const parsedId = parseInt(id);

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name.toString().trim();
    if (body.category !== undefined) updates.category = body.category;
    if (body.calculationType !== undefined) updates.calculationType = body.calculationType;
    if (body.value !== undefined) updates.value = Number(body.value);
    if (body.baseComponent !== undefined) updates.baseComponent = body.baseComponent;
    if (body.isTaxable !== undefined) updates.isTaxable = Boolean(body.isTaxable);
    if (body.isStatutory !== undefined) updates.isStatutory = Boolean(body.isStatutory);
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.displayOrder !== undefined) updates.displayOrder = Number(body.displayOrder);

    if (body.code !== undefined) {
      const code = body.code.toString().trim();
      const dup = await db.select().from(payHeads).where(and(eq(payHeads.code, code))).limit(1);
      if (dup.length && dup[0].id !== parsedId) {
        return NextResponse.json({ error: "A pay head with this code already exists", code: "DUPLICATE_CODE" }, { status: 400 });
      }
      updates.code = code;
    }

    const updated = await db.update(payHeads).set(updates).where(eq(payHeads.id, parsedId)).returning();
    if (!updated.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (e) {
    return NextResponse.json({ error: "Internal server error: " + e }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "Valid ID is required", code: "INVALID_ID" }, { status: 400 });
    }

    const deleted = await db.delete(payHeads).where(eq(payHeads.id, parseInt(id))).returning();
    if (!deleted.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted", deleted: deleted[0] });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error: " + e }, { status: 500 });
  }
}
