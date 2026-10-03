import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

/** Liveness + database reachability for uptime monitors. Reveals no data. */
export async function GET() {
  const started = Date.now();
  try {
    await sql`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up", ms: Date.now() - started });
  } catch {
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
