import { NextRequest, NextResponse } from "next/server";
import { getTranscriptionModel } from "@/lib/transcription";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
]);

/**
 * POST /api/stt
 *
 * Server-side proxy for OpenAI speech-to-text.
 * Keeps the API key off the client and validates the uploaded audio before
 * forwarding it upstream.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  const contentLength = Number(request.headers.get("content-length") || 0);

  if (!apiKey || apiKey === "sk-your-key-here") {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  if (contentLength > MAX_AUDIO_BYTES + 1024 * 1024) {
    return NextResponse.json(
      { error: "Audio upload is too large" },
      { status: 413 }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (audioFile.size <= 0 || audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Audio file size is invalid" },
        { status: 413 }
      );
    }

    if (audioFile.type && !ALLOWED_AUDIO_TYPES.has(audioFile.type)) {
      return NextResponse.json(
        { error: "Unsupported audio type" },
        { status: 415 }
      );
    }

    const transcriptionForm = new FormData();
    transcriptionForm.append("file", audioFile, "recording.webm");
    transcriptionForm.append("model", getTranscriptionModel());
    transcriptionForm.append("language", "es");
    transcriptionForm.append("response_format", "json");
    transcriptionForm.append(
      "prompt",
      "Transcripcion en espanol. Escribir los numeros con letras: uno, dos, tres, veinte, cien."
    );

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: transcriptionForm,
      }
    );

    if (!response.ok) {
      console.error("Transcription API request failed:", response.status);
      return NextResponse.json(
        { error: "Transcription request failed" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ text: result.text ?? "" });
  } catch (error) {
    console.error("STT route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
