// CSS-only chevron. The parent <details> passes a group-open rotation class.
export function Chevron({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-2 shrink-0 -rotate-45 border-b-2 border-r-2 border-neutral-400 transition-transform ${className}`}
    />
  );
}
