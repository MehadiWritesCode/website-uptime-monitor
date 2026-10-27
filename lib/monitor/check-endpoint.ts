import { assertPublicUrl } from "./ssrf-guard";
import type { DueEndpoint } from "./get-due-endpoints";

export type CheckResult = {
  ok: boolean;
  statusCode: number | null;
  responseMs: number | null;
  error: string | null;
};

const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 512 * 1024;

export async function checkEndpoint(ep: DueEndpoint): Promise<CheckResult> {
  const started = performance.now();
  const timeoutMs = ep.timeout_seconds * 1000;
  const signal = AbortSignal.timeout(timeoutMs);

  try {
    return await Promise.race([
      run(ep, signal, started),
      rejectOnAbort(signal, timeoutMs),
    ]);
  } catch (e) {
    return {
      ok: false,
      statusCode: null,
      responseMs: Math.round(performance.now() - started),
      error: describeError(e),
    };
  }
}

async function run(
  ep: DueEndpoint,
  signal: AbortSignal,
  started: number,
): Promise<CheckResult> {
  // Build from origin + path so a path like "//evil.com" can never change the host.
  const base = new URL(ep.site.base_url);
  const prefix = base.pathname.replace(/\/+$/, "");
  let current = new URL(base.origin + prefix + ep.path);

  const wantsBody = !!ep.keyword && ep.method === "GET";

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(current.href); // re-checked on every redirect hop

    const res = await fetch(current, {
      method: ep.method,
      redirect: "manual",
      cache: "no-store",
      signal,
      headers: { "user-agent": "UptimeMonitor/1.0", accept: "*/*" },
    });

    const location = res.headers.get("location");
    const isRedirect = res.status >= 300 && res.status < 400 && !!location;

    // follow redirects unless the user explicitly expects this redirect status
    if (isRedirect && res.status !== ep.expected_status) {
      await res.body?.cancel();
      current = new URL(location, current);
      continue;
    }

    const body = wantsBody
      ? await readCapped(res)
      : (await res.body?.cancel(), "");
    const responseMs = Math.round(performance.now() - started);

    if (res.status !== ep.expected_status) {
      return fail(
        res.status,
        responseMs,
        `Expected status ${ep.expected_status}, got ${res.status}`,
      );
    }
    if (wantsBody && !body.includes(ep.keyword!)) {
      return fail(res.status, responseMs, "Keyword not found in response body");
    }
    return { ok: true, statusCode: res.status, responseMs, error: null };
  }

  throw new Error(`Too many redirects (more than ${MAX_REDIRECTS})`);
}

function fail(
  statusCode: number,
  responseMs: number,
  error: string,
): CheckResult {
  return { ok: false, statusCode, responseMs, error };
}

async function readCapped(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    text += decoder.decode(value, { stream: true });
    if (bytes >= MAX_BODY_BYTES) {
      await reader.cancel();
      break;
    }
  }
  return text;
}

function rejectOnAbort(signal: AbortSignal, ms: number): Promise<never> {
  return new Promise((_, reject) => {
    signal.addEventListener(
      "abort",
      () => reject(new Error(`Timed out after ${ms / 1000}s`)),
      { once: true },
    );
  });
}

function describeError(e: unknown): string {
  if (e instanceof Error) {
    const code = (e.cause as { code?: string } | undefined)?.code;
    return code ? `${e.message} (${code})` : e.message;
  }
  return String(e);
}
