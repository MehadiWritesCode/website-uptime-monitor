import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/get-user";
import { timeAgo } from "@/lib/format";
import { SiteCard } from "@/components/monitors/site-card";
import type { RecentCheck, SiteView } from "@/components/monitors/types";
import { BackLink } from "@/components/back-link";
import { primaryButton } from "@/components/ui/styles";

type SearchParams = Promise<{ open?: string }>;

async function SiteList({ searchParams }: { searchParams: SearchParams }) {
  const { open } = await searchParams;
  const user = await getUser(); // request-time from here on
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [sitesRes, overviewRes, recentRes] = await Promise.all([
    supabase
      .from("sites")
      .select("*, endpoints(*)")
      .order("created_at", { ascending: false })
      .order("created_at", { referencedTable: "endpoints", ascending: true }),
    supabase.rpc("endpoints_overview"),
    supabase.rpc("endpoints_recent_results", { p_limit: 30 }),
  ]);

  if (sitesRes.error) {
    return (
      <p role="alert" className="mt-6 text-sm text-red-600">
        Could not load sites.
      </p>
    );
  }

  const overview = new Map(
    (overviewRes.data ?? []).map((o) => [o.endpoint_id, o]),
  );

  const recent = new Map<string, RecentCheck[]>();
  for (const r of recentRes.data ?? []) {
    const list = recent.get(r.endpoint_id) ?? [];
    list.push({ ok: r.ok, ms: r.response_ms });
    recent.set(r.endpoint_id, list);
  }

  const sites: SiteView[] = (sitesRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    baseUrl: s.base_url,
    endpoints: (s.endpoints ?? []).map((e) => {
      const o = overview.get(e.id);
      return {
        id: e.id,
        path: e.path,
        method: e.method,
        isActive: e.is_active,
        status: e.current_status,
        intervalMinutes: e.interval_minutes,
        timeoutSeconds: e.timeout_seconds,
        expectedStatus: e.expected_status,
        failureThreshold: e.failure_threshold,
        keyword: e.keyword,
        lastChecked: timeAgo(e.last_checked_at),
        checks24h: o?.checks ?? 0,
        ok24h: o?.ok_count ?? 0,
        uptime24h: o?.uptime_pct ?? null,
        avgMs24h: o?.avg_ms ?? null,
        recent: (recent.get(e.id) ?? []).slice().reverse(), // oldest -> newest
      };
    }),
  }));

  if (sites.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500">
          No sites yet. Add a site, then the paths you want to monitor.
        </p>
        <Link href="/sites/new" className={`${primaryButton} mt-4`}>
          Add site
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {sites.map((site) => (
        <SiteCard
          key={site.id}
          site={site}
          defaultOpen={site.id === open || sites.length === 1}
          addOpen={site.id === open}
        />
      ))}
    </div>
  );
}

export default function SitesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <BackLink href="/dashboard">Dashboard</BackLink>
      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold sm:text-2xl">Sites</h1>
        <Link href="/sites/new" className={primaryButton}>
          Add site
        </Link>
      </div>

      <Suspense
        fallback={<p className="mt-6 text-sm text-neutral-500">Loading…</p>}
      >
        <SiteList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
