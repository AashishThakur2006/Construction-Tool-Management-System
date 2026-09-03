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

const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");

export default function PeoplePage() {
  return (
    <>
      <section className="section hero">
        <div className="wrap hero__inner" style={{ textAlign: "left" }}>
          <span className="eyebrow reveal">people</span>
          <h1 className="reveal d1" style={{ maxWidth: "16ch", marginInline: 0 }}>
            The people behind the register.
          </h1>
          <p className="lede reveal d2" style={{ marginInline: 0, textAlign: "left", marginTop: 22 }}>
            A small build. Below are the people who made it, and the two people
            the product is modelled around.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow reveal">team</span>
            <h2 className="reveal d1">Who built it</h2>
          </div>
          <div className="grid-3">
            {TEAM.map((m) => (
              <div className="person reveal" key={m.name}>
                <div className="person__ph" aria-hidden="true">{initials(m.name)}</div>
                <h3>{m.name}</h3>
                <div className="role">{m.role}</div>
                <p>{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow reveal">the model</span>
            <h2 className="reveal d1">Who it is built for</h2>
            <p className="lede reveal d2">
              Plinth ships with these two accounts seeded, so you can sign in as
              either and see genuinely different registers.
            </p>
          </div>
          <div className="grid-2">
            {PERSONAS.map((p) => (
              <div className="role-card reveal" key={p.name}>
                <span className="tag">{p.role}</span>
                <h3>{p.name}</h3>
                <p>{p.bio}</p>
              </div>
            ))}
          </div>
          <p className="tokens reveal" style={{ marginTop: 18 }}>
            rajendra@plinthops.in · priya@plinthops.in · demo1234
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Sign in as one of them.</h2>
            <div className="hero__cta">
              <a className="btn btn--primary btn--lg" href="/app">Open Plinth</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
