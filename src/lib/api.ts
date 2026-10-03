import { NextResponse } from "next/server";
import { AuthError } from "./auth";

export function errorResponse(e: unknown) {
  if (e instanceof AuthError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  // Postgres integrity errors are the caller's fault, not ours
  const code = (e as { code?: string } | null)?.code;
  if (code === "23505") return NextResponse.json({ error: "That id already exists" }, { status: 409 });
  if (code === "23503") return NextResponse.json({ error: "That refers to a record that does not exist (or is still in use)" }, { status: 409 });
  if (code === "23514" || code === "23502" || code === "22P02" || code === "22007") {
    return NextResponse.json({ error: "A value was rejected by the database" }, { status: 400 });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message: string) {
  return NextResponse.json({ error: message }, { status: 404 });
}
