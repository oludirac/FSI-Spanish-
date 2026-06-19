# FSI Spanish Speaking Drills

Audio-first Spanish speaking practice built from the public-domain FSI Spanish
Basic Course. The app helps learners practice structured transformations:
listen to a cue, produce the full Spanish answer, and get immediate feedback.

The focus is deliberate oral pattern practice rather than flashcards or free
conversation. It currently covers Units 7-16, with 343 drill items adapted for
browser-based speaking practice.

## What It Does

- Training Mode for first-time learners: visible base sentence, cue text,
  short English explanations, examples, replay controls, typed fallback, and
  answer reveal.
- Test Mode for classic audio-first practice once the pattern is familiar.
- Microphone recording with server-side OpenAI speech-to-text.
- Deterministic grading against accepted Spanish outputs.
- Failed items return once at the end of the session for focused review.
- Local progress is stored in `localStorage`.
- Browser speech synthesis works by default; pre-generated ElevenLabs audio is
  optional.

## Course Coverage

Included:

- Unit 7: number transformation, regular `-er` verbs
- Unit 8: number transformation, regular `-ir` verbs
- Unit 9: present perfect and possessives
- Unit 10: personal `a` and direct objects
- Unit 11: possessive number agreement
- Unit 12: adjective agreement and `ser`/`estar`
- Unit 13: relative clauses and demonstratives
- Unit 14: irregular verbs and periphrastic future
- Unit 15: indirect object clitics
- Unit 16: `faltar`, `gustar`, and negation review

Not included:

- Full FSI course coverage
- Required generated audio assets
- Realtime/WebRTC voice mode
- AI chatbot conversation
- LLM-based pass/fail grading

## Learner Notes

The app teaches the drill pattern before asking for spoken answers. For example,
early number/person drills often flip singular and plural:

| If you hear | Say |
| --- | --- |
| `yo` / I | `nosotros` / we |
| `nosotros` / we | `yo` / I |
| `usted` / you singular/formal | `ustedes`, `ellos`, or `ellas` |
| `ustedes`, `ellos`, or `ellas` | `usted` |

The course uses Latin American formal Spanish, so "you all" is `ustedes`, not
`vosotros`.

## Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- OpenAI speech-to-text API
- Optional ElevenLabs text-to-speech generation
- Vitest for core logic tests

## Setup

```bash
npm install
```

Create `.env.local` from `.env.example`:

```bash
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
APP_PASSCODE=
```

`ELEVENLABS_API_KEY` is optional. The app falls back to browser TTS when
generated audio files are not present.

`APP_PASSCODE` is optional. When set, the whole app is protected by a simple
passcode gate. This is useful for private Vercel demos that use your own
server-side OpenAI key.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

On Vercel, set these environment variables:

- `OPENAI_API_KEY`
- `OPENAI_TRANSCRIPTION_MODEL`
- `APP_PASSCODE`
- `ELEVENLABS_API_KEY` only if you plan to generate audio

The passcode gate is intentionally lightweight. It is enough for a private demo
link, but it is not a replacement for real user authentication.

## Verify

```bash
npm run lint
npm test
npm run validate:drills
npm run build
```

## Optional Audio Generation

The app works without pre-generated audio. To generate MP3 files with
ElevenLabs:

```bash
npx ts-node scripts/generate-audio.ts
npx ts-node scripts/generate-audio.ts --unit 10
npx ts-node scripts/generate-audio.ts --force
```

Generated files are written to `public/audio/` and are intentionally ignored by
Git.

## Content Format

Each drill item contains:

- source unit
- drill type
- grammar focus
- cue text
- base sentence
- chain flag
- accepted outputs
- strictness policy
- tags
- block instruction

Run `npm run validate:drills` before changing drill data.

## Known Limitations

- Speech-to-text can mishear correct Spanish. Training Mode includes typed
  fallback and local mark-correct controls for this reason.
- The grader is intentionally deterministic. It does not accept every possible
  paraphrase.
- Browser TTS quality depends on the user's device and installed voices.
- The current progress system is local-only.
- The app has no user accounts, sync, or hosted database.

## Roadmap

- Add richer per-unit study notes and vocabulary previews.
- Add adaptive daily review from missed items.
- Add optional AI feedback after failed answers while keeping deterministic
  pass/fail grading.
- Add screenshots and a short demo video.
- Continue extracting and auditing more FSI units.

## License And Source Material

Application code is MIT licensed.

The FSI Spanish Basic Course source material is public-domain United States
government material. Full source PDFs are not included in this repository.
