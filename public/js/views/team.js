/* PLINTH — team & access. Owner only. Manages login accounts and their
   role + linked employee record. */
import * as store from "../store.js";
import {
  h, fmt, table, pageHead, toast, openModal, confirmDialog, field, submitRow, skelTable, stateBlock,
} from "../ui.js";
import { deniedBlock } from "./misc.js";

const ROLE_OPTS = [
  { value: "SITE_ENGINEER", label: "Site Engineer" },
  { value: "OWNER", label: "Owner" },
];

function empOptions() {
  return [{ value: "", label: "— Not linked —" }].concat(
    store.db.employees.map((e) => ({ value: e.id, label: `${e.id} · ${e.name}` }))
  );
}

export function render(container) {
  if (!store.isOwner()) { container.append(deniedBlock()); return; }
  container.append(skelTable(5));
  load(container);
}

async function load(container) {
  let members;
  try {
    members = await store.fetchTeam();
  } catch (e) {
    container.replaceChildren(stateBlock({
      title: "Could not load the team",
      body: e.message || "The register did not respond.",
      action: "Retry",
    }, { onAction: () => { container.replaceChildren(); render(container); } }));
    return;
  }
  container.replaceChildren();
  paint(container, members);
}

function paint(container, members) {
  const me = store.persona();
  const rerender = async () => { container.replaceChildren(store.persona() ? h("div") : h("div")); await load(container); };

  const cols = [
    { key: "email", label: "Account", mono: true, sub: (m) => m.name || "—" },
    {
      key: "role", label: "Role",
      render: (m) => h("select.inline-select", {
        "aria-label": `Role for ${m.email}`,
        disabled: m.isSelf,
        onchange: async (e) => {
          try { await store.updateMember(m.id, { role: e.target.value }); toast(`${m.email} is now ${e.target.value === "OWNER" ? "an Owner" : "a Site Engineer"}.`); }
          catch (err) { toast(err.message || "Update failed"); }
          rerender();
        },
      }, ROLE_OPTS.map((o) => h("option", { value: o.value, selected: (m.role === o.value) }, o.label))),
    },
    {
      key: "employeeId", label: "Linked employee",
      render: (m) => h("select.inline-select", {
        "aria-label": `Employee link for ${m.email}`,
        onchange: async (e) => {
          try { await store.updateMember(m.id, { employeeId: e.target.value }); toast("Employee link updated."); }
          catch (err) { toast(err.message || "Update failed"); }
          rerender();
        },
      }, empOptions().map((o) => h("option", { value: o.value, selected: (m.employeeId || "") === o.value }, o.label))),
      sub: (m) => m.employeeName || null,
    },
    { key: "createdAt", label: "Joined", mono: true, render: (m) => fmt.date((m.createdAt || "").slice(0, 10)) },
    {
      key: "act", label: "",
      render: (m) => m.isSelf
        ? h("span.muted", {}, "you")
        : h("button.link-btn.as-btn.danger", {
            type: "button",
            onclick: async () => {
              if (!await confirmDialog({
                title: `Remove ${m.email}?`,
                body: "Their login is deleted. Any records they created stay on the register. This cannot be undone.",
                confirmLabel: "Remove account",
              })) return;
              try { await store.removeMember(m.id); toast(`${m.email} removed.`); }
              catch (err) { toast(err.message || "Remove failed"); }
              rerender();
            },
          }, "Remove"),
    },
  ];

  container.append(
    pageHead({
      title: "Team",
      sub: `${members.length} account${members.length === 1 ? "" : "s"} · you approve every one`,
      actions: h("button.btn.btn-primary", { type: "button", onclick: () => addModal(rerender) }, "Add account"),
    }),
    members.length
      ? h("div.card", {}, table({ cols, rows: members, rowKey: (m) => m.id, ariaLabel: "Team accounts" }))
      : h("div.card", {}, stateBlock({ title: "No accounts yet", body: "Add the first one.", action: null })),
    h("p.card-pad.muted", { style: "font-size:12.5px" },
      "New accounts get a temporary password shown once — pass it on, and the person changes it after signing in. ",
      "A Site Engineer sees only the jobs of the employee they're linked to."),
  );
}

function addModal(done) {
  const name = field({ name: "name", label: "Full name", required: true });
  const email = field({
    name: "email", label: "Work email", type: "email", required: true,
    validate: (v) => /.+@.+\..+/.test(v) ? null : "Enter an email like priya@plinthops.in",
  });
  const role = field({ name: "role", label: "Role", type: "select", required: true, value: "SITE_ENGINEER", options: ROLE_OPTS });
  const emp = field({
    name: "emp", label: "Link to employee", type: "select", value: "",
    options: empOptions(),
    help: "A Site Engineer only sees the jobs assigned to this employee.",
  });
  let dlg;
  const submit = submitRow([name, email, role], "Create account", async () => {
    try {
      const r = await store.createMember({
        name: name.get(), email: email.get(), role: role.get(), employeeId: emp.get() || null,
      });
      dlg.close();
      openModal({
        title: "Account created",
        content: h("div", {},
          h("p", {}, `${r.email} can now sign in with this temporary password:`),
          h("p.mono", { style: "font-size:18px;user-select:all;padding:10px;background:var(--bone);border-radius:8px;text-align:center" }, r.tempPassword),
          h("p.muted", { style: "font-size:13px" }, "Shown once. Hand it over securely; they change it after signing in.")),
        footer: h("button.btn.btn-primary", { type: "button", onclick: () => { document.querySelector(".scrim")?.remove(); done(); } }, "Done"),
      });
    } catch (e) {
      toast(e.message || "Could not create the account.");
    }
  });
  dlg = openModal({
    title: "Add an account",
    content: h("form", { onsubmit: (e) => e.preventDefault() }, name.root, email.root, role.root, emp.root, submit),
  });
}
