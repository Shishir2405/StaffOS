import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { taxDeclarations } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const VALID_PROOF_STATUSES = ["Declared", "Submitted", "Verified", "Rejected"];

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const employeeId = searchParams.get("employeeId");
    const financialYear = searchParams.get("financialYear");
    const proofStatus = searchParams.get("proofStatus");

    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId))
        return NextResponse.json(
          { error: "Valid ID is required", code: "INVALID_ID" },
          { status: 400 },
        );
      const row = await db
        .select()
        .from(taxDeclarations)
        .where(eq(taxDeclarations.id, parsedId))
        .limit(1);
      if (!row.length)
        return NextResponse.json(
          { error: "Tax declaration not found" },
          { status: 404 },
        );
      return NextResponse.json(row[0]);
    }

    const conditions = [];
    if (employeeId && !isNaN(parseInt(employeeId)))
      conditions.push(eq(taxDeclarations.employeeId, parseInt(employeeId)));
    if (financialYear)
      conditions.push(eq(taxDeclarations.financialYear, financialYear));
    if (proofStatus)
      conditions.push(eq(taxDeclarations.proofStatus, proofStatus));

    const rows =
      conditions.length > 0
        ? await db
            .select()
            .from(taxDeclarations)
            .where(and(...conditions))
            .orderBy(desc(taxDeclarations.id))
        : await db
            .select()
            .from(taxDeclarations)
            .orderBy(desc(taxDeclarations.id));

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
      financialYear,
      section,
      category,
      declaredAmount,
      proofAmount,
      proofUrl,
      proofStatus,
      remarks,
    } = body;

    if (!employeeId || isNaN(parseInt(String(employeeId))))
      return NextResponse.json(
        { error: "Employee is required", code: "MISSING_EMPLOYEE" },
        { status: 400 },
      );
    if (!financialYear)
      return NextResponse.json(
        { error: "Financial year is required", code: "MISSING_FY" },
        { status: 400 },
      );
    if (!section)
      return NextResponse.json(
        { error: "Section is required", code: "MISSING_SECTION" },
        { status: 400 },
      );
    if (!category)
      return NextResponse.json(
        { error: "Category is required", code: "MISSING_CATEGORY" },
        { status: 400 },
      );

    if (proofStatus && !VALID_PROOF_STATUSES.includes(proofStatus))
      return NextResponse.json(
        {
          error: `Invalid proof status. Must be one of: ${VALID_PROOF_STATUSES.join(", ")}`,
          code: "INVALID_PROOF_STATUS",
        },
        { status: 400 },
      );

    const now = new Date().toISOString();
    const created = await db
      .insert(taxDeclarations)
      .values({
        employeeId: parseInt(String(employeeId)),
        financialYear,
        section,
        category,
        declaredAmount: Number(declaredAmount) || 0,
        proofAmount: Number(proofAmount) || 0,
        proofUrl: proofUrl || null,
        proofStatus: proofStatus || "Declared",
        remarks: remarks || null,
        createdAt: now,
        updatedAt: now,
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
    const parsedId = parseInt(id);

    const existing = await db
      .select()
      .from(taxDeclarations)
      .where(eq(taxDeclarations.id, parsedId))
      .limit(1);
    if (!existing.length)
      return NextResponse.json(
        { error: "Tax declaration not found" },
        { status: 404 },
      );

    const body = await request.json();
    const {
      financialYear,
      section,
      category,
      declaredAmount,
      proofAmount,
      proofUrl,
      proofStatus,
      verifiedBy,
      remarks,
    } = body;

    const updates: any = { updatedAt: new Date().toISOString() };
    if (financialYear !== undefined) updates.financialYear = financialYear;
    if (section !== undefined) updates.section = section;
    if (category !== undefined) updates.category = category;
    if (declaredAmount !== undefined)
      updates.declaredAmount = Number(declaredAmount) || 0;
    if (proofAmount !== undefined)
      updates.proofAmount = Number(proofAmount) || 0;
    if (proofUrl !== undefined) updates.proofUrl = proofUrl;
    if (remarks !== undefined) updates.remarks = remarks;
    if (proofStatus !== undefined) {
      if (!VALID_PROOF_STATUSES.includes(proofStatus))
        return NextResponse.json(
          {
            error: `Invalid proof status. Must be one of: ${VALID_PROOF_STATUSES.join(", ")}`,
            code: "INVALID_PROOF_STATUS",
          },
          { status: 400 },
        );
      updates.proofStatus = proofStatus;
      updates.verifiedBy =
        verifiedBy !== undefined
          ? verifiedBy
          : (user as any).employeeId ?? null;
    } else if (verifiedBy !== undefined) {
      updates.verifiedBy = verifiedBy;
    }

    const updated = await db
      .update(taxDeclarations)
      .set(updates)
      .where(eq(taxDeclarations.id, parsedId))
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
    const parsedId = parseInt(id);

    const deleted = await db
      .delete(taxDeclarations)
      .where(eq(taxDeclarations.id, parsedId))
      .returning();

    if (!deleted.length)
      return NextResponse.json(
        { error: "Tax declaration not found" },
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
