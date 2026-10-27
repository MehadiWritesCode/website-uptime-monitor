import { OAuthButtons } from "@/components/oauth-buttons";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold">Uptime Monitor</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sign in to manage your sites and endpoints.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          Sign-in failed. Try again.
        </p>
      )}

      <OAuthButtons />
    </main>
  );
}
