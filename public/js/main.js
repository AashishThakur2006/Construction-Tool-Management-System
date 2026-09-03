/* PLINTH — app shell and hash router. */
import * as store from "./store.js";
import { h, icon, fmt, toast, modalIsOpen } from "./ui.js";
import * as login from "./views/login.js";
import * as dashboard from "./views/dashboard.js";
import * as jobs from "./views/jobs.js";
import * as assets from "./views/assets.js";
import * as allocate from "./views/allocate.js";
import * as people from "./views/people.js";
import * as maintenance from "./views/maintenance.js";
import * as payments from "./views/payments.js";
import * as search from "./views/search.js";
import * as settings from "./views/settings.js";
import * as misc from "./views/misc.js";

store.applyPrefs();

const root = document.getElementById("app");
let sidebarEl, navEl, viewEl, searchInput, offlineBar, sidebarScrim;

export function navigate(to) { location.hash = to; }

/* ---------------- route parsing ---------------- */
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, qs] = raw.split("?");
  const segs = path.split("/").filter(Boolean);
  const params = new URLSearchParams(qs || "");
  return { segs, params };
}

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard", sub: () => null },
  { key: "jobs", label: "Jobs", icon: "jobs", sub: (c) => `${c.jobs.active} active · ${c.jobs.total} total` },
  { key: "assets", label: "Assets", icon: "assets", sub: (c) => `${c.assets.total} registered · ${c.assets.inYard} in yard` },
  { key: "allocate", label: "Allocate", icon: "allocate", sub: (c) => c.assets.inYard ? `${c.assets.inYard} ready to allocate` : null },
  { key: "employees", label: "Employees", icon: "employees", sub: (c) => `${c.employees.total} on payroll` },
  {
    key: "maintenance", label: "Maintenance", icon: "maintenance",
    sub: (c) => c.maintenance.open
      ? [`${c.maintenance.open} open`, c.maintenance.overdue ? h("span.alert", {}, ` · ${c.maintenance.overdue} overdue`) : null]
      : "queue clear",
  },
  {
    key: "payments", label: "Payments", icon: "payments",
    sub: (c) => c.payments.overdue
      ? [h("span.alert", {}, `${c.payments.overdue} overdue · ${fmt.inrC(c.payments.overdueSum)}`)]
      : (c.payments.pending ? `${c.payments.pending} pending` : "settled"),
  },
];

/* ---------------- shell ---------------- */
function buildShell() {
  const me = store.persona();
  searchInput = h("input", {
    type: "search", placeholder: "Search assets, jobs, invoices, people",
    "aria-label": "Search everything",
    onkeydown: (e) => {
      if (e.key === "Enter") {
        const q = searchInput.value.trim();
        if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
      }
      if (e.key === "Escape") searchInput.blur();
    },
  });

  navEl = h("nav.nav", { "aria-label": "Primary" });

  offlineBar = h("div.offline-bar", { hidden: true, role: "status" },
    icon("offline"),
    h("span", {}, h("b", {}, store.COPY.offline.title + ". "), store.COPY.offline.body));

  sidebarScrim = h("div.sidebar-scrim", { hidden: true, onclick: () => toggleSidebar(false) });

  sidebarEl = h("aside.sidebar", { id: "sidebar" },
    h("div.brand", {}, "Plinth", h("span.mono", {}, "PLANT REGISTER")),
    navEl,
    h("div.nav-foot", {},
      h("a.nav-item", { href: "#/settings", dataset: { navkey: "settings" } },
        icon("settings"), h("span.nav-label", {}, h("b", {}, "Settings"))),
      h("div.user-row", {},
        h("span.avatar", { dataset: { userAvatar: "" } }, initials(me.name)),
        h("span.user-meta", { dataset: { userMeta: "" } }, h("b", {}, me.name), h("span.muted", {}, me.role)),
        h("button.btn.btn-ghost", {
          type: "button", "aria-label": "Sign out",
          onclick: async () => { await store.logout(); sidebarEl = navEl = viewEl = null; render(); },
        }, icon("logout")))));

  viewEl = h("main.view", { id: "view", tabindex: "-1" });

  const shell = h("div.app", {},
    sidebarEl, sidebarScrim,
    h("div.main-col", {},
      h("header.topbar", {},
        h("button.btn.btn-ghost.menu-toggle", { type: "button", "aria-label": "Open navigation", onclick: () => toggleSidebar() }, icon("menu")),
        h("div.searchbox", {}, icon("search"), searchInput, h("kbd", {}, "/")),
        h("div.topbar-spacer"),
        h("span.role-label.muted", {}, me.role)),
      offlineBar,
      viewEl));
  root.replaceChildren(shell);
  refreshNav();
  syncOffline(); // reflect current connectivity now that the bar exists
}

