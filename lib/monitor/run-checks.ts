import { createAdminClient } from "@/lib/supabase/admin";
import { sendAlert } from "@/lib/alerts";
import { checkEndpoint } from "./check-endpoint";
import { claimEndpoints, getDueEndpoints } from "./get-due-endpoints";
import { nextState, type Status } from "./state-machine";

const CONCURRENCY = 10;

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

export async function runChecks() {
  const now = new Date();
  const due = await getDueEndpoints(now);
  if (due.length === 0) return { due: 0, failed: 0, wentDown: 0, recovered: 0 };

  await claimEndpoints(
    due.map((e) => e.id),
    now,
  );

  const checked = await mapLimit(due, CONCURRENCY, async (ep) => ({
    ep,
    result: await checkEndpoint(ep),
  }));

  const supabase = createAdminClient();

  // 1) history
  const { error: historyError } = await supabase.from("check_results").insert(
    checked.map(({ ep, result }) => ({
      endpoint_id: ep.id,
      ok: result.ok,
      status_code: result.statusCode,
      response_ms: result.responseMs,
      error: result.error,
    })),
  );
  if (historyError) console.error("[check_results]", historyError.message);

  // 2) state, incidents, alerts
  let wentDown = 0;
  let recovered = 0;

  await Promise.all(
    checked.map(async ({ ep, result }) => {
      const next = nextState(
        {
          status: ep.current_status as Status,
          consecutiveFailures: ep.consecutive_failures,
          threshold: ep.failure_threshold,
        },
        result.ok,
      );

      const { error: stateError } = await supabase
        .from("endpoints")
        .update({
          current_status: next.status,
          consecutive_failures: next.consecutiveFailures,
        })
        .eq("id", ep.id);
      if (stateError) console.error("[endpoint state]", stateError.message);

      const alert = {
        siteName: ep.site.name,
        baseUrl: ep.site.base_url,
        path: ep.path,
        error: result.error,
      };

      if (next.transition === "went_down") {
        wentDown++;
        const { error } = await supabase
          .from("incidents")
          .insert({ endpoint_id: ep.id, last_error: result.error });
        // 23505 = an incident is already open (unique partial index) -> fine
        if (error && error.code !== "23505")
          console.error("[incident open]", error.message);
        await sendAlert({ kind: "down", ...alert });
      }

      if (next.transition === "recovered") {
        recovered++;
        const { error } = await supabase
          .from("incidents")
          .update({ resolved_at: new Date().toISOString() })
          .eq("endpoint_id", ep.id)
          .is("resolved_at", null);
        if (error) console.error("[incident close]", error.message);
        await sendAlert({ kind: "recovered", ...alert });
      }
    }),
  );

  return {
    due: due.length,
    failed: checked.filter((c) => !c.result.ok).length,
    wentDown,
    recovered,
  };
}
