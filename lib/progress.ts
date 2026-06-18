import { UnitProgress } from "./types";

const STORAGE_KEY_PREFIX = "fsi_progress_unit_";

/**
 * Get progress for a specific unit from localStorage.
 */
export function getUnitProgress(unit: number): UnitProgress | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${unit}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UnitProgress;
  } catch {
    return null;
  }
}

/**
 * Save progress for a specific unit to localStorage.
 */
export function saveUnitProgress(progress: UnitProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${STORAGE_KEY_PREFIX}${progress.unit}`,
    JSON.stringify(progress)
  );
}

/**
 * Get progress for all units.
 */
export function getAllProgress(): Record<number, UnitProgress> {
  if (typeof window === "undefined") return {};
  const result: Record<number, UnitProgress> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      const unit = parseInt(key.replace(STORAGE_KEY_PREFIX, ""), 10);
      const progress = getUnitProgress(unit);
      if (progress) result[unit] = progress;
    }
  }
  return result;
}

/**
 * Clear progress for a specific unit.
 */
export function clearUnitProgress(unit: number): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${unit}`);
}
