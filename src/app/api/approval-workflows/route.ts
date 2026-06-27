import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { approvalWorkflows } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const VALID_MODULES = [
  "Leave",
  "Reimbursement",
  "Loan",
  "Payroll",
  "Overtime",
];

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
        .from(approvalWorkflows)
        .where(eq(approvalWorkflows.id, parseInt(id)))
        .limit(1);
      if (!row.length)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(row[0]);
    }

    const rows = await db
      .select()
      .from(approvalWorkflows)
      .orderBy(desc(approvalWorkflows.id));
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
    if (!body.module || !VALID_MODULES.includes(body.module)) {
      return NextResponse.json(
        {
          error: `Module must be one of: ${VALID_MODULES.join(", ")}`,
          code: "INVALID_MODULE",
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const created = await db
      .insert(approvalWorkflows)
      .values({
        name: String(body.name).trim(),
        module: body.module,
        levels: body.levels ?? null,
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
    if (body.module !== undefined) {
      if (!VALID_MODULES.includes(body.module)) {
        return NextResponse.json(
          {
            error: `Module must be one of: ${VALID_MODULES.join(", ")}`,
            code: "INVALID_MODULE",
          },
          { status: 400 },
        );
      }
      updates.module = body.module;
    }
    if (body.levels !== undefined) updates.levels = body.levels;
    if (body.isActive !== undefined) updates.isActive = !!body.isActive;

    const updated = await db
      .update(approvalWorkflows)
      .set(updates)
      .where(eq(approvalWorkflows.id, parseInt(id)))
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
      .delete(approvalWorkflows)
      .where(eq(approvalWorkflows.id, parseInt(id)))
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
