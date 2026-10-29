"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Renders a timestamp in the viewer's own timezone without hydration mismatch. */
export function LocalTime({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () =>
      new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "medium",
      }),
    () => `${iso.slice(0, 16).replace("T", " ")} UTC`, // server + first paint
  );

  return <time dateTime={iso}>{text}</time>;
}
