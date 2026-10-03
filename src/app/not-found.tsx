import Link from "next/link";

export const metadata = { title: "Page not found — Plinth" };

export default function NotFound() {
  return (
    <>
      <link rel="stylesheet" href="/landing.css" />
      <main className="wrap" style={{ minHeight: "100dvh", display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <span className="eyebrow">404</span>
          <h1 style={{ maxWidth: "12ch", marginInline: "auto" }}>That page isn&apos;t on the register.</h1>
          <p className="lede" style={{ margin: "20px auto 0" }}>
            The link may be old, or the address mistyped. Nothing was changed.
          </p>
          <div className="hero__cta">
            <Link className="btn btn--primary btn--lg" href="/">Back to home</Link>
            <a className="btn btn--ghost btn--lg" href="/app">Open the app</a>
          </div>
        </div>
      </main>
    </>
  );
}
