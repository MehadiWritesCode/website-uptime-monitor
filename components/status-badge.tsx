type Props = { status: string; active: boolean };

const STYLES = {
  up: [
    "Up",
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  ],
  down: ["Down", "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"],
  unknown: [
    "Pending",
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  ],
  paused: [
    "Paused",
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  ],
} as const;

export function StatusBadge({ status, active }: Props) {
  const key = !active
    ? "paused"
    : status === "up" || status === "down"
      ? status
      : "unknown";
  const [label, classes] = STYLES[key];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}
