"use client";

import { useActionState, useEffect, useRef } from "react";
import { createEndpoint } from "@/actions/endpoints";
import {
  hintClass,
  inputClass,
  labelClass,
  primaryButton,
} from "@/components/ui/styles";

export function EndpointForm({ siteId }: { siteId: string }) {
  const [state, action, pending] = useActionState(createEndpoint, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <input type="hidden" name="siteId" value={siteId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className={`${labelClass} sm:col-span-2 lg:col-span-2`}>
          Path
          <input
            name="path"
            required
            defaultValue="/"
            placeholder="/api/health"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Method
          <select name="method" defaultValue="GET" className={inputClass}>
            <option value="GET">GET</option>
            <option value="HEAD">HEAD</option>
          </select>
        </label>

        <label className={labelClass}>
          Check every (minutes)
          <input
            name="intervalMinutes"
            type="number"
            min={1}
            max={1440}
            step={1}
            required
            defaultValue={5}
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
            defaultValue={10}
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
            defaultValue={200}
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
            defaultValue={2}
            className={inputClass}
          />
          <span className={hintClass}>Avoids false alarms</span>
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          Keyword (optional)
          <input
            name="keyword"
            maxLength={100}
            placeholder="Text that must appear in the response"
            className={inputClass}
          />
          <span className={hintClass}>Only checked for GET requests.</span>
        </label>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          Endpoint added. The first check runs on the next scheduler tick.
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Adding…" : "Add endpoint"}
        </button>
      </div>
    </form>
  );
}
