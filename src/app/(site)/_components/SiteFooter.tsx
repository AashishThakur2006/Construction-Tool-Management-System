import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__row">
        <div className="site-footer__brand">
          <div className="brand">
            Plinth<span className="brand__tag">plant register</span>
          </div>
          <p>
            The plant register for every job, asset and rupee — allocation to
            settlement.
          </p>
        </div>

        <nav>
          <b>Product</b>
          <Link href="/">Overview</Link>
          <Link href="/pricing">Pricing</Link>
          <a href="/app">Sign in</a>
          <a href="/guide.html">Design guide</a>
        </nav>
        <nav>
          <b>Company</b>
          <Link href="/about">About</Link>
          <Link href="/people">People</Link>
        </nav>
        <nav>
          <b>Get started</b>
          <a href="/app?tab=register">Create an account</a>
          <a href="/app">Book a walkthrough</a>
        </nav>
      </div>
      <div className="wrap site-footer__legal">
        <span>© {new Date().getFullYear()} Plinth. A student project.</span>
        <span>Built with Next.js + Supabase</span>
      </div>
    </footer>
  );
}
