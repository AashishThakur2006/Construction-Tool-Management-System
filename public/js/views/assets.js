/* PLINTH — asset register (densest table) and asset detail. */
import { exportButton } from "../csv.js";
import * as store from "../store.js";
import { repaint, frameBatch, h, fmt, table, sortRows, statusChip, condBadge, stateBlock, pageHead, confirmDialog, toast, openModal, field, submitRow } from "../ui.js";
import { deniedBlock } from "./misc.js";

const state = {
  q: "", category: "", status: "", cond: "",
  sort: { key: "id", dir: 1 },
  selected: new Set(),
};

const CONDS = ["A", "B", "C", "D"];

export function assetModal(existing) {
  const f = {
    model: field({ name: "model", label: "Model", required: true, value: existing?.model || "" }),
    category: field({ name: "category", label: "Category", value: existing?.category || "" }),
    serial: field({ name: "serial", label: "Serial", value: existing?.serial || "" }),
    condition: field({ name: "condition", label: "Condition", type: "select", value: existing?.condition || "B", options: CONDS.map((c) => ({ value: c, label: `Condition ${c}` })) }),
    value: field({ name: "value", label: "Book value (₹)", type: "number", inputmode: "numeric", value: existing ? String(existing.value) : "", validate: (v) => +v >= 0 ? null : "Enter zero or more" }),
    purchased: field({ name: "purchased", label: "Purchased", type: "date", value: existing?.purchased || "" }),
    hours: existing ? field({ name: "hours", label: "Meter hours", type: "number", inputmode: "numeric", value: String(existing.hours) }) : null,
  };
  let dlg;
  const submit = submitRow([f.model], existing ? "Save asset" : "Register asset", () => {
    const data = {
      model: f.model.get(), category: f.category.get(), serial: f.serial.get(),
      condition: f.condition.get(), value: f.value.get() || 0, purchased: f.purchased.get() || null,
    };
    if (existing) {
      if (f.hours) data.hours = f.hours.get() || 0;
      store.updateAsset(existing.id, data);
      toast(`${existing.id} updated.`);
    } else {
      const { id } = store.addAsset(data);
      toast(`${id} registered to the yard.`);
      location.hash = `/assets/${id}`;
    }
    dlg.close();
  });
  dlg = openModal({
    title: existing ? `Edit ${existing.id}` : "Register an asset",
    content: h("form", { onsubmit: (e) => e.preventDefault() },
      f.model.root, f.category.root, f.serial.root,
      h("div.two-col-fields", {}, f.condition.root, f.value.root),
      h("div.two-col-fields", {}, f.purchased.root, f.hours?.root || h("div")),
      submit),
  });
}

export function importModal() {
  const ta = field({
    name: "csv", label: "Paste CSV rows", type: "textarea", rows: 8, required: true,
    help: "Header row: model,category,serial,condition,value,purchased. One asset per line.",
  });
  let dlg;
  const submit = submitRow([ta], "Import", async () => {
    const lines = ta.get().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) { toast("Add a header row and at least one asset."); return; }
    const head = lines[0].split(",").map((s) => s.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const cells = line.split(",");
      const o = {};
      head.forEach((k, i) => { o[k] = (cells[i] || "").trim(); });
      return o;
    });
    try {
      const r = await store.importAssets(rows);
      dlg.close();
      toast(`Imported ${r.count} asset${r.count === 1 ? "" : "s"} to the yard.`);
    } catch (e) {
      toast(e.message || "Import failed — nothing was saved.");
    }
  });
  dlg = openModal({
    title: "Import assets",
    content: h("form", { onsubmit: (e) => e.preventDefault() },
      ta.root,
      h("p.form-note", {}, "Example:  Belle Minimix 150,Concrete,BEL-40912,B,84000,2024-05-01"),
      submit),
  });
}

export function list(container) {
  paint(container);
}

