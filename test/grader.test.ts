import { describe, expect, it } from "vitest";
import { grade } from "../lib/grader";

describe("grade", () => {
  it("ignores accents, case, trailing periods, and discourse commas", () => {
    expect(grade("si la veo", ["Si, la veo."]).passed).toBe(true);
    expect(grade("APRENDEMOS ESPANOL.", ["Aprendemos espanol."]).passed).toBe(true);
  });

  it("normalizes ahi and alli", () => {
    expect(grade("Alicia come ahi", ["Alicia come alli."]).passed).toBe(true);
  });

  it("normalizes common digit output from STT", () => {
    expect(grade("Debe 20 pesos", ["Debe veinte pesos."]).passed).toBe(true);
  });

  it("allows subject drop only when enabled", () => {
    expect(
      grade("Aprendo mucho ahi", ["Yo aprendo mucho ahi."], {
        allow_subject_drop: true,
      }).passed
    ).toBe(true);

    expect(
      grade("Aprendo mucho ahi", ["Yo aprendo mucho ahi."], {
        allow_subject_drop: false,
      }).passed
    ).toBe(false);
  });
});
