import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/get-user";
import { primaryButton } from "@/components/ui/styles";

async function Summary() {
  const user = await getUser(); // also marks the rest as request-time

  const supabase = await createClient();
  const { data } = await supabase
    .from("endpoints")
    .select("current_status, is_active");

  const rows = data ?? [];
  const active = rows.filter((r) => r.is_active);
  const stats = [
    { label: "Endpoints", value: rows.length },
    {
      label: "Up",
      value: active.filter((r) => r.current_status === "up").length,
    },
    {
      label: "Down",
      value: active.filter((r) => r.current_status === "down").length,
    },
    { label: "Paused", value: rows.length - active.length },
  ];

  return (
    <>
      <p className="mt-1 text-sm text-neutral-500">
        Signed in as {user?.email}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <p className="text-sm text-neutral-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold sm:text-2xl">Dashboard</h1>
        <Link href="/sites" className={primaryButton}>
          Manage sites
        </Link>
      </div>

      <Suspense
        fallback={<p className="mt-4 text-sm text-neutral-500">Loading…</p>}
      >
        <Summary />
      </Suspense>
    </main>
  );
}
