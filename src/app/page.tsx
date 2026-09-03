import Script from "next/script";

/**
 * Plinth is a static client-side SPA (hash router in /public/js/main.js).
 * This route just serves its shell; everything else happens in the browser
 * against /api/state and /api/mutate.
 */
export default function Page() {
  return (
    <>
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
