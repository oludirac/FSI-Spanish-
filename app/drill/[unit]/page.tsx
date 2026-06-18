"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DrillItem } from "@/lib/types";
import { loadDrills } from "@/lib/drills";
import DrillSession from "@/components/DrillSession";

export default function DrillPage() {
  const router = useRouter();
  const params = useParams();
  const unit = Number(params.unit);

  const [drills, setDrills] = useState<DrillItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(unit) || unit < 7) {
      setError("Invalid unit number");
      return;
    }

    loadDrills(unit).then((items) => {
      if (items.length === 0) {
        setError(`No drills found for Unit ${unit}`);
      } else {
        setDrills(items);
      }
    });
  }, [unit]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
        <p className="text-fail mb-6">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-surface border border-border rounded-lg text-sm
                     hover:bg-border transition-colors"
        >
          Back to Units
        </button>
      </div>
    );
  }

  if (!drills) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-muted">Loading Unit {unit}...</div>
      </div>
    );
  }

  return (
    <DrillSession
      unit={unit}
      drills={drills}
      onExit={() => router.push("/")}
    />
  );
}
