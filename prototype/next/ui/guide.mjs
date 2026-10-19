import { FEATURES, FEATURE_BY_ID } from "../content/features.mjs";
import {
  isUnlocked,
  nextIntroduction,
  nextLocked,
} from "../application/onboarding.mjs";
import { icon, esc, btn } from "./components.mjs";

export function featureBlock(g, id, html, section = id) {
  const item = FEATURE_BY_ID[id];
  if (!isUnlocked(g, id))
    return `<section class="locked-feature" data-feature="${section}"><span>${icon("lock")} ${item.title}</span><small>${item.unlockHint}</small>${btn("了解", "guide-open", id, false, "guide-text")}</section>`;
  return `<div class="feature-block" data-feature="${section}">${html}<button class="feature-help" data-cmd="guide-open" data-arg="${id}" aria-label="了解${item.title}">?</button></div>`;
}
export function renderGuideCard(g) {
  if (g.pending || g.status !== "playing") return "";
  const current = nextIntroduction(g);
  if (current)
    return `<section class="guide-card ornate" aria-label="新功能介绍" aria-live="polite"><div class="guide-kicker">${icon("scroll")} 照世碑指引 <span>新功能</span></div><h2>${current.title}</h2>${current.intro.map((text) => `<p>${esc(text)}</p>`).join("")}<div class="guide-tip">${esc(current.tip)}</div><div class="guide-actions">${btn("去看看", "guide-go", current.id, false, "mini-action")}${btn("明白了", "guide-ack", current.id, false, "mini-action")}${btn("暂时收起指引", "guide-mute", "", false, "guide-text")}</div></section>`;
  const next = nextLocked(g);
  return `<div class="guide-next"><span>${icon("scroll")} ${next ? `接下来：${next.title} · ${next.unlockHint}` : "已发现当前切片的全部功能"}</span>${btn("指引手册", "guide-open", "all", false, "guide-text")}</div>`;
}
export function renderHandbook(g, selected) {
  if (!selected) return "";
  const guide = g.meta.guide;
  return `<div class="overlay handbook-overlay"><section class="modal handbook" role="dialog" aria-modal="true" aria-labelledby="handbook-title"><div class="handbook-head"><div><p class="eyebrow">照世碑 · 随时查阅</p><h2 id="handbook-title">修行指引</h2></div>${btn("关闭", "guide-close", "", false, "mini-action")}</div><p>已开放 ${guide.unlocked.length} / ${FEATURES.length} 项。进度自动保存在本机，可随时导出备份。介绍不耗年、不发资源，已知功能跨世保留。</p><div class="guide-actions">${btn(guide.muted ? "恢复首次提示" : "收起首次提示", guide.muted ? "guide-resume" : "guide-mute", "", false, "mini-action")}${btn("重看已开放介绍", "guide-replay", "", false, "guide-text")}${btn("导出进度", "save", "", false, "guide-text")}</div><div class="handbook-list">${FEATURES.map((item) => `<details ${selected === item.id ? "open" : ""}><summary><span>${isUnlocked(g, item.id) ? icon("book") : icon("lock")} ${item.title}</span><small>${isUnlocked(g, item.id) ? "已开放" : item.unlockHint}</small></summary><div class="handbook-content">${item.intro.map((text) => `<p>${esc(text)}</p>`).join("")}<p class="guide-tip">${esc(item.tip)}</p>${isUnlocked(g, item.id) ? btn("前往功能", "guide-go", item.id, false, "mini-action") : '<p class="muted">达到上方条件后开放；提前阅读不会提前解锁。</p>'}</div></details>`).join("")}</div></section></div>`;
}
