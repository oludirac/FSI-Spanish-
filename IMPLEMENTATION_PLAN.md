# FSI Spanish Drills: Fix + Improve Checklist

This file is the working implementation checklist for making the app a GitHub-ready MVP.

## Keep / Remove / Defer

- [x] Keep the core Next.js drill app, Units 7-16 JSON, deterministic grader, mic/STT flow, local progress, and browser TTS fallback.
- [x] Keep ElevenLabs audio generation as an optional utility only.
- [x] Keep local evidence materials on the machine, but exclude PDFs, local notes, generated audio, and env files from GitHub.
- [x] Defer full-course coverage, realtime voice, chatbot conversation, LLM pass/fail grading, and advanced dashboards.

## Core Fixes

- [x] Add Unit 16 to the unit grid.
- [x] Move drill progression into a pure tested helper.
- [x] Fix stale pass/fail/completion/re-drill state handling.
- [x] Make final failed items enter the re-drill queue.
- [x] Ensure re-drilled items can play again.
- [x] Remove hook dependency suppressions from the core drill loop.
- [x] Save clear unit progress with pass/fail/re-drill information.

## Learner Experience

- [x] Add Training Mode as the default.
- [x] Keep Test Mode for audio-first practice.
- [x] Add first-run/start explanation.
- [x] Show base sentence, cue, task label, and block lesson in Training Mode.
- [x] Add explicit number/person transformation guidance.
- [x] Add watch-out notes for verb endings, agreement, clitics, personal `a`, and subject-drop rules.
- [x] Add replay, show answer, skip, and typed-answer fallback controls.
- [x] Update the guide so it matches the app.

## Feedback And Review

- [x] Improve failure feedback with transcript and expected answer.
- [x] Add immediate retry for failed items.
- [x] Add mark-correct-local escape hatch.
- [x] Add end-of-session review with failed items and retry options.

## API / Audio

- [x] Keep `/api/stt` server-side.
- [x] Use a current transcription model.
- [x] Keep deterministic grading as the source of truth.
- [x] Document browser TTS as the default and generated audio as optional.

## Repo + GitHub Readiness

- [x] Add `.env.example`.
- [x] Strengthen `.gitignore` for local evidence and generated files.
- [x] Rewrite README for actual MVP scope.
- [x] Add MIT license with public-domain FSI note.

## Tests And Validation

- [x] Add Vitest.
- [x] Add grader tests.
- [x] Add progression tests.
- [x] Add drill content validation script.
- [x] Verify `npm run lint`, `npm test`, `npm run validate:drills`, and `npm run build`.
