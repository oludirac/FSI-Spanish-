const fs = require('fs');
const path = require('path');

// Migration: prompt_text → base_sentence + is_chain
// Also fixes:
// 1. Ud./Uds. → usted/ustedes in cue_audio_text and accepted_outputs
// 2. Normalize original_focus vocabulary
// 3. Fix taxonomy: number substitution items in unit 9 that should be controlled_substitution

const FOCUS_REPLACEMENTS = [
  [/number change/g, 'number substitution'],
  [/person-number substitution/g, 'person substitution'],
  [/number transformation/g, 'number substitution'],
  [/noun-adjective gender agreement/g, 'gender substitution'],
];

function fixUdAbbreviations(text) {
  // Only fix standalone Ud./Uds. not inside words
  return text
    .replace(/\bUd\.\b/g, 'usted')
    .replace(/\bUds\.\b/g, 'ustedes');
}

function normalizeOriginalFocus(focus) {
  let result = focus;
  for (const [pattern, replacement] of FOCUS_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function migrateUnit(unitNum) {
  const padded = String(unitNum).padStart(2, '0');
  const filePath = path.join(__dirname, '..', 'drills', `unit_${padded}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  Unit ${unitNum}: file not found, skipping`);
    return;
  }

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changes = 0;

  const migrated = items.map(item => {
    // Extract base_sentence from prompt_text if needed
    let baseSentence = item.base_sentence;
    if (!baseSentence && item.prompt_text) {
      const parts = item.prompt_text.split(' — ');
      baseSentence = parts[0] || '';
      changes++;
    }

    // Fix Ud./Uds. in cue_audio_text
    const fixedCue = fixUdAbbreviations(item.cue_audio_text);
    if (fixedCue !== item.cue_audio_text) changes++;

    // Fix Ud./Uds. in accepted_outputs
    const fixedOutputs = item.accepted_outputs.map(o => fixUdAbbreviations(o));
    if (JSON.stringify(fixedOutputs) !== JSON.stringify(item.accepted_outputs)) changes++;

    // Fix Ud./Uds. in base_sentence
    const fixedBase = fixUdAbbreviations(baseSentence);
    if (fixedBase !== baseSentence) changes++;

    // Normalize original_focus
    const fixedFocus = normalizeOriginalFocus(item.original_focus);
    if (fixedFocus !== item.original_focus) changes++;

    // Build clean object with field order
    return {
      source_unit: item.source_unit,
      drill_type: item.drill_type,
      original_focus: fixedFocus,
      cue_audio_text: fixedCue,
      base_sentence: fixedBase,
      is_chain: item.is_chain || false,
      accepted_outputs: fixedOutputs,
      strictness: item.strictness,
      tags: item.tags,
    };
  });

  fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2) + '\n');
  console.log(`  Unit ${unitNum}: ${migrated.length} items, ${changes} changes`);
}

// Migrate units 7-15
console.log('Migrating units 7-15...');
for (let u = 7; u <= 15; u++) {
  migrateUnit(u);
}
console.log('Done.');
