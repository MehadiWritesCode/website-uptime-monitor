import { deleteSite } from "@/actions/sites";
import { ConfirmButton } from "@/components/confirm-button";
import { EndpointForm } from "@/components/endpoint-form";
import { StatusBadge } from "@/components/status-badge";
import { dangerButton } from "@/components/ui/styles";
import { Chevron } from "./chevron";
import { EndpointRow } from "./endpoint-row";
import type { SiteView } from "./types";

function summarize(site: SiteView) {
  const eps = site.endpoints;
  const active = eps.filter((e) => e.isActive);
  const down = active.filter((e) => e.status === "down").length;
  const pending = active.filter(
    (e) => e.status !== "up" && e.status !== "down",
  ).length;

  if (eps.length === 0)
    return { status: "unknown", active: true, label: "No endpoints" };
  if (active.length === 0)
    return { status: "unknown", active: false, label: "All paused" };
  if (down > 0) return { status: "down", active: true, label: `${down} down` };
  if (pending > 0) return { status: "unknown", active: true, label: "Pending" };
  return { status: "up", active: true, label: "All up" };
}

export function SiteCard({
  site,
  defaultOpen,
  addOpen,
}: {
  site: SiteView;
  defaultOpen: boolean;
  addOpen: boolean;
}) {
  const badge = summarize(site);
  const total = site.endpoints.reduce((n, e) => n + e.checks24h, 0);
  const ok = site.endpoints.reduce((n, e) => n + e.ok24h, 0);
  const uptime = total > 0 ? `${Math.round((ok / total) * 1000) / 10}%` : "—";
  const count = site.endpoints.length;

  return (
    <details
      id={`site-${site.id}`}
      open={defaultOpen}
      className="group/site rounded-xl border border-neutral-200 dark:border-neutral-800"
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 [&::-webkit-details-marker]:hidden">
        <Chevron className="group-open/site:rotate-45" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{site.name}</p>
          <p className="truncate text-sm text-neutral-500">{site.baseUrl}</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <StatusBadge
            status={badge.status}
            active={badge.active}
            label={badge.label}
          />
          <span className="hidden text-neutral-500 sm:inline">
            {count} endpoint{count === 1 ? "" : "s"}
          </span>
          <span className="tabular-nums text-neutral-500">{uptime}</span>
        </div>
      </summary>

      <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
        {count === 0 ? (
          <p className="mb-3 text-sm text-neutral-500">
            No endpoints yet. Add the first path to monitor below.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {site.endpoints.map((ep) => (
              <EndpointRow key={ep.id} siteId={site.id} ep={ep} />
            ))}
          </div>
        )}

        <details
          open={addOpen}
          className="mt-3 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700"
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="text-lg leading-none">
              +
            </span>
            Add endpoint
          </summary>
          <div className="border-t border-dashed border-neutral-300 p-4 dark:border-neutral-700">
            <EndpointForm siteId={site.id} />
          </div>
        </details>

        <div className="mt-4 flex justify-end">
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
      </div>
    </details>
  );
}
