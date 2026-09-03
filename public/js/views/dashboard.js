/* PLINTH — dashboard. Genuinely different by role. */
import * as store from "../store.js";
import { h, fmt, icon, statusChip, skelKpis, skelTable, pageHead } from "../ui.js";
import { createField } from "../signature.js";

let heroHandle = null;

export function render(container) {
  container.append(skelKpis(4), skelTable(5));
  store.load("dashboard").then(() => {
    container.replaceChildren();
    heroHandle?.dispose();
    store.isOwner() ? owner(container) : engineer(container);
  });
}

function hero(container, scopeMine, overlayBig, overlayRow) {
  const canvas = h("canvas", { "aria-hidden": "true" });
  const panel = h("div.card.hero-panel", {},
    canvas,
    h("div.hero-overlay", {},
      h("div.big", {}, overlayBig),
      h("div.row", {}, overlayRow.map((r) => h("span", {}, r)))));
  container.append(panel);
  heroHandle = createField(canvas, {
    mode: "hero", seed: 4,
    forceStatic: store.reducedMotion(),
    data: store.fieldData(scopeMine),
  });
}

function kpi(label, value, sub, alert) {
  return h("div.card.kpi", {},
    h("div.label", {}, label),
    h("div.value", {}, value),
    sub && h("div.sub", { class: alert ? "alert" : "" }, sub));
}

function listCard(title, items, emptyText, headExtra) {
  return h("div.card", {},
    h("div.card-head", {}, h("h2", {}, title), headExtra),
    items.length
      ? h("ul.rowlist", {}, items)
      : h("p.card-pad.muted", {}, emptyText));
}

function rowItem(href, primary, subText, right) {
  return h("li", {}, h("a.rowlist-item", { href },
    h("span.rowlist-main", {}, h("b", {}, primary), h("span.cell-sub", {}, subText)),
    h("span.rowlist-right", {}, right)));
}

/* ---------------- owner ---------------- */
function owner(container) {
  const u = store.utilization();
  const c = store.navCounts();
  const fleetValue = store.db.assets.filter((a) => a.status !== "Retired").reduce((s, a) => s + a.value, 0);
  const open = store.db.payments.filter((p) => ["Pending", "Overdue", "Disputed"].includes(p.status));
  const committed = open.reduce((s, p) => s + p.amount, 0);
  const mrOpen = store.db.maintenance.filter((m) => ["Reported", "Approved", "In workshop"].includes(m.status));
  const mrExposure = mrOpen.reduce((s, m) => s + m.estCost, 0);
  const inYard = store.db.assets.filter((a) => a.status === "In yard").length;
  const inShop = store.db.assets.filter((a) => a.status === "In workshop").length;

  container.append(pageHead({
    title: `Morning, ${store.persona().name.split(" ")[0]}`,
    sub: `Fleet position for ${fmt.date(store.TODAY)} — live from the register`,
  }));

  hero(container, false,
    `${u.pct}% of the fleet is on a job`,
    [`${u.allocated} allocated`, `${inYard} in yard`, `${inShop} in workshop`, `${c.jobs.active} active jobs`]);

  container.append(h("div.kpis", {},
    kpi("Fleet value", fmt.inrC(fleetValue), `${u.total} assets registered`),
    kpi("Committed spend", fmt.inrC(committed), `${open.length} open payments`),
    kpi("Overdue payments", fmt.inrC(c.payments.overdueSum), `${c.payments.overdue} invoices past due`, c.payments.overdue > 0),
    kpi("Maintenance exposure", fmt.inrC(mrExposure), `${mrOpen.length} open requests`, c.maintenance.overdue > 0)));

  /* assets by job — utilization bars */
  const activeJobs = store.db.jobs.filter((j) => j.status === "Active");
  const byJob = activeJobs.map((j) => ({ j, n: store.jobAssets(j.id).length }))
    .sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...byJob.map((x) => x.n));
  const bars = h("div.barlist.card-pad", {}, byJob.map(({ j, n }) =>
    h("a.rowline", { href: `#/jobs/${j.id}`, "aria-label": `${j.id} ${j.name}: ${n} assets` },
      h("span.mono", {}, j.id),
      h("span.track", {}, h("span.fill", { style: `width:${(n / max) * 100}%` })),
      h("span.mono", {}, String(n)))));

  /* needs attention */
  const overduePays = store.db.payments.filter((p) => p.status === "Overdue")
    .map((p) => rowItem(`#/payments/${p.id}`, `${p.id} · ${p.payee}`,
      `${p.jobId} · due ${fmt.date(p.due)} (${fmt.rel(p.due, store.TODAY)})`,
      h("span.mono.alert", {}, fmt.inrC(p.amount))));
  const overdueMrs = mrOpen.filter((m) => m.overdue)
    .map((m) => rowItem(`#/maintenance/${m.id}`, `${m.id} · ${store.asset(m.assetId).model}`,
      `${m.status} since ${fmt.date(m.workshopOn || m.reported)}`,
      statusChip("mr", m.status)));
  const held = store.db.jobs.filter((j) => j.status === "On hold")
    .map((j) => rowItem(`#/jobs/${j.id}`, `${j.id} · ${j.name}`, j.holdNote || "On hold", statusChip("job", j.status)));

  const dueBack = store.dueBack(30).map((a) => {
    const j = store.job(a.jobId);
    return rowItem(`#/assets/${a.id}`, `${a.id} · ${a.model}`,
      `${a.jobId} ends ${fmt.date(j.ends)} (${fmt.rel(j.ends, store.TODAY)})`, statusChip("asset", a.status));
  });

  container.append(h("div.grid.dash-grid", {},
    listCard(`Assets by active job`, [h("li", {}, bars)], "No active jobs."),
    listCard("Needs attention", [...overduePays, ...overdueMrs, ...held],
      "Nothing is overdue, disputed or on hold."),
    listCard(`Due back within 30 days · ${dueBack.length}`, dueBack,
      "No allocations end in the next 30 days.")));
}

