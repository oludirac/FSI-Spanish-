"use client";

import { useEffect, useRef } from "react";

interface MicPulseProps {
  isListening: boolean;
  stream: MediaStream | null;
}

const BAR_COUNT = 24;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const CANVAS_WIDTH = BAR_COUNT * (BAR_WIDTH + BAR_GAP);
const CANVAS_HEIGHT = 64;

/**
 * Visual microphone indicator with live waveform bars.
 * When listening: draws real-time frequency bars from mic input.
 * When idle: shows a static mic icon.
 */
export default function MicPulse({ isListening, stream }: MicPulseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isListening || !stream || !canvasRef.current) {
      // Cleanup when not listening
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
        analyserRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create analyser from mic stream
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      if (!analyserRef.current || !ctx) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (let i = 0; i < BAR_COUNT; i++) {
        // Map frequency bins to bars (use lower frequencies which are more vocal)
        const binIndex = Math.min(i, dataArray.length - 1);
        const value = dataArray[binIndex] / 255;

        // Minimum bar height so it always looks "alive"
        const minHeight = 4;
        const barHeight = minHeight + value * (CANVAS_HEIGHT - minHeight);

        const x = i * (BAR_WIDTH + BAR_GAP);
        const y = (CANVAS_HEIGHT - barHeight) / 2;

        // Green gradient based on amplitude
        const alpha = 0.4 + value * 0.6;
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(x, y, BAR_WIDTH, barHeight, 1.5);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      audioCtx.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
    };
  }, [isListening, stream]);

  // Idle state: mic icon
  if (!isListening) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center bg-surface border border-border transition-all duration-300">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#737373"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </div>
      </div>
    );
  }

  // Listening state: live waveform bars
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="flex items-center justify-center h-20">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="text-accent text-xs font-medium uppercase tracking-wider">
          Recording
        </span>
      </div>
    </div>
  );
}
