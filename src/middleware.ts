import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// Only the app shell needs the session cookie refreshed. The marketing pages
// are public, and the API routes read the session themselves, so none of them
// should pay a Supabase round-trip on every request.
export const config = {
  matcher: ["/app/:path*"],
};
