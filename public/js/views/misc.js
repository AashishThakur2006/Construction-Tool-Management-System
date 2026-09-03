/* PLINTH — designed permission-denied screen and interface-state previews. */
import * as store from "../store.js";
import { h, icon, stateBlock, skelKpis, skelTable, toast, pageHead } from "../ui.js";
import { createField } from "../signature.js";

export function denied(container) {
  container.append(deniedBlock());
}

export function deniedBlock() {
  const c = store.COPY.denied;
  return h("div.state.big.denied", {},
    h("div.denied-glyph", {}, icon("lock", "glyph")),
    h("h2", {}, c.title),
    h("p", {}, c.body),
    h("div.state-actions", {},
      h("a.btn.btn-primary", { href: "#/dashboard" }, c.action),
      h("a.btn.btn-secondary", { href: "#/jobs" }, "See your jobs")));
}

let emptyHandle = null;
export function preview(container, kind) {
  const kinds = {
    error: () => stateBlock(store.COPY.error, {
      glyph: "warn",
      onAction: () => toast("Retried — the register responded and this view is current."),
    }),
    offline: () => stateBlock(store.COPY.offline, {
      glyph: "offline",
      onAction: () => toast("Connection check complete — you are online."),
    }),
    empty: () => {
      const canvas = h("canvas", { "aria-hidden": "true" });
      const block = stateBlock(store.COPY.empty.assets, {
        canvasMount: h("div.empty-canvas", {}, canvas),
        onAction: () => toast("Asset registration lives in the Assets view once stock arrives."),
      });
      queueMicrotask(() => {
        emptyHandle?.dispose();
        emptyHandle = createField(canvas, {
          mode: "empty", seed: 2, forceStatic: store.reducedMotion(),
          data: { jobs: [], idle: 0, workshop: 0 },
        });
      });
      return block;
    },
    loading: () => h("div", {},
      h("p.muted", { style: "margin-bottom:16px" }, store.COPY.loading + " Skeletons mirror the final layout — this preview holds the shape."),
      skelKpis(4), skelTable(6)),
  };

  container.append(
    pageHead({
      title: "Interface states",
      sub: "Previews of every designed state — reachable from Settings so nothing ships unseen",
      crumbs: [{ label: "Settings", href: "#/settings" }, { label: "States" }],
    }),
    h("div.pipeline", {},
      [["error", "Load error"], ["offline", "Offline"], ["empty", "Empty register"], ["loading", "Loading"]].map(([k, label]) =>
        h("a", { href: `#/preview/${k}`, class: "pill" + (kind === k ? " active" : "") }, label))),
    h("div.card", {}, (kinds[kind] || kinds.error)()));
}