function initials(name) { return name.split(" ").map((w) => w[0]).slice(0, 2).join(""); }

function toggleSidebar(force) {
  const open = force != null ? force : !sidebarEl.classList.contains("open");
  sidebarEl.classList.toggle("open", open);
  sidebarScrim.hidden = !open;
}

function refreshNav() {
  if (!navEl) return;
  const counts = store.navCounts();
  const current = parseHash().segs[0] || "dashboard";
  navEl.replaceChildren(...NAV.map((item) => {
    const sub = item.sub(counts);
    return h("a.nav-item", {
      href: "#/" + item.key,
      class: current === item.key ? "active" : "",
      "aria-current": current === item.key ? "page" : null,
      onclick: () => toggleSidebar(false),
    },
      icon(item.icon),
      h("span.nav-label", {},
        h("b", {}, item.label),
        sub && h("span.nav-sub", {}, sub)));
  }));
  const settingsLink = sidebarEl.querySelector('[data-navkey="settings"]');
  if (settingsLink) settingsLink.classList.toggle("active", current === "settings");
  const me = store.persona();
  const av = sidebarEl.querySelector("[data-user-avatar]");
  const meta = sidebarEl.querySelector("[data-user-meta]");
  if (me && av && meta) {
    av.textContent = initials(me.name);
    meta.replaceChildren(h("b", {}, me.name), h("span.muted", {}, me.role));
  }
}

/* ---------------- routing ---------------- */
const views = {
  dashboard: { title: "Dashboard", render: (c) => dashboard.render(c) },
  jobs: { title: "Jobs", render: (c, seg, params) => seg[1] ? jobs.detail(c, seg[1]) : jobs.list(c) },
  assets: { title: "Assets", render: (c, seg) => seg[1] ? assets.detail(c, seg[1]) : assets.list(c) },
  allocate: { title: "Allocate", render: (c, seg, params) => allocate.render(c, params) },
  employees: { title: "Employees", render: (c, seg) => seg[1] ? people.detail(c, seg[1]) : people.list(c) },
  maintenance: { title: "Maintenance", render: (c, seg) => seg[1] ? maintenance.detail(c, seg[1]) : maintenance.list(c) },
  payments: { title: "Payments", render: (c, seg) => seg[1] ? payments.detail(c, seg[1]) : payments.list(c) },
  search: { title: "Search", render: (c, seg, params) => search.render(c, params) },
  settings: { title: "Settings", render: (c) => settings.render(c) },
  preview: { title: "Interface states", render: (c, seg) => misc.preview(c, seg[1]) },
  denied: { title: "Restricted", render: (c) => misc.denied(c) },
};

let lastRoute = "";
function render() {
  if (!store.sessionRole()) {
    document.title = "Plinth — sign in";
    login.render(root, () => { buildShell(); navigate("/dashboard"); render(); });
    sidebarEl = navEl = viewEl = null;
    return;
  }
  if (!viewEl) buildShell();

  const { segs, params } = parseHash();
  const key = segs[0] || "dashboard";
  const def = views[key] || views.dashboard;
  document.title = `Plinth — ${def.title}`;
  refreshNav();

  if (key === "search" && searchInput) searchInput.value = params.get("q") || "";

  const routeId = location.hash;
  viewEl.replaceChildren();
  viewEl.scrollTop = 0;
  def.render(viewEl, segs, params);
  if (routeId !== lastRoute) { viewEl.focus({ preventScroll: true }); lastRoute = routeId; }
}

/* ---------------- global wiring ---------------- */
function syncOffline() { if (offlineBar) offlineBar.hidden = store.online; }

window.addEventListener("hashchange", render);
store.onChange(() => {
  syncOffline();
  if (store.sessionRole() && viewEl) render();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !modalIsOpen() && !e.target.closest("input, textarea, select") && searchInput) {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
  if (e.key === "Escape" && sidebarEl?.classList.contains("open")) toggleSidebar(false);
});

/* The offline bar is driven purely by whether our own API requests complete
   (store.online), never by navigator.onLine — which misreports on some
   machines. When the browser signals it is back online, re-hydrate. */
window.addEventListener("online", () => { store.boot().then(render).catch(() => {}); });

/* ---------------- boot ---------------- */
(async function boot() {
  try {
    await store.boot();
  } catch (e) {
    root.replaceChildren(h("div.state.big", {},
      h("h2", {}, "The register did not respond"),
      h("p", {}, "Could not reach the server. Check your connection and reload."),
      h("button.btn.btn-primary", { type: "button", onclick: () => location.reload() }, "Reload")));
    return;
  }
  render();
})();
