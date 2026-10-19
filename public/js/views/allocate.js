/* PLINTH — allocation flow: the product's core transaction.
   Three steps: choose the job, pick from the yard, confirm. Fully keyboard-driven. */
import * as store from "../store.js";
import { repaint, h, fmt, icon, condBadge, statusChip, pageHead, toast } from "../ui.js";

const flow = { step: 1, jobId: null, assetIds: new Set(), catFilter: "", seededFrom: "" };

export function render(container, params) {
  /* accept presets from other screens, once per distinct link */
  const seedKey = params.toString();
  if (seedKey && seedKey !== flow.seededFrom) {
    flow.seededFrom = seedKey;
    const pj = params.get("job");
    const pa = params.get("assets");
    if (pj && store.canSeeJob(pj)) { flow.jobId = pj; flow.step = 2; }
    if (pa) {
      flow.assetIds = new Set(pa.split(",").filter((id) => {
        const a = store.asset(id);
        return a && a.status === "In yard";
      }));
      if (flow.assetIds.size) flow.step = flow.jobId ? 3 : 1;
    }
  }
  paint(container);
}

function paint(container) {
  container.replaceChildren();
  const rerender = () => repaint(container, paint);
  if (flow.step > 1 && !store.job(flow.jobId)) Object.assign(flow, { step: 1, jobId: null });

  container.append(pageHead({
    title: "Allocate assets",
    sub: "Commit assets from the yard to a job — the register updates the moment you confirm",
  }));

  container.append(stepsBar());

  if (flow.step === 1) stepJob(container, rerender);
  else if (flow.step === 2) stepAssets(container, rerender);
  else stepConfirm(container, rerender);
}

function stepsBar() {
  const defs = [
    [1, "Choose the job"],
    [2, "Pick from the yard"],
    [3, "Confirm allocation"],
  ];
  return h("div.steps", {}, defs.map(([n, label]) =>
    h("span.step", { class: flow.step === n ? "now" : flow.step > n ? "done" : "" },
      h("span.dot", {}, flow.step > n ? "✓" : String(n)),
      label)));
}

function navRow(back, next) {
  return h("div.flow-nav", {}, back, h("span", { style: "flex:1" }), next);
}

/* -------- step 1: choose job -------- */
function stepJob(container, rerender) {
  const jobs = store.myJobs().filter((j) => ["Active", "Mobilising"].includes(j.status));
  if (!jobs.length) {
    container.append(h("div.card.card-pad", {},
      h("p", {}, "No open jobs can receive assets right now. Jobs that are completed or on hold cannot take allocations.")));
    return;
  }
  const listEl = h("div.pick-grid", { role: "radiogroup", "aria-label": "Choose a job" },
    jobs.map((j) => h("button.pick-card", {
      type: "button", role: "radio", "aria-checked": String(flow.jobId === j.id),
      class: flow.jobId === j.id ? "chosen" : "",
      onclick: () => { flow.jobId = j.id; rerender(); },
    },
      h("span.pick-top", {}, h("b.mono", {}, j.id), statusChip("job", j.status)),
      h("b", {}, j.name),
      h("span.cell-sub", {}, `${j.client} · ${j.location}`),
      h("span.cell-sub.mono", {}, `${store.jobAssets(j.id).length} assets on it now · window closes ${fmt.date(j.ends)}`))));

  container.append(listEl, navRow(
    h("a.btn.btn-ghost", { href: "#/dashboard" }, "Cancel"),
    h("button.btn.btn-primary", {
      type: "button", disabled: !flow.jobId,
      onclick: () => { flow.step = 2; rerender(); },
    }, "Continue", icon("chevR"))));
}

