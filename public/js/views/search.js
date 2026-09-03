/* PLINTH — global search results, scoped to what the role can see. */
import * as store from "../store.js";
import { h, fmt, statusChip, stateBlock, pageHead } from "../ui.js";

export function render(container, params) {
  const q = (params.get("q") || "").trim();

  if (!q) {
    container.append(
      pageHead({ title: "Search" }),
      h("div.card", {}, stateBlock({
        title: "Search the whole register",
        body: "Type in the bar above (or press /) to find assets, jobs, invoices, requests and people in one pass. Results respect your role — a Site Engineer only sees their own jobs' records.",
        action: null,
      }, { glyph: "search" })));
    return;
  }

  const r = store.searchAll(q);
  const total = r.assets.length + r.jobs.length + r.employees.length + r.maintenance.length + r.payments.length;

  container.append(pageHead({
    title: `Results for “${q}”`,
    sub: `${total} match${total === 1 ? "" : "es"} across the register, scoped to your role`,
  }));

  if (total === 0) {
    container.append(h("div.card", {}, stateBlock(store.COPY.noResults(q), {
      glyph: "search",
      onAction: () => { location.hash = "/search"; },
    })));
    return;
  }

  const group = (title, items, mk) => items.length > 0 && h("div.card", {},
    h("div.card-head", {}, h("h2", {}, `${title} · ${items.length}`)),
    h("ul.rowlist", {}, items.map(mk)));

  container.append(h("div.stack", {},
    group("Assets", r.assets, (a) => row(`#/assets/${a.id}`,
      `${a.id} · ${a.model}`, `${a.category} · serial ${a.serial}`, statusChip("asset", a.status))),
    group("Jobs", r.jobs, (j) => row(`#/jobs/${j.id}`,
      `${j.id} · ${j.name}`, `${j.client} · ${j.location}`, statusChip("job", j.status))),
    group("Employees", r.employees, (e) => row(`#/employees/${e.id}`,
      e.name, `${e.role} · ${e.id}`, statusChip("emp", e.status))),
    group("Maintenance", r.maintenance, (m) => row(`#/maintenance/${m.id}`,
      `${m.id} · ${m.fault}`, `${m.assetId} · reported ${fmt.date(m.reported)}`, statusChip("mr", m.status))),
    group("Payments", r.payments, (p) => row(`#/payments/${p.id}`,
      `${p.id} · ${p.payee}`, `${p.jobId} · ${p.desc}`,
      h("span.rowlist-stack", {}, statusChip("pay", p.status), h("span.mono", {}, fmt.inr(p.amount)))))));
}

function row(href, primary, sub, right) {
  return h("li", {}, h("a.rowlist-item", { href },
    h("span.rowlist-main", {}, h("b", {}, primary), h("span.cell-sub", {}, sub)),
    h("span.rowlist-right", {}, right)));
}
