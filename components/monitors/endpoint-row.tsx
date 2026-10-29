import Link from "next/link";
import { deleteEndpoint, toggleEndpoint } from "@/actions/endpoints";
import { ConfirmButton } from "@/components/confirm-button";
import { EndpointSettingsForm } from "@/components/endpoint-settings-form";
import { StatusBadge } from "@/components/status-badge";
import {
  dangerButton,
  primaryButton,
  secondaryButton,
} from "@/components/ui/styles";
import { Chevron } from "./chevron";
import { RecentBars } from "./recent-bars";
import type { EndpointView } from "./types";

export function EndpointRow({
  siteId,
  ep,
}: {
  siteId: string;
  ep: EndpointView;
}) {
  const hasData = ep.uptime24h != null;
  const summary = hasData
    ? `${ep.uptime24h}%${ep.avgMs24h != null ? ` · ${ep.avgMs24h} ms` : ""}`
    : "No data yet";

  const facts: [string, string][] = [
    ["Interval", `${ep.intervalMinutes} min`],
    ["Timeout", `${ep.timeoutSeconds}s`],
    ["Expected status", String(ep.expectedStatus)],
    [
      "Down after",
      `${ep.failureThreshold} failure${ep.failureThreshold === 1 ? "" : "s"}`,
    ],
    [
      "Uptime (24h)",
      hasData ? `${ep.uptime24h}% · ${ep.checks24h} checks` : "—",
    ],
    ["Avg response (24h)", ep.avgMs24h == null ? "—" : `${ep.avgMs24h} ms`],
    ["Last checked", ep.lastChecked],
    ["Keyword", ep.keyword ?? "—"],
  ];

  return (
    <details className="group/ep rounded-lg border border-neutral-200 dark:border-neutral-800">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 [&::-webkit-details-marker]:hidden">
        <Chevron className="group-open/ep:rotate-45" />
        <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs dark:bg-neutral-800">
          {ep.method}
        </span>
        <span className="min-w-0 flex-1 break-all font-mono text-sm font-medium">
          {ep.path}
        </span>
        <StatusBadge status={ep.status} active={ep.isActive} />
        <span className="text-sm tabular-nums text-neutral-500">{summary}</span>
        <div className="w-full pl-5 sm:w-auto sm:pl-0">
          <RecentBars checks={ep.recent} />
        </div>
      </summary>

      <div className="border-t border-neutral-200 px-3 py-4 dark:border-neutral-800">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-neutral-500">{label}</dt>
              <dd className="mt-0.5 break-words text-sm font-medium">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/sites/${siteId}/endpoints/${ep.id}`}
            className={primaryButton}
          >
            Full details
          </Link>
          <form action={toggleEndpoint}>
            <input type="hidden" name="id" value={ep.id} />
            <input type="hidden" name="siteId" value={siteId} />
            <input
              type="hidden"
              name="active"
              value={ep.isActive ? "false" : "true"}
            />
            <button className={`${secondaryButton} min-h-10`}>
              {ep.isActive ? "Pause" : "Resume"}
            </button>
          </form>
          <form action={deleteEndpoint}>
            <input type="hidden" name="id" value={ep.id} />
            <input type="hidden" name="siteId" value={siteId} />
            <ConfirmButton
              message="Delete this endpoint and its history?"
              className={`${dangerButton} min-h-10`}
            >
              Delete
            </ConfirmButton>
          </form>
        </div>

        <details className="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
            Edit settings
          </summary>
          <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
            <EndpointSettingsForm
              id={ep.id}
              siteId={siteId}
              intervalMinutes={ep.intervalMinutes}
              timeoutSeconds={ep.timeoutSeconds}
              expectedStatus={ep.expectedStatus}
              failureThreshold={ep.failureThreshold}
              keyword={ep.keyword}
            />
          </div>
        </details>
      </div>
    </details>
  );
}
