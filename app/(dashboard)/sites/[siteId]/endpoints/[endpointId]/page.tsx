import { BackLink } from "@/components/back-link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/get-user";
import { idSchema } from "@/lib/validators";
import { StatusBadge } from "@/components/status-badge";
import { LocalTime } from "@/components/local-time";
import { ResponseChart } from "@/components/response-chart";
import { EndpointSettingsForm } from "@/components/endpoint-settings-form";

type Params = Promise<{ siteId: string; endpointId: string }>;

function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "under 1 min";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

function getNow() {
  return Date.now();
}

const card = "rounded-xl border border-neutral-200 p-4 dark:border-neutral-800";

async function EndpointDetail({ params }: { params: Params }) {
  const { siteId, endpointId } = await params;
  await getUser(); // request-time from here on (Date.now() below is safe)
  const now = getNow();

  if (
    !idSchema.safeParse(siteId).success ||
    !idSchema.safeParse(endpointId).success
  ) {
    notFound();
  }

  const supabase = await createClient();
  const [endpointRes, statsRes, seriesRes, checksRes, incidentsRes] =
    await Promise.all([
      supabase
        .from("endpoints")
        .select("*, site:sites(id, name, base_url)")
        .eq("id", endpointId)
        .eq("site_id", siteId)
        .maybeSingle(),
      supabase.rpc("endpoint_uptime", { p_endpoint_id: endpointId }),
      supabase.rpc("endpoint_response_series", {
        p_endpoint_id: endpointId,
        p_hours: 24,
        p_bucket_minutes: 15,
      }),
      supabase
        .from("check_results")
        .select("id, checked_at, ok, status_code, response_ms, error")
        .eq("endpoint_id", endpointId)
        .order("checked_at", { ascending: false })
        .limit(20),
      supabase
        .from("incidents")
        .select("id, started_at, resolved_at, last_error")
        .eq("endpoint_id", endpointId)
        .order("started_at", { ascending: false })
        .limit(10),
    ]);

  const endpoint = endpointRes.data;
  const site = endpoint?.site as unknown as {
    id: string;
    name: string;
    base_url: string;
  } | null;
  if (!endpoint || !site) notFound();

  const stats = new Map((statsRes.data ?? []).map((s) => [s.window_label, s]));
  const series = (seriesRes.data ?? []).map((r) => ({
    t: r.bucket,
    avg: r.avg_ms,
    checks: r.checks,
    failures: r.failures,
  }));
  const checks = checksRes.data ?? [];
  const incidents = incidentsRes.data ?? [];

  return (
    <>
      <BackLink href={`/sites?open=${site.id}`}>{site.name}</BackLink>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs dark:bg-neutral-800">
          {endpoint.method}
        </span>
        <h1 className="break-all font-mono text-lg font-semibold sm:text-xl">
          {endpoint.path}
        </h1>
        <StatusBadge
          status={endpoint.current_status}
          active={endpoint.is_active}
        />
      </div>
      <p className="mt-1 break-all text-sm text-neutral-500">
        {site.base_url}
        {endpoint.path}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["24h", "7d", "30d"] as const).map((w) => {
          const s = stats.get(w);
          return (
            <div key={w} className={card}>
              <p className="text-sm text-neutral-500">Uptime ({w})</p>
              <p className="mt-1 text-2xl font-semibold">
                {s?.uptime_pct == null ? "—" : `${s.uptime_pct}%`}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {s?.total ?? 0} checks
              </p>
            </div>
          );
        })}
        <div className={card}>
          <p className="text-sm text-neutral-500">Avg response (24h)</p>
          <p className="mt-1 text-2xl font-semibold">
            {stats.get("24h")?.avg_ms == null
              ? "—"
              : `${stats.get("24h")?.avg_ms} ms`}
          </p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">
        Response time (last 24 hours)
      </h2>
      <div className={`${card} mt-3`}>
        <ResponseChart data={series} />
      </div>

      <h2 className="mt-8 text-lg font-semibold">Incidents</h2>
      {incidents.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No incidents recorded.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {incidents.map((i) => {
            const end = i.resolved_at ? new Date(i.resolved_at).getTime() : now;
            return (
              <li key={i.id} className={card}>
                <p className="text-sm">
                  <span
                    className={
                      i.resolved_at ? "font-medium" : "font-medium text-red-600"
                    }
                  >
                    {i.resolved_at ? "Resolved" : "Ongoing"}
                  </span>{" "}
                  · lasted{" "}
                  {formatDuration(end - new Date(i.started_at).getTime())}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Started <LocalTime iso={i.started_at} />
                  {i.resolved_at && (
                    <>
                      {" "}
                      · ended <LocalTime iso={i.resolved_at} />
                    </>
                  )}
                </p>
                {i.last_error && (
                  <p className="mt-1 break-words text-xs text-neutral-500">
                    {i.last_error}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mt-8 text-lg font-semibold">Recent checks</h2>
      {checks.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No checks yet.</p>
      ) : (
        <div className={`${card} mt-3 overflow-x-auto p-0`}>
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs text-neutral-500 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Result</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Response</th>
                <th className="px-4 py-2 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                >
                  <td className="whitespace-nowrap px-4 py-2">
                    <LocalTime iso={c.checked_at} />
                  </td>
                  <td
                    className={`px-4 py-2 font-medium ${c.ok ? "text-green-700 dark:text-green-400" : "text-red-600"}`}
                  >
                    {c.ok ? "OK" : "Failed"}
                  </td>
                  <td className="px-4 py-2">{c.status_code ?? "—"}</td>
                  <td className="px-4 py-2">
                    {c.response_ms == null ? "—" : `${c.response_ms} ms`}
                  </td>
                  <td
                    className="max-w-xs truncate px-4 py-2 text-neutral-500"
                    title={c.error ?? ""}
                  >
                    {c.error ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold">Settings</h2>
      <div className={`${card} mt-3`}>
        <EndpointSettingsForm
          id={endpoint.id}
          siteId={site.id}
          intervalMinutes={endpoint.interval_minutes}
          timeoutSeconds={endpoint.timeout_seconds}
          expectedStatus={endpoint.expected_status}
          failureThreshold={endpoint.failure_threshold}
          keyword={endpoint.keyword}
        />
      </div>
    </>
  );
}

export default function EndpointPage({ params }: { params: Params }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <EndpointDetail params={params} />
      </Suspense>
    </main>
  );
}
