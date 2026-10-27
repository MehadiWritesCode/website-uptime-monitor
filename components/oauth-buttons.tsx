"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Provider = "google" | "github";

const LABELS: Record<Provider, string> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
};

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
    <div className="flex flex-col gap-3">
      {(Object.keys(LABELS) as Provider[]).map((provider) => (
        <button
          key={provider}
          type="button"
          onClick={() => signIn(provider)}
          disabled={loading !== null}
          className="rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          {loading === provider ? "Redirecting…" : LABELS[provider]}
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
