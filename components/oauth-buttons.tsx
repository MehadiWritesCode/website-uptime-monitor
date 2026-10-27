"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";

type Provider = "google" | "github";

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "google", label: "Continue with Google" },
  { id: "github", label: "Continue with GitHub" },
];

// Icons are rendered directly (no dynamic component variable), which keeps
// the JSX props fully typed by react-icons.
function ProviderIcon({ provider }: { provider: Provider }) {
  const className = "size-5 shrink-0";

  if (provider === "google") {
    return <FcGoogle className={className} aria-hidden />;
  }
  return <FaGithub className={className} aria-hidden />;
}

export function OAuthButtons() {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    setLoading(provider);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    // on success the browser navigates away, so only handle failure here
    if (error) {
      setError(error.message);
      setLoading(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {PROVIDERS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => signIn(id)}
          disabled={loading !== null}
          className="flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          <ProviderIcon provider={id} />
          <span>{loading === id ? "Redirecting…" : label}</span>
        </button>
      ))}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
