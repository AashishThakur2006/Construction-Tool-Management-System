import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

const PRINCIPLES = [
  { k: "One vocabulary", p: "Asset, job, allocation, yard, workshop, ledger. The words never drift between the interface, the docs and the database." },
  { k: "Truthful state", p: "Every screen reads live from the register. A mutation shows on the job page and the asset's own history the moment it lands." },
  { k: "Role, not permission flags", p: "The Owner sees everything; a Site Engineer sees the jobs they run. Scoping is the model, not a setting bolted on later." },
  { k: "Designed states", p: "Loading, empty, offline, restricted and error screens are all drawn on purpose — nothing ships unseen." },
];

export default function AboutPage() {
  return (
    <>
      <section className="section">
        <div className="wrap">
          <span className="eyebrow">about</span>
          <h1 style={{ maxWidth: "18ch" }}>
            A register a site office can actually keep.
          </h1>
          <p className="lede" style={{ marginTop: 22 }}>
            Plinth started as a Software Project Management coursework build and
            grew into a working product: a Next.js app on Supabase that a small
            plant-owning contractor could run day to day. It replaces the
            allocation spreadsheet and the &ldquo;where is the 320?&rdquo; phone
            call.
          </p>
          <div className="hero__art" style={{ marginTop: 34 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/blueprint.svg" alt="Blueprint diagram of the allocation model" />
          </div>
        </div>
      </section>

      <hr className="divider" />

      <section className="section">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow">principles</span>
            <h2>What we hold to</h2>
          </div>
          <div className="grid grid--2">
            {PRINCIPLES.map((x) => (
              <div className="card" key={x.k}>
                <span className="card__k">{x.k}</span>
                <p style={{ marginTop: 10 }}>{x.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      <section className="section">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow">under the hood</span>
            <h2>How it is built</h2>
            <p className="lede">
              Deliberately small. A client-side SPA for the interface, a thin
              typed API, and Postgres doing the work.
            </p>
          </div>
          <div className="grid grid--3">
            <div className="card">
              <span className="card__k">Interface</span>
              <h3>No-build SPA</h3>
              <p>Plain ES modules and a hash router. An in-memory register hydrated once, mutations applied optimistically then synced, undo on every action.</p>
            </div>
            <div className="card">
              <span className="card__k">API</span>
              <h3>Command bus</h3>
              <p>Reads come from one endpoint; every change is a batch of ops checked against the caller&apos;s role and applied in a single transaction.</p>
            </div>
            <div className="card">
              <span className="card__k">Data</span>
              <h3>Supabase Postgres</h3>
              <p>Supabase Auth for sign-in, Postgres over the session pooler for data, RLS on every table. Seed data is internally consistent to a fixed date.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section--tight">
        <div className="wrap">
          <div className="cta-band">
            <h2>See it with data in it.</h2>
            <div className="hero__cta">
              <a className="btn btn--primary" href="/app?tab=register">Open the demo</a>
              <a className="btn btn--ghost" href="/guide.html">Read the design guide</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
