import { NextRequest, NextResponse } from "next/server";
import { getTranscriptionModel } from "@/lib/transcription";

/**
 * POST /api/stt
 *
 * Proxy route for OpenAI Whisper speech-to-text.
 * Receives audio blob from client, sends to Whisper API,
 * returns transcription. Keeps API key server-side.
 *
 * This is the ONLY runtime API call in the entire app.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === "sk-your-key-here") {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
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

    // Build FormData for OpenAI API
    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, "recording.webm");
    whisperForm.append("model", getTranscriptionModel());
    whisperForm.append("language", "es");
    whisperForm.append("response_format", "json");
    // Prompt biases Whisper toward Spanish text output —
    // prevents it from converting "veinte" to "20", etc.
    whisperForm.append(
      "prompt",
      "Transcripción en español. Escribir los números con letras: uno, dos, tres, veinte, cien."
    );

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: whisperForm,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Whisper API error:", errorText);
      return NextResponse.json(
        { error: "Whisper API request failed" },
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
