import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Plinth — the register",
};

/**
 * Plinth is a static client-side SPA (hash router in /public/js/main.js).
 * This route serves its shell and loads its own stylesheet; everything
 * else happens in the browser against /api/state and /api/mutate.
 */
export default function AppPage() {
  return (
    <>
      <link rel="stylesheet" href="/styles.css" />
      <div id="app">
        <div className="boot-fallback">
          <h1>Plinth</h1>
          <p>
            Loading the register. If this message does not clear, JavaScript
            failed to load — check the connection and reload the page.
          </p>
        </div>
      </div>
      <Script src="/js/main.js" type="module" strategy="afterInteractive" />
    </>
  );
}
