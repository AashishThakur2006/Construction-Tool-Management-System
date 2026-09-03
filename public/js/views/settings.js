/* PLINTH — settings: density, motion, role context, interface state previews. */
import * as store from "../store.js";
import { h, pageHead, toast } from "../ui.js";

export function render(container) {
  const me = store.persona();

  const radioGroup = (name, label, help, options, current, onPick) =>
    h("fieldset.card.card-pad.setting", {},
      h("legend", {}, label),
      h("p.muted", {}, help),
      h("div.radio-row", { role: "radiogroup", "aria-label": label },
        options.map(([value, optLabel, optHelp]) =>
          h("label.radio-card", { class: current === value ? "chosen" : "" },
            h("input", {
              type: "radio", name, value, checked: current === value,
              onchange: () => onPick(value),
            }),
            h("b", {}, optLabel),
            h("small", {}, optHelp)))));

  container.append(
    pageHead({ title: "Settings", sub: "Preferences apply immediately and persist on this device" }),
    h("div.settings-grid", {},
      radioGroup("density", "Density",
        "Comfortable is the default. Compact tightens rows and controls for long registers on small screens.",
        [["comfortable", "Comfortable", "44px rows — easy scanning"], ["compact", "Compact", "32px rows — more of the register per screen"]],
        store.pref("density", "comfortable"),
        (v) => { store.setPref("density", v); toast(`Density set to ${v}.`); }),
      radioGroup("motion", "Motion",
        "Reduced motion stills the allocation field to a single truthful frame and removes transitions. Your operating system's reduce-motion setting is always respected on top of this.",
        [["full", "Full", "Field animates, transitions ease"], ["reduced", "Reduced", "Static frame, instant transitions"]],
        store.pref("motion", "full"),
        (v) => { store.setPref("motion", v); toast(`Motion set to ${v}.`); }),
      h("div.card.card-pad.setting", {},
        h("h2", {}, "Signed in as"),
        h("dl.meta-list", { style: "margin-top:12px" },
          h("dt", {}, "Name"), h("dd", {}, me.name),
          h("dt", {}, "Role"), h("dd", {}, me.role),
          h("dt", {}, "Scope"), h("dd", {}, store.isOwner()
            ? "Every job, asset and payment"
            : "Your jobs, their assets and their money")),
        h("p.muted", { style: "margin-top:12px" },
          "Your role is set on your account. A Site Engineer sees only their own jobs and the money and maintenance on them; the Owner sees the whole register.")),
      h("div.card.card-pad.setting", {},
        h("h2", {}, "Interface states"),
        h("p.muted", { style: "margin: 8px 0 12px" },
          "Every designed state is previewable, so nothing ships unseen: load errors, offline, an empty register, loading skeletons, and the restricted-area screen."),
        h("div.head-actions", {},
          h("a.btn.btn-secondary", { href: "#/preview/error" }, "Error"),
          h("a.btn.btn-secondary", { href: "#/preview/offline" }, "Offline"),
          h("a.btn.btn-secondary", { href: "#/preview/empty" }, "Empty"),
          h("a.btn.btn-secondary", { href: "#/preview/loading" }, "Loading"),
          h("a.btn.btn-secondary", { href: "#/denied" }, "Restricted"))),
      h("div.card.card-pad.setting", {},
        h("h2", {}, "About Plinth"),
        h("p.muted", { style: "margin-top: 8px" },
          "Plinth speaks one language: assets live in the yard, get allocated to jobs, pass through the workshop, and every rupee lands on the ledger. The full glossary, palette and design decisions are documented in the guide."),
        h("p", { style: "margin-top: 12px" },
          h("a.btn.btn-secondary", { href: "/guide.html" }, "Open the design guide")))));
}