/* -------- step 2: pick assets -------- */
function stepAssets(container, rerender) {
  const j = store.job(flow.jobId);
  const yard = store.db.assets.filter((a) => a.status === "In yard");
  const cats = [...new Set(yard.map((a) => a.category))];
  const rows = flow.catFilter ? yard.filter((a) => a.category === flow.catFilter) : yard;

  container.append(h("p.flow-context", {},
    "Allocating to ", h("b", {}, `${j.id} — ${j.name}`), ". ",
    h("button.link-btn.as-btn", { type: "button", onclick: () => { flow.step = 1; rerender(); } }, "Change job")));

  if (!yard.length) {
    container.append(h("div.card.card-pad", {},
      h("p", {}, "The yard is empty — every asset is already on a job or in the workshop. Return something first, or wait for a job to close.")));
    container.append(navRow(h("button.btn.btn-ghost", { type: "button", onclick: () => { flow.step = 1; rerender(); } }, icon("back"), "Back"), null));
    return;
  }

  container.append(
    h("div.filters", {},
      h("select", { "aria-label": "Filter yard by category", onchange: (e) => { flow.catFilter = e.target.value; rerender(); } },
        h("option", { value: "" }, "Every category"),
        cats.map((c) => h("option", { value: c, selected: flow.catFilter === c }, c))),
      h("span.count", {}, `${rows.length} in the yard · ${flow.assetIds.size} picked`)),
    h("div.pick-list", { role: "group", "aria-label": "Assets available in the yard" },
      rows.map((a) => {
        const checked = flow.assetIds.has(a.id);
        return h("label.pick-row", { class: checked ? "chosen" : "" },
          h("input", {
            type: "checkbox", checked,
            "aria-label": `Pick ${a.id} ${a.model}`,
            onchange: () => { if (checked) flow.assetIds.delete(a.id); else flow.assetIds.add(a.id); rerender(); },
          }),
          h("span.pick-main", {},
            h("b", {}, `${a.id} · ${a.model}`),
            h("span.cell-sub", {}, `${a.category} · ${fmt.int(a.hours)} h · serial ${a.serial}`)),
          condBadge(a.condition));
      })),
    navRow(
      h("button.btn.btn-ghost", { type: "button", onclick: () => { flow.step = 1; rerender(); } }, icon("back"), "Back"),
      h("div.flow-next", {},
        flow.assetIds.size === 0 && h("span.btn-note", {}, "Pick at least one asset to continue"),
        h("button.btn.btn-primary", {
          type: "button", disabled: flow.assetIds.size === 0,
          onclick: () => { flow.step = 3; rerender(); },
        }, `Review ${flow.assetIds.size || ""}`.trim(), icon("chevR")))));
}

/* -------- step 3: confirm -------- */
function stepConfirm(container, rerender) {
  const j = store.job(flow.jobId);
  const picked = [...flow.assetIds].map((id) => store.asset(id)).filter(Boolean);
  const value = picked.reduce((s, a) => s + a.value, 0);

  container.append(
    h("div.card", {},
      h("div.card-head", {}, h("h2", {}, "Review before you commit")),
      h("div.card-pad", {},
        h("p", {}, h("b", {}, String(picked.length)), ` asset${picked.length > 1 ? "s" : ""} (${fmt.inrC(value)} of plant) will move to `,
          h("b", {}, `${j.id} — ${j.name}`), ` dated ${fmt.date(store.TODAY)}. Each shows on the job page and in its own history immediately.`),
        h("ul.confirm-list", {}, picked.map((a) =>
          h("li", {}, h("span.mono", {}, a.id), ` ${a.model}`, h("span.muted", {}, ` · condition ${a.condition}`)))))),
    navRow(
      h("button.btn.btn-ghost", { type: "button", onclick: () => { flow.step = 2; rerender(); } }, icon("back"), "Back"),
      h("button.btn.btn-primary", {
        type: "button",
        onclick: () => {
          const ids = [...flow.assetIds];
          const undo = store.allocate(ids, flow.jobId);
          const jobId = flow.jobId;
          Object.assign(flow, { step: 1, jobId: null, assetIds: new Set(), catFilter: "", seededFrom: "done" });
          toast(`${ids.length} asset${ids.length > 1 ? "s" : ""} allocated to ${jobId}.`, { undo });
          location.hash = `/jobs/${jobId}`;
        },
      }, "Confirm allocation")));
}
