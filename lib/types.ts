/** Core drill item — matches the JSON schema in drills/unit_XX.json */
export interface DrillItem {
  source_unit: string;
  drill_type:
    | "controlled_substitution"
    | "structural_transformation"
    | "constrained_response"
    | "combination";
  original_focus: string;
  cue_audio_text: string;
  base_sentence: string;
  is_chain: boolean;
  accepted_outputs: string[];
  strictness: {
    require_accents: boolean;
    allow_subject_drop: boolean;
  };
  tags: string[];
  /** Optional: Spanish phrase spoken when this block starts (e.g. "Hágalo plural o singular: verbo") */
  block_instruction?: string;
}

/** Per-unit progress stored in localStorage */
export interface UnitProgress {
  unit: number;
  completed: number;
  total: number;
  passCount: number;
  failCount: number;
  reDrillCount?: number;
  failedIndices: number[];
  lastSessionDate: string | null;
}

/** Metadata for unit selection grid */
export interface UnitMeta {
  unit: number;
  volume: number;
  title: string;
  itemCount: number;
}

/** Drill session state machine */
export type SessionPhase = "main" | "re_drill";

export interface SessionState {
  mainQueue: number[];
  reDrillQueue: number[];
  currentIndex: number;
  phase: SessionPhase;
}

export type DrillState =
  | "loading"
  | "ready"
  | "playing_cue"
  | "listening"
  | "processing"
  | "show_pass"
  | "show_fail"
  | "transcript_flash"
  | "playing_correct"
  | "session_end";

/** Grader result */
export interface GradeResult {
  passed: boolean;
  transcript: string;
  matchedOutput: string | null;
}
