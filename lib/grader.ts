import { GradeResult } from "./types";

/**
 * Spanish number words ↔ digits mapping.
 * Whisper sometimes outputs "20" instead of "veinte".
 */
const DIGIT_TO_WORD: Record<string, string> = {
  "0": "cero", "1": "un", "2": "dos", "3": "tres", "4": "cuatro",
  "5": "cinco", "6": "seis", "7": "siete", "8": "ocho", "9": "nueve",
  "10": "diez", "11": "once", "12": "doce", "13": "trece", "14": "catorce",
  "15": "quince", "16": "dieciseis", "17": "diecisiete", "18": "dieciocho",
  "19": "diecinueve", "20": "veinte", "21": "veintiun",
  "30": "treinta", "40": "cuarenta", "50": "cincuenta",
  "60": "sesenta", "70": "setenta", "80": "ochenta", "90": "noventa",
  "100": "cien", "200": "doscientos", "500": "quinientos", "1000": "mil",
};

/**
 * Replace digit sequences with Spanish word equivalents.
 */
function normalizeDigits(text: string): string {
  // Sort by length descending so "100" matches before "10" before "1"
  const sorted = Object.entries(DIGIT_TO_WORD).sort(
    (a, b) => b[0].length - a[0].length
  );
  let result = text;
  for (const [digit, word] of sorted) {
    result = result.replace(new RegExp(`\\b${digit}\\b`, "g"), word);
  }
  return result;
}

/**
 * Normalize a string for comparison:
 * 1. Unicode NFC normalization
 * 2. Strip ALL diacritical marks (accents, tildes, dieresis)
 * 3. Lowercase
 * 4. Trim and collapse whitespace
 * 5. Strip trailing period
 * 6. Normalize discourse marker commas ("Sí, X" matches "Sí X")
 * 7. Locative equivalence: allí → ahí (grading_policy locative_adverb_equivalence)
 * 8. Convert digits to Spanish words ("20" → "veinte")
 */
function normalize(text: string): string {
  // Step 1: Unicode NFC
  let s = text.normalize("NFC");

  // Step 2: Strip all combining diacritical marks
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Step 3: Lowercase
  s = s.toLowerCase();

  // Step 4: Trim and collapse whitespace
  s = s.trim().replace(/\s+/g, " ");

  // Step 5: Strip trailing period
  if (s.endsWith(".")) {
    s = s.slice(0, -1).trimEnd();
  }

  // Step 6: Discourse marker comma normalization
  s = s.replace(/^(si|no),\s*/i, "$1 ");

  // Step 7: Locative adverb equivalence (ahí/allí — Whisper can't distinguish; policy: treat same)
  s = s.replace(/\balli\b/g, "ahi");

  // Step 8: Digits → Spanish words
  s = normalizeDigits(s);

  return s;
}

/** Spanish subject pronouns (normalized, no accents) that can be dropped when allow_subject_drop is true */
const SUBJECT_PRONOUNS =
  /^(yo|nosotros|nosotras|tu|usted|el|ella|ellos|ellas|ustedes)\s+/i;

/**
 * Return normalized string with leading subject pronoun stripped, if present.
 * Used when allow_subject_drop is true so "aprendo mucho ahi" matches "Yo aprendo mucho ahí."
 */
function dropLeadingSubject(normalized: string): string {
  return normalized.replace(SUBJECT_PRONOUNS, "").trim();
}

export interface GradeOptions {
  allow_subject_drop?: boolean;
}

/**
 * Grade a user's spoken response against accepted outputs.
 *
 * Accent Policy: Accents are NOT enforced at grading time. Whisper's Spanish
 * transcription inconsistently reproduces accent marks. The grader strips all
 * diacritical marks from both sides before comparing. `require_accents: true`
 * in drill JSON is a content quality flag only — it ensures the JSON files
 * themselves use correct orthography but does not affect runtime grading.
 *
 * @param transcript - Raw text from Whisper STT
 * @param acceptedOutputs - Array of valid responses from drill JSON
 * @param options - Optional: allow_subject_drop — also accept answer without leading subject pronoun
 * @returns GradeResult with pass/fail, transcript, and which output matched
 */
export function grade(
  transcript: string,
  acceptedOutputs: string[],
  options?: GradeOptions
): GradeResult {
  const normalizedTranscript = normalize(transcript);
  const allowSubjectDrop = options?.allow_subject_drop === true;

  for (const output of acceptedOutputs) {
    const normalizedOutput = normalize(output);
    if (normalizedTranscript === normalizedOutput) {
      return {
        passed: true,
        transcript,
        matchedOutput: output,
      };
    }
    if (allowSubjectDrop) {
      const withoutSubject = dropLeadingSubject(normalizedOutput);
      if (withoutSubject && normalizedTranscript === withoutSubject) {
        return {
          passed: true,
          transcript,
          matchedOutput: output,
        };
      }
    }
  }

  return {
    passed: false,
    transcript,
    matchedOutput: null,
  };
}
