/* PLINTH — employees list and detail. */
import { exportButton } from "../csv.js";
import * as store from "../store.js";
import { repaint, frameBatch, h, fmt, table, sortRows, statusChip, stateBlock, pageHead, toast, openModal, field, submitRow } from "../ui.js";
import { deniedBlock } from "./misc.js";

const state = { q: "", role: "", sort: { key: "name", dir: 1 } };

export function list(container) {
  paint(container);
}

function paint(container) {
  const all = store.visibleEmployees();
  const rerender = () => repaint(container, paint);
  const rerenderSoon = frameBatch(rerender);

  if (all.length === 0) {
    container.append(pageHead({ title: "Employees" }), h("div.card", {}, stateBlock(store.COPY.empty.employees)));
    return;
  }

  const cols = [
    { key: "name", label: "Name", sortable: true, sub: (e) => e.id },
    { key: "role", label: "Role", sortable: true },
    {
      key: "jobId", label: "On job", sortable: true, mono: true,
      render: (e) => e.jobId ? e.jobId : h("span.muted", {}, "—"),
      sub: (e) => e.jobId ? store.job(e.jobId)?.name : (e.role === "Site Engineer" ? "runs own jobs" : "yard / office"),
    },
    { key: "phone", label: "Phone", mono: true },
    { key: "startedOn", label: "Since", sortable: true, mono: true, render: (e) => fmt.date(e.startedOn) },
    { key: "status", label: "Status", sortable: true, render: (e) => statusChip("emp", e.status) },
  ];

  const roles = [...new Set(store.db.employees.map((e) => e.role))];
  let rows = all.filter((e) => {
    if (state.role && e.role !== state.role) return false;
    if (state.q) {
      const s = state.q.toLowerCase();
      if (![e.name, e.id, e.role, e.email].some((v) => String(v ?? "").toLowerCase().includes(s))) return false;
    }
    return true;
  });
  rows = sortRows(rows, state.sort, cols);

  container.append(
    pageHead({
      title: "Employees",
      sub: store.isOwner() ? `${all.length} on the payroll` : "Crew on your jobs",
      actions: store.isOwner() && h("button.btn.btn-primary", { type: "button", onclick: () => addModal() }, "Add employee"),
    }),
    h("div.filters", {},
      h("input", {
        type: "search", placeholder: "Filter by name, ID, role…", "aria-label": "Filter employees",
        value: state.q, oninput: (e) => { state.q = e.target.value; rerenderSoon(); },
      }),
      h("select", { "aria-label": "Filter by role", onchange: (e) => { state.role = e.target.value; rerender(); } },
        h("option", { value: "" }, "Any role"),
        roles.map((r) => h("option", { value: r, selected: state.role === r }, r))),
      exportButton("employees", cols, rows),
      h("span.count", {}, `${rows.length} of ${all.length}`)),
    rows.length
      ? h("div.card", {}, table({
          cols, rows, rowKey: (e) => e.id, ariaLabel: "Employees",
          sort: state.sort,
          onSort: (key) => { state.sort = state.sort.key === key ? { key, dir: -state.sort.dir } : { key, dir: 1 }; rerender(); },
          onOpen: (e) => { location.hash = `/employees/${e.id}`; },
        }))
      : h("div.card", {}, stateBlock(store.COPY.noResults(state.q || "these filters"), {
          onAction: () => { state.q = ""; state.role = ""; rerender(); },
        })));
}

