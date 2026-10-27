import { Suspense } from "react";
import { getUser } from "@/lib/supabase/get-user";

// Reads the session (runtime data), so it lives inside its own Suspense boundary.
async function UserEmail() {
  const user = await getUser();

  return (
    <p className="mt-4 text-sm text-neutral-500">Signed in as {user?.email}</p>
  );
}

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <form action="/auth/signout" method="post">
          <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
            Sign out
          </button>
        </form>
      </div>

      <Suspense
        fallback={<p className="mt-4 text-sm text-neutral-500">Loading…</p>}
      >
        <UserEmail />
      </Suspense>
    </main>
  );
}
