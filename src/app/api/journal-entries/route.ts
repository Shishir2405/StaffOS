import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { journalEntries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const VALID_STATUSES = ["Draft", "Posted", "Exported"];

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const jid = parseInt(id);
      if (isNaN(jid))
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );
      const row = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, jid))
        .limit(1);
      if (!row.length)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(row[0]);
    }

    const rows = await db
      .select()
      .from(journalEntries)
      .orderBy(desc(journalEntries.id));
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
      payrollRunId,
      entryDate,
      account,
      accountCode,
      debit,
      credit,
      narration,
      costCenterId,
      status,
    } = body;

    if (!entryDate || typeof entryDate !== "string")
      return NextResponse.json(
        { error: "entryDate is required", code: "MISSING_ENTRY_DATE" },
        { status: 400 },
      );
    if (!account || typeof account !== "string" || !account.trim())
      return NextResponse.json(
        { error: "account is required", code: "MISSING_ACCOUNT" },
        { status: 400 },
      );

    const now = new Date().toISOString();
    const created = await db
      .insert(journalEntries)
      .values({
        payrollRunId: payrollRunId ? parseInt(String(payrollRunId)) : null,
        entryDate,
        account: account.trim(),
        accountCode: accountCode || null,
        debit: debit !== undefined && !isNaN(Number(debit)) ? Number(debit) : 0,
        credit:
          credit !== undefined && !isNaN(Number(credit)) ? Number(credit) : 0,
        narration: narration || null,
        costCenterId: costCenterId ? parseInt(String(costCenterId)) : null,
        status: status && VALID_STATUSES.includes(status) ? status : "Draft",
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
    const jid = parseInt(id);

    const existing = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.id, jid))
      .limit(1);
    if (!existing.length)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status))
        return NextResponse.json(
          { error: "Invalid status", code: "INVALID_STATUS" },
          { status: 400 },
        );
      updates.status = body.status;
    }
    if (body.account !== undefined) updates.account = body.account;
    if (body.accountCode !== undefined) updates.accountCode = body.accountCode;
    if (body.debit !== undefined) updates.debit = Number(body.debit);
    if (body.credit !== undefined) updates.credit = Number(body.credit);
    if (body.narration !== undefined) updates.narration = body.narration;
    if (body.costCenterId !== undefined)
      updates.costCenterId = body.costCenterId
        ? parseInt(String(body.costCenterId))
        : null;

    const updated = await db
      .update(journalEntries)
      .set(updates)
      .where(eq(journalEntries.id, jid))
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
    const jid = parseInt(id);

    const deleted = await db
      .delete(journalEntries)
      .where(eq(journalEntries.id, jid))
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
