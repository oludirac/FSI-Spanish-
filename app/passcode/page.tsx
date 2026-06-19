import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enter passcode | FSI Spanish Drills",
};

interface PasscodePageProps {
  searchParams?: {
    error?: string;
    next?: string;
  };
}

export default function PasscodePage({ searchParams }: PasscodePageProps) {
  const nextPath = searchParams?.next || "/";
  const hasError = searchParams?.error === "1";

  return (
    <main className="min-h-screen bg-bg px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-wider text-muted">
            Private demo
          </span>
          <h1 className="mt-2 text-3xl font-bold">FSI Spanish Drills</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            This deployment is passcode-protected because speech grading uses a
            server-side API key.
          </p>
        </div>

        <form
          action="/api/passcode"
          method="post"
          className="rounded-lg border border-border bg-surface p-5"
        >
          <input type="hidden" name="next" value={nextPath} />
          <label htmlFor="passcode" className="text-sm font-medium">
            Passcode
          </label>
          <input
            id="passcode"
            name="passcode"
            type="password"
            autoComplete="current-password"
            className="mt-3 w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-white outline-none focus:border-accent/60"
            required
          />
          {hasError && (
            <p className="mt-3 text-sm text-fail">
              That passcode was not correct. Try again.
            </p>
          )}
          <button
            type="submit"
            className="mt-5 w-full rounded-lg border border-accent/40 bg-accent/10 px-5 py-3 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
          >
            Enter
          </button>
        </form>
      </div>
    </main>
  );
}
