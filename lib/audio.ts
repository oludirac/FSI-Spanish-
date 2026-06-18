/**
 * Audio recording utilities using MediaRecorder API.
 * Records user speech and returns a Blob for Whisper STT.
 * Includes silence detection to auto-stop recording.
 */

const SILENCE_THRESHOLD = 0.01; // RMS amplitude threshold for silence
const SILENCE_DURATION_MS = 1500; // How long silence must persist to auto-stop
const MAX_RECORDING_MS = 15000; // Safety cap: stop recording after 15s

export interface RecordingResult {
  blob: Blob;
  durationMs: number;
}

/**
 * Request microphone permission and return the MediaStream.
 * Throws if permission is denied.
 */
export async function getMicStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Browser does not support microphone access");
  }
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  });
}

/**
 * Record audio from the microphone with silence detection.
 * Returns a Blob (webm/opus) suitable for Whisper API.
 *
 * @param stream - MediaStream from getMicStream()
 * @param onSilenceDetected - Optional callback when silence auto-stop triggers
 * @returns Promise<RecordingResult> with the audio blob and duration
 */
export function recordWithSilenceDetection(
  stream: MediaStream,
  onSilenceDetected?: () => void
): {
  promise: Promise<RecordingResult>;
  stop: () => void;
} {
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: getSupportedMimeType(),
  });
  const chunks: Blob[] = [];
  const startTime = Date.now();

  // Set up AudioAnalyser for silence detection
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  const dataArray = new Float32Array(analyser.fftSize);

  let silenceStart: number | null = null;
  let stopped = false;
  let silenceCheckInterval: ReturnType<typeof setInterval>;
  let maxTimeout: ReturnType<typeof setTimeout>;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(silenceCheckInterval);
    clearTimeout(maxTimeout);
    if (mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    audioContext.close();
  };

  const promise = new Promise<RecordingResult>((resolve) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      resolve({ blob, durationMs: Date.now() - startTime });
    };

    mediaRecorder.start(100); // Collect data every 100ms

    // Silence detection loop
    silenceCheckInterval = setInterval(() => {
      analyser.getFloatTimeDomainData(dataArray);

      // Calculate RMS
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);

      if (rms < SILENCE_THRESHOLD) {
        if (silenceStart === null) {
          silenceStart = Date.now();
        } else if (Date.now() - silenceStart > SILENCE_DURATION_MS) {
          onSilenceDetected?.();
          stop();
        }
      } else {
        silenceStart = null;
      }
    }, 100);

    // Safety timeout
    maxTimeout = setTimeout(() => {
      stop();
    }, MAX_RECORDING_MS);
  });

  return { promise, stop };
}

/**
 * Send recorded audio to the STT API route.
 */
export async function transcribeAudio(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", blob, "recording.webm");

  const res = await fetch("/api/stt", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`STT request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.text ?? "";
}

/**
 * Play an audio file from a URL. If the file doesn't exist (404),
 * falls back to browser SpeechSynthesis with a Spanish voice.
 *
 * @param src - Path to the pre-generated MP3 file
 * @param fallbackText - Text to speak via browser TTS if the file is missing
 * @returns Promise that resolves when playback finishes
 */
export function playAudioWithFallback(
  src: string,
  fallbackText: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(src);
    audio.onended = () => resolve();
    audio.onerror = () => {
      // File not found — use browser TTS
      speakWithBrowserTTS(fallbackText).then(resolve).catch(reject);
    };
    audio.play().catch(() => {
      speakWithBrowserTTS(fallbackText).then(resolve).catch(reject);
    });
  });
}

/**
 * Wait for browser speech synthesis voices to load.
 * On Windows/Chrome, voices load asynchronously.
 */
function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    // Voices not loaded yet — wait for the event
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
    // Safety timeout — don't hang forever
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });
}

/**
 * Browser-native SpeechSynthesis fallback.
 * Picks the best available Spanish voice (prefers online/Edge voices).
 * Includes safety timeout — Chrome's onend event is unreliable.
 */
export async function speakWithBrowserTTS(text: string): Promise<void> {
  if (!("speechSynthesis" in window) || !text.trim()) {
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const voices = await waitForVoices();

  return new Promise<void>((resolve) => {
    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(safetyTimer);
      resolve();
    };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.9;

    // Prefer online/Edge Spanish voices (much higher quality on Windows)
    const spanishVoices = voices.filter((v) => v.lang.startsWith("es"));
    const onlineSpanish = spanishVoices.find((v) => !v.localService);
    const localSpanish = spanishVoices.find((v) => v.localService);
    const bestVoice = onlineSpanish ?? localSpanish;

    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
    }

    utterance.onend = done;
    utterance.onerror = done;

    // Safety timeout: Chrome sometimes never fires onend.
    // Estimate ~80ms per character at 0.9 rate, minimum 3s.
    const estimatedMs = Math.max(3000, text.length * 80);
    const safetyTimer = setTimeout(() => {
      console.warn("TTS safety timeout — onend never fired");
      window.speechSynthesis.cancel();
      done();
    }, estimatedMs);

    // Chrome bug: speech can hang if called immediately after cancel
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  });
}

/**
 * Play a short prompt tone using Web Audio API.
 * A clean sine wave beep that signals "speak now."
 */
export function playPromptTone(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880; // A5 — clear, not jarring
      gain.gain.value = 0.15; // Soft volume

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      // Fade in/out for smooth sound
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.03);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);

      oscillator.onended = () => {
        ctx.close().catch(() => {});
        resolve();
      };
    } catch {
      resolve(); // Don't block drill flow if AudioContext fails
    }
  });
}

/**
 * Get the best supported audio MIME type for MediaRecorder.
 */
function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "audio/webm"; // Fallback
}