function paint(container) {
  const all = store.visibleAssets().filter((a) => a.status !== "Retired" || store.isOwner());
  const rerender = () => repaint(container, paint);
  const rerenderSoon = frameBatch(rerender);

  const ownerActions = store.isOwner() ? h("div.head-actions", {},
    h("button.btn.btn-secondary", { type: "button", onclick: () => importModal() }, "Import CSV"),
    h("button.btn.btn-primary", { type: "button", onclick: () => assetModal() }, "Register asset")) : null;

  if (all.length === 0) {
    container.append(
      pageHead({ title: "Assets", actions: ownerActions }),
      h("div.card", {}, stateBlock(store.COPY.empty.assets, { onAction: () => assetModal() })));
    return;
  }

  const cols = [
    { key: "id", label: "Asset", sortable: true, mono: true },
    { key: "model", label: "Model", sortable: true, sub: (a) => a.serial },
    { key: "category", label: "Category", sortable: true },
    {
      key: "status", label: "Status", sortable: true,
      render: (a) => statusChip("asset", a.status),
      sub: (a) => a.jobId ? `${a.jobId} · since ${fmt.date(a.allocatedOn)}` : null,
    },
    { key: "condition", label: "Cond", sortable: true, render: (a) => condBadge(a.condition), width: "56px" },
    { key: "hours", label: "Hours", sortable: true, mono: true, right: true, render: (a) => fmt.int(a.hours) },
    { key: "value", label: "Value", sortable: true, mono: true, right: true, render: (a) => fmt.inrC(a.value) },
    { key: "purchased", label: "Purchased", sortable: true, mono: true, render: (a) => fmt.date(a.purchased) },
  ];

  let rows = all.filter((a) => {
    if (state.category && a.category !== state.category) return false;
    if (state.status && a.status !== state.status) return false;
    if (state.cond && a.condition !== state.cond) return false;
    if (state.q) {
      const s = state.q.toLowerCase();
      if (![a.id, a.model, a.serial, a.category, a.jobId].some((v) => v && v.toLowerCase().includes(s))) return false;
    }
    return true;
  });
  rows = sortRows(rows, state.sort, cols);

  const categories = [...new Set(store.db.assets.map((a) => a.category))];
  const visibleKeys = new Set(rows.map((a) => a.id));
  state.selected.forEach((k) => { if (!visibleKeys.has(k)) state.selected.delete(k); });

  const selectedAssets = [...state.selected].map((id) => store.asset(id));
  const allYard = selectedAssets.length > 0 && selectedAssets.every((a) => a.status === "In yard");
  const allAllocated = selectedAssets.length > 0 && selectedAssets.every((a) => a.status === "Allocated");

  const bulkbar = state.selected.size > 0 && h("div.bulkbar", {},
    h("span", {}, h("b.mono", {}, String(state.selected.size)), " selected"),
    h("span", { style: "flex:1" }),
    allYard && h("a.btn.btn-sm", { href: `#/allocate?assets=${[...state.selected].join(",")}` }, "Allocate to a job"),
    allAllocated && h("button.btn.btn-sm", {
      type: "button",
      onclick: async () => {
        const ok = await confirmDialog({
          title: `Return ${state.selected.size} asset${state.selected.size > 1 ? "s" : ""} to the yard?`,
          body: "Each open allocation closes today and the assets become available to every job.",
          confirmLabel: "Return all", danger: false,
        });
        if (ok) {
          const undo = store.returnToYard([...state.selected]);
          toast(`${state.selected.size} assets returned to the yard.`, { undo });
          state.selected.clear();
        }
      },
    }, "Return to yard"),
    !allYard && !allAllocated && h("span.bulk-note", {}, "Mixed statuses — select only in-yard assets to allocate, or only allocated assets to return"),
    h("button.btn.btn-sm", { type: "button", onclick: () => { state.selected.clear(); rerender(); } }, "Clear"));

  container.append(
    pageHead({
      title: "Assets",
      sub: `${all.length} on the register · ${fmt.inrC(all.reduce((s, a) => s + a.value, 0))} of plant`,
      actions: ownerActions,
    }),
    h("div.filters", {},
      h("input", {
        type: "search", placeholder: "Filter by ID, model, serial…", "aria-label": "Filter assets",
        value: state.q, oninput: (e) => { state.q = e.target.value; rerenderSoon(); },
      }),
      h("select", { "aria-label": "Filter by category", onchange: (e) => { state.category = e.target.value; rerender(); } },
        h("option", { value: "" }, "Any category"),
        categories.map((c) => h("option", { value: c, selected: state.category === c }, c))),
      h("select", { "aria-label": "Filter by status", onchange: (e) => { state.status = e.target.value; rerender(); } },
        h("option", { value: "" }, "Any status"),
        ["Allocated", "In yard", "In workshop", store.isOwner() && "Retired"].filter(Boolean).map((s) => h("option", { value: s, selected: state.status === s }, s))),
      h("select", { "aria-label": "Filter by condition", onchange: (e) => { state.cond = e.target.value; rerender(); } },
        h("option", { value: "" }, "Any condition"),
        ["A", "B", "C", "D"].map((c) => h("option", { value: c, selected: state.cond === c }, "Condition " + c))),
      exportButton("assets", cols, rows),
      h("span.count", {}, `${rows.length} of ${all.length}`)),
    bulkbar || "",
    rows.length
      ? h("div.card", {}, table({
          cols, rows, rowKey: (a) => a.id, ariaLabel: "Asset register",
          sort: state.sort,
          onSort: (key) => { state.sort = state.sort.key === key ? { key, dir: -state.sort.dir } : { key, dir: 1 }; rerender(); },
          onOpen: (a) => { location.hash = `/assets/${a.id}`; },
          selected: state.selected,
          onSelect: (keys, replaceAll) => {
            if (replaceAll) { state.selected.clear(); keys.forEach((k) => state.selected.add(k)); }
            else keys.forEach((k) => state.selected.has(k) ? state.selected.delete(k) : state.selected.add(k));
            rerender();
          },
        }))
      : h("div.card", {}, stateBlock(store.COPY.noResults(state.q || "these filters"), {
          onAction: () => { state.q = ""; state.category = ""; state.status = ""; state.cond = ""; rerender(); },
        })));
}

