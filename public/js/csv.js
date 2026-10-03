/* PLINTH — CSV export. toCsv() is pure (unit-tested under node); the rest touches the DOM. */
import { h, toast } from "./ui.js";

/** One CSV field. Quotes when needed and neutralises spreadsheet formulas (= + - @ tab CR). */
export function csvCell(v) {
  let s = v == null ? "" : String(v);
  if (typeof v !== "number" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** headers: string[]; rows: any[][]. UTF-8 BOM is added by downloadCsv, not here. */
export function toCsv(headers, rows) {
  return [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}

/** Today as YYYY-MM-DD, for filenames. */
function stamp() { return new Date().toISOString().slice(0, 10); }

export function downloadCsv(name, headers, rows) {
  // BOM so Excel reads rupee signs and accents as UTF-8
  const blob = new Blob(["﻿" + toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`${name} downloaded (${rows.length} row${rows.length === 1 ? "" : "s"}).`);
}

/**
 * "Export CSV" button for a list view. Exports exactly the rows on screen
 * (filters and sort applied) using each column's raw value, not its rendered markup.
 */
export function exportButton(baseName, cols, rows) {
  const usable = cols.filter((c) => c && c.label && c.key !== "select");
  return h("button.btn.btn-ghost.btn-sm", {
    type: "button",
    title: `Download the ${rows.length} rows shown as a spreadsheet`,
    disabled: rows.length === 0,
    onclick: () => downloadCsv(
      `plinth-${baseName}-${stamp()}.csv`,
      usable.map((c) => c.label),
      rows.map((r) => usable.map((c) => (c.value ? c.value(r) : r[c.key]))),
    ),
  }, "Export CSV");
}
