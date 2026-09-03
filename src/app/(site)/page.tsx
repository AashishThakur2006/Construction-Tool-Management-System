const FEATURES = [
  {
    k: "Register",
    h: "One asset register, always current",
    p: "Every excavator, generator and total station on the books — condition, hours, book value, serial. It updates the moment an allocation changes.",
    bullets: ["Filter by category, status or condition", "Per-asset history kept for audit", "Retire without losing the record"],
    art: "/art/field.svg",
    alt: "Abstract field of asset nodes linked to jobs",
  },
  {
    k: "Allocate",
    h: "Yard to job in three steps",
    p: "Choose the job, pick from the yard, confirm. The job page and the asset's own history reflect it immediately — no spreadsheet round-trip.",
    bullets: ["Allocate, return, transfer", "Bulk-select straight from the register", "Transfers logged both sides"],
    art: "/art/blueprint.svg",
    alt: "Blueprint-style diagram of an allocation path",
  },
  {
    k: "Maintain",
    h: "Faults from report to resolution",
    p: "Site Engineers raise a fault with an estimate. The Owner approves the spend. The workshop takes intake, and the asset returns serviceable.",
    bullets: ["Reported → Approved → In workshop → Resolved", "Owner approves every rupee", "Machine status stays in sync"],
    art: "/art/workshop.svg",
    alt: "Concentric dials representing the maintenance pipeline",
  },
  {
    k: "Settle",
    h: "A ledger that ties to the work",
    p: "Payments recorded against the job they belong to. Paid, pending, overdue and disputed are all one glance, scoped to what you run.",
    bullets: ["Per-job committed spend", "Overdue and disputed surfaced", "Void keeps the audit row"],
    art: "/art/ledger.svg",
    alt: "Bar chart of paid versus pending payments",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="wrap hero__inner">
          <span className="eyebrow">plant register</span>
          <h1>
            The register that keeps <span className="dim">every job, asset and rupee</span> in one place.
          </h1>
          <p className="lede">
            Plinth is where a construction firm runs its plant fleet — allocation
            to settlement. Owners see the whole picture; Site Engineers see the
            jobs they run, and nothing they shouldn&apos;t.
          </p>
          <div className="hero__cta">
            <a className="btn btn--primary" href="/app?tab=register">
              Start free
            </a>
            <a className="btn btn--ghost" href="/app">
              Sign in
            </a>
          </div>
          <p className="hero__note">no card · demo data included</p>

          <div className="hero__art">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/field.svg" alt="The Plinth allocation field — every dot an asset" />
          </div>
        </div>
      </section>

      <section className="section--tight">
        <div className="wrap">
          <div className="stats">
            <div><div className="n">64</div><div className="l">assets tracked in the demo</div></div>
            <div><div className="n">14</div><div className="l">live jobs across Pune</div></div>
            <div><div className="n">3</div><div className="l">yard · workshop · on a job</div></div>
            <div><div className="n">2</div><div className="l">roles, genuinely different views</div></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow">what it does</span>
            <h2>Four moves, one vocabulary</h2>
            <p className="lede">
              Assets live in the yard, get allocated to jobs, pass through the
              workshop, and every rupee lands on the ledger. Plinth never drifts
              from that language.
            </p>
          </div>

          {FEATURES.map((f) => (
            <div className="feature-row" key={f.k}>
              <div>
                <span className="card__k">{f.k}</span>
                <h3 style={{ marginTop: 10 }}>{f.h}</h3>
                <p className="muted" style={{ marginTop: 12 }}>{f.p}</p>
                <ul>
                  {f.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
              <div className="art-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.art} alt={f.alt} loading="lazy" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section--tight">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow">role scoping</span>
            <h2>Two people, two registers</h2>
          </div>
          <div className="grid grid--2">
            <div className="card">
              <span className="card__k">Owner</span>
              <h3>Every job, asset and payment</h3>
              <p>
                Fleet utilisation, committed spend, overdue invoices and
                maintenance exposure on one dashboard. Approves spend, records
                payments, manages the payroll, retires assets.
              </p>
            </div>
            <div className="card">
              <span className="card__k">Site Engineer</span>
              <h3>Only the jobs you run</h3>
              <p>
                Their jobs, the assets on them, the money and the faults on
                them — nothing else. Allocates, returns, transfers and raises
                fault reports; the Owner decides the rest.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cta-band">
            <span className="eyebrow">get started</span>
            <h2>Put your yard on the register.</h2>
            <p className="lede" style={{ marginInline: "auto", marginTop: 14 }}>
              Sign up and land straight in a fully seeded demo. Bring your own
              data when you&apos;re ready.
            </p>
            <div className="hero__cta">
              <a className="btn btn--primary" href="/app?tab=register">
                Create an account
              </a>
              <a className="btn btn--ghost" href="/pricing">
                See pricing
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
