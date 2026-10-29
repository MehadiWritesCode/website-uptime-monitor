"use client";

import { useActionState } from "react";
import { updateEndpoint } from "@/actions/endpoints";
import {
  hintClass,
  inputClass,
  labelClass,
  primaryButton,
} from "@/components/ui/styles";

type Props = {
  id: string;
  siteId: string;
  intervalMinutes: number;
  timeoutSeconds: number;
  expectedStatus: number;
  failureThreshold: number;
  keyword: string | null;
};

export function EndpointSettingsForm(p: Props) {
  const [state, action, pending] = useActionState(updateEndpoint, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={p.id} />
      <input type="hidden" name="siteId" value={p.siteId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className={labelClass}>
          Check every (minutes)
          <input
            name="intervalMinutes"
            type="number"
            min={1}
            max={1440}
            step={1}
            required
            defaultValue={p.intervalMinutes}
            className={inputClass}
          />
          <span className={hintClass}>1 to 1440</span>
        </label>
        <label className={labelClass}>
          Timeout (seconds)
          <input
            name="timeoutSeconds"
            type="number"
            min={1}
            max={30}
            step={1}
            required
            defaultValue={p.timeoutSeconds}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Expected status
          <input
            name="expectedStatus"
            type="number"
            min={100}
            max={599}
            step={1}
            required
            defaultValue={p.expectedStatus}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Down after N failures
          <input
            name="failureThreshold"
            type="number"
            min={1}
            max={10}
            step={1}
            required
            defaultValue={p.failureThreshold}
            className={inputClass}
          />
        </label>
        <label className={`${labelClass} sm:col-span-2 lg:col-span-4`}>
          Keyword (optional)
          <input
            name="keyword"
            maxLength={100}
            defaultValue={p.keyword ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          Saved.
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
