import Link from "next/link";
import { secondaryButton } from "@/components/ui/styles";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 text-sm sm:px-6">
          <span className="font-semibold">Uptime Monitor</span>
          <Link
            href="/dashboard"
            className="text-neutral-600 hover:underline dark:text-neutral-300"
          >
            Dashboard
          </Link>
          <Link
            href="/sites"
            className="text-neutral-600 hover:underline dark:text-neutral-300"
          >
            Sites
          </Link>
          <form action="/auth/signout" method="post" className="ml-auto">
            <button className={secondaryButton}>Sign out</button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
