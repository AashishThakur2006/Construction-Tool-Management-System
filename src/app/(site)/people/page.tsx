import type { Metadata } from "next";

export const metadata: Metadata = { title: "People" };

const TEAM = [
  { name: "Veerbhadra Mahant", role: "maker", bio: "Built Plinth end to end — the register model, the SPA, the Supabase backend and this site." },
  { name: "The SPM cohort", role: "first readers", bio: "Course reviewers who pushed on scope, the glossary and what an MVP actually has to do." },
  { name: "Claude", role: "pair", bio: "Paired on the Supabase migration, the command-bus API and the marketing build." },
];

const PERSONAS = [
  { name: "Rajendra Palekar", role: "Owner", bio: "Sees every job, asset and rupee. Approves maintenance spend, records payments, manages the payroll." },
  { name: "Priya Nair", role: "Site Engineer", bio: "Runs four jobs around Pune. Allocates and returns plant, raises fault reports, watches the money on her jobs." },
];

function initials(n: string) {
  return n.split(" ").map((w) => w[0]).slice(0, 2).join("");
}

export default function PeoplePage() {
  return (
    <>
      <section className="section">
        <div className="wrap">
          <span className="eyebrow">people</span>
          <h1 style={{ maxWidth: "16ch" }}>The people behind the register.</h1>
          <p className="lede" style={{ marginTop: 22 }}>
            A small build. Below are the people who made it, and the two people
            the product is modelled around.
          </p>
        </div>
      </section>

      <section className="section--tight">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow">team</span>
            <h2>Who built it</h2>
          </div>
          <div className="grid grid--3">
            {TEAM.map((m) => (
              <div className="person" key={m.name}>
                <div className="person__ph" aria-hidden="true">{initials(m.name)}</div>
                <h3>{m.name}</h3>
                <div className="role">{m.role}</div>
                <p>{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      <section className="section">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow">the model</span>
            <h2>Who it is built for</h2>
            <p className="lede">
              Plinth ships with these two accounts seeded, so you can sign in as
              either and see genuinely different registers.
            </p>
          </div>
          <div className="grid grid--2">
            {PERSONAS.map((p) => (
              <div className="card" key={p.name}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div className="person__ph" style={{ width: 56, height: 56, margin: 0, fontSize: 20, aspectRatio: "auto" }} aria-hidden="true">
                    {initials(p.name)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18 }}>{p.name}</h3>
                    <div className="role">{p.role}</div>
                  </div>
                </div>
                <p style={{ marginTop: 14 }}>{p.bio}</p>
              </div>
            ))}
          </div>
          <p className="faint" style={{ marginTop: 20, fontFamily: "var(--font-mono)", fontSize: 12.5 }}>
            rajendra@plinthops.in · priya@plinthops.in · demo1234
          </p>
        </div>
      </section>

      <section className="section--tight">
        <div className="wrap">
          <div className="cta-band">
            <h2>Sign in as one of them.</h2>
            <div className="hero__cta">
              <a className="btn btn--primary" href="/app">Open Plinth</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
