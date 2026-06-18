import { SessionPhase, UnitProgress } from "./types";

export interface DrillSessionProgress {
  queue: number[];
  queueIndex: number;
  reDrillQueue: number[];
  phase: SessionPhase;
  completed: number;
  passCount: number;
  failCount: number;
  reDrillCount: number;
  failedIndices: number[];
  previousAnswer: string | null;
  attemptId: number;
  isComplete: boolean;
}

export interface RecordedResult {
  itemIndex: number;
  passed: boolean;
  acceptedOutput: string | null;
  queueForReview?: boolean;
}

export function createSessionProgress(totalItems: number): DrillSessionProgress {
  return {
    queue: Array.from({ length: totalItems }, (_, i) => i),
    queueIndex: 0,
    reDrillQueue: [],
    phase: "main",
    completed: 0,
    passCount: 0,
    failCount: 0,
    reDrillCount: 0,
    failedIndices: [],
    previousAnswer: null,
    attemptId: 0,
    isComplete: totalItems === 0,
  };
}

export function getCurrentItemIndex(progress: DrillSessionProgress): number | null {
  if (progress.isComplete) return null;
  return progress.queue[progress.queueIndex] ?? null;
}

export function recordDrillResult(
  progress: DrillSessionProgress,
  result: RecordedResult
): DrillSessionProgress {
  const isMain = progress.phase === "main";
  const shouldQueueForReview =
    isMain && !result.passed && result.queueForReview !== false;
  const failedIndices = shouldQueueForReview
    ? Array.from(new Set([...progress.failedIndices, result.itemIndex]))
    : progress.failedIndices;
  const reDrillQueue = shouldQueueForReview
    ? [...progress.reDrillQueue, result.itemIndex]
    : progress.reDrillQueue;

  const nextBase: DrillSessionProgress = {
    ...progress,
    completed: isMain ? progress.completed + 1 : progress.completed,
    passCount: result.passed ? progress.passCount + 1 : progress.passCount,
    failCount: result.passed ? progress.failCount : progress.failCount + 1,
    reDrillCount: isMain ? progress.reDrillCount : progress.reDrillCount + 1,
    failedIndices,
    reDrillQueue,
    previousAnswer: result.acceptedOutput,
  };

  return advanceQueue(nextBase);
}

export function retryCurrentItem(progress: DrillSessionProgress): DrillSessionProgress {
  return {
    ...progress,
    attemptId: progress.attemptId + 1,
  };
}

export function skipCurrentItem(
  progress: DrillSessionProgress,
  acceptedOutput: string | null
): DrillSessionProgress {
  const current = getCurrentItemIndex(progress);
  if (current === null) return progress;
  return recordDrillResult(progress, {
    itemIndex: current,
    passed: false,
    acceptedOutput,
    queueForReview: progress.phase === "main",
  });
}

export function toUnitProgress(
  progress: DrillSessionProgress,
  unit: number,
  total: number
): UnitProgress {
  return {
    unit,
    completed: progress.completed,
    total,
    passCount: progress.passCount,
    failCount: progress.failCount,
    reDrillCount: progress.reDrillCount,
    failedIndices: progress.failedIndices,
    lastSessionDate: new Date().toISOString(),
  };
}

function advanceQueue(progress: DrillSessionProgress): DrillSessionProgress {
  const nextQueueIndex = progress.queueIndex + 1;
  if (nextQueueIndex < progress.queue.length) {
    return {
      ...progress,
      queueIndex: nextQueueIndex,
      attemptId: progress.attemptId + 1,
    };
  }

  if (progress.phase === "main" && progress.reDrillQueue.length > 0) {
    return {
      ...progress,
      queue: progress.reDrillQueue,
      queueIndex: 0,
      reDrillQueue: [],
      phase: "re_drill",
      attemptId: progress.attemptId + 1,
    };
  }

  return {
    ...progress,
    isComplete: true,
    attemptId: progress.attemptId + 1,
  };
}
