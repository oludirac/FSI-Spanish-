"use client";

export default function StudyPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-bg px-6 py-12 no-select">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={onBack}
          className="mb-8 text-sm text-muted transition-colors hover:text-white"
        >
          &#8592; Back
        </button>

        <div className="mb-10">
          <h1 className="text-3xl font-bold">How the Drills Work</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            FSI drills are pattern practice. You hear a model or cue, change the
            sentence in a specific way, and say the full Spanish answer.
          </p>
        </div>

        <section className="mb-8 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-accent">Training Mode vs Test Mode</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">Training Mode</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Best for a first pass. It shows the base sentence, cue, grammar
                note, examples, replay controls, and typed-answer fallback.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Test Mode</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Best after you know the pattern. It keeps the experience closer
                to classic audio-first FSI practice.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-accent">Common Number/Person Flip</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            In many early drills, singular becomes plural and plural becomes
            singular. This course uses Latin American formal Spanish: &ldquo;you&rdquo; is
            usually <span className="text-white/80">usted</span>, and &ldquo;you all&rdquo;
            is <span className="text-white/80">ustedes</span>, not vosotros.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-border text-sm">
            <div className="grid grid-cols-2 bg-bg/70 px-3 py-2 text-xs uppercase tracking-wider text-muted">
              <span>If you hear</span>
              <span>Say</span>
            </div>
            {[
              ["yo / I", "nosotros / we"],
              ["nosotros / we", "yo / I"],
              ["usted / you singular", "ustedes, ellos, or ellas"],
              ["ustedes / ellos / ellas", "usted"],
            ].map(([from, to]) => (
              <div key={from} className="grid grid-cols-2 border-t border-border px-3 py-2">
                <span className="text-white/80">{from}</span>
                <span className="text-accent">{to}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <DrillCard
            title="Substitution"
            body="Swap the cue into the base sentence and adjust agreement."
            from="El libro es bueno. Cue: mesa"
            to="La mesa es buena."
          />
          <DrillCard
            title="Transformation"
            body="Change the sentence according to the instruction."
            from="Aprendo espanol."
            to="Aprendemos espanol."
          />
          <DrillCard
            title="Response"
            body="Answer the question using the practiced structure."
            from="Da usted las camisas?"
            to="Si, las doy."
          />
          <DrillCard
            title="Chain"
            body="Each answer can become the next base sentence."
            from="Este es el sector comercial. Cue: bonito"
            to="Este es el sector bonito."
          />
        </section>

        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Watch For</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
            <li>Verb endings carry person and number.</li>
            <li>Articles and adjectives agree with the noun.</li>
            <li>Object pronouns such as lo, la, le, and les are easy to mix up.</li>
            <li>Some drills require usted/ustedes because that is the tested form.</li>
            <li>A short beep means it is your turn to speak.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function DrillCard({
  title,
  body,
  from,
  to,
}: {
  title: string;
  body: string;
  from: string;
  to: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold text-accent">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
      <div className="mt-4 rounded-lg bg-bg/60 p-3 text-sm">
        <p className="text-white/70">{from}</p>
        <p className="mt-1 text-accent">-&gt; {to}</p>
      </div>
    </div>
  );
}
