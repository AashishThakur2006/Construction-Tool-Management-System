import Icon from "./_components/Icon";

const BENTO = [
  { ico: "boxes", k: "Register", h: "One asset register", p: "Every excavator, generator and total station — condition, hours, book value, serial. Filter, sort, retire without losing the record." },
  { ico: "shuffle", k: "Allocate", h: "Yard to job in three steps", p: "Choose the job, pick from the yard, confirm. The job page and the asset's history reflect it the moment you commit." },
  { ico: "wrench", k: "Maintain", h: "Report to resolution", p: "Engineers raise a fault with an estimate; the Owner approves the spend; the workshop takes intake. Machine status stays in sync." },
  { ico: "receipt", k: "Settle", h: "A ledger tied to the work", p: "Payments recorded against the job they belong to. Paid, pending, overdue and disputed at a glance, scoped to what you run." },
];

const FEATURES = [
  {
    k: "Allocation",
    h: "The core transaction, in a flow you can't get wrong",
    p: "A three-step wizard from the yard to a job. Bulk-select straight from the register, review the value moving, confirm. Every allocate, return and transfer is written to both the job and the asset's own history.",
    bullets: ["Allocate · return · transfer, one vocabulary", "Transfers logged on both sites", "Undo on every action"],
    shot: "/art/panel-allocate.svg",
    alt: "The Plinth allocation wizard, step two — picking assets from the yard",
  },
  {
    k: "Maintenance",
    h: "The Owner approves every rupee of exposure",
    p: "Faults move Reported → Approved → In workshop → Resolved, or Rejected. Sending an asset to the workshop closes its allocation automatically, so the machine's status is never a lie.",
    bullets: ["Spend approval sits with the Owner", "Workshop intake pulls the asset off its job", "Quarterly exposure on the dashboard"],
    shot: "/art/panel-maintain.svg",
    alt: "A Plinth maintenance request showing the approval pipeline and progress timeline",
  },
];

const PLANS = [
  { name: "Yard", price: "₹0", unit: "forever", features: ["Full product on demo data", "1 Owner + 1 Site Engineer"], cta: "Start free", href: "/app?tab=register", featured: false },
  { name: "Site", price: "₹2,400", unit: "/ month", features: ["Up to 15 users", "Your own register", "Role scoping per engineer"], cta: "Start trial", href: "/app?tab=register", featured: true },
  { name: "Fleet", price: "Custom", unit: "", features: ["Unlimited users", "Multi-yard registers", "SSO / OAuth"], cta: "Contact us", href: "/app", featured: false },
];

