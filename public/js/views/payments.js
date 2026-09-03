/* PLINTH — payment ledger and detail. Financials are role-scoped. */
import * as store from "../store.js";
import {
  h, fmt, table, sortRows, statusChip, stateBlock, skelTable, skelDetail,
  pageHead, toast, confirmDialog, openModal, field, submitRow,
} from "../ui.js";
import { deniedBlock } from "./misc.js";

const state = { status: "", jobId: "", sort: { key: "issued", dir: -1 } };

export function list(container) {
  container.append(skelTable(8));
  store.load("payments").then(() => { container.replaceChildren(); paint(container); });
}

function paint(container) {
  const all = store.visiblePayments();
  const rerender = () => { container.replaceChildren(); paint(container); };

  const open = all.filter((p) => ["Pending", "Overdue", "Disputed"].includes(p.status));
  const overdue = all.filter((p) => p.status === "Overdue");
  const disputed = all.filter((p) => p.status === "Disputed");

  container.append(pageHead({
    title: "Payments",
    sub: store.isOwner() ? "The full ledger, every job" : "The ledger for your jobs only",
    actions: store.isOwner() && h("button.btn.btn-primary", { type: "button", onclick: () => recordModal() }, "Record payment"),
  }));

  if (all.length === 0) {
    container.append(h("div.card", {}, stateBlock(store.COPY.empty.payments)));
    return;
  }

  container.append(h("div.kpis", {},
    h("div.card.kpi", {}, h("div.label", {}, "Outstanding"), h("div.value", {}, fmt.inrC(open.reduce((s, p) => s + p.amount, 0))), h("div.sub", {}, `${open.length} open entries`)),
    h("div.card.kpi", {}, h("div.label", {}, "Overdue"), h("div.value", {}, fmt.inrC(overdue.reduce((s, p) => s + p.amount, 0))), h("div.sub", { class: overdue.length ? "alert" : "" }, `${overdue.length} past due date`)),
    h("div.card.kpi", {}, h("div.label", {}, "Disputed"), h("div.value", {}, String(disputed.length)), h("div.sub", {}, disputed.length ? "needs a decision" : "none contested")),
    h("div.card.kpi", {}, h("div.label", {}, "Paid this quarter"), h("div.value", {}, fmt.inrC(all.filter((p) => p.status === "Paid").reduce((s, p) => s + p.amount, 0))), h("div.sub", {}, `${all.filter((p) => p.status === "Paid").length} settled`))));

  const cols = [
    { key: "id", label: "Invoice", sortable: true, mono: true },
    { key: "jobId", label: "Job", sortable: true, mono: true, sub: (p) => store.job(p.jobId)?.name },
    { key: "payee", label: "Payee", sortable: true, sub: (p) => p.desc },
    { key: "issued", label: "Issued", sortable: true, mono: true, render: (p) => fmt.date(p.issued) },
    {
      key: "due", label: "Due", sortable: true, mono: true,
      render: (p) => fmt.date(p.due),
      sub: (p) => ["Pending", "Overdue", "Disputed"].includes(p.status)
        ? h("span", { class: p.due < store.TODAY ? "alert" : "" }, fmt.rel(p.due, store.TODAY)) : null,
    },
    { key: "amount", label: "Amount", sortable: true, mono: true, right: true, render: (p) => fmt.inr(p.amount) },
    { key: "status", label: "Status", sortable: true, render: (p) => statusChip("pay", p.status) },
  ];

  const jobsWithPays = [...new Set(all.map((p) => p.jobId))];
  let rows = all.filter((p) => {
    if (state.status && p.status !== state.status) return false;
    if (state.jobId && p.jobId !== state.jobId) return false;
    return true;
  });
  rows = sortRows(rows, state.sort, cols);

  container.append(
    h("div.filters", {},
      h("select", { "aria-label": "Filter by status", onchange: (e) => { state.status = e.target.value; rerender(); } },
        h("option", { value: "" }, "Any status"),
        ["Paid", "Pending", "Overdue", "Disputed", "Voided"].map((s) => h("option", { value: s, selected: state.status === s }, s))),
      h("select", { "aria-label": "Filter by job", onchange: (e) => { state.jobId = e.target.value; rerender(); } },
        h("option", { value: "" }, "Any job"),
        jobsWithPays.map((jid) => h("option", { value: jid, selected: state.jobId === jid }, jid))),
      h("span.count", {}, `${rows.length} of ${all.length} entries`)),
    rows.length
      ? h("div.card", {}, table({
          cols, rows, rowKey: (p) => p.id, ariaLabel: "Payment ledger",
          sort: state.sort,
          onSort: (key) => { state.sort = state.sort.key === key ? { key, dir: -state.sort.dir } : { key, dir: 1 }; rerender(); },
          onOpen: (p) => { location.hash = `/payments/${p.id}`; },
        }))
      : h("div.card.card-pad", {},
          h("p.muted", {}, "No entries match those filters. ",
            h("button.link-btn.as-btn", { type: "button", onclick: () => { state.status = ""; state.jobId = ""; rerender(); } }, "Clear filters"))));
}

