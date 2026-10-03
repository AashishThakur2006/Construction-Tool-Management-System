import { NextRequest, NextResponse } from "next/server";
import { originGuard } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const blocked = originGuard(request);
  if (blocked) return blocked;
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
