import { DrillItem, UnitMeta } from "./types";

/**
 * Unit metadata — maps unit numbers to volume and topic.
 * Extend this as new units are extracted.
 */
const UNIT_META: Record<number, { volume: number; title: string; itemCount: number }> = {
  7: { volume: 1, title: "Number Transformation, -er Verbs", itemCount: 33 },
  8: { volume: 1, title: "Number Transformation, -ir Verbs", itemCount: 36 },
  9: { volume: 1, title: "Present Perfect, Possessives", itemCount: 36 },
  10: { volume: 1, title: "Personal a, Direct Objects", itemCount: 34 },
  11: { volume: 1, title: "Possessive Number Agreement", itemCount: 31 },
  12: { volume: 1, title: "Adjective Agreement, ser/estar", itemCount: 24 },
  13: { volume: 1, title: "Relative Clauses, Demonstratives", itemCount: 32 },
  14: { volume: 1, title: "Irregular Verbs, Periphrastic Future", itemCount: 36 },
  15: { volume: 1, title: "Indirect Object Clitics", itemCount: 36 },
  16: { volume: 2, title: "Faltar, Gustar, Negation Review", itemCount: 45 },
};

/**
 * Get available unit numbers by scanning what drill files exist.
 * In Next.js, we import JSON statically — this function returns
 * the known unit list.
 */
export function getAvailableUnits(): number[] {
  return Object.keys(UNIT_META)
    .map(Number)
    .sort((a, b) => a - b);
}

/**
 * Get metadata for all available units.
 */
export function getUnitMetaList(): UnitMeta[] {
  return getAvailableUnits().map((unit) => ({
    unit,
    volume: UNIT_META[unit]?.volume ?? Math.ceil((unit - 6) / 15),
    title: UNIT_META[unit]?.title ?? `Unit ${unit}`,
    itemCount: UNIT_META[unit]?.itemCount ?? 0,
  }));
}

/**
 * Load drill items for a specific unit.
 * Uses dynamic import to load only the requested unit's JSON.
 */
export async function loadDrills(unit: number): Promise<DrillItem[]> {
  const paddedUnit = String(unit).padStart(2, "0");
  try {
    const mod = await import(`@/drills/unit_${paddedUnit}.json`);
    return mod.default as DrillItem[];
  } catch {
    console.error(`Failed to load drills for unit ${unit}`);
    return [];
  }
}

/**
 * Get audio file paths for a drill item at a given index.
 */
export function getAudioPaths(unit: number, itemIndex: number) {
  const paddedUnit = String(unit).padStart(2, "0");
  const paddedIndex = String(itemIndex + 1).padStart(3, "0");
  return {
    cue: `/audio/unit_${paddedUnit}/cue_${paddedIndex}.mp3`,
    answer: `/audio/unit_${paddedUnit}/answer_${paddedIndex}.mp3`,
  };
}
