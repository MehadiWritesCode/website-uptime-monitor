import { Suspense } from "react";
import { OAuthButtons } from "@/components/oauth-buttons";

type SearchParams = Promise<{ error?: string }>;

// Reads searchParams (runtime data), so it lives inside its own Suspense boundary.
async function AuthError({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;
  if (!error) return null;

  return (
    <p role="alert" className="text-sm text-red-600">
      Sign-in failed. Try again.
    </p>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-8 sm:px-6">
      <div className="flex w-full max-w-sm flex-col gap-6 sm:rounded-xl sm:border sm:border-neutral-200 sm:p-8 dark:sm:border-neutral-800">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Uptime Monitor</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Sign in to manage your sites and endpoints.
          </p>
        </div>

        <Suspense fallback={null}>
          <AuthError searchParams={searchParams} />
        </Suspense>

        <OAuthButtons />
      </div>
    </main>
  );
}
