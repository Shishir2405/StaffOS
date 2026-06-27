import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { insurancePolicies } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const VALID_STATUSES = ["Active", "Expired", "Cancelled"];

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const pid = parseInt(id);
      if (isNaN(pid))
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );
      const row = await db
        .select()
        .from(insurancePolicies)
        .where(eq(insurancePolicies.id, pid))
        .limit(1);
      if (!row.length)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(row[0]);
    }

    const rows = await db
      .select()
      .from(insurancePolicies)
      .orderBy(desc(insurancePolicies.id));
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
      employeeId,
      policyType,
      provider,
      policyNumber,
      coverageAmount,
      premium,
      employeeShare,
      employerShare,
      startDate,
      endDate,
      status,
    } = body;

    if (!employeeId || isNaN(parseInt(String(employeeId))))
      return NextResponse.json(
        { error: "employeeId is required", code: "MISSING_EMPLOYEE" },
        { status: 400 },
      );
    if (!policyType || typeof policyType !== "string" || !policyType.trim())
      return NextResponse.json(
        { error: "policyType is required", code: "MISSING_POLICY_TYPE" },
        { status: 400 },
      );
    if (!provider || typeof provider !== "string" || !provider.trim())
      return NextResponse.json(
        { error: "provider is required", code: "MISSING_PROVIDER" },
        { status: 400 },
      );

    const now = new Date().toISOString();
    const created = await db
      .insert(insurancePolicies)
      .values({
        employeeId: parseInt(String(employeeId)),
        policyType: policyType.trim(),
        provider: provider.trim(),
        policyNumber: policyNumber || null,
        coverageAmount:
          coverageAmount !== undefined && !isNaN(Number(coverageAmount))
            ? Number(coverageAmount)
            : 0,
        premium:
          premium !== undefined && !isNaN(Number(premium))
            ? Number(premium)
            : 0,
        employeeShare:
          employeeShare !== undefined && !isNaN(Number(employeeShare))
            ? Number(employeeShare)
            : 0,
        employerShare:
          employerShare !== undefined && !isNaN(Number(employerShare))
            ? Number(employerShare)
            : 0,
        startDate: startDate || null,
        endDate: endDate || null,
        status: status && VALID_STATUSES.includes(status) ? status : "Active",
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
    const pid = parseInt(id);

    const existing = await db
      .select()
      .from(insurancePolicies)
      .where(eq(insurancePolicies.id, pid))
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
    if (body.policyType !== undefined) updates.policyType = body.policyType;
    if (body.provider !== undefined) updates.provider = body.provider;
    if (body.policyNumber !== undefined)
      updates.policyNumber = body.policyNumber;
    if (body.coverageAmount !== undefined)
      updates.coverageAmount = Number(body.coverageAmount);
    if (body.premium !== undefined) updates.premium = Number(body.premium);
    if (body.employeeShare !== undefined)
      updates.employeeShare = Number(body.employeeShare);
    if (body.employerShare !== undefined)
      updates.employerShare = Number(body.employerShare);

    const updated = await db
      .update(insurancePolicies)
      .set(updates)
      .where(eq(insurancePolicies.id, pid))
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
    const pid = parseInt(id);

    const deleted = await db
      .delete(insurancePolicies)
      .where(eq(insurancePolicies.id, pid))
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
