"use client";

import { useEffect, useState } from "react";

interface ResultFlashProps {
  type: "pass" | "fail" | null;
  transcript?: string;
  correctAnswer?: string;
}

/**
 * Full-screen flash overlay for pass/fail feedback.
 * - PASS: green check, fades out quickly
 * - FAIL: red X + what Whisper heard vs correct answer
 */
export default function ResultFlash({
  type,
  transcript,
  correctAnswer,
}: ResultFlashProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (type) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [type]);

  if (!type || !visible) return null;

  return (
    <div
      className={`
        fixed inset-0 flex items-center justify-center z-50
        transition-opacity duration-300
        ${type === "pass" ? "bg-accent/10" : "bg-fail/10"}
      `}
    >
      <div className="text-center px-6">
        {type === "pass" ? (
          <div className="text-accent text-6xl font-bold">&#10003;</div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <div className="text-fail text-5xl font-bold">&#10007;</div>
            {transcript && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-muted text-xs uppercase tracking-wider">
                  You said
                </span>
                <p className="text-white/60 text-base max-w-xs text-center">
                  &ldquo;{transcript}&rdquo;
                </p>
              </div>
            )}
            {correctAnswer && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-muted text-xs uppercase tracking-wider">
                  Correct
                </span>
                <p className="text-accent text-base font-medium max-w-xs text-center">
                  &ldquo;{correctAnswer}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
