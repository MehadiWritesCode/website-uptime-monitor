import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type EndpointRow = Database["public"]["Tables"]["endpoints"]["Row"];

export type DueEndpoint = EndpointRow & {
  site: { name: string; base_url: string };
};

// pg_cron fires at the top of the minute but a check finishes a few seconds
// later; without slack a 1-minute interval would drift to 2 minutes.
const SLACK_MS = 15_000;

export async function getDueEndpoints(now: Date): Promise<DueEndpoint[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("endpoints")
    .select("*, site:sites(name, base_url)")
    .eq("is_active", true);

  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    const site = row.site as unknown as DueEndpoint["site"] | null;
    if (!site) return [];

    const last = row.last_checked_at
      ? new Date(row.last_checked_at).getTime()
      : 0;
    const due =
      last === 0 ||
      now.getTime() - last >= row.interval_minutes * 60_000 - SLACK_MS;

    return due ? [{ ...row, site }] : [];
  });
}

/** Stamp last_checked_at with the run's start time (prevents drift and double runs). */
export async function claimEndpoints(ids: string[], now: Date): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await createAdminClient()
    .from("endpoints")
    .update({ last_checked_at: now.toISOString() })
    .in("id", ids);

  if (error) throw error;
}
