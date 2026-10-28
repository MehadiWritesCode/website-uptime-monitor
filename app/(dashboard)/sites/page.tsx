import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/get-user";
import { primaryButton } from "@/components/ui/styles";

async function SiteList() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: sites, error } = await supabase
    .from("sites")
    .select("id, name, base_url, endpoints(id, current_status, is_active)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p role="alert" className="mt-6 text-sm text-red-600">
        Could not load sites.
      </p>
    );
  }

  if (!sites || sites.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500">
          No sites yet. Add your first site to start monitoring.
        </p>
        <Link href="/sites/new" className={`${primaryButton} mt-4`}>
          Add site
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
      {sites.map((site) => {
        const endpoints = site.endpoints ?? [];
        const down = endpoints.filter(
          (e) => e.is_active && e.current_status === "down",
        ).length;

        return (
          <li key={site.id}>
            <Link
              href={`/sites/${site.id}`}
              className="block rounded-xl border border-neutral-200 p-4 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
              <p className="font-medium">{site.name}</p>
              <p className="mt-0.5 truncate text-sm text-neutral-500">
                {site.base_url}
              </p>
              <p className="mt-3 text-sm">
                {endpoints.length} endpoint{endpoints.length === 1 ? "" : "s"}
                {down > 0 && (
                  <span className="ml-2 font-medium text-red-600">
                    {down} down
                  </span>
                )}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function SitesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold sm:text-2xl">Sites</h1>
        <Link href="/sites/new" className={primaryButton}>
          Add site
        </Link>
      </div>

      <Suspense
        fallback={<p className="mt-6 text-sm text-neutral-500">Loading…</p>}
      >
        <SiteList />
      </Suspense>
    </main>
  );
}
