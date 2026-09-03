import type { Metadata } from "next";
import Icon from "../_components/Icon";

export const metadata: Metadata = { title: "About" };

const PRINCIPLES = [
  { k: "One vocabulary", p: "Asset, job, allocation, yard, workshop, ledger. The words never drift between the interface, the docs and the database." },
  { k: "Truthful state", p: "Every screen reads live from the register. A mutation shows on the job page and the asset's own history the moment it lands." },
  { k: "Role, not permission flags", p: "The Owner sees everything; a Site Engineer sees the jobs they run. Scoping is the model, not a setting bolted on later." },
  { k: "Designed states", p: "Loading, empty, offline, restricted and error screens are all drawn on purpose — nothing ships unseen." },
];

const STACK = [
  { ico: "layers", k: "Interface", h: "No-build SPA", p: "Plain ES modules and a hash router. An in-memory register hydrated once, mutations applied optimistically then synced, undo on every action." },
  { ico: "shuffle", k: "API", h: "Command bus", p: "Reads come from one endpoint; every change is a batch of ops checked against the caller's role and applied in a single transaction." },
  { ico: "shield", k: "Data", h: "Supabase Postgres", p: "Supabase Auth for sign-in, Postgres over the session pooler for data, RLS on every table. Seed data is internally consistent to a fixed date." },
];

export default function AboutPage() {
  return (
    <>
      <section className="section hero">
        <div className="wrap hero__inner" style={{ textAlign: "left" }}>
          <span className="eyebrow reveal">about</span>
          <h1 className="reveal d1" style={{ maxWidth: "18ch", marginInline: 0 }}>
            A register a site office can actually keep.
          </h1>
          <p className="lede reveal d2" style={{ marginInline: 0, textAlign: "left", marginTop: 22 }}>
            Plinth started as a Software Project Management coursework build and
            grew into a working product: a Next.js app on Supabase that a small
            plant-owning contractor could run day to day. It replaces the
            allocation spreadsheet and the &ldquo;where is the 320?&rdquo; phone call.
          </p>
          <div className="hero__art reveal d3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/panel-allocate.svg" alt="The Plinth allocation flow" width={640} height={460} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow reveal">principles</span>
            <h2 className="reveal d1">What we hold to</h2>
          </div>
          <div className="grid-2">
            {PRINCIPLES.map((x) => (
              <div className="card reveal" key={x.k}>
                <span className="card__k">{x.k}</span>
                <p>{x.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow reveal">under the hood</span>
            <h2 className="reveal d1">How it is built</h2>
            <p className="lede reveal d2">
              Deliberately small. A client-side SPA for the interface, a thin
              typed API, and Postgres doing the work.
            </p>
          </div>
          <div className="grid-3">
            {STACK.map((s) => (
              <div className="card reveal" key={s.k}>
                <div className="card__ico"><Icon name={s.ico} /></div>
                <span className="card__k">{s.k}</span>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>See it with data in it.</h2>
            <div className="hero__cta">
              <a className="btn btn--primary btn--lg" href="/app?tab=register">Open the demo</a>
              <a className="btn btn--ghost btn--lg" href="/guide.html">Read the design guide</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
