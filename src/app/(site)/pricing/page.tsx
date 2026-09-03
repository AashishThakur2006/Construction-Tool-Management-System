import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pricing" };

const PLANS = [
  {
    name: "Yard",
    price: "₹0",
    unit: "/ forever",
    blurb: "The full product on the seeded demo register.",
    features: ["1 Owner + 1 Site Engineer", "Seeded demo data", "Every module unlocked", "Community support"],
    cta: "Start free",
    href: "/app?tab=register",
    featured: false,
  },
  {
    name: "Site",
    price: "₹2,400",
    unit: "/ month",
    blurb: "For a contractor running a real fleet.",
    features: ["Up to 15 users", "Your own register", "Role scoping for every engineer", "Asset history export", "Email support"],
    cta: "Start 30-day trial",
    href: "/app?tab=register",
    featured: true,
  },
  {
    name: "Fleet",
    price: "Let's talk",
    unit: "",
    blurb: "Multiple yards, many engineers, custom needs.",
    features: ["Unlimited users", "Multi-yard registers", "SSO / OAuth", "Priority support", "Onboarding help"],
    cta: "Contact us",
    href: "/app",
    featured: false,
  },
];

const FAQ = [
  { q: "Is the free plan really the whole product?", a: "Yes. Every module is unlocked on the Yard plan — it just runs on the demo register with two accounts. Paid plans give you your own data and more users." },
  { q: "What counts as a user?", a: "Anyone who signs in. Site Engineers are scoped to their own jobs, so adding one only exposes their jobs' assets, money and faults." },
  { q: "Can I bring my own asset list?", a: "Import is on the roadmap. Today you'd seed it through the database; the schema is small and documented." },
  { q: "Do you offer OAuth / SSO?", a: "Google and GitHub sign-in are wired up and enable per project. Enterprise SSO is part of the Fleet plan." },
  { q: "Is this production software?", a: "It began as coursework and is honest about that. It runs, it's tested, and it's a genuine full-stack build — evaluate it on the demo before you trust it with a fleet." },
];

export default function PricingPage() {
  return (
    <>
      <section className="section">
        <div className="wrap">
          <span className="eyebrow">pricing</span>
          <h1 style={{ maxWidth: "14ch" }}>Priced per yard, not per asset.</h1>
          <p className="lede" style={{ marginTop: 22 }}>
            Start on the demo for free. Move to your own register when you&apos;re
            ready. No charge for the plant you already own.
          </p>
        </div>
      </section>

      <section className="section--tight">
        <div className="wrap">
          <div className="price-grid">
            {PLANS.map((p) => (
              <div className={`plan${p.featured ? " plan--featured" : ""}`} key={p.name}>
                <div className="plan__name">{p.name}</div>
                <div className="plan__price">
                  {p.price} {p.unit && <span>{p.unit}</span>}
                </div>
                <p className="muted" style={{ margin: 0, fontSize: 14.5 }}>{p.blurb}</p>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <a className={`btn ${p.featured ? "btn--primary" : "btn--ghost"}`} href={p.href}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow">questions</span>
            <h2>Before you sign up</h2>
          </div>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section--tight">
        <div className="wrap">
          <div className="cta-band">
            <h2>Try it on the demo first.</h2>
            <div className="hero__cta">
              <a className="btn btn--primary" href="/app?tab=register">Start free</a>
              <a className="btn btn--ghost" href="/app">Sign in</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
