const fs = require("fs");
const path = require("path");

const drillsDir = path.join(__dirname, "..", "drills");
const requiredFields = [
  "source_unit",
  "drill_type",
  "original_focus",
  "cue_audio_text",
  "base_sentence",
  "is_chain",
  "accepted_outputs",
  "strictness",
  "tags",
  "block_instruction",
];

let failures = 0;

for (const file of fs.readdirSync(drillsDir).filter((name) => /^unit_\d+\.json$/.test(name))) {
  const filePath = path.join(drillsDir, file);
  const items = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!Array.isArray(items) || items.length === 0) {
    report(file, 0, "file must contain a non-empty array");
    continue;
  }

  items.forEach((item, index) => {
    for (const field of requiredFields) {
      if (!(field in item)) report(file, index, `missing ${field}`);
    }

    if (!Array.isArray(item.accepted_outputs) || item.accepted_outputs.length === 0) {
      report(file, index, "accepted_outputs must be non-empty");
    }

    if (!item.block_instruction || !String(item.block_instruction).trim()) {
      report(file, index, "block_instruction must be non-empty");
    }

    if (typeof item.is_chain !== "boolean") {
      report(file, index, "is_chain must be boolean");
    }

    if (item.is_chain && index > 0) {
      const previousAnswer = items[index - 1].accepted_outputs?.[0];
      if (!previousAnswer) report(file, index, "chain item follows item with no answer");
    }
  });
}

if (failures > 0) {
  console.error(`Drill validation failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log("Drill validation passed.");

function report(file, index, message) {
  failures += 1;
  console.error(`${file}:${index + 1} ${message}`);
}
