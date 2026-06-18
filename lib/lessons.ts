import { DrillItem } from "./types";

export interface BlockLesson {
  title: string;
  explanation: string;
  examples: Array<{ from: string; to: string }>;
  watchOut: string[];
}

export function getTaskLabel(drill: DrillItem): string {
  const instruction = drill.block_instruction?.trim();
  if (instruction) {
    return instruction
      .replace(/^H.galo/i, "Change it")
      .replace(/^Sustituci.n/i, "Substitution")
      .replace(/^Transformaci.n/i, "Transformation")
      .replace(/^Respuesta/i, "Response");
  }

  switch (drill.drill_type) {
    case "controlled_substitution":
      return "Substitution";
    case "structural_transformation":
      return "Transformation";
    case "constrained_response":
      return "Response";
    case "combination":
      return "Combination";
    default:
      return "Drill";
  }
}

export function getBlockLesson(drill: DrillItem): BlockLesson {
  const focus = `${drill.original_focus} ${drill.block_instruction ?? ""} ${drill.tags.join(" ")}`.toLowerCase();

  if (focus.includes("number substitution") || focus.includes("plural o singular")) {
    return {
      title: "Change singular to plural, or plural to singular",
      explanation:
        "These FSI drills flip person and number. I/yo becomes we/nosotros, and we/nosotros becomes I/yo. Formal you/usted becomes ustedes, ellos, or ellas depending on the sentence; ustedes/ellos/ellas becomes usted. This course uses Latin American formal Spanish, so you all is ustedes, not vosotros.",
      examples: [
        { from: "Aprendo espanol.", to: "Aprendemos espanol." },
        { from: "Usted come aqui.", to: "Ustedes comen aqui." },
      ],
      watchOut: [
        "Listen for whether the verb is singular or plural.",
        "Change the verb ending, not just the subject word.",
        "In this app, you singular is usually usted and you all is ustedes.",
      ],
    };
  }

  if (focus.includes("clitic") || focus.includes("direct object") || focus.includes("indirect")) {
    return {
      title: "Track the object pronoun",
      explanation:
        "These drills test Spanish object pronouns. Keep the person, gender, and number straight before you answer.",
      examples: [
        { from: "Busco a la secretaria.", to: "La busco." },
        { from: "A mi me falta una maleta.", to: "A nosotros nos falta una maleta." },
      ],
      watchOut: [
        "Lo/la/los/las agree with the direct object.",
        "Le/les are indirect object clitics.",
        "Spanish often keeps the a + person phrase for emphasis.",
      ],
    };
  }

  if (focus.includes("personal a")) {
    return {
      title: "Use personal a before people",
      explanation:
        "When a specific person is the direct object, Spanish normally uses a before that person.",
      examples: [{ from: "Busco la oficina.", to: "Busco a la secretaria." }],
      watchOut: [
        "Use a with specific people.",
        "Do not add a before ordinary things.",
      ],
    };
  }

  if (focus.includes("gender") || focus.includes("adjective") || focus.includes("agreement")) {
    return {
      title: "Make the words agree",
      explanation:
        "Articles and adjectives usually change to match the noun's gender and number.",
      examples: [
        { from: "El libro es bueno.", to: "La mesa es buena." },
        { from: "La casa es grande.", to: "Las casas son grandes." },
      ],
      watchOut: [
        "Check masculine/feminine endings.",
        "Check singular/plural endings.",
        "The adjective follows the noun it describes.",
      ],
    };
  }

  if (focus.includes("subject") || focus.includes("person")) {
    return {
      title: "Change the subject and the verb together",
      explanation:
        "When the subject changes, the verb ending usually changes too. Spanish often lets you drop the subject pronoun, but the drill may require it when the subject is the tested part.",
      examples: [
        { from: "Yo aprendo mucho.", to: "Nosotros aprendemos mucho." },
        { from: "Usted vive aqui.", to: "Ustedes viven aqui." },
      ],
      watchOut: [
        "Do not leave the old verb ending behind.",
        "Subject pronoun dropping is allowed only on some items.",
      ],
    };
  }

  if (drill.drill_type === "constrained_response") {
    return {
      title: "Answer the question in the expected pattern",
      explanation:
        "These are not free conversation questions. Use the cue and answer with the structure the drill is practicing.",
      examples: [{ from: "Come usted aqui?", to: "Si, como aqui." }],
      watchOut: [
        "Alternative questions may accept either option.",
        "If a hint is spoken first, use it in your answer.",
        "Keep si/no when the prompt asks for confirmation or correction.",
      ],
    };
  }

  return {
    title: "Listen, transform, and answer",
    explanation:
      "Use the cue to transform the base sentence. The goal is the specific grammar pattern, not a free translation.",
    examples: [{ from: drill.base_sentence, to: drill.accepted_outputs[0] ?? "" }],
    watchOut: [
      "Keep the sentence structure close to the model.",
      "Say the whole answer, not only the changed word.",
    ],
  };
}
