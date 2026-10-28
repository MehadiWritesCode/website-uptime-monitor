import Link from "next/link";
import { SiteForm } from "@/components/site-form";

export default function NewSitePage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <Link href="/sites" className="text-sm text-neutral-500 hover:underline">
        ← Back to sites
      </Link>
      <h1 className="mt-3 text-xl font-semibold sm:text-2xl">Add site</h1>
      <div className="mt-6">
        <SiteForm />
      </div>
    </main>
  );
}
