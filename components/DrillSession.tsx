"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DrillItem, DrillState, GradeResult } from "@/lib/types";
import { grade } from "@/lib/grader";
import { getAudioPaths } from "@/lib/drills";
import { getBlockLesson, getTaskLabel } from "@/lib/lessons";
import {
  createSessionProgress,
  getCurrentItemIndex,
  recordDrillResult,
  retryCurrentItem,
  toUnitProgress,
} from "@/lib/session";
import {
  getMicStream,
  recordWithSilenceDetection,
  transcribeAudio,
  playAudioWithFallback,
  speakWithBrowserTTS,
  playPromptTone,
} from "@/lib/audio";
import { saveUnitProgress } from "@/lib/progress";
import MicPulse from "./MicPulse";
import ResultFlash from "./ResultFlash";

type PracticeMode = "training" | "test";
type PendingAttempt = {
  itemIndex: number;
  result: GradeResult;
  acceptedOutput: string | null;
};

interface DrillSessionProps {
  unit: number;
  drills: DrillItem[];
  onExit: () => void;
}

function getBlockAnnouncement(drill: DrillItem): string {
  if (drill.block_instruction?.trim()) return drill.block_instruction.trim();
  switch (drill.drill_type) {
    case "controlled_substitution":
      return "Substitution drill";
    case "structural_transformation":
      return "Transformation drill";
    case "constrained_response":
      return "Response drill";
    case "combination":
      return "Combination drill";
    default:
      return "Next drill";
  }
}