function recordModal() {
  const jobSel = field({
    name: "job", label: "Against job", type: "select", required: true,
    options: store.db.jobs.filter((j) => j.status !== "Completed").map((j) => ({ value: j.id, label: `${j.id} — ${j.name}` })),
  });
  const payee = field({ name: "payee", label: "Payee", required: true });
  const desc = field({ name: "desc", label: "What it covers", required: true });
  const amount = field({
    name: "amount", label: "Amount (₹)", type: "number", required: true, inputmode: "numeric",
    validate: (v) => !(+v > 0) ? "Enter an amount above zero" : null,
  });
  const due = field({
    name: "due", label: "Due date", type: "date", required: true,
    validate: (v) => v < store.TODAY ? "Due date is before today — the entry would be born overdue" : null,
  });
  let dlg;
  const submit = submitRow([jobSel, payee, desc, amount, due], "Record as pending", () => {
    const { undo, id } = store.recordPayment({ jobId: jobSel.get(), payee: payee.get(), desc: desc.get(), amount: +amount.get(), due: due.get() });
    dlg.close();
    toast(`${id} recorded against ${jobSel.get()} — ${fmt.inr(+amount.get())} pending.`, { undo });
  });
  dlg = openModal({
    title: "Record a payment",
    content: h("form", { onsubmit: (e) => e.preventDefault() }, jobSel.root, payee.root, desc.root, amount.root, due.root, submit),
  });
}

/* ---------------- detail ---------------- */
export function detail(container, id) {
  container.append(skelDetail());
  store.load("pay:" + id, 300).then(() => { container.replaceChildren(); paintDetail(container, id); });
}

function paintDetail(container, id) {
  const p = store.paymentById(id);
  if (!p || !store.canSeePayment(id)) { container.append(deniedBlock()); return; }

  const j = store.job(p.jobId);
  const timeline = [
    { on: p.issued, note: `Invoice issued by ${p.payee}` },
    { on: p.due, note: p.due < store.TODAY && !p.paidOn ? "Due date passed unpaid" : `Due date (${fmt.rel(p.due, store.TODAY)})` },
    p.paidOn && { on: p.paidOn, note: "Paid in full" },
    p.voidedOn && { on: p.voidedOn, note: "Voided — kept on the ledger for audit" },
    p.disputeNote && { on: p.issued, note: `Disputed: ${p.disputeNote}` },
  ].filter(Boolean).sort((a, b) => a.on.localeCompare(b.on));

  const actions = h("div.head-actions", {}, statusChip("pay", p.status));
  if (store.isOwner() && ["Pending", "Overdue", "Disputed"].includes(p.status)) {
    actions.append(
      h("button.btn.btn-primary", {
        type: "button",
        onclick: () => {
          const undo = store.markPaid(p.id);
          toast(`${p.id} marked paid — ${fmt.inr(p.amount)} to ${p.payee}.`, { undo });
        },
      }, "Mark paid"),
      h("button.btn.btn-danger", {
        type: "button",
        onclick: async () => {
          const c = store.COPY.confirm.voidPayment(p);
          if (await confirmDialog(c)) {
            const undo = store.voidPayment(p.id);
            toast(`${p.id} voided.`, { undo });
          }
        },
      }, "Void"));
  }

  container.append(
    pageHead({
      title: `${p.id} · ${fmt.inr(p.amount)}`,
      sub: `${p.payee} — ${p.desc}`,
      crumbs: [{ label: "Payments", href: "#/payments" }, { label: p.id }],
      actions,
    }),
    h("div.two-col", {},
      h("div.stack", {},
        p.disputeNote && h("div.card.card-pad.note-warn", {},
          h("b", {}, "Under dispute. "), p.disputeNote),
        h("div.card", {},
          h("div.card-head", {}, h("h2", {}, "Timeline")),
          h("ul.timeline.card-pad", {}, timeline.map((t) =>
            h("li", {}, h("span.when", {}, fmt.date(t.on)), h("span", {}, t.note)))))),
      h("div.card", {},
        h("div.card-head", {}, h("h2", {}, "Details")),
        h("dl.meta-list.card-pad", {},
          h("dt", {}, "Job"), h("dd", {}, j ? h("a.mono", { href: `#/jobs/${j.id}` }, j.id) : p.jobId),
          h("dt", {}, "Payee"), h("dd", {}, p.payee),
          h("dt", {}, "Amount"), h("dd.mono", {}, fmt.inr(p.amount)),
          h("dt", {}, "Issued"), h("dd.mono", {}, fmt.date(p.issued)),
          h("dt", {}, "Due"), h("dd.mono", {}, fmt.date(p.due)),
          p.paidOn && h("dt", {}, "Paid"), p.paidOn && h("dd.mono", {}, fmt.date(p.paidOn))))));
}
