/* PLINTH — sign in & register against Supabase Auth. The signature runs full-bleed here. */
import * as store from "../store.js";
import { h, field, submitRow, toast } from "../ui.js";
import { createField } from "../signature.js";

let fieldHandle = null;

const OAUTH = [
  { provider: "google", label: "Continue with Google" },
  { provider: "github", label: "Continue with GitHub" },
];

export function render(root, onEntered) {
  fieldHandle?.dispose();
  const canvas = h("canvas", { "aria-hidden": "true" });

  const params = new URLSearchParams(location.search);
  let tab = params.get("tab") === "register" ? "register" : "signin";
  const initialError = params.get("authError");
  if (params.has("tab") || params.has("authError")) {
    history.replaceState(null, "", location.pathname + location.hash);
  }

  const panelBody = h("div");
  const msg = h("p.form-note", { role: "alert", style: "color:var(--danger,#b23);min-height:0" });
  if (initialError) msg.textContent = initialError;

  function oauthRow() {
    return h("div.oauth-row", {},
      OAUTH.map((o) => h("button.btn.btn-secondary", {
        type: "button",
        onclick: () => {
          msg.textContent = `Redirecting to ${o.provider}…`;
          location.href = `/api/auth/oauth?provider=${o.provider}&next=/app`;
        },
      }, o.label)),
      h("p.form-note", { style: "text-align:center;margin:4px 0 0" }, "or use email"));
  }

  function renderTabs() {
    return h("div.login-tabs", { role: "tablist", "aria-label": "Sign in or register" },
      ["signin", "register"].map((t) =>
        h("button", {
          type: "button", role: "tab", "aria-selected": String(tab === t),
          class: tab === t ? "active" : "",
          onclick: () => { tab = t; msg.textContent = ""; paint(); },
        }, t === "signin" ? "Sign in" : "Register")));
  }

  function done() {
    fieldHandle?.dispose(); fieldHandle = null;
    onEntered();
  }

  function signinForm() {
    const email = field({
      name: "email", label: "Work email", type: "email", required: true, autocomplete: "email",
      validate: (v) => /.+@.+\..+/.test(v) ? null : "Enter an email like priya@plinthops.in",
    });
    const pw = field({
      name: "password", label: "Password", type: "password", required: true,
      autocomplete: "current-password",
      validate: (v) => v ? null : "Enter your password",
    });
    const submit = submitRow([email, pw], "Enter Plinth", async () => {
      msg.textContent = "Signing in…";
      try {
        await store.signIn(email.get(), pw.get());
        done();
      } catch (e) {
        msg.textContent = e.message || "Could not sign in.";
      }
    });

    const demo = h("div.role-cards", { role: "group", "aria-label": "Demo accounts" },
      [
        { kind: "owner", role: "Owner", name: "Rajendra Palekar", desc: "Every job, asset and rupee. Approves spend." },
        { kind: "engineer", role: "Site Engineer", name: "Priya Nair", desc: "Scoped to her jobs. Requests, returns, fault reports." },
      ].map((p) => h("button.role-card", {
        type: "button",
        onclick: async () => {
          msg.textContent = `Signing in as ${p.name}…`;
          try { await store.signInDev(p.kind); done(); }
          catch (e) { msg.textContent = e.message || "Demo sign-in is disabled here."; }
        },
      },
        h("b", {}, p.role),
        h("span", {}, p.name),
        h("small", {}, p.desc))));

    return h("form", { onsubmit: (e) => e.preventDefault() },
      email.root, pw.root, submit,
      h("p.form-note", {}, "Or continue with a demo account:"),
      demo);
  }

  function registerForm() {
    const name = field({ name: "name", label: "Full name", required: true, autocomplete: "name" });
    const email = field({
      name: "email", label: "Work email", type: "email", required: true, autocomplete: "email",
      validate: (v) => /.+@.+\..+/.test(v) ? null : "Enter an email like priya@plinthops.in",
    });
    const pw = field({
      name: "password", label: "Password", type: "password", required: true,
      autocomplete: "new-password",
      validate: (v) => v.length < 8 ? "Use at least 8 characters" : !/[a-zA-Z]/.test(v) || !/[0-9]/.test(v) ? "Include at least one letter and one number" : null,
    });
    const role = field({
      name: "role", label: "Role", type: "select", required: true, value: "SITE_ENGINEER",
      options: [
        { value: "OWNER", label: "Owner" },
        { value: "SITE_ENGINEER", label: "Site Engineer" },
      ],
    });
    const submit = submitRow([name, email, pw, role], "Create account", async () => {
      msg.textContent = "Creating your account…";
      try {
        const r = await store.register({ name: name.get(), email: email.get(), password: pw.get(), role: role.get() });
        if (r && r.message) {
          msg.textContent = r.message;
          tab = "signin"; paint();
          toast(r.message);
        } else {
          await store.signIn(email.get(), pw.get());
          done();
        }
      } catch (e) {
        msg.textContent = e.message || "Could not create the account.";
      }
    });
    return h("form", { onsubmit: (e) => e.preventDefault() },
      name.root, email.root, pw.root, role.root,
      h("p.form-note", {}, "A Site Engineer only sees the jobs assigned to them."),
      submit);
  }

  function paint() {
    panelBody.replaceChildren(
      renderTabs(),
      oauthRow(),
      tab === "signin" ? signinForm() : registerForm(),
      msg);
  }
  paint();

  root.replaceChildren(
    h("div.login", {},
      h("div.login-field", {}, canvas),
      h("div.login-panel", {},
        h("div.login-title", {}, "Plinth"),
        h("p.login-sub", {}, "The plant register for every job, asset and rupee — allocation to settlement."),
        panelBody),
      h("div.login-brandmark", {}, "PLINTH · LIVE ALLOCATION FIELD — EVERY DOT IS AN ASSET IN THE REGISTER")));

  fieldHandle = createField(canvas, {
    mode: "full", labels: true, seed: 11,
    forceStatic: store.reducedMotion(),
    data: store.fieldData(false),
  });
}