/* ---------------- site engineer ---------------- */
function engineer(container) {
  const me = store.persona();
  const myJobs = store.myJobs();
  const active = myJobs.filter((j) => j.status === "Active");
  const myAssets = store.visibleAssets().filter((a) => a.jobId && store.myJobIds().has(a.jobId));
  const myMrs = store.visibleMaintenance().filter((m) => ["Reported", "Approved", "In workshop"].includes(m.status));
  const due = store.dueBack(30);
  const myPays = store.visiblePayments().filter((p) => ["Pending", "Overdue", "Disputed"].includes(p.status));

  container.append(pageHead({
    title: `Morning, ${me.name.split(" ")[0]}`,
    sub: `Your jobs at ${fmt.date(store.TODAY)} — scoped to what you run`,
  }));

  hero(container, true,
    `${myAssets.length} assets across your ${active.length} active jobs`,
    [`${store.fieldData(true).idle} in yard, ready to request`, `${myMrs.length} open fault reports`]);

  container.append(h("div.kpis", {},
    kpi("Your active jobs", String(active.length), `${myJobs.length} total on file`),
    kpi("Assets on your jobs", String(myAssets.length), "allocated to you"),
    kpi("Your open requests", String(myMrs.length), myMrs.length ? "awaiting workshop or decision" : "queue clear", myMrs.some((m) => m.overdue)),
    kpi("Due back ≤ 30 days", String(due.length), "as job windows close", due.length > 0)));

  const jobRows = myJobs.map((j) => rowItem(`#/jobs/${j.id}`, `${j.id} · ${j.name}`,
    `${j.client} · ends ${fmt.date(j.ends)}`,
    h("span.rowlist-stack", {}, statusChip("job", j.status), h("span.mono.muted", {}, `${store.jobAssets(j.id).length} assets`))));

  const mrRows = myMrs.map((m) => rowItem(`#/maintenance/${m.id}`, `${m.id} · ${store.asset(m.assetId).model}`,
    m.fault, statusChip("mr", m.status)));

  const dueRows = due.map((a) => {
    const j = store.job(a.jobId);
    return rowItem(`#/assets/${a.id}`, `${a.id} · ${a.model}`,
      `${a.jobId} ends ${fmt.date(j.ends)} (${fmt.rel(j.ends, store.TODAY)})`,
      h("button.btn.btn-secondary.btn-sm", {
        type: "button",
        onclick: (e) => { e.preventDefault(); location.hash = `/assets/${a.id}`; },
      }, "Log return"));
  });

  const payRows = myPays.map((p) => rowItem(`#/payments/${p.id}`, `${p.id} · ${p.payee}`,
    `${p.jobId} · due ${fmt.date(p.due)}`,
    h("span.rowlist-stack", {}, statusChip("pay", p.status), h("span.mono", {}, fmt.inrC(p.amount)))));

  container.append(h("div.grid.dash-grid", {},
    listCard("Your jobs", jobRows, "No jobs are assigned to you yet. The Owner assigns jobs to engineers."),
    listCard("Your open fault reports", mrRows, "You have no open reports. Raise one from any asset page.",
      h("a.link-btn", { href: "#/maintenance" }, "Open queue")),
    listCard(`Due back within 30 days · ${due.length}`, dueRows, "No allocations on your jobs end in the next 30 days."),
    listCard("Payments on your jobs", payRows, "Nothing is outstanding on your jobs.")));
}
