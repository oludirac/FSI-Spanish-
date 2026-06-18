"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UnitMeta, UnitProgress } from "@/lib/types";
import { getAllProgress } from "@/lib/progress";

interface UnitGridProps {
  units: UnitMeta[];
}

const VOLUME_LABELS: Record<number, string> = {
  1: "Volume 1 — Units 7-15",
  2: "Volume 2 — Units 16-30",
  3: "Volume 3 — Units 31-45",
  4: "Volume 4 — Units 46-55",
};

export default function UnitGrid({ units }: UnitGridProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<number, UnitProgress>>({});

  useEffect(() => {
    setProgress(getAllProgress());
  }, []);

  // Group by volume
  const volumes = units.reduce(
    (acc, unit) => {
      const vol = unit.volume;
      if (!acc[vol]) acc[vol] = [];
      acc[vol].push(unit);
      return acc;
    },
    {} as Record<number, UnitMeta[]>
  );

  return (
    <div className="space-y-10">
      {Object.entries(volumes)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([vol, volUnits]) => (
          <div key={vol}>
            <h2 className="text-muted text-xs uppercase tracking-wider mb-4 px-1">
              {VOLUME_LABELS[Number(vol)] ?? `Volume ${vol}`}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {volUnits.map((unit) => {
                const p = progress[unit.unit];
                const completed = p && p.passCount === p.total;
                const attempted = !!p;
                const pct =
                  p && p.total > 0
                    ? Math.round((p.passCount / p.total) * 100)
                    : 0;

                return (
                  <button
                    key={unit.unit}
                    onClick={() => router.push(`/drill/${unit.unit}`)}
                    className={`
                      relative flex flex-col items-center justify-center
                      rounded-xl border p-4 h-24
                      transition-all duration-200 hover:scale-[1.03]
                      ${
                        completed
                          ? "border-accent/40 bg-accent/5"
                          : attempted
                            ? "border-border bg-surface"
                            : "border-border bg-surface/50"
                      }
                    `}
                  >
                    <span className="text-lg font-semibold">{unit.unit}</span>
                    <span className="text-muted text-[10px] mt-1 text-center leading-tight line-clamp-2">
                      {unit.title}
                    </span>
                    <span className="mt-1 text-[10px] text-muted/70">
                      {unit.itemCount} items
                    </span>
                    {attempted && (
                      <div className="absolute top-2 right-2">
                        <span
                          className={`text-[10px] font-medium ${
                            completed ? "text-accent" : "text-muted"
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
