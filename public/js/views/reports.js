/* PLINTH — reports & exports. Owner only; computed from the full register. */
import * as store from "../store.js";
import { h, fmt, pageHead, toast } from "../ui.js";
import { deniedBlock } from "./misc.js";
import { downloadCsv } from "../csv.js";

const csvDownload = downloadCsv;

function bar(label, value, max, right) {
  return h("a.rowline", { style: "cursor:default" },
    h("span", { style: "min-width:150px" }, label),
    h("span.track", {}, h("span.fill", { style: `width:${max ? (value / max) * 100 : 0}%` })),
    h("span.mono", {}, right));
}

function kpi(label, value, sub) {
  return h("div.card.kpi", {}, h("div.label", {}, label), h("div.value", {}, value),
    sub && h("div.sub", {}, sub));
}

export function render(container) {
  if (!store.isOwner()) { container.append(deniedBlock()); return; }
  store.load().then(() => { container.replaceChildren(); paint(container); });
}

function paint(container) {
  const db = store.db;
  const live = db.assets.filter((a) => a.status !== "Retired");
  const fleetValue = live.reduce((s, a) => s + a.value, 0);
  const u = store.utilization();
  const openMr = db.maintenance.filter((m) => ["Reported", "Approved", "In workshop"].includes(m.status));
  const mrExposure = openMr.reduce((s, m) => s + m.estCost, 0);

  const paySum = (st) => db.payments.filter((p) => p.status === st).reduce((s, p) => s + p.amount, 0);
  const committed = paySum("Pending") + paySum("Overdue") + paySum("Disputed");

  // fleet value by category
  const byCat = {};
  live.forEach((a) => { byCat[a.category] = (byCat[a.category] || 0) + a.value; });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const catMax = Math.max(1, ...cats.map((c) => c[1]));

  // committed spend by job
  const byJob = {};
  db.payments.filter((p) => ["Pending", "Overdue", "Disputed"].includes(p.status))
    .forEach((p) => { byJob[p.jobId] = (byJob[p.jobId] || 0) + p.amount; });
  const jobs = Object.entries(byJob).sort((a, b) => b[1] - a[1]);
  const jobMax = Math.max(1, ...jobs.map((j) => j[1]));

  const mrByStatus = ["Reported", "Approved", "In workshop", "Resolved", "Rejected"]
    .map((s) => [s, db.maintenance.filter((m) => m.status === s).length]);

  container.append(
    pageHead({
      title: "Reports",
      sub: `Fleet, spend and maintenance across the whole register — ${fmt.date(store.TODAY)}`,
      actions: h("div.head-actions", {},
        h("button.btn.btn-secondary", {
          type: "button",
          onclick: () => csvDownload("plinth-assets.csv",
            ["id", "category", "model", "serial", "status", "job", "condition", "hours", "value", "purchased"],
            db.assets.map((a) => [a.id, a.category, a.model, a.serial, a.status, a.jobId || "", a.condition, a.hours, a.value, a.purchased || ""])),
        }, "Export assets"),
        h("button.btn.btn-secondary", {
          type: "button",
          onclick: () => csvDownload("plinth-ledger.csv",
            ["id", "job", "payee", "description", "amount", "status", "issued", "due", "paidOn"],
            db.payments.map((p) => [p.id, p.jobId || "", p.payee, p.desc, p.amount, p.status, p.issued || "", p.due || "", p.paidOn || ""])),
        }, "Export ledger")),
    }),

    h("div.kpis", {},
      kpi("Fleet value", fmt.inrC(fleetValue), `${live.length} live assets`),
      kpi("Utilisation", `${u.pct}%`, `${u.allocated} of ${u.total} on a job`),
      kpi("Committed spend", fmt.inrC(committed), `${db.payments.filter((p) => ["Pending", "Overdue", "Disputed"].includes(p.status)).length} open entries`),
      kpi("Maintenance exposure", fmt.inrC(mrExposure), `${openMr.length} open requests`)),

    h("div.two-col", {},
      h("div.stack", {},
        h("div.card", {},
          h("div.card-head", {}, h("h2", {}, "Fleet value by category")),
          h("div.barlist.card-pad", {}, cats.map(([c, v]) => bar(c, v, catMax, fmt.inrC(v))))),
        h("div.card", {},
          h("div.card-head", {}, h("h2", {}, "Committed spend by job")),
          jobs.length
            ? h("div.barlist.card-pad", {}, jobs.map(([j, v]) => bar(j, v, jobMax, fmt.inrC(v))))
            : h("p.card-pad.muted", {}, "Nothing outstanding."))),
      h("div.stack", {},
        h("div.card", {},
          h("div.card-head", {}, h("h2", {}, "Maintenance pipeline")),
          h("dl.meta-list.card-pad", {},
            ...mrByStatus.flatMap(([s, n]) => [h("dt", {}, s), h("dd.mono", {}, String(n))]),
            h("dt", {}, "Open exposure"), h("dd.mono", {}, fmt.inr(mrExposure)))),
        h("div.card", {},
          h("div.card-head", {}, h("h2", {}, "Payments by status")),
          h("dl.meta-list.card-pad", {},
            h("dt", {}, "Paid"), h("dd.mono", {}, fmt.inr(paySum("Paid"))),
            h("dt", {}, "Pending"), h("dd.mono", {}, fmt.inr(paySum("Pending"))),
            h("dt", {}, "Overdue"), h("dd.mono.alert", {}, fmt.inr(paySum("Overdue"))),
            h("dt", {}, "Disputed"), h("dd.mono", {}, fmt.inr(paySum("Disputed"))))))));
}
