import { describe, expect, it } from "vitest";
import {
  createSessionProgress,
  getCurrentItemIndex,
  recordDrillResult,
  retryCurrentItem,
} from "../lib/session";

describe("session progression", () => {
  it("advances after a pass", () => {
    const start = createSessionProgress(2);
    const next = recordDrillResult(start, {
      itemIndex: 0,
      passed: true,
      acceptedOutput: "A",
    });

    expect(getCurrentItemIndex(next)).toBe(1);
    expect(next.passCount).toBe(1);
    expect(next.completed).toBe(1);
  });

  it("queues a failed item for re-drill", () => {
    const start = createSessionProgress(2);
    const next = recordDrillResult(start, {
      itemIndex: 0,
      passed: false,
      acceptedOutput: "A",
    });

    expect(getCurrentItemIndex(next)).toBe(1);
    expect(next.reDrillQueue).toEqual([0]);
    expect(next.failedIndices).toEqual([0]);
  });

  it("does not drop a final failed item before review", () => {
    const start = createSessionProgress(1);
    const review = recordDrillResult(start, {
      itemIndex: 0,
      passed: false,
      acceptedOutput: "A",
    });

    expect(review.phase).toBe("re_drill");
    expect(getCurrentItemIndex(review)).toBe(0);
    expect(review.isComplete).toBe(false);
  });

  it("completes after re-drill", () => {
    const start = createSessionProgress(1);
    const review = recordDrillResult(start, {
      itemIndex: 0,
      passed: false,
      acceptedOutput: "A",
    });
    const done = recordDrillResult(review, {
      itemIndex: 0,
      passed: true,
      acceptedOutput: "A",
    });

    expect(done.isComplete).toBe(true);
    expect(done.reDrillCount).toBe(1);
  });

  it("increments attempt id for replaying the same item", () => {
    const start = createSessionProgress(1);
    const retried = retryCurrentItem(start);

    expect(getCurrentItemIndex(retried)).toBe(0);
    expect(retried.attemptId).toBe(start.attemptId + 1);
  });

  it("does not count a failed attempt until it is committed", () => {
    const start = createSessionProgress(1);

    expect(start.failCount).toBe(0);
    expect(start.failedIndices).toEqual([]);
    expect(getCurrentItemIndex(start)).toBe(0);
  });
});
