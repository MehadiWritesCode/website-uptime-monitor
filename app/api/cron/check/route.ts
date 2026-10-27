import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runChecks } from "@/lib/monitor/run-checks";

// Reading request headers makes this handler dynamic by itself, so no
// `dynamic` segment config (it is not allowed with Cache Components).
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // never run unprotected

  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runChecks();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    console.error("[cron/check]", error);
    return NextResponse.json(
      { ok: false, error: "Check run failed" },
      { status: 500 },
    );
  }
}

// pg_net sends POST; GET is handy for manual testing
export const GET = handle;
export const POST = handle;
