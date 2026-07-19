/* PLINTH — login & registration. The one place the signature runs full-bleed. */
import * as store from "../store.js";
import { h, field, submitRow, toast } from "../ui.js";
import { createField } from "../signature.js";

let fieldHandle = null;

export function render(root, onEntered) {
  fieldHandle?.dispose();
  const canvas = h("canvas", { "aria-hidden": "true" });
  let tab = "signin";
  let roleChoice = "owner";

  const panelBody = h("div");

  function renderTabs() {
    return h("div.login-tabs", { role: "tablist", "aria-label": "Sign in or register" },
      ["signin", "register"].map((t) =>
        h("button", {
          type: "button", role: "tab", "aria-selected": String(tab === t),
          class: tab === t ? "active" : "",
          onclick: () => { tab = t; paint(); },
        }, t === "signin" ? "Sign in" : "Register")));
  }

  function signinForm() {
    const roleCards = h("div.role-cards", { role: "radiogroup", "aria-label": "Choose a demo role" },
      [
        { key: "owner", name: "Rajendra Palekar", role: "Owner", desc: "Every job, every asset, every rupee. Approves spend." },
        { key: "engineer", name: "Priya Nair", role: "Site Engineer", desc: "Scoped to her jobs. Requests, returns, fault reports." },
      ].map((p) => h("button.role-card", {
        type: "button", role: "radio", "aria-checked": String(roleChoice === p.key),
        class: roleChoice === p.key ? "chosen" : "",
        onclick: (e) => { roleChoice = p.key; [...roleCards.children].forEach((c) => { c.classList.toggle("chosen", c === e.currentTarget); c.setAttribute("aria-checked", String(c === e.currentTarget)); }); },
      },
        h("b", {}, p.role),
        h("span", {}, p.name),
        h("small", {}, p.desc))));

    const pw = field({
      name: "password", label: "Password", type: "password", required: true,
      help: "Demo build — any password of 4+ characters signs you in.",
      validate: (v) => v.length < 4 ? "Use at least 4 characters" : null,
      value: "",
      autocomplete: "current-password",
    });
    const submit = submitRow([pw], "Enter Plinth", () => {
      store.login(roleChoice);
      fieldHandle?.dispose(); fieldHandle = null;
      onEntered();
    });
    return h("form", { onsubmit: (e) => e.preventDefault() }, roleCards, pw.root, submit);
  }

  function registerForm() {
    const name = field({ name: "name", label: "Full name", required: true, autocomplete: "name" });
    const email = field({
      name: "email", label: "Work email", type: "email", required: true, autocomplete: "email",
      validate: (v) => /.+@.+\..+/.test(v) ? null : "Enter an email like priya@plinthops.in",
    });
    const phone = field({
      name: "phone", label: "Phone", type: "tel", inputmode: "tel", autocomplete: "tel",
      validate: (v) => /^[+\d][\d ()-]{9,}$/.test(v) ? null : "Enter a phone number with at least 10 digits",
    });
    const role = field({
      name: "role", label: "Requested role", type: "select", required: true,
      options: ["Site Engineer", "Plant Operator", "Plant Mechanic", "Surveyor", "Office Administrator"].map((r) => ({ value: r, label: r })),
    });
    const submit = submitRow([name, email, role], "Request access", () => {
      toast(`Request recorded for ${name.get()}. The Owner adds users, so your access begins once approved.`);
      tab = "signin"; paint();
    });
    return h("form", { onsubmit: (e) => e.preventDefault() },
      name.root, email.root, phone.root, role.root,
      h("p.form-note", {}, "New accounts are created by the Owner. This sends them your details."),
      submit);
  }

  function paint() {
    panelBody.replaceChildren(
      renderTabs(),
      tab === "signin" ? signinForm() : registerForm());
  }
  paint();

  root.replaceChildren(
    h("div.login", {},
      h("div.login-field", {}, canvas),
      h("div.login-panel", {},
        h("div.login-title", {}, "Plinth"),
        h("p.login-sub", {}, "The plant register for every job, asset and rupee — allocation to settlement."),
        panelBody),
      h("div.login-brandmark", {}, "PLINTH · LIVE ALLOCATION FIELD — EVERY DOT IS AN ASSET IN THE DEMO REGISTER")));

  fieldHandle = createField(canvas, {
    mode: "full", labels: true, seed: 11,
    forceStatic: store.reducedMotion(),
    data: store.fieldData(false),
  });
}
