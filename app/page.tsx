import Link from "next/link";
import { getUnitMetaList } from "@/lib/drills";
import UnitGrid from "@/components/UnitGrid";

export default function HomePage() {
  const units = getUnitMetaList();

  return (
    <main className="min-h-screen bg-bg px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight">
          FSI Spanish Drills
        </h1>
        <p className="text-muted text-sm mt-2">
          Audio-first speaking practice from the FSI Basic Course.
          Select a unit to begin.
        </p>
        <Link
          href="/guide"
          className="inline-block mt-3 text-accent text-sm hover:underline"
        >
          How do the drills work? →
        </Link>
      </div>

      {/* Unit grid */}
      <UnitGrid units={units} />

      {/* Footer */}
      <div className="mt-16 text-center text-muted text-xs">
        <p>Based on the FSI Spanish Basic Course (Public Domain)</p>
      </div>
    </main>
  );
}