export default function HomePage() {
  return (
    <>
      {/* ---------------- hero ---------------- */}
      <section className="hero section">
        <div className="wrap hero__inner">
          <span className="eyebrow reveal">plant register</span>
          <h1 className="reveal d1">
            Every job, asset and rupee <span className="dim">on one register.</span>
          </h1>
          <p className="lede reveal d2">
            Plinth is where a construction firm runs its plant fleet — allocation
            to settlement. The Owner sees the whole picture; Site Engineers see
            the jobs they run, and nothing they shouldn&apos;t.
          </p>
          <div className="hero__cta reveal d3">
            <a className="btn btn--primary btn--lg" href="/app?tab=register">Start free</a>
            <a className="btn btn--ghost btn--lg" href="/app">Sign in</a>
          </div>
          <p className="hero__note reveal d3">no card · seeded demo register included</p>

          <div className="frame reveal d4">
            <span className="frame__glow" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/app-dashboard.svg" alt="The Plinth dashboard: fleet utilisation, committed spend, overdue payments and maintenance exposure" width={1000} height={643} />
          </div>
        </div>
      </section>

      {/* ---------------- trust ---------------- */}
      <section className="section--flush">
        <div className="wrap trust reveal">
          <span className="trust__label">Built for yards like</span>
          <span className="trust__logo">Panchshil Industrial</span>
          <span className="trust__logo">Bharat Forge</span>
          <span className="trust__logo">L&amp;T Transportation</span>
          <span className="trust__logo">Godrej Constructions</span>
          <span className="trust__logo">NCC Ltd</span>
        </div>
      </section>

      {/* ---------------- bento ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow reveal">what it does</span>
            <h2 className="reveal d1">Four moves, one vocabulary</h2>
            <p className="lede reveal d2">
              Assets live in the yard, get allocated to jobs, pass through the
              workshop, and every rupee lands on the ledger. Plinth never drifts
              from that language.
            </p>
          </div>

          <div className="bento">
            {BENTO.map((b) => (
              <div className="card reveal" key={b.k}>
                <div className="card__ico"><Icon name={b.ico} /></div>
                <span className="card__k">{b.k}</span>
                <h3>{b.h}</h3>
                <p>{b.p}</p>
              </div>
            ))}
            <div className="card card--wide reveal">
              <div>
                <span className="card__k">Asset register</span>
                <h3>Everything, always current</h3>
                <p>
                  Sixty-four machines in the demo, filterable by category, status
                  and condition. Each row opens a full history — purchase, every
                  past allocation, every fault — kept for audit even after retirement.
                </p>
              </div>
              <div className="card__art">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/art/panel-register.svg" alt="The Plinth asset register table with status and condition columns" width={640} height={460} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- deep-dive ---------------- */}
      <section className="section">
        <div className="wrap">
          {FEATURES.map((f, i) => (
            <div className={`feature${i % 2 ? " feature--flip" : ""}`} key={f.k}>
              <div className="reveal">
                <span className="card__k">{f.k}</span>
                <h2 style={{ marginTop: 8 }}>{f.h}</h2>
                <p className="muted" style={{ marginTop: 12 }}>{f.p}</p>
                <ul>
                  {f.bullets.map((b) => (
                    <li key={b}><Icon name="check" />{b}</li>
                  ))}
                </ul>
              </div>
              <div className="feature__shot reveal d1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.shot} alt={f.alt} loading="lazy" width={640} height={460} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- stats ---------------- */}
      <section className="section--flush">
        <div className="wrap">
          <div className="stats reveal">
            <div><div className="n">64</div><div className="l">assets in the demo register</div></div>
            <div><div className="n">14</div><div className="l">live jobs across Pune</div></div>
            <div><div className="n">208</div><div className="l">history events kept for audit</div></div>
            <div><div className="n">2</div><div className="l">roles, genuinely different views</div></div>
          </div>
        </div>
      </section>

      {/* ---------------- roles ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow reveal">role scoping</span>
            <h2 className="reveal d1">Two people, two registers</h2>
          </div>
          <div className="roles">
            <div className="role-card reveal">
              <span className="tag">Owner</span>
              <h3>Every job, asset and payment</h3>
              <p>
                Fleet utilisation, committed spend, overdue invoices and
                maintenance exposure on one dashboard. Approves spend, records
                payments, manages the payroll, retires assets.
              </p>
            </div>
            <div className="role-card reveal d1">
              <span className="tag">Site Engineer</span>
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

      {/* ---------------- proof ---------------- */}
      <section className="section">
        <div className="wrap quote reveal">
          <blockquote>
            The allocation spreadsheet is gone. I open one page and know where
            every machine is and what it&apos;s costing.
          </blockquote>
          <div className="cite">
            <span className="av" aria-hidden="true">RP</span>
            <span>
              <b>Rajendra Palekar</b>
              <span>Owner — demo persona</span>
            </span>
          </div>
        </div>
      </section>

      {/* ---------------- pricing preview ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow reveal">pricing</span>
            <h2 className="reveal d1">Priced per yard, not per asset</h2>
            <p className="lede reveal d2">
              Start on the demo for free. Move to your own register when you&apos;re
              ready. <a href="/pricing" style={{ color: "var(--accent)" }}>Full pricing →</a>
            </p>
          </div>
          <div className="price-grid">
            {PLANS.map((p) => (
              <div className={`plan reveal${p.featured ? " plan--featured" : ""}`} key={p.name}>
                {p.featured && <span className="plan__badge">Most popular</span>}
                <div className="plan__name">{p.name}</div>
                <div className="plan__price">
                  {p.price} {p.unit && <span>{p.unit}</span>}
                </div>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}><Icon name="check" />{f}</li>
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

      {/* ---------------- CTA ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="cta-band reveal">
            <span className="eyebrow">get started</span>
            <h2>Put your yard on the register.</h2>
            <p className="lede">
              Sign up and land straight in a fully seeded demo. Bring your own
              data when you&apos;re ready.
            </p>
            <div className="hero__cta">
              <a className="btn btn--primary btn--lg" href="/app?tab=register">Create an account</a>
              <a className="btn btn--ghost btn--lg" href="/app">Sign in</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
