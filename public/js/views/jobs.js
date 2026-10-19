/* PLINTH — jobs list and job detail. */
import { exportButton } from "../csv.js";
import * as store from "../store.js";
import { repaint, frameBatch, h, fmt, table, sortRows, statusChip, stateBlock, pageHead, confirmDialog, toast, openModal, field, submitRow } from "../ui.js";
import { deniedBlock } from "./misc.js";

const state = { q: "", status: "", engineer: "", sort: { key: "id", dir: -1 } };
const JOB_STATUS = ["Mobilising", "Active", "On hold", "Completed"];

export function jobModal(existing) {
  const engineers = store.db.employees.filter((e) => e.role === "Site Engineer");
  const f = {
    name: field({ name: "name", label: "Job name", required: true, value: existing?.name || "" }),
    client: field({ name: "client", label: "Client", value: existing?.client || "" }),
    location: field({ name: "location", label: "Location", value: existing?.location || "" }),
    status: field({ name: "status", label: "Status", type: "select", required: true, value: existing?.status || "Mobilising", options: JOB_STATUS.map((s) => ({ value: s, label: s })) }),
    engineerId: field({ name: "eng", label: "Site Engineer", type: "select", value: existing?.engineerId || "", options: [{ value: "", label: "— Unassigned —" }].concat(engineers.map((e) => ({ value: e.id, label: e.name }))) }),
    started: field({ name: "started", label: "Start date", type: "date", value: existing?.started || "" }),
    ends: field({ name: "ends", label: "End date", type: "date", value: existing?.ends || "" }),
  };
  let dlg;
  const submit = submitRow([f.name, f.status], existing ? "Save job" : "Create job", () => {
    const data = {
      name: f.name.get(), client: f.client.get(), location: f.location.get(),
      status: f.status.get(), engineerId: f.engineerId.get() || null,
      started: f.started.get() || null, ends: f.ends.get() || null,
    };
    if (existing) { store.updateJob(existing.id, data); toast(`${existing.id} updated.`); }
    else { const { id } = store.addJob(data); toast(`${id} created.`); location.hash = `/jobs/${id}`; }
    dlg.close();
  });
  dlg = openModal({
    title: existing ? `Edit ${existing.id}` : "Create a job",
    content: h("form", { onsubmit: (e) => e.preventDefault() },
      f.name.root, f.client.root, f.location.root,
      h("div.two-col-fields", {}, f.status.root, f.engineerId.root),
      h("div.two-col-fields", {}, f.started.root, f.ends.root),
      submit),
  });
}

export function list(container) {
  paint(container);
}

