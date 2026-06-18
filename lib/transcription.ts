const DEFAULT_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";

export function getTranscriptionModel(): string {
  return process.env.OPENAI_TRANSCRIPTION_MODEL || DEFAULT_TRANSCRIPTION_MODEL;
}
