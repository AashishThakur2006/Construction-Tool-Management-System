/* PLINTH — maintenance queue with status pipeline, and request detail. */
import * as store from "../store.js";
import { repaint, h, fmt, table, sortRows, statusChip, stateBlock, pageHead, toast, openModal, field, submitRow } from "../ui.js";
import { deniedBlock } from "./misc.js";

const state = { stage: "", sort: { key: "reported", dir: -1 } };
const STAGES = ["Reported", "Approved", "In workshop", "Resolved", "Rejected"];

export function list(container) {
  paint(container);
}

function paint(container) {
  const all = store.visibleMaintenance();
  const rerender = () => repaint(container, paint);

  const counts = Object.fromEntries(STAGES.map((s) => [s, all.filter((m) => m.status === s).length]));
  const openSum = all.filter((m) => ["Reported", "Approved", "In workshop"].includes(m.status)).reduce((s, m) => s + m.estCost, 0);

  container.append(pageHead({
    title: "Maintenance",
    sub: store.isOwner()
      ? `Open exposure ${fmt.inrC(openSum)} — you approve every rupee of it`
      : "Faults you have reported, from first report to resolution",
    actions: !store.isOwner() && h("a.btn.btn-primary", { href: "#/assets" }, "Report from an asset page"),
  }));

  if (all.length === 0) {
    container.append(h("div.card", {}, stateBlock(store.COPY.empty.maintenance)));
    return;
  }

  container.append(h("div.pipeline", { role: "group", "aria-label": "Filter by stage" },
    h("button", { type: "button", class: state.stage === "" ? "active" : "", onclick: () => { state.stage = ""; rerender(); } },
      "All ", h("span.n", {}, String(all.length))),
    STAGES.map((s) => h("button", {
      type: "button", class: state.stage === s ? "active" : "",
      onclick: () => { state.stage = s; rerender(); },
    }, s + " ", h("span.n", {}, String(counts[s]))))));

  const cols = [
    { key: "id", label: "Request", sortable: true, mono: true, sub: (m) => m.overdue ? h("span.alert", {}, "running late") : null },
    {
      key: "assetId", label: "Asset", sortable: true, mono: true,
      sub: (m) => store.asset(m.assetId)?.model,
    },
    { key: "fault", label: "Fault" },
    {
      key: "reported", label: "Reported", sortable: true, mono: true,
      render: (m) => fmt.date(m.reported),
      sub: (m) => `by ${store.employee(m.reporterId)?.name || m.reporterId}`,
    },
    { key: "estCost", label: "Est. cost", sortable: true, mono: true, right: true, render: (m) => fmt.inr(m.estCost) },
    { key: "status", label: "Status", sortable: true, render: (m) => statusChip("mr", m.status) },
  ];

  let rows = state.stage ? all.filter((m) => m.status === state.stage) : all;
  rows = sortRows(rows, state.sort, cols);

  container.append(rows.length
    ? h("div.card", {}, table({
        cols, rows, rowKey: (m) => m.id, ariaLabel: "Maintenance queue",
        sort: state.sort,
        onSort: (key) => { state.sort = state.sort.key === key ? { key, dir: -state.sort.dir } : { key, dir: 1 }; rerender(); },
        onOpen: (m) => { location.hash = `/maintenance/${m.id}`; },
      }))
    : h("div.card.card-pad", {},
        h("p.muted", {}, `Nothing is at “${state.stage}” right now. `,
          h("button.link-btn.as-btn", { type: "button", onclick: () => { state.stage = ""; rerender(); } }, "Show the whole queue"))));
}

/* ---------------- detail ---------------- */
export function detail(container, id) {
  paintDetail(container, id);
}

function paintDetail(container, id) {
  const m = store.mrById(id);
  if (!m || !store.canSeeMr(id)) { container.append(deniedBlock()); return; }

  const a = store.asset(m.assetId);
  const reporter = store.employee(m.reporterId);
  const mechanic = m.mechanicId ? store.employee(m.mechanicId) : null;

  const timeline = [
    { on: m.reported, note: `Reported by ${reporter?.name || m.reporterId}` },
    m.approvedOn && { on: m.approvedOn, note: `Spend approved by the Owner — ${fmt.inr(m.estCost)}` },
    m.workshopOn && { on: m.workshopOn, note: `Workshop intake${mechanic ? ` — ${mechanic.name}` : ""}` },
    m.resolvedOn && { on: m.resolvedOn, note: "Resolved and returned to the yard serviceable" },
    m.rejectedOn && { on: m.rejectedOn, note: `Rejected — ${m.rejectNote || "no note"}` },
  ].filter(Boolean);

  container.append(
    pageHead({
      title: `${m.id} — ${m.fault}`,
      sub: a ? `${a.id} · ${a.model}` : m.assetId,
      crumbs: [{ label: "Maintenance", href: "#/maintenance" }, { label: m.id }],
      actions: h("div.head-actions", {}, statusChip("mr", m.status)),
    }),
    h("div.two-col", {},
      h("div.stack", {},
        decisionCard(m, a),
        h("div.card", {},
          h("div.card-head", {}, h("h2", {}, "Progress")),
          h("ul.timeline.card-pad", {}, timeline.map((t) =>
            h("li", {}, h("span.when", {}, fmt.date(t.on)), h("span", {}, t.note)))))),
      h("div.card", {},
        h("div.card-head", {}, h("h2", {}, "Details")),
        h("dl.meta-list.card-pad", {},
          h("dt", {}, "Asset"), h("dd", {}, a ? h("a.mono", { href: `#/assets/${a.id}` }, a.id) : m.assetId),
          h("dt", {}, "Estimated cost"), h("dd.mono", {}, fmt.inr(m.estCost)),
          h("dt", {}, "Reported"), h("dd.mono", {}, fmt.date(m.reported)),
          h("dt", {}, "Reporter"), h("dd", {}, reporter ? h("a", { href: `#/employees/${reporter.id}` }, reporter.name) : m.reporterId),
          mechanic && h("dt", {}, "Mechanic"), mechanic && h("dd", {}, h("a", { href: `#/employees/${mechanic.id}` }, mechanic.name)),
          h("dt", {}, "Running late"), h("dd", {}, m.overdue ? "Yes — flagged in the queue" : "No")))));
}

