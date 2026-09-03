import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // skip the API, the OAuth callback, Next internals and static assets
    "/((?!api|auth/callback|_next/static|_next/image|favicon.ico|js/|art/|styles.css|landing.css|landing.js|guide.html|signature-demo.html).*)",
  ],
};