function addModal() {
  const name = field({ name: "name", label: "Full name", required: true });
  const role = field({
    name: "role", label: "Role", type: "select", required: true,
    options: ["Site Engineer", "Plant Operator", "Plant Mechanic", "Surveyor", "Rigger", "Concrete Finisher", "Truck Driver", "Yard Storekeeper", "Office Administrator"].map((r) => ({ value: r, label: r })),
  });
  const jobSel = field({
    name: "job", label: "Assign to job", type: "select",
    placeholder: "Yard / office (no job)",
    options: store.db.jobs.filter((j) => ["Active", "Mobilising"].includes(j.status)).map((j) => ({ value: j.id, label: `${j.id} — ${j.name}` })),
    help: "Optional — crew can also be assigned from the job page later.",
  });
  const phone = field({
    name: "phone", label: "Phone", type: "tel", required: true, inputmode: "tel",
    validate: (v) => /^[+\d][\d ()-]{9,}$/.test(v) ? null : "Enter a phone number with at least 10 digits",
  });
  const email = field({
    name: "email", label: "Email", type: "email", required: true,
    validate: (v) => /.+@.+\..+/.test(v) ? null : "Enter an email like priya@plinthops.in",
  });
  let dlg;
  const submit = submitRow([name, role, phone, email], "Add to payroll", () => {
    const { undo, id } = store.addEmployee({ name: name.get(), role: role.get(), jobId: jobSel.get() || null, phone: phone.get(), email: email.get() });
    dlg.close();
    toast(`${name.get()} added as ${role.get()} (${id}).`, { undo });
  });
  dlg = openModal({
    title: "Add an employee",
    content: h("form", { onsubmit: (e) => e.preventDefault() }, name.root, role.root, jobSel.root, phone.root, email.root, submit),
  });
}

/* ---------------- detail ---------------- */
export function detail(container, id) {
  paintDetail(container, id);
}

function paintDetail(container, id) {
  const e = store.employee(id);
  if (!e || !store.canSeeEmployee(id)) { container.append(deniedBlock()); return; }

  const j = e.jobId ? store.job(e.jobId) : null;
  const runs = e.role === "Site Engineer" ? store.db.jobs.filter((x) => x.engineerId === e.id) : [];
  const reports = store.visibleMaintenance().filter((m) => m.reporterId === e.id || m.mechanicId === e.id);

  container.append(
    pageHead({
      title: e.name,
      sub: `${e.role} · ${e.id}`,
      crumbs: [{ label: "Employees", href: "#/employees" }, { label: e.id }],
      actions: statusChip("emp", e.status),
    }),
    h("div.two-col", {},
      h("div.stack", {},
        h("div.card", {},
          h("div.card-head", {}, h("h2", {}, e.role === "Site Engineer" ? "Runs these jobs" : "Assignment")),
          e.role === "Site Engineer"
            ? (runs.length
                ? h("ul.rowlist", {}, runs.map((x) => h("li", {},
                    h("a.rowlist-item", { href: `#/jobs/${x.id}` },
                      h("span.rowlist-main", {}, h("b", {}, `${x.id} · ${x.name}`), h("span.cell-sub", {}, x.client)),
                      statusChip("job", x.status)))))
                : h("p.card-pad.muted", {}, "No jobs assigned yet."))
            : h("div.card-pad", {}, j
                ? h("p", {}, "On ", h("a", { href: `#/jobs/${j.id}` }, h("b", {}, `${j.id} — ${j.name}`)), ` · ${j.location}.`)
                : h("p.muted", {}, "Based at the yard or office — not committed to a job."))),
        reports.length > 0 && h("div.card", {},
          h("div.card-head", {}, h("h2", {}, "Maintenance involvement")),
          h("ul.rowlist", {}, reports.map((m) => h("li", {},
            h("a.rowlist-item", { href: `#/maintenance/${m.id}` },
              h("span.rowlist-main", {}, h("b", {}, `${m.id} · ${m.fault}`),
                h("span.cell-sub", {}, m.reporterId === e.id ? "reported" : "assigned mechanic")),
              statusChip("mr", m.status)))))),),
      h("div.card", {},
        h("div.card-head", {}, h("h2", {}, "Contact & record")),
        h("dl.meta-list.card-pad", {},
          h("dt", {}, "Phone"), h("dd.mono", {}, e.phone),
          h("dt", {}, "Email"), h("dd", {}, h("a", { href: `mailto:${e.email}` }, e.email)),
          h("dt", {}, "On payroll since"), h("dd.mono", {}, fmt.date(e.startedOn)),
          h("dt", {}, "Status"), h("dd", {}, e.status)))));
}