function decisionCard(m, a) {
  if (!store.isOwner()) {
    /* engineers see the decision state, not the controls */
    const msg = {
      Reported: "Awaiting the Owner's decision. You will see approval or rejection here.",
      Approved: "Spend approved. The workshop will schedule intake next.",
      "In workshop": "In the workshop now. The asset returns to the yard when resolved.",
      Resolved: "Closed. The asset went back to the yard serviceable.",
      Rejected: `Rejected by the Owner${m.rejectNote ? ` — ${m.rejectNote}` : ""}.`,
    }[m.status];
    return h("div.card", {},
      h("div.card-head", {}, h("h2", {}, "Decision")),
      h("p.card-pad", {}, msg));
  }

  const wrap = h("div.card-pad.head-actions");
  if (m.status === "Reported") {
    wrap.append(
      h("button.btn.btn-primary", {
        type: "button",
        onclick: () => {
          const undo = store.approveMr(m.id);
          toast(`${m.id} approved — ${fmt.inr(m.estCost)} committed.`, { undo });
        },
      }, "Approve spend"),
      h("button.btn.btn-danger", { type: "button", onclick: () => rejectModal(m, a) }, "Reject"));
  } else if (m.status === "Approved") {
    wrap.append(h("button.btn.btn-primary", { type: "button", onclick: () => workshopModal(m) }, "Send to workshop"),
      h("button.btn.btn-danger", { type: "button", onclick: () => rejectModal(m, a) }, "Reject"));
  } else if (m.status === "In workshop") {
    wrap.append(h("button.btn.btn-primary", {
      type: "button",
      onclick: () => {
        const undo = store.resolveMr(m.id);
        toast(`${m.id} resolved — ${m.assetId} is back in the yard.`, { undo });
      },
    }, "Mark resolved"));
  } else {
    wrap.append(h("p.muted", {}, m.status === "Resolved" ? "Closed — no further action." : `Rejected${m.rejectNote ? ` — ${m.rejectNote}` : ""}.`));
  }
  return h("div.card", {}, h("div.card-head", {}, h("h2", {}, "Owner decision")), wrap);
}

function rejectModal(m, a) {
  const reporter = store.employee(m.reporterId)?.name || m.reporterId;
  const copy = store.COPY.confirm.rejectMr(m, a, reporter);
  const note = field({
    name: "note", label: "Reason shown to the reporter", type: "textarea", required: true,
    validate: (v) => v.length < 8 ? "Give a reason of at least 8 characters — the reporter sees it verbatim" : null,
  });
  let dlg;
  const submit = submitRow([note], copy.confirmLabel, () => {
    const undo = store.rejectMr(m.id, note.get());
    dlg.close();
    toast(`${m.id} rejected.`, { undo });
  }, { danger: true });
  dlg = openModal({
    title: copy.title,
    content: h("form", { onsubmit: (e) => e.preventDefault() },
      h("p.confirm-body", {}, copy.body), note.root, submit),
  });
}

function workshopModal(m) {
  const mechs = store.db.employees.filter((e) => e.role === "Plant Mechanic");
  const mechanics = mechs.length ? mechs : store.db.employees; // never leave the required select empty
  const mech = field({
    name: "mech", label: "Assign a mechanic", type: "select", required: true,
    options: mechanics.map((e) => ({ value: e.id, label: e.name })),
    help: m.status === "Approved" && store.asset(m.assetId)?.status === "Allocated"
      ? `${m.assetId} is currently on ${store.asset(m.assetId).jobId} — intake pulls it off that job.`
      : "The asset moves to workshop holding on intake.",
  });
  let dlg;
  const submit = submitRow([mech], "Confirm intake", () => {
    const undo = store.startWork(m.id, mech.get());
    dlg.close();
    toast(`${m.id} moved to the workshop.`, { undo });
  });
  dlg = openModal({
    title: `Workshop intake for ${m.id}`,
    content: h("form", { onsubmit: (e) => e.preventDefault() }, mech.root, submit),
  });
}