/* ---------------- detail ---------------- */
export function detail(container, id) {
  paintDetail(container, id);
}

function paintDetail(container, id) {
  const a = store.asset(id);
  if (!a || !store.canSeeAsset(id)) { container.append(deniedBlock()); return; }

  const j = a.jobId ? store.job(a.jobId) : null;
  const mrs = store.visibleMaintenance().filter((m) => m.assetId === id);
  const openMr = store.openMrsFor(id).length;
  const events = (store.db.history[id] || []).slice().reverse();
  const activeJobs = store.myJobs().filter((x) => ["Active", "Mobilising"].includes(x.status));

  const actions = h("div.head-actions", {});
  if (store.isOwner() && a.status !== "Retired") {
    actions.append(h("button.btn.btn-secondary", { type: "button", onclick: () => assetModal(a) }, "Edit"));
  }
  if (a.status === "In yard") {
    actions.append(h("a.btn.btn-primary", { href: `#/allocate?assets=${a.id}` }, "Allocate"));
  }
  if (a.status === "Allocated") {
    actions.append(
      h("button.btn.btn-secondary", {
        type: "button",
        onclick: async () => {
          const c = store.COPY.confirm.returnAsset(a);
          if (await confirmDialog({ ...c, danger: false })) {
            const undo = store.returnToYard([a.id]);
            toast(`${a.id} returned to the yard.`, { undo });
          }
        },
      }, "Return to yard"),
      h("button.btn.btn-secondary", { type: "button", onclick: () => transferModal(a, activeJobs) }, "Transfer"));
  }
  if (a.status !== "Retired") {
    actions.append(h("button.btn.btn-secondary", { type: "button", onclick: () => faultModal(a) }, "Report a fault"));
    if (store.isOwner()) {
      actions.append(h("button.btn.btn-danger", {
        type: "button",
        onclick: async () => {
          const c = store.COPY.confirm.deleteAsset(a, a.status === "Allocated", openMr);
          if (await confirmDialog(c)) {
            const undo = store.retireAsset(a.id);
            toast(`${a.id} retired from the register.`, { undo });
          }
        },
      }, "Retire"));
    }
  }

  container.append(
    pageHead({
      title: `${a.id} — ${a.model}`,
      sub: `${a.category} · serial ${a.serial}`,
      crumbs: [{ label: "Assets", href: "#/assets" }, { label: a.id }],
      actions,
    }),
    h("div.two-col", {},
      h("div.stack", {},
        h("div.card", {},
          h("div.card-head", {}, h("h2", {}, "Current position"), statusChip("asset", a.status)),
          h("div.card-pad", {},
            a.status === "Allocated" && j
              ? h("p", {}, "On ", h("a", { href: `#/jobs/${j.id}` }, h("b", {}, `${j.id} — ${j.name}`)),
                ` since ${fmt.date(a.allocatedOn)}. The job window closes ${fmt.date(j.ends)} (${fmt.rel(j.ends, store.TODAY)}).`)
              : a.status === "In yard"
                ? h("p", {}, "In the yard and available to every job. Allocate it to commit it to one.")
                : a.status === "In workshop"
                  ? h("p", {}, "Held in the workshop. See its open request below for progress.")
                  : h("p", {}, "Retired from the active register. History is kept for audit."))),
        h("div.card", {},
          h("div.card-head", {}, h("h2", {}, `Maintenance record · ${mrs.length}`)),
          mrs.length
            ? h("ul.rowlist", {}, mrs.map((m) => h("li", {},
                h("a.rowlist-item", { href: `#/maintenance/${m.id}` },
                  h("span.rowlist-main", {}, h("b", {}, `${m.id} · ${m.fault}`),
                    h("span.cell-sub", {}, `reported ${fmt.date(m.reported)} by ${store.employee(m.reporterId)?.name || m.reporterId}`)),
                  h("span.rowlist-stack", {}, statusChip("mr", m.status), h("span.mono", {}, fmt.inrC(m.estCost)))))))
            : h("p.card-pad.muted", {}, "No faults on record for this asset.")),
        h("div.card", {},
          h("div.card-head", {}, h("h2", {}, "History")),
          h("ul.timeline.card-pad", {}, events.map((e) =>
            h("li", {}, h("span.when", {}, fmt.date(e.on)), h("span", {}, h("b", {}, e.kind), " — ", e.note)))))),
      h("div.stack", {},
        h("div.card", {},
          h("div.card-head", {}, h("h2", {}, "Details")),
          h("dl.meta-list.card-pad", {},
            h("dt", {}, "Condition"), h("dd", {}, condBadge(a.condition), h("span.muted", {}, ["", " excellent", " serviceable", " worn", " end of life"]["ABCD".indexOf(a.condition) + 1])),
            h("dt", {}, "Serial"), h("dd.mono", {}, a.serial),
            h("dt", {}, "Category"), h("dd", {}, a.category),
            h("dt", {}, "Purchased"), h("dd.mono", {}, fmt.date(a.purchased)),
            h("dt", {}, "Book value"), h("dd.mono", {}, fmt.inr(a.value)),
            h("dt", {}, "Meter hours"), h("dd.mono", {}, fmt.int(a.hours) + " h"))))));
}

