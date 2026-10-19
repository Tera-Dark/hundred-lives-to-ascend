export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const formats = new Map([
  [1, new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 })],
]);
export const num = (v) => formats.get(1).format(Number(v));
export const button = (label, cmd, arg = "", opts = {}) =>
  `<button class="${opts.cls || "small-btn"}" data-cmd="${cmd}" data-arg="${esc(arg)}" ${opts.disabled ? "disabled" : ""}>${label}</button>`;
export const fmt = (v, u = "") => `${num(v)}${u}`;
export const pct = (v) => `${Math.round((Number(v) || 0) * 100)}%`;
export const ICON = {
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 1 3h5l1-3 3-1 2-3-2-2 1-3-3-2-1-3Z"/>',
  sound:
    '<path d="m3 9 4 0 5-5v16l-5-5H3Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
  time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M9 9h6m-6 4h6m-3-8v14"/>',
  bolt: '<path d="m13 2-8 11h7l-1 9 8-11h-7z"/>',
  leaf: '<path d="M20 4C11 4 4 8 4 16a4 4 0 0 0 4 4c8 0 12-7 12-16Z"/><path d="M6 18c3-5 6-7 11-10"/>',
  cycle:
    '<path d="M20 7a8 8 0 0 0-14-2L4 7m0-4v4h4M4 17a8 8 0 0 0 14 2l2-2m0 4v-4h-4"/>',
  book: '<path d="M12 7c-3-2-6-2-9-1v13c3-1 6-1 9 1m0-13c3-2 6-2 9-1v13c-3-1-6-1-9 1M12 7v13"/>',
  mountain: '<path d="m3 19 7-12 4 6 2-3 5 9H3Z"/>',
  house: '<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/>',
  people:
    '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 6a3 3 0 0 1 0 6m1 2a5 5 0 0 1 3 5v1"/>',
  sword: '<path d="m3 21 6-6m1-5 9-7 2 2-7 9-4-4Zm-3 1 6 6M6 18l-3 3"/>',
  chart: '<path d="M4 19V12m5 7V5m5 14v-8m5 8V3"/>',
  shield:
    '<path d="m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6z"/><path d="m8 12 3 3 5-6"/>',
  scroll:
    '<path d="M7 3h12v14a4 4 0 0 1-4 4H6a3 3 0 0 1-3-3V7a4 4 0 0 1 4-4Zm0 0v14a3 3 0 0 1-3 3m6-11h6m-6 4h5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 7-5 2 3-7z"/>',
  bowl: '<path d="M4 13a8 8 0 0 0 16 0H4zm2 5h12M6 4v5m6-6v6m6-5v5"/>',
  target:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  bag: '<path d="M4 10h16v11H4zm4 0V7a4 4 0 0 1 8 0v3"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  spark:
    '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  flag: '<path d="M5 3v18m0-16h14l-4 5 4 5H5"/>',
};
export const icon = (name, cls = "") =>
  `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ICON.spark}</svg>`;
export const btn = (label, cmd, arg = "", disabled = false, cls = "") =>
  button(label, cmd, arg, { disabled, cls: cls || "small-btn" });
export const number = (v, d = 1) => {
  if (!Number.isFinite(Number(v))) return "—";
  if (!formats.has(d))
    formats.set(
      d,
      new Intl.NumberFormat("zh-CN", { maximumFractionDigits: d }),
    );
  return formats.get(d).format(Number(v));
};
export function section(content, cls = "") {
  return `<section class="panel ${cls}">${content}</section>`;
}
export function title(name, detail = "", ic = "") {
  return `<div class="panel-head"><h2>${ic ? icon(ic) : ""}${name}</h2>${detail ? `<span class="panel-meta">${detail}</span>` : ""}</div>`;
}
export function progress(value, limit, show = true) {
  let v = Math.max(0, Number(value) || 0),
    m = Math.max(1, Number(limit) || 1);
  return `<div class="progress-track" role="progressbar" aria-valuenow="${Math.min(m, v)}" aria-valuemin="0" aria-valuemax="${m}"><i style="width:${Math.min(100, (100 * v) / m).toFixed(1)}%"></i></div>${show ? `<span class="progress-label">${number(v)} / ${number(limit)}</span>` : ""}`;
}
