import Link from "next/link";

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="-ml-1 inline-flex min-h-9 items-center gap-1.5 rounded-md px-1 text-sm text-neutral-500 hover:text-neutral-900 hover:underline focus-visible:outline-2 dark:hover:text-neutral-100"
    >
      <span aria-hidden="true">←</span>
      <span>Back to {children}</span>
    </Link>
  );
}
