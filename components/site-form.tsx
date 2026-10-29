"use client";

import { useActionState } from "react";
import { createSite } from "@/actions/sites";
import {
  hintClass,
  inputClass,
  labelClass,
  primaryButton,
} from "@/components/ui/styles";

export function SiteForm() {
  const [state, action, pending] = useActionState(createSite, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={labelClass}>
        Name
        <input
          name="name"
          required
          maxLength={100}
          placeholder="My website"
          className={inputClass}
        />
      </label>

      <label className={labelClass}>
        Base URL
        <input
          name="baseUrl"
          type="url"
          required
          placeholder="https://example.com"
          className={inputClass}
        />
        <span className={hintClass}>
          Paths are added to this URL in the next step.
        </span>
      </label>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Creating…" : "Create site & add endpoints"}
      </button>
    </form>
  );
}