export default function DrillSession({ unit, drills, onExit }: DrillSessionProps) {
  const [flow, setFlow] = useState<DrillState>("ready");
  const [progress, setProgress] = useState(() => createSessionProgress(drills.length));
  const [mode, setMode] = useState<PracticeMode>("training");
  const [lastResult, setLastResult] = useState<GradeResult | null>(null);
  const [flashType, setFlashType] = useState<"pass" | "fail" | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [showTypedAnswer, setShowTypedAnswer] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [revealedFailedItems, setRevealedFailedItems] = useState<number[]>([]);
  const [pendingAttempt, setPendingAttempt] = useState<PendingAttempt | null>(null);
  const [preferTypedRetry, setPreferTypedRetry] = useState(false);

  const micStreamRef = useRef<MediaStream | null>(null);
  const stopRecordingRef = useRef<(() => void) | null>(null);
  const prevBlockInstructionRef = useRef<string>("");
  const preferTypedRetryRef = useRef(false);

  useEffect(() => {
    setProgress(createSessionProgress(drills.length));
    setFlow("ready");
    setLastResult(null);
    setFlashType(null);
    setTypedAnswer("");
    setShowCorrectAnswer(false);
    setRevealedFailedItems([]);
    setPendingAttempt(null);
    setPreferTypedRetry(false);
    preferTypedRetryRef.current = false;
    prevBlockInstructionRef.current = "";
  }, [drills]);

  const currentItemIndex = getCurrentItemIndex(progress);
  const currentDrill = currentItemIndex === null ? null : drills[currentItemIndex];
  const audioPaths =
    currentDrill && currentItemIndex !== null ? getAudioPaths(unit, currentItemIndex) : null;
  const lesson = useMemo(
    () => (currentDrill ? getBlockLesson(currentDrill) : null),
    [currentDrill]
  );
  const taskLabel = currentDrill ? getTaskLabel(currentDrill) : "Drill";
  const totalItems = drills.length;
  const itemNumber = Math.min(progress.completed + 1, totalItems);
  const correctAnswer = currentDrill?.accepted_outputs[0] ?? "";
  const spokenBase =
    currentDrill?.is_chain && progress.previousAnswer
      ? progress.previousAnswer
      : currentDrill?.base_sentence ?? "";

  const stopMic = useCallback(() => {
    stopRecordingRef.current?.();
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
  }, []);

  const commitAttempt = useCallback(
    (attempt: PendingAttempt, queueForReview = true) => {
      const nextProgress = recordDrillResult(progress, {
        itemIndex: attempt.itemIndex,
        passed: attempt.result.passed,
        acceptedOutput: attempt.acceptedOutput,
        queueForReview,
      });
      setProgress(nextProgress);
      setPendingAttempt(null);
      return nextProgress;
    },
    [progress]
  );

  const finishAttempt = useCallback(
    (result: GradeResult) => {
      if (currentItemIndex === null || !currentDrill) return;
      setLastResult(result);
      setShowCorrectAnswer(false);
      setTypedAnswer("");

      setFlashType(result.passed ? "pass" : "fail");
      setFlow(result.passed ? "show_pass" : "show_fail");

      const attempt: PendingAttempt = {
        itemIndex: currentItemIndex,
        result,
        acceptedOutput: currentDrill.accepted_outputs[0] ?? null,
      };

      if (result.passed) {
        commitAttempt(attempt, false);
      } else {
        setPendingAttempt(attempt);
      }
    },
    [commitAttempt, currentDrill, currentItemIndex]
  );

  const playCurrentPrompt = useCallback(async () => {
    if (!currentDrill || !audioPaths) return;
    const blockAnnouncement = getBlockAnnouncement(currentDrill);
    const isBlockChange = blockAnnouncement !== prevBlockInstructionRef.current;
    prevBlockInstructionRef.current = blockAnnouncement;

    if (isBlockChange) {
      await speakWithBrowserTTS(blockAnnouncement);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    if (spokenBase && spokenBase !== currentDrill.cue_audio_text) {
      await playAudioWithFallback(audioPaths.cue.replace("cue_", "base_"), spokenBase);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    await playAudioWithFallback(audioPaths.cue, currentDrill.cue_audio_text);
    await new Promise((resolve) => setTimeout(resolve, 150));
    await playPromptTone();
  }, [audioPaths, currentDrill, spokenBase]);

  useEffect(() => {
    if (flow !== "playing_cue" || !currentDrill) return;
    let cancelled = false;
    const safety = setTimeout(() => {
      if (!cancelled) setFlow("listening");
    }, 20000);

    playCurrentPrompt()
      .catch((error) => console.warn("[drill] cue sequence failed:", error))
      .finally(() => {
        if (!cancelled) setFlow("listening");
      });

    return () => {
      cancelled = true;
      clearTimeout(safety);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [currentDrill, flow, playCurrentPrompt, progress.attemptId]);

  useEffect(() => {
    if (flow !== "listening" || showTypedAnswer) return;
    let cancelled = false;

    (async () => {
      try {
        if (!micStreamRef.current) {
          micStreamRef.current = await getMicStream();
        }
        if (cancelled) return;

        const { promise, stop } = recordWithSilenceDetection(micStreamRef.current);
        stopRecordingRef.current = stop;
        const { blob } = await promise;
        if (cancelled) return;

        setFlow("processing");
        const transcript = await transcribeAudio(blob);
        if (!currentDrill) return;

        const result = grade(transcript, currentDrill.accepted_outputs, {
          allow_subject_drop: currentDrill.strictness?.allow_subject_drop ?? false,
        });
        finishAttempt(result);
      } catch (error) {
        console.error("[drill] recording/STT error:", error);
        setMicError("Speech capture failed. You can retry or type the answer instead.");
        setPreferTypedRetry(true);
        preferTypedRetryRef.current = true;
        finishAttempt({ passed: false, transcript: "(speech error)", matchedOutput: null });
      }
    })();

    return () => {
      cancelled = true;
      stopRecordingRef.current?.();
    };
  }, [currentDrill, finishAttempt, flow, showTypedAnswer]);

  useEffect(() => {
    if (flow === "show_pass") {
      const timer = setTimeout(() => {
        setFlashType(null);
        setFlow(progress.isComplete ? "session_end" : "playing_cue");
      }, 800);
      return () => clearTimeout(timer);
    }

    if (flow === "show_fail") {
      const timer = setTimeout(() => {
        setFlashType(null);
        setFlow("transcript_flash");
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [flow, progress.isComplete]);

  useEffect(() => {
    if (flow !== "playing_correct" || !currentDrill || !audioPaths) return;
    let cancelled = false;
    playAudioWithFallback(audioPaths.answer, correctAnswer)
      .catch((error) => console.warn("[drill] correct answer playback failed:", error))
      .finally(() => {
        if (cancelled) return;
        setFlashType(null);
        const nextProgress = pendingAttempt
          ? commitAttempt(pendingAttempt, true)
          : progress;
        setFlow(nextProgress.isComplete ? "session_end" : "playing_cue");
      });
    return () => {
      cancelled = true;
    };
  }, [audioPaths, commitAttempt, correctAnswer, currentDrill, flow, pendingAttempt, progress]);

  useEffect(() => {
    if (!progress.isComplete) return;
    saveUnitProgress(toUnitProgress(progress, unit, totalItems));
    setFlow("session_end");
    stopMic();
  }, [progress, stopMic, totalItems, unit]);

  const handleBegin = useCallback(async () => {
    setMicError(null);
    try {
      micStreamRef.current = await getMicStream();
      setFlow("playing_cue");
    } catch {
      setMicError("Microphone access was denied. Training Mode can continue with typed answers.");
      setShowTypedAnswer(true);
      setPreferTypedRetry(true);
      preferTypedRetryRef.current = true;
      setFlow("playing_cue");
    }
  }, []);

  const handleTypedSubmit = useCallback(() => {
    if (!currentDrill || !typedAnswer.trim()) return;
    const result = grade(typedAnswer, currentDrill.accepted_outputs, {
      allow_subject_drop: currentDrill.strictness?.allow_subject_drop ?? false,
    });
    finishAttempt(result);
  }, [currentDrill, finishAttempt, typedAnswer]);

  const handleRetry = useCallback(() => {
    setFlashType(null);
    setLastResult(null);
    setTypedAnswer("");
    setShowCorrectAnswer(false);
    setShowTypedAnswer(preferTypedRetryRef.current);
    setPreferTypedRetry(false);
    preferTypedRetryRef.current = false;
    setProgress((current) => retryCurrentItem(current));
    setPendingAttempt(null);
    setFlow("playing_cue");
  }, []);

  const handleSkip = useCallback(() => {
    const result = { passed: false, transcript: "(skipped)", matchedOutput: null };
    finishAttempt(result);
  }, [finishAttempt]);

  const handleMarkCorrect = useCallback(() => {
    if (!pendingAttempt) return;
    const correctedAttempt: PendingAttempt = {
      ...pendingAttempt,
      result: {
        passed: true,
        transcript: lastResult?.transcript ?? "(marked correct)",
        matchedOutput: pendingAttempt.acceptedOutput,
      },
    };
    const nextProgress = commitAttempt(correctedAttempt, false);
    setFlashType("pass");
    setPreferTypedRetry(false);
    preferTypedRetryRef.current = false;
    setFlow(nextProgress.isComplete ? "session_end" : "show_pass");
  }, [commitAttempt, lastResult?.transcript, pendingAttempt]);

  const handleReplayCorrect = useCallback(() => {
    if (!audioPaths || !correctAnswer) return;
    playAudioWithFallback(audioPaths.answer, correctAnswer).catch(() => {});
  }, [audioPaths, correctAnswer]);

  if (flow === "ready") {
    return (
      <div className="min-h-screen bg-bg px-6 py-8 no-select">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center">
          <button onClick={onExit} className="mb-8 self-start text-sm text-muted hover:text-white">
            &#8592; Back
          </button>

          <div className="mb-8">
            <span className="text-xs uppercase tracking-wider text-muted">Unit {unit}</span>
            <h1 className="mt-2 text-3xl font-bold">Speaking drill session</h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Training Mode shows the base sentence, cue, and grammar notes before you answer.
              Test Mode keeps the classic audio-first flow once the pattern feels familiar.
            </p>
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setMode("training")}
              className={`rounded-lg border p-4 text-left transition-colors ${
                mode === "training"
                  ? "border-accent/60 bg-accent/10"
                  : "border-border bg-surface hover:bg-border"
              }`}
            >
              <div className="text-sm font-semibold">Training Mode</div>
              <p className="mt-2 text-xs leading-5 text-muted">Best for first pass: text, hints, replay, typing.</p>
            </button>
            <button
              onClick={() => setMode("test")}
              className={`rounded-lg border p-4 text-left transition-colors ${
                mode === "test"
                  ? "border-accent/60 bg-accent/10"
                  : "border-border bg-surface hover:bg-border"
              }`}
            >
              <div className="text-sm font-semibold">Test Mode</div>
              <p className="mt-2 text-xs leading-5 text-muted">Audio-first practice with minimal on-screen help.</p>
            </button>
          </div>

          <div className="mb-8 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">How it works</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
              <li>A short beep means it is your turn to answer.</li>
              <li>The grader expects the drill pattern, not free conversation.</li>
              <li>Failed items return at the end for one focused review pass.</li>
              <li>Some items allow subject drop; others require the subject because that is the grammar being tested.</li>
            </ul>
          </div>

          <button
            onClick={handleBegin}
            className="rounded-lg border border-accent/40 bg-accent/10 px-8 py-4 text-lg font-medium text-accent transition-colors hover:bg-accent/20"
          >
            Begin {totalItems} items
          </button>
          {micError && <p className="mt-4 text-sm text-fail">{micError}</p>}
        </div>
      </div>
    );
  }

  if (flow === "session_end") {
    const pct = totalItems > 0 ? Math.round((progress.passCount / totalItems) * 100) : 0;
    return (
      <div className="min-h-screen bg-bg px-6 py-8 no-select">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center">
          <h1 className="text-3xl font-bold">Session complete</h1>
          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            <Stat label="Score" value={`${pct}%`} />
            <Stat label="Passed" value={String(progress.passCount)} />
            <Stat label="Missed" value={String(progress.failedIndices.length)} />
            <Stat label="Review tries" value={String(progress.reDrillCount)} />
          </div>

          {progress.failedIndices.length > 0 && (
            <div className="mt-8 rounded-lg border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold">Items to review</h2>
              <div className="mt-4 space-y-3">
                {progress.failedIndices.map((idx) => {
                  const item = drills[idx];
                  const isOpen = revealedFailedItems.includes(idx);
                  return (
                    <div key={idx} className="rounded-lg border border-border bg-bg/60 p-3">
                      <button
                        onClick={() =>
                          setRevealedFailedItems((items) =>
                            items.includes(idx)
                              ? items.filter((itemIdx) => itemIdx !== idx)
                              : [...items, idx]
                          )
                        }
                        className="flex w-full items-center justify-between text-left text-sm"
                      >
                        <span>Item {idx + 1}: {getTaskLabel(item)}</span>
                        <span className="text-muted">{isOpen ? "Hide" : "Show"}</span>
                      </button>
                      {isOpen && (
                        <div className="mt-3 space-y-2 text-sm text-muted">
                          <p>Base: <span className="text-white/80">{item.base_sentence}</span></p>
                          <p>Cue: <span className="text-white/80">{item.cue_audio_text}</span></p>
                          <p>Answer: <span className="text-accent">{item.accepted_outputs[0]}</span></p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setProgress(createSessionProgress(drills.length));
                setFlow("ready");
              }}
              className="rounded-lg border border-accent/40 bg-accent/10 px-5 py-3 text-sm text-accent hover:bg-accent/20"
            >
              Retry unit
            </button>
            <button
              onClick={onExit}
              className="rounded-lg border border-border bg-surface px-5 py-3 text-sm hover:bg-border"
            >
              Back to units
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg px-6 py-6 no-select">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl flex-col">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={() => {
              stopMic();
              onExit();
            }}
            className="text-sm text-muted hover:text-white"
          >
            &#8592; Exit
          </button>
          <div className="text-right text-sm text-muted">
            Unit {unit} - {itemNumber}/{totalItems}
            {progress.phase === "re_drill" && <span className="ml-2 text-fail">review</span>}
          </div>
        </div>

        {mode === "training" && currentDrill && lesson && (
          <div className="mb-6 rounded-lg border border-border bg-surface p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded border border-accent/30 bg-accent/10 px-2 py-1 text-xs uppercase tracking-wider text-accent">
                {taskLabel}
              </span>
              <span className="text-xs text-muted">{lesson.title}</span>
            </div>
            <p className="text-sm leading-6 text-muted">{lesson.explanation}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {lesson.examples.map((example) => (
                <div key={`${example.from}-${example.to}`} className="rounded-lg bg-bg/60 p-3 text-sm">
                  <p className="text-white/70">{example.from}</p>
                  <p className="mt-1 text-accent">-&gt; {example.to}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs leading-5 text-muted">
              <span className="font-semibold text-white/70">Watch out: </span>
              {lesson.watchOut.join(" ")}
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center">
          {mode === "training" && currentDrill && (
            <div className="mb-8 grid w-full gap-3 sm:grid-cols-2">
              <InfoPanel label="Base" value={spokenBase || currentDrill.base_sentence} />
              <InfoPanel label="Cue" value={currentDrill.cue_audio_text} />
            </div>
          )}

          <MicPulse isListening={flow === "listening" && !showTypedAnswer} stream={micStreamRef.current} />

          <div className="mt-6 h-6 text-sm text-muted">
            {flow === "playing_cue" && "Listen..."}
            {flow === "listening" && (showTypedAnswer ? "Type your answer" : "Speak now")}
            {flow === "processing" && "Processing..."}
            {flow === "transcript_flash" && "Review the correction"}
            {flow === "playing_correct" && "Listen to the correct answer..."}
          </div>

          {mode === "training" && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ControlButton onClick={handleRetry}>Replay prompt</ControlButton>
              <ControlButton onClick={() => setShowTypedAnswer((value) => !value)}>
                {showTypedAnswer ? "Use microphone" : "Type answer"}
              </ControlButton>
              <ControlButton onClick={() => setShowCorrectAnswer((value) => !value)}>
                {showCorrectAnswer ? "Hide answer" : "Show answer"}
              </ControlButton>
              <ControlButton onClick={handleSkip}>Skip</ControlButton>
            </div>
          )}

          {showCorrectAnswer && (
            <div className="mt-5 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-center text-sm text-accent">
              {correctAnswer}
            </div>
          )}

          {showTypedAnswer && flow === "listening" && (
            <div className="mt-6 flex w-full max-w-xl flex-col gap-3">
              <input
                value={typedAnswer}
                onChange={(event) => setTypedAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleTypedSubmit();
                }}
                className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-white outline-none focus:border-accent/60"
                placeholder="Type the full Spanish answer"
              />
              <button
                onClick={handleTypedSubmit}
                className="rounded-lg border border-accent/40 bg-accent/10 px-5 py-3 text-sm text-accent hover:bg-accent/20"
              >
                Check typed answer
              </button>
            </div>
          )}

          {flow === "transcript_flash" && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ControlButton onClick={handleRetry}>Retry now</ControlButton>
              <ControlButton onClick={handleReplayCorrect}>Replay correct</ControlButton>
              <ControlButton onClick={() => setFlow("playing_correct")}>Continue</ControlButton>
              {lastResult && !lastResult.passed && (
                <ControlButton onClick={handleMarkCorrect}>Mark correct locally</ControlButton>
              )}
            </div>
          )}

          {micError && <p className="mt-4 max-w-md text-center text-sm text-fail">{micError}</p>}
        </div>

        <ResultFlash
          type={flashType}
          transcript={
            flow === "transcript_flash" || flow === "show_fail" || flow === "playing_correct"
              ? lastResult?.transcript
              : undefined
          }
          correctAnswer={
            flow === "transcript_flash" || flow === "playing_correct" ? correctAnswer : undefined
          }
        />
      </div>
    </div>
  );
}

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="text-base text-white/85">{value}</div>
    </div>
  );
}

function ControlButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-white/80 transition-colors hover:bg-border"
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
