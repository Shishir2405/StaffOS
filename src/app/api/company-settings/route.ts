import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companySettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const ALLOWED_FIELDS = [
  "companyName",
  "legalName",
  "address",
  "city",
  "state",
  "pincode",
  "email",
  "phone",
  "pan",
  "tan",
  "gstin",
  "pfNumber",
  "esiNumber",
  "ptNumber",
  "lwfNumber",
  "logoUrl",
  "financialYearStart",
  "currency",
  "emailNotifications",
  "smsNotifications",
] as const;

function pickFields(body: any) {
  const out: Record<string, any> = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

// GET → returns the single config row (or null)
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db.select().from(companySettings).limit(1);
    return NextResponse.json(rows[0] ?? null);
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 },
    );
  }
}

// POST = upsert the single row
async function upsert(request: NextRequest) {
  const user = await getUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const fields = pickFields(body);
  const now = new Date().toISOString();

  const existing = await db.select().from(companySettings).limit(1);

  if (existing.length) {
    const updated = await db
      .update(companySettings)
      .set({ ...fields, updatedAt: now })
      .where(eq(companySettings.id, existing[0].id))
      .returning();
    return NextResponse.json(updated[0]);
  }

  if (!fields.companyName || String(fields.companyName).trim() === "") {
    return NextResponse.json(
      { error: "Company name is required", code: "MISSING_FIELD" },
      { status: 400 },
    );
  }

  const created = await db
    .insert(companySettings)
    .values({
      companyName: fields.companyName,
      ...fields,
      currency: fields.currency ?? "INR",
      updatedAt: now,
    })
    .returning();
  return NextResponse.json(created[0], { status: 201 });
}

export async function POST(request: NextRequest) {
  try {
    return await upsert(request);
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    return await upsert(request);
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 },
    );
  }
}
