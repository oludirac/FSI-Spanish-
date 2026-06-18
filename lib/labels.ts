/**
 * Maps verbose original_focus strings to short, human-readable
 * instruction labels for display and audio announcement.
 *
 * Matching is done by keyword prefix — the first match wins.
 * Order matters: more specific patterns come first.
 */

const LABEL_RULES: [RegExp, string][] = [
  // Number substitution
  [/number substitution.*singular to plural/i, "Make it plural"],
  [/number substitution.*plural to singular/i, "Make it singular"],
  [/number substitution/i, "Flip the number"],

  // Person substitution
  [/person substitution/i, "Change the subject"],

  // Demonstrative
  [/demonstrative form substitution/i, "Change the demonstrative"],
  [/demonstrative gender agreement/i, "Match the demonstrative"],
  [/demonstrative response.*spatial/i, "Point to the right one"],
  [/demonstrative response/i, "Answer with demonstratives"],

  // Replacement / chain
  [/chain:/i, "Replacement chain"],
  [/replacement drill/i, "Replace and adjust"],
  [/replacement:/i, "Replace and adjust"],

  // Possessive
  [/possessive disambiguation/i, "Clarify the possessive"],
  [/possessive nominalization/i, "Drop the noun"],

  // Clitic
  [/redundant clitic.*person substitution/i, "Change the person"],
  [/redundant clitic.*number substitution/i, "Flip the number"],
  [/redundant clitic.*alternative question/i, "Answer the question"],
  [/redundant clitic.*who-question/i, "Answer the question"],
  [/redundant clitic.*yes.*no/i, "Answer yes or no"],
  [/redundant clitic/i, "Adjust the clitic"],

  // Negative question
  [/negative question/i, "Make it a negative question"],

  // Response drills
  [/response drill.*alternative/i, "Pick one and answer"],
  [/response drill.*information/i, "Answer the question"],
  [/response drill.*negative/i, "Correct with no"],
  [/response drill/i, "Answer the question"],

  // Progressive
  [/progressive/i, "Continue the pattern"],

  // Tense
  [/tense substitution.*past/i, "Put it in the past"],
  [/tense substitution.*present/i, "Put it in the present"],
  [/tense substitution/i, "Change the tense"],

  // Gender
  [/gender substitution/i, "Flip the gender"],
  [/gender agreement/i, "Match the gender"],

  // Lexical
  [/lexical substitution/i, "Swap the word"],
];

/**
 * Convert a verbose original_focus string to a short human-readable label.
 * Falls back to the original string (title-cased, trimmed) if no rule matches.
 */
export function getDisplayLabel(originalFocus: string): string {
  for (const [pattern, label] of LABEL_RULES) {
    if (pattern.test(originalFocus)) {
      return label;
    }
  }
  // Fallback: clean up the raw string
  return originalFocus
    .replace(/[_:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}