function transferModal(a, jobsList) {
  const targets = jobsList.filter((x) => x.id !== a.jobId);
  const target = field({
    name: "target", label: "Transfer to job", type: "select", required: true,
    options: targets.map((x) => ({ value: x.id, label: `${x.id} — ${x.name}` })),
    help: `Closes the allocation to ${a.jobId} and opens one on the chosen job, dated today.`,
  });
  let dlg;
  const submit = submitRow([target], "Transfer asset", () => {
    const undo = store.transfer(a.id, target.get());
    dlg.close();
    toast(`${a.id} transferred ${a.jobId} → ${target.get()}.`, { undo });
  });
  dlg = openModal({
    title: `Transfer ${a.id}`,
    content: h("form", { onsubmit: (e) => e.preventDefault() }, target.root, submit),
  });
}

function faultModal(a) {
  const fault = field({
    name: "fault", label: "What is wrong", type: "textarea", required: true,
    placeholder: "e.g. Hydraulic hose weeping at boom ram",
    validate: (v) => v.length < 10 ? "Describe the fault in at least 10 characters so the mechanic can triage it" : null,
  });
  const cost = field({
    name: "cost", label: "Estimated repair cost (₹)", type: "number", required: true, inputmode: "numeric",
    validate: (v) => !(+v > 0) ? "Enter an amount above zero" : null,
    help: "A rough figure is fine — the Owner approves the spend.",
  });
  let dlg;
  const submit = submitRow([fault, cost], "Raise request", () => {
    const { undo, id } = store.raiseMaintenance({ assetId: a.id, fault: fault.get(), estCost: +cost.get() });
    dlg.close();
    toast(`${id} raised for ${a.id}. The Owner will see it for approval.`, { undo });
  });
  dlg = openModal({
    title: `Report a fault on ${a.id}`,
    content: h("form", { onsubmit: (e) => e.preventDefault() }, fault.root, cost.root, submit),
  });
}
