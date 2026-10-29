import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/get-user";
import { deleteSite } from "@/actions/sites";
import { deleteEndpoint, toggleEndpoint } from "@/actions/endpoints";
import { ConfirmButton } from "@/components/confirm-button";
import { EndpointForm } from "@/components/endpoint-form";
import { StatusBadge } from "@/components/status-badge";
import { dangerButton, secondaryButton } from "@/components/ui/styles";

function timeAgo(iso: string | null): string {
  if (!iso) return "Not checked yet";
  const s = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 1000),
  );
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

async function SiteDetail({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  await getUser(); // request-time from here on (Date.now() below is safe)

  const supabase = await createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("*, endpoints(*)")
    .eq("id", siteId)
    .order("created_at", { referencedTable: "endpoints", ascending: true })
    .maybeSingle();

  if (!site) notFound();

  const endpoints = site.endpoints ?? [];

  return (
    <>
      <Link href="/sites" className="text-sm text-neutral-500 hover:underline">
        ← Back to sites
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold sm:text-2xl">{site.name}</h1>
          <p className="mt-0.5 break-all text-sm text-neutral-500">
            {site.base_url}
          </p>
        </div>
        <form action={deleteSite}>
          <input type="hidden" name="id" value={site.id} />
          <ConfirmButton
            message="Delete this site and all its endpoints and history?"
            className={dangerButton}
          >
            Delete site
          </ConfirmButton>
        </form>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Endpoints</h2>

      {endpoints.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">
          No endpoints yet. Add one below.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {endpoints.map((ep) => (
            <li
              key={ep.id}
              className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs dark:bg-neutral-800">
                    {ep.method}
                  </span>
                  <Link
                    href={`/sites/${site.id}/endpoints/${ep.id}`}
                    className="break-all font-mono text-sm font-medium hover:underline"
                  >
                    {ep.path}
                  </Link>
                  <StatusBadge
                    status={ep.current_status}
                    active={ep.is_active}
                  />
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/sites/${site.id}/endpoints/${ep.id}`}
                    className={secondaryButton}
                  >
                    Details
                  </Link>
                  <form action={toggleEndpoint}>
                    <input type="hidden" name="id" value={ep.id} />
                    <input type="hidden" name="siteId" value={site.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={ep.is_active ? "false" : "true"}
                    />
                    <button className={secondaryButton}>
                      {ep.is_active ? "Pause" : "Resume"}
                    </button>
                  </form>
                  <form action={deleteEndpoint}>
                    <input type="hidden" name="id" value={ep.id} />
                    <input type="hidden" name="siteId" value={site.id} />
                    <ConfirmButton
                      message="Delete this endpoint and its history?"
                      className={dangerButton}
                    >
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              </div>

              <p className="mt-2 text-sm text-neutral-500">
                Every {ep.interval_minutes} min · timeout {ep.timeout_seconds}s
                · expects {ep.expected_status}
                {ep.keyword ? ` · keyword “${ep.keyword}”` : ""} · down after{" "}
                {ep.failure_threshold} failures
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Last checked: {timeAgo(ep.last_checked_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 text-lg font-semibold">Add endpoint</h2>
      <div className="mt-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <EndpointForm siteId={site.id} />
      </div>
    </>
  );
}

export default function SitePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <SiteDetail params={params} />
      </Suspense>
    </main>
  );
}
