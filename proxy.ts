// Next.js 16+: proxy.ts / export function proxy
// Next.js 15 or older: rename this file to middleware.ts and the function to `middleware`.
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // skip static assets and the cron endpoint (it uses CRON_SECRET instead)
    "/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
