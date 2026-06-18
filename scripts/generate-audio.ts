/**
 * Build-time script: Generate TTS audio files from drill JSONs using ElevenLabs.
 *
 * Usage:
 *   npx ts-node scripts/generate-audio.ts
 *   npx ts-node scripts/generate-audio.ts --force    # Regenerate existing files
 *   npx ts-node scripts/generate-audio.ts --unit 10  # Only generate for unit 10
 *
 * Requires ELEVENLABS_API_KEY in .env.local
 *
 * For each drill item at index N, generates 2 MP3 files:
 *   public/audio/unit_XX/cue_NNN.mp3   — speaks the cue_audio_text
 *   public/audio/unit_XX/answer_NNN.mp3 — speaks accepted_outputs[0]
 */

import * as fs from "fs";
import * as path from "path";

// Load .env.local
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        process.env[key] = value;
      }
    }
  }
}

const API_KEY = process.env.ELEVENLABS_API_KEY;
// ElevenLabs multilingual v2 voice — neutral Latin American Spanish
// You can change this to any ElevenLabs voice ID
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // "Rachel" — replace with preferred Spanish voice
const MODEL_ID = "eleven_multilingual_v2";

interface DrillItem {
  cue_audio_text: string;
  accepted_outputs: string[];
}

async function generateSpeech(text: string, outputPath: string): Promise<void> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs API error (${res.status}): ${err}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}

async function processUnit(
  unitNum: number,
  force: boolean
): Promise<{ generated: number; skipped: number }> {
  const paddedUnit = String(unitNum).padStart(2, "0");
  const jsonPath = path.resolve(
    __dirname,
    "..",
    "drills",
    `unit_${paddedUnit}.json`
  );

  if (!fs.existsSync(jsonPath)) {
    console.log(`  Skipping unit ${unitNum}: no JSON file found`);
    return { generated: 0, skipped: 0 };
  }

  const drills: DrillItem[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const audioDir = path.resolve(
    __dirname,
    "..",
    "public",
    "audio",
    `unit_${paddedUnit}`
  );
  fs.mkdirSync(audioDir, { recursive: true });

  let generated = 0;
  let skipped = 0;

  for (let i = 0; i < drills.length; i++) {
    const drill = drills[i];
    const paddedIndex = String(i + 1).padStart(3, "0");
    const cuePath = path.join(audioDir, `cue_${paddedIndex}.mp3`);
    const answerPath = path.join(audioDir, `answer_${paddedIndex}.mp3`);

    // Generate cue audio
    if (force || !fs.existsSync(cuePath)) {
      console.log(`  [${paddedUnit}] cue_${paddedIndex}: "${drill.cue_audio_text}"`);
      await generateSpeech(drill.cue_audio_text, cuePath);
      generated++;
      // Rate limiting: ElevenLabs allows ~10 req/s on starter
      await sleep(150);
    } else {
      skipped++;
    }

    // Generate answer audio
    if (force || !fs.existsSync(answerPath)) {
      const answerText = drill.accepted_outputs[0];
      console.log(`  [${paddedUnit}] answer_${paddedIndex}: "${answerText}"`);
      await generateSpeech(answerText, answerPath);
      generated++;
      await sleep(150);
    } else {
      skipped++;
    }
  }

  return { generated, skipped };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!API_KEY || API_KEY === "your-key-here") {
    console.error(
      "Error: ELEVENLABS_API_KEY not set. Add it to .env.local"
    );
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const unitArgIdx = args.indexOf("--unit");
  const specificUnit =
    unitArgIdx >= 0 ? parseInt(args[unitArgIdx + 1], 10) : null;

  console.log("FSI Audio Generator");
  console.log(`  Force: ${force}`);
  console.log(`  Unit: ${specificUnit ?? "all"}`);
  console.log("");

  const drillsDir = path.resolve(__dirname, "..", "drills");
  const files = fs.readdirSync(drillsDir).filter((f) => /^unit_\d+\.json$/.test(f));
  const unitNums = files
    .map((f) => parseInt(f.match(/unit_(\d+)/)?.[1] ?? "0", 10))
    .filter((n) => n > 0)
    .sort((a, b) => a - b);

  const unitsToProcess = specificUnit
    ? unitNums.filter((n) => n === specificUnit)
    : unitNums;

  let totalGenerated = 0;
  let totalSkipped = 0;

  for (const unitNum of unitsToProcess) {
    console.log(`Processing Unit ${unitNum}...`);
    const { generated, skipped } = await processUnit(unitNum, force);
    totalGenerated += generated;
    totalSkipped += skipped;
    console.log(`  Done: ${generated} generated, ${skipped} skipped`);
  }

  console.log("");
  console.log(
    `Complete: ${totalGenerated} files generated, ${totalSkipped} skipped`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