function paint(container) {
  const all = store.myJobs();
  const addAction = store.isOwner()
    ? h("button.btn.btn-primary", { type: "button", onclick: () => jobModal() }, "New job")
    : null;
  if (all.length === 0) {
    container.append(
      pageHead({ title: "Jobs", actions: addAction }),
      h("div.card", {}, stateBlock(store.COPY.empty.jobs, { onAction: () => jobModal() })));
    return;
  }

  const cols = [
    { key: "id", label: "Job", sortable: true, mono: true, sub: (j) => j.name },
    { key: "client", label: "Client", sortable: true },
    { key: "location", label: "Location" },
    store.isOwner() && { key: "engineerId", label: "Engineer", sortable: true, render: (j) => store.employee(j.engineerId)?.name || "—" },
    { key: "started", label: "Window", sortable: true, mono: true, render: (j) => `${fmt.date(j.started)} → ${fmt.date(j.ends)}` },
    { key: "assets", label: "Assets", sortable: true, mono: true, right: true, value: (j) => store.jobAssets(j.id).length, render: (j) => String(store.jobAssets(j.id).length) },
    { key: "status", label: "Status", sortable: true, render: (j) => statusChip("job", j.status) },
  ].filter(Boolean);

  let rows = all.filter((j) => {
    if (state.status && j.status !== state.status) return false;
    if (state.engineer && j.engineerId !== state.engineer) return false;
    if (state.q) {
      const s = state.q.toLowerCase();
      if (![j.id, j.name, j.client, j.location].some((v) => String(v ?? "").toLowerCase().includes(s))) return false;
    }
    return true;
  });
  rows = sortRows(rows, state.sort, cols);

  const engineers = store.db.employees.filter((e) => e.role === "Site Engineer");
  const rerender = () => repaint(container, paint);
  const rerenderSoon = frameBatch(rerender);

  container.append(
    pageHead({
      title: "Jobs",
      sub: store.isOwner() ? "Every contracted scope of work" : "The jobs you run",
      actions: addAction,
    }),
    h("div.filters", {},
      h("input", {
        type: "search", placeholder: "Filter by code, name, client…", "aria-label": "Filter jobs",
        value: state.q, oninput: (e) => { state.q = e.target.value; rerenderSoon(); },
      }),
      h("select", { "aria-label": "Filter by status", onchange: (e) => { state.status = e.target.value; rerender(); } },
        h("option", { value: "" }, "Any status"),
        ["Active", "Mobilising", "On hold", "Completed"].map((s) => h("option", { value: s, selected: state.status === s }, s))),
      store.isOwner() && h("select", { "aria-label": "Filter by engineer", onchange: (e) => { state.engineer = e.target.value; rerender(); } },
        h("option", { value: "" }, "Any engineer"),
        engineers.map((e) => h("option", { value: e.id, selected: state.engineer === e.id }, e.name))),
      exportButton("jobs", cols, rows),
      h("span.count", {}, `${rows.length} of ${all.length} jobs`)),
    rows.length
      ? h("div.card", {}, table({
          cols, rows, rowKey: (j) => j.id, ariaLabel: "Jobs",
          sort: state.sort,
          onSort: (key) => { state.sort = state.sort.key === key ? { key, dir: -state.sort.dir } : { key, dir: 1 }; rerender(); },
          onOpen: (j) => { location.hash = `/jobs/${j.id}`; },
        }))
      : h("div.card", {}, stateBlock(store.COPY.noResults(state.q || "these filters"), {
          onAction: () => { state.q = ""; state.status = ""; state.engineer = ""; rerender(); },
        })));
}

