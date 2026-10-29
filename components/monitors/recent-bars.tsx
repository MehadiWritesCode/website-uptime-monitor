import type { RecentCheck } from "./types";

const SIZE = 30;

export function RecentBars({ checks }: { checks: RecentCheck[] }) {
  const recent = checks.slice(-SIZE);
  const slots: (RecentCheck | null)[] = [
    ...Array.from({ length: SIZE - recent.length }, () => null),
    ...recent,
  ];
  const failed = recent.filter((c) => !c.ok).length;

  return (
    <div
      role="img"
      aria-label={`Last ${recent.length} checks, ${failed} failed`}
      className="flex h-6 items-stretch gap-px"
    >
      {slots.map((c, i) => (
        <span
          key={i}
          title={
            c
              ? `${c.ok ? "OK" : "Failed"}${c.ms != null ? ` · ${c.ms} ms` : ""}`
              : "No data"
          }
          className={`w-1 rounded-sm sm:w-1.5 ${
            c === null
              ? "bg-neutral-200 dark:bg-neutral-800"
              : c.ok
                ? "bg-green-500"
                : "bg-red-500"
          }`}
        />
      ))}
    </div>
  );
}
