/* PLINTH — ui primitives: h(), icons, chips, toasts, modals, tables, fields, states. */

/* ---------------- dom ---------------- */
export function h(tag, attrs, ...kids) {
  const [name, ...classes] = tag.split(".");
  const node = document.createElement(name || "div");
  if (classes.length) node.className = classes.join(" ");
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") node.className += (node.className ? " " : "") + v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "value") node.value = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k.startsWith("on")) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v === true ? "" : v);
  }
  const add = (kid) => {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) kid.forEach(add);
    else node.append(kid.nodeType ? kid : document.createTextNode(kid));
  };
  kids.forEach(add);
  return node;
}

/* ---------------- formatters ---------------- */
export const fmt = {
  inr: (n) => "₹" + Math.round(n).toLocaleString("en-IN"),
  inrC(n) {
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(n >= 1e8 ? 1 : 2) + " Cr";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + " L";
    return fmt.inr(n);
  },
  date(iso) {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  },
  rel(iso, today) {
    const days = Math.round((new Date(iso) - new Date(today)) / 864e5);
    if (days === 0) return "today";
    if (days > 0) return `in ${days} d`;
    return `${-days} d ago`;
  },
  int: (n) => n.toLocaleString("en-IN"),
};

/* ---------------- icons (one stroke family, 24 viewBox) ---------------- */
const paths = {
  dashboard: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.2"/>',
  jobs: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 3.5L17 11H5"/>',
  assets: '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3z"/><path d="M4 7.5 12 12l8-4.5"/><path d="M12 12v9"/>',
  allocate: '<path d="M4 7h13"/><path d="m14 3.5 3.5 3.5L14 10.5"/><path d="M20 17H7"/><path d="m10 13.5-3.5 3.5L10 20.5"/>',
  employees: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c.6-3.6 2.8-5.5 5.5-5.5s4.9 1.9 5.5 5.5"/><path d="M15.5 5.4a3.2 3.2 0 0 1 0 5.9"/><path d="M17.2 14.9c1.8.7 3 2.4 3.4 5.1"/>',
  maintenance: '<path d="M14.5 6.5a4.5 4.5 0 0 0-6 5.6L3 17.6V21h3.4l5.5-5.5a4.5 4.5 0 0 0 5.6-6L14 13l-3-3 3.5-3.5z"/>',
  payments: '<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M3.5 10h17"/><path d="M7 15h4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  settings: '<path d="M4 8h10"/><circle cx="17" cy="8" r="2.5"/><path d="M20 16H10"/><circle cx="7" cy="16" r="2.5"/>',
  sortAsc: '<path d="m6 14 6-6 6 6"/>',
  sortDesc: '<path d="m6 10 6 6 6-6"/>',
  sortBoth: '<path d="m8 9 4-4 4 4"/><path d="m8 15 4 4 4-4"/>',
  chevR: '<path d="m9 5 7 7-7 7"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m4.5 12.5 5 5L19.5 7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  warn: '<path d="M12 3.5 22 20H2L12 3.5z"/><path d="M12 10v4.5"/><path d="M12 17.4v.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="1.5"/><path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7"/>',
  logout: '<path d="M14 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H14"/><path d="M10 12h10.5"/><path d="m17 8.5 3.5 3.5L17 15.5"/>',
  history: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  offline: '<path d="M4 4l16 16"/><path d="M8.5 8.8A7.5 7.5 0 0 0 4.7 12"/><path d="M12 5.5c3 0 5.7 1.2 7.3 3.2"/><path d="M12 19.5v.01"/><path d="M8.2 15.7a5 5 0 0 1 5.4-1"/>',
};
export function icon(name, cls) {
  const tpl = document.createElement("template");
  tpl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${cls ? ` class="${cls}"` : ""}>${paths[name] || ""}</svg>`;
  return tpl.content.firstChild;
}

/* ---------------- chips: colour + glyph shape + label ---------------- */
const glyphs = {
  ok: '<circle cx="4" cy="4" r="3.4" fill="currentColor"/>',
  warn: '<path d="M4 .8 7.6 7H.4L4 .8z" fill="currentColor"/>',
  bad: '<rect x="0.8" y="0.8" width="6.4" height="6.4" fill="currentColor"/>',
  info: '<circle cx="4" cy="4" r="2.8" fill="none" stroke="currentColor" stroke-width="1.7"/>',
  mut: '<circle cx="4" cy="4" r="2.2" fill="none" stroke="currentColor" stroke-width="1.3"/>',
};
export function chip(kind, label) {
  const tpl = document.createElement("template");
  tpl.innerHTML = `<span class="chip chip-${kind}"><svg viewBox="0 0 8 8" aria-hidden="true">${glyphs[kind]}</svg>${label}</span>`;
  return tpl.content.firstChild;
}
const statusKinds = {
  asset: { Allocated: "ok", "In yard": "info", "In workshop": "warn", Retired: "mut" },
  job: { Active: "ok", Mobilising: "info", "On hold": "warn", Completed: "mut" },
  mr: { Reported: "info", Approved: "warn", "In workshop": "warn", Resolved: "ok", Rejected: "bad" },
  pay: { Paid: "ok", Pending: "info", Overdue: "bad", Disputed: "warn", Voided: "mut" },
  emp: { Active: "ok", "On leave": "warn" },
};
export function statusChip(domain, status) {
  return chip(statusKinds[domain]?.[status] || "mut", status);
}
export function condBadge(letter) {
  return h("span.cond.cond-" + letter, { title: `Condition ${letter}`, "aria-label": `Condition ${letter}` }, letter);
}

/* ---------------- toasts ---------------- */
let toastRoot;
export function toast(msg, opts = {}) {
  if (!toastRoot) {
    toastRoot = h("div.toasts", { "aria-live": "polite" });
    document.body.append(toastRoot);
  }
  const t = h("div.toast", {},
    h("span", { style: "flex:1" }, msg),
    opts.undo && h("button", {
      type: "button",
      onclick: () => { opts.undo(); dismiss(); toast(opts.undoneMsg || "Undone."); },
    }, "Undo"),
    h("button", { type: "button", "aria-label": "Dismiss notification", onclick: () => dismiss() }, icon("x", "toast-x")));
  const timer = setTimeout(() => dismiss(), opts.undo ? 7000 : 4500);
  function dismiss() { clearTimeout(timer); t.remove(); }
  toastRoot.append(t);
  return dismiss;
}

/* ---------------- modal ---------------- */
let openModalCount = 0;
export function openModal({ title, content, footer, onClose, wide }) {
  const opener = document.activeElement;
  const scrim = h("div.scrim", {
    onclick: (e) => { if (e.target === scrim) close(); },
  });
  const head = h("div.modal-head", {},
    h("h2", { id: "modal-title" }, title),
    h("button.btn.btn-ghost", { type: "button", "aria-label": "Close dialog", onclick: () => close() }, icon("x")));
  const modal = h("div.modal", { role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title", class: wide ? "modal-wide" : "" },
    head, h("div.modal-body", {}, content), footer && h("div.modal-foot", {}, footer));
  scrim.append(modal);

  function onKey(e) {
    if (e.key === "Escape") { e.stopPropagation(); close(); }
    if (e.key === "Tab") {
      const focusables = modal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  }
  function close() {
    document.removeEventListener("keydown", onKey, true);
    scrim.remove();
    openModalCount--;
    onClose?.();
    opener?.focus?.();
  }
  document.addEventListener("keydown", onKey, true);
  document.body.append(scrim);
  openModalCount++;
  (modal.querySelector("input, select, textarea") || modal.querySelector(".modal-foot button") || head.querySelector("button")).focus();
  return { close, modal };
}
export function modalIsOpen() { return openModalCount > 0; }

export function confirmDialog({ title, body, confirmLabel, danger = true }) {
  return new Promise((resolve) => {
    let dlg;
    const done = (v) => { resolve(v); dlg.close(); };
    dlg = openModal({
      title,
      content: h("p.confirm-body", {}, body),
      footer: [
        h("button.btn.btn-secondary", { type: "button", onclick: () => done(false) }, "Cancel"),
        h("button.btn", { type: "button", class: danger ? "btn-danger-solid" : "btn-primary", onclick: () => done(true) }, confirmLabel),
      ],
      onClose: () => resolve(false),
    });
    dlg.modal.querySelector(".modal-foot .btn-secondary").focus();
  });
}

/* ---------------- table ----------------
   cols: { key, label, sortable, mono, right, render(row), sub(row), width }
   Sticky header, sortable columns, roving-tabindex keyboard rows,
   checkbox selection, data-label attrs for the stacked mobile layout. */
export function table({ cols, rows, rowKey, onOpen, sort, onSort, selected, onSelect, ariaLabel }) {
  const selectable = !!onSelect;
  const thead = h("thead", {}, h("tr", {},
    selectable && h("th", { style: "width:36px" },
      h("input", {
        type: "checkbox", "aria-label": "Select all rows",
        checked: rows.length > 0 && rows.every((r) => selected.has(rowKey(r))),
        onchange: (e) => onSelect(e.target.checked ? rows.map(rowKey) : [], true),
      })),
    cols.map((c) => {
      const active = sort && sort.key === c.key;
      const th = h("th", { class: (c.mono ? "mono " : "") + (active ? "sorted" : ""), style: c.width ? `width:${c.width}` : null, "aria-sort": active ? (sort.dir === 1 ? "ascending" : "descending") : null });
      if (c.sortable && onSort) {
        th.append(h("button.th-btn", { type: "button", onclick: () => onSort(c.key) },
          h("span", { style: c.right ? "margin-left:auto" : null }, c.label),
          icon(active ? (sort.dir === 1 ? "sortAsc" : "sortDesc") : "sortBoth")));
      } else {
        th.append(h("span.th-btn", { style: c.right ? "justify-content:flex-end" : null }, c.label));
      }
      return th;
    })));

  const tbody = h("tbody");
  rows.forEach((r) => {
    const key = rowKey(r);
    const tr = h("tr", {
      tabindex: "0",
      dataset: { key },
      class: selected && selected.has(key) ? "selected" : "",
      role: onOpen ? "link" : null,
      onclick: (e) => { if (e.target.closest("input,button,a")) return; onOpen?.(r); },
      onkeydown: (e) => {
        if (e.key === "Enter" && onOpen) { onOpen(r); }
        else if (e.key === " " && selectable) { e.preventDefault(); onSelect([key]); }
        else if (e.key === "ArrowDown") { e.preventDefault(); tr.nextElementSibling?.focus(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); tr.previousElementSibling?.focus(); }
      },
    });
    if (selectable) {
      tr.append(h("td", { dataset: { label: "Select" } },
        h("input", {
          type: "checkbox", "aria-label": `Select ${key}`, checked: selected.has(key),
          onchange: () => onSelect([key]),
        })));
    }
    cols.forEach((c) => {
      const td = h("td", { class: (c.mono ? "mono " : "") + (c.right ? "right" : ""), dataset: { label: c.label } });
      const v = c.render ? c.render(r) : r[c.key];
      if (v != null) td.append(v.nodeType ? v : String(v));
      if (c.sub) { const s = c.sub(r); if (s) td.append(h("span.cell-sub", {}, s)); }
      tr.append(td);
    });
    tbody.append(tr);
  });

  return h("div.table-wrap", { tabindex: "-1" },
    h("table.data", { "aria-label": ariaLabel || "Data table" }, thead, tbody));
}

export function sortRows(rows, sort, cols) {
  if (!sort) return rows;
  const col = cols.find((c) => c.key === sort.key);
  const val = col?.value || ((r) => r[sort.key]);
  return [...rows].sort((a, b) => {
    const va = val(a), vb = val(b);
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "number") return (va - vb) * sort.dir;
    return String(va).localeCompare(String(vb)) * sort.dir;
  });
}

/* ---------------- states & skeletons ---------------- */
export function stateBlock(copy, { big, glyph = "warn", onAction, canvasMount } = {}) {
  return h("div.state", { class: big ? "big" : "" },
    canvasMount || h("div.glyph-wrap", {}, icon(glyph, "glyph")),
    h("h2", {}, copy.title),
    h("p", {}, copy.body),
    copy.action && h("button.btn.btn-primary", { type: "button", onclick: onAction }, copy.action));
}

export function skelRow(widths) {
  return h("div.skel-row", {}, widths.map((w) => h("div.skel", { style: `width:${w};height:14px` })));
}
export function skelTable(rows = 8) {
  return h("div.card.card-pad", { "aria-hidden": "true" },
    h("div.skel", { style: "width:220px;height:18px;margin-bottom:16px" }),
    Array.from({ length: rows }, () => skelRow(["12%", "26%", "16%", "14%", "10%", "12%"])));
}
export function skelKpis(n = 4) {
  return h("div.kpis", { "aria-hidden": "true" }, Array.from({ length: n }, () =>
    h("div.card.kpi", {},
      h("div.skel", { style: "width:90px;height:11px" }),
      h("div.skel", { style: "width:120px;height:26px;margin-top:8px" }),
      h("div.skel", { style: "width:70px;height:10px;margin-top:8px" }))));
}
export function skelDetail() {
  return h("div", { "aria-hidden": "true" },
    h("div.skel", { style: "width:300px;height:24px;margin-bottom:20px" }),
    h("div.two-col", {},
      h("div.card.card-pad", {}, Array.from({ length: 6 }, () => skelRow(["30%", "50%"]))),
      h("div.card.card-pad", {}, Array.from({ length: 4 }, () => skelRow(["40%", "40%"])))));
}

/* ---------------- form fields ----------------
   Inline validation on blur, never on submit alone. */
export function field(cfg) {
  const id = "f-" + cfg.name;
  let touched = false;
  const errEl = h("div.error", { id: id + "-err", hidden: true });
  const help = cfg.help ? h("div.help", {}, cfg.help) : null;

  let input;
  if (cfg.type === "select") {
    input = h("select", { id, "aria-describedby": help ? id + "-help" : null },
      h("option", { value: "" }, cfg.placeholder || "Select…"),
      (cfg.options || []).map((o) => h("option", { value: o.value, selected: cfg.value === o.value }, o.label)));
  } else if (cfg.type === "textarea") {
    input = h("textarea", { id, rows: cfg.rows || 3, placeholder: cfg.placeholder || "" });
  } else {
    input = h("input", { id, type: cfg.type || "text", placeholder: cfg.placeholder || "", inputmode: cfg.inputmode, autocomplete: cfg.autocomplete });
  }
  if (cfg.value != null) input.value = cfg.value;

  const root = h("div.field", {},
    h("label", { for: id }, cfg.label, cfg.required && h("span.req", { "aria-hidden": "true" }, " *")),
    input, help && Object.assign(help, { id: id + "-help" }), errEl);

  function validate() {
    let msg = null;
    const v = input.value.trim();
    if (cfg.required && !v) msg = `${cfg.label} is required`;
    else if (v && cfg.validate) msg = cfg.validate(v) || null;
    root.classList.toggle("invalid", !!msg);
    errEl.hidden = !msg;
    errEl.textContent = "";
    if (msg) { errEl.append(icon("warn"), " " + msg); }
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }
  input.addEventListener("blur", () => { touched = true; validate(); cfg.onState?.(); });
  input.addEventListener("input", () => { if (touched) validate(); cfg.onState?.(); });
  input.addEventListener("change", () => { cfg.onState?.(); });

  return {
    root, input,
    name: cfg.name,
    label: cfg.label,
    get: () => input.value.trim(),
    valid: () => {
      const v = input.value.trim();
      if (cfg.required && !v) return false;
      if (v && cfg.validate && cfg.validate(v)) return false;
      return true;
    },
    check: () => { touched = true; return validate(); },
  };
}

/* ---------------- page head ---------------- */
export function pageHead({ title, sub, crumbs, actions }) {
  return h("div", {},
    crumbs && h("div.crumb", {}, crumbs.flatMap((c, i) => [
      i > 0 && h("span", { "aria-hidden": "true" }, "/"),
      c.href ? h("a", { href: c.href }, c.label) : h("span", {}, c.label),
    ])),
    h("div.page-head", {},
      h("div", {}, h("h1", {}, title), sub && h("div.sub", {}, sub)),
      h("div.spacer"),
      actions));
}

/* Submit button that explains why it is disabled. */
export function submitRow(fields, label, onSubmit, { danger } = {}) {
  const btn = h("button.btn", { type: "submit", class: danger ? "btn-danger-solid" : "btn-primary" }, label);
  const note = h("span.btn-note", { "aria-live": "polite" });
  function refresh() {
    const missing = fields.filter((f) => !f.valid()).map((f) => f.label);
    btn.disabled = missing.length > 0;
    note.textContent = missing.length ? `To continue, complete: ${missing.join(", ")}` : "";
  }
  fields.forEach((f) => { const prev = f.input.oninput; f.input.addEventListener("input", refresh); f.input.addEventListener("change", refresh); f.input.addEventListener("blur", refresh); });
  refresh();
  const row = h("div.submit-row", {}, note, btn);
  row.refresh = refresh;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const bad = fields.filter((f) => !f.check());
    if (bad.length) { bad[0].input.focus(); return; }
    onSubmit();
  });
  return row;
}
