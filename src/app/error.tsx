"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <link rel="stylesheet" href="/landing.css" />
      <main className="wrap" style={{ minHeight: "100dvh", display: "grid", placeItems: "center", textAlign: "center" }} role="alert">
        <div>
          <span className="eyebrow">Something went wrong</span>
          <h1 style={{ maxWidth: "14ch", marginInline: "auto" }}>We hit a snag loading this page.</h1>
          <p className="lede" style={{ margin: "20px auto 0" }}>
            Your data is safe. Try again, and if it keeps happening, reload the page.
            {error.digest ? ` Reference: ${error.digest}.` : ""}
          </p>
          <div className="hero__cta">
            <button className="btn btn--primary btn--lg" onClick={reset}>Try again</button>
            <a className="btn btn--ghost btn--lg" href="/">Back to home</a>
          </div>
        </div>
      </main>
    </>
  );
}