/* ---------------- detail ---------------- */
export function detail(container, id) {
  const j = store.job(id);
  if (!j || !store.canSeeJob(id)) { container.append(deniedBlock()); return; }

  const eng = store.employee(j.engineerId);
  const assets = store.jobAssets(id);
  const crew = store.jobCrew(id);
  const pays = store.visiblePayments().filter((p) => p.jobId === id);
  const committed = pays.filter((p) => ["Pending", "Overdue", "Disputed"].includes(p.status)).reduce((s, p) => s + p.amount, 0);
  const mrs = store.visibleMaintenance().filter((m) => {
    const a = store.asset(m.assetId);
    return a && (a.jobId === id) && ["Reported", "Approved", "In workshop"].includes(m.status);
  });

  const timeline = [
    j.started && { on: j.started, note: `Job ${j.status === "Mobilising" ? "mobilises" : "started"} — ${j.client}` },
    ...assets.map((a) => ({ on: a.allocatedOn, note: `${a.id} ${a.model} allocated` })),
    j.holdNote && { on: "2026-05-22", note: j.holdNote },
    j.ends && { on: j.ends, note: j.ends < store.TODAY ? "Job completed" : `Planned completion (${fmt.rel(j.ends, store.TODAY)})` },
  ].filter((t) => t && t.on).sort((a, b) => a.on.localeCompare(b.on));

  container.append(
    pageHead({
      title: j.name,
      sub: `${j.client} · ${j.location}`,
      crumbs: [{ label: "Jobs", href: "#/jobs" }, { label: j.id }],
      actions: h("div.head-actions", {},
        statusChip("job", j.status),
        store.isOwner() && h("button.btn.btn-secondary", { type: "button", onclick: () => jobModal(j) }, "Edit"),
        ["Active", "Mobilising"].includes(j.status) && h("a.btn.btn-primary", { href: `#/allocate?job=${j.id}` }, "Allocate assets")),
    }),
    h("div.kpis", {},
      h("div.card.kpi", {}, h("div.label", {}, "Allocated assets"), h("div.value", {}, String(assets.length))),
      h("div.card.kpi", {}, h("div.label", {}, "Crew on job"), h("div.value", {}, String(crew.length))),
      h("div.card.kpi", {}, h("div.label", {}, "Committed spend"), h("div.value", {}, fmt.inrC(committed)), h("div.sub", {}, `${pays.length} ledger entries`)),
      h("div.card.kpi", {}, h("div.label", {}, "Open fault reports"), h("div.value", {}, String(mrs.length)))),
    h("div.two-col", {},
      h("div.stack", {},
        assetCard(j, assets),
        payCard(j, pays)),
      h("div.stack", {},
        h("div.card", {},
          h("div.card-head", {}, h("h2", {}, "Details")),
          h("dl.meta-list.card-pad", {},
            h("dt", {}, "Code"), h("dd.mono", {}, j.id),
            h("dt", {}, "Client"), h("dd", {}, j.client),
            h("dt", {}, "Location"), h("dd", {}, j.location),
            h("dt", {}, "Engineer"), h("dd", {}, eng ? h("a", { href: `#/employees/${eng.id}` }, eng.name) : "—"),
            h("dt", {}, "Window"), h("dd.mono", {}, `${fmt.date(j.started)} → ${fmt.date(j.ends)}`))),
        h("div.card", {},
          h("div.card-head", {}, h("h2", {}, "Crew")),
          crew.length ? h("ul.rowlist", {}, crew.map((e) => h("li", {},
            h("a.rowlist-item", { href: `#/employees/${e.id}` },
              h("span.rowlist-main", {}, h("b", {}, e.name), h("span.cell-sub", {}, e.role)),
              h("span.mono.muted", {}, e.id)))))
            : h("p.card-pad.muted", {}, "No crew assigned yet.")),
        h("div.card", {},
          h("div.card-head", {}, h("h2", {}, "Timeline")),
          h("ul.timeline.card-pad", {}, timeline.map((t) =>
            h("li", {}, h("span.when", {}, fmt.date(t.on)), h("span", {}, t.note))))))));
}

function assetCard(j, assets) {
  return h("div.card", {},
    h("div.card-head", {}, h("h2", {}, `Allocated assets · ${assets.length}`),
      h("a.link-btn", { href: "#/assets" }, "Full register")),
    assets.length
      ? h("ul.rowlist", {}, assets.map((a) => h("li", {},
          h("div.rowlist-item", {},
            h("a.rowlist-main", { href: `#/assets/${a.id}` },
              h("b", {}, `${a.id} · ${a.model}`),
              h("span.cell-sub", {}, `since ${fmt.date(a.allocatedOn)} · condition ${a.condition}`)),
            h("button.btn.btn-secondary.btn-sm", {
              type: "button",
              onclick: async () => {
                const c = store.COPY.confirm.returnAsset(a);
                if (await confirmDialog({ ...c, danger: false })) {
                  const undo = store.returnToYard([a.id]);
                  toast(`${a.id} returned to the yard.`, { undo });
                }
              },
            }, "Return")))))
      : h("p.card-pad.muted", {}, `Nothing is allocated to ${j.id} right now. Use “Allocate assets” to commit stock from the yard.`));
}

function payCard(j, pays) {
  return h("div.card", {},
    h("div.card-head", {}, h("h2", {}, `Ledger for ${j.id}`),
      h("a.link-btn", { href: "#/payments" }, "All payments")),
    pays.length
      ? h("ul.rowlist", {}, pays.map((p) => h("li", {},
          h("a.rowlist-item", { href: `#/payments/${p.id}` },
            h("span.rowlist-main", {}, h("b", {}, `${p.id} · ${p.payee}`), h("span.cell-sub", {}, p.desc)),
            h("span.rowlist-stack", {}, statusChip("pay", p.status), h("span.mono", {}, fmt.inr(p.amount)))))))
      : h("p.card-pad.muted", {}, "No payments recorded against this job."));
}
