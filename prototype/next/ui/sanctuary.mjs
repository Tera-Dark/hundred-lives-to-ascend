import { isUnlocked } from "../application/onboarding.mjs";
import { FEATURE_BY_ID, TAB_FEATURE } from "../content/features.mjs";
/** 墨青金环呈现层：所有进度来自现有状态，不另建游戏规则。 */
import { rates, careerRole, npcState, actionStatus } from "../game.mjs";

const ART = "./assets/";
import { nextDelta } from "../application/selectors.mjs";
import { quickPlans, opportunityList } from "./shortcuts.mjs";
const names = { town: "浮潮集", valley: "青药谷" };

export function renderMasthead(
  g,
  { icon, number },
  { compact = false, settings = false } = {},
) {
  const l = g.life;
  const r = rates(g);
  return `<header class="masthead ${compact ? "masthead-compact" : ""} ${settings ? "masthead-settings" : ""}">
    <div class="identity">
      <div><span class="eyebrow">照世碑 · 浮岚界</span><div class="brand-heading"><h1>百世劫录</h1><button class="guide-entry" data-cmd="guide-open" data-arg="all" aria-label="修行指引手册">?</button><button class="music-shortcut" data-cmd="preference" data-arg="music" aria-label="切换背景音乐">${icon("sound")}</button></div><div class="identity-realm">${l.realm}<span>${l.path === "dan" ? "丹修" : l.path === "xuan" ? "玄修" : "待入仙途"}</span></div></div>
    </div>
    <div class="incarnation"><strong>第 <b>${l.id}</b> 世</strong><span>世界历 ${g.worldYear} 年</span></div>
    <div class="life-strip"><span>${icon("time")} 寿元 <b>${l.age} / ${l.lifeCap}</b></span><div class="life-track"><i style="width:${Math.min(100, (l.age / l.lifeCap) * 100)}%"></i></div><span>余寿 ${Math.max(0, l.lifeCap - l.age)} 年</span></div>
    <div class="resources">${[
      [
        "coin",
        "灵石",
        number(l.money),
        `${r.net >= 0 ? "+" : ""}${number(r.net)}/年`,
      ],
      ["bolt", "修为", number(l.qi), `+${number(r.qi)}/年`],
      ["leaf", "灵材", number(l.herbs), "当世"],
      ["cycle", "轮回点", number(g.meta.rp), "传承"],
    ]
      .map(
        ([ic, label, value, hint]) =>
          `<div class="res"><span>${icon(ic)} ${label}</span><b>${value}</b><small>${hint}</small></div>`,
      )
      .join("")}</div>
  </header>`;
}

export function renderWorld(g, { icon }) {
  return `<section class="world-scene" aria-label="浮岚界仙境">
    <div class="world-caption"><span>山河为卷 · 众生为墨</span><span>${icon("mountain")} ${names[g.life.region]}</span></div>
    <div class="scene-poem">一念入道<span>万世求真</span></div>
    ${
      isUnlocked(g, "regions")
        ? `<button class="place-marker marker-town" data-cmd="tab" data-arg="机缘" aria-label="查看浮潮集与营生"><span>浮潮集</span><i></i></button>
    <button class="place-marker marker-valley" data-cmd="tab" data-arg="机缘" aria-label="查看青药谷与同道"><span>青药谷</span><i></i></button>
    `
        : ""
    }<div class="world-location"><i></i> ${names[g.life.region]} · ${careerRole(g)} <span>Lv.${g.life.level[g.life.career]}</span></div>
  </section>`;
}

function cultivation(g, { icon, number, btn, progress }, preferences = {}) {
  const l = g.life;
  const req =
    l.realm === "凡人"
      ? 180
      : l.realm === "炼气"
        ? 1650 - l.foundationReduction
        : null;
  const ready =
    l.realm === "炼气" && l.qi >= req && l.money >= 45 && l.herbs >= 3;
  const disabled =
    g.status !== "playing" || Boolean(g.pending) || Boolean(l.action);
  let primary;
  if (l.action)
    primary = btn(
      `继续行动 · ${nextDelta(g)}年`,
      "advance",
      "next",
      g.status !== "playing" || Boolean(g.pending),
      "gold-button",
    );
  else if (ready)
    primary = btn(
      "筑基突破",
      "action",
      "foundation",
      disabled || !actionStatus(g, "foundation").ok,
      "gold-button",
    );
  else
    primary = btn(
      `修炼 · ${nextDelta(g)}年`,
      "advance",
      "next",
      disabled,
      "gold-button",
    );
  return `<section class="cultivation-card ornate">
    <div class="cultivation-heading"><span class="eyebrow">CULTIVATION</span><h2>修行</h2><p>感悟天地，淬炼己身</p></div>
    <div class="cultivation-orbit" aria-hidden="true"><i></i><i></i><span>☯</span></div>
    ${preferences.showScenery === false ? "" : `<img class="meditating-art" src="${ART}characters/quiet-meditation.webp" alt="水墨静修者" width="474" height="480" decoding="async"/>`}
    <div class="cultivation-links">
      <button data-cmd="details" data-arg="study" ${!isUnlocked(g, "study") ? `disabled title="${FEATURE_BY_ID.study.unlockHint}"` : ""}>${icon("book")}<span>功法</span></button>
      <button data-cmd="details" data-arg="plan" ${!isUnlocked(g, "plans") ? `disabled title="${FEATURE_BY_ID.plans.unlockHint}"` : ""}>${icon("chart")}<span>日程</span></button>
      <button data-cmd="details" data-arg="life" ${!isUnlocked(g, "food") ? `disabled title="${FEATURE_BY_ID.food.unlockHint}"` : ""}>${icon("house")}<span>居所</span></button>
    </div>
    <div class="realm-seal"><span>${l.realm}</span><small>${l.path === "dan" ? "丹心问道" : "静心养道"}</small></div>
    <div class="cultivation-bottom"><div class="cultivation-progress"><div><span>${req === null ? "道基已成" : l.realm === "凡人" ? "引气入体" : "凝练道基"}</span><b>${req === null ? "筑基 · 当前境界上限" : `${number(l.qi)} / ${number(req)}`}</b></div>${progress(l.qi, req ?? Math.max(1, l.qi), false)}<small>${l.action ? `行动尚余 ${l.action.remaining} 年` : ready ? "45灵石 · 3灵材 · 2年" : req === null ? "继续经营、应劫或追寻前世" : l.realm === "凡人" ? "修为达标自动踏入炼气" : "筑基另需 45灵石 · 3灵材 · 2年"}</small></div>${primary}</div>${ready && !actionStatus(g, "foundation").ok ? `<p class="action-reason">${actionStatus(g, "foundation").reason}</p>` : ""}
    ${l.path === "xuan" && l.realm === "炼气" && !l.flags.includes("xuan-used") ? `<div class="xuan-option">${btn("闭关推演 · 18石 / 2年", "action", "xuan", disabled || !actionStatus(g, "xuan").ok, "text-button")}<span>筑基所需修为 −140</span></div>` : ""}
  </section>`;
}

function storyCards(g, { icon }) {
  const first = g.world.tide === "waiting";
  const done = !first && g.world.veinDone;
  const years = Math.max(0, (first ? 60 : 95) - g.worldYear);
  const gu = npcState(g, "gu");
  const shen = npcState(g, "shen");
  const count = Number(gu.helped) + Number(shen.helped);
  return `<div class="story-cards">
    <button class="story-card journey-card ornate" data-cmd="tab" data-arg="机缘"><h2>机缘</h2><p>游历天地，奇遇造化</p><span class="story-card-bottom">${icon("compass")} 游历寻宝</span></button>
    <button class="story-card calamity-art ornate ${!isUnlocked(g, "alchemy") ? "is-locked" : ""}" data-cmd="${isUnlocked(g, "alchemy") ? "tab" : "guide-open"}" data-arg="${isUnlocked(g, "alchemy") ? "应劫" : "alchemy"}"><h2>应劫</h2><p>天道有数，万劫可渡</p><span class="calamity-count"><small>${done ? "余潮断脉" : first ? "距灵潮逆涌" : "距余潮断脉"}</small><b>${done ? "已定" : `${years}<em>年</em>`}</b></span><span class="story-card-bottom">${isUnlocked(g, "alchemy") ? "渡劫准备" : "炼气后开放"} ${icon(isUnlocked(g, "alchemy") ? "arrow" : "lock")}</span></button>
    <button class="story-card companion-card ornate ${!isUnlocked(g, "companions") ? "is-locked" : ""}" data-cmd="${isUnlocked(g, "companions") ? "tab" : "guide-open"}" data-arg="${isUnlocked(g, "companions") ? "机缘" : "companions"}"><h2>同道</h2><p>红尘相伴，共赴长生</p><span class="companion-silhouette" aria-hidden="true"></span><span class="companion-names">${count ? `${count} 段因缘，留待后世` : "仙途漫漫，有缘相逢"}</span><span class="story-card-bottom">${icon(isUnlocked(g, "companions") ? "people" : "lock")} ${isUnlocked(g, "companions") ? "寻访故人" : "本世18年开放"}</span></button>
  </div>`;
}

export function renderChronicle(g, { icon }) {
  return `<button class="chronicle ornate" data-cmd="tab" data-arg="轮回"><div class="chronicle-title"><h2>轮回</h2><span>百世轮转，终见真我</span></div><div class="realm-road">${["凡人", "炼气", "筑基"].map((name, i) => `<div class="${["凡人", "炼气", "筑基"].indexOf(g.life.realm) >= i ? "reached" : ""}"><span>${icon(i === 0 ? "people" : i === 1 ? "spark" : "mountain")}</span><small>${name}</small></div>`).join("")}<div><span>?</span><small>问长生</small></div></div><span class="chronicle-note">已历 ${g.meta.lives.length} 世 <b>${g.meta.rp} RP</b></span></button>`;
}

export function renderSanctuary(g, ui, details, detailsOpen, preferences = {}) {
  const management = isUnlocked(g, "plans")
    ? `<details class="management" ${detailsOpen ? "open" : ""}><summary>${ui.icon("scroll")} 详细安排 <span>功法 · 生活投资</span>${ui.icon("arrow")}</summary><div class="management-content">${detailsOpen ? (typeof details === "function" ? details() : details) : ""}</div></details>`
    : "";
  return `<div class="home-layout"><div class="home-primary">${cultivation(g, ui, preferences)}${quickPlans(g)}</div><div class="home-secondary">${opportunityList(g)}${management}${preferences.compactLayout === false && isUnlocked(g, "career") ? storyCards(g, ui) : ""}${preferences.compactLayout === false && isUnlocked(g, "reincarnation") ? renderChronicle(g, ui) : ""}</div></div>`;
}

export function renderDock(g, { icon, btn }, tab, next) {
  const disabled = g.status !== "playing" || Boolean(g.pending);
  return `<div class="bottom-fixed">${tab === "设置" ? "" : `<div class="next-buttons"><span class="time-label">${icon("time")} 岁月流转</span>${btn("1年", "advance", "1", disabled, "next-btn")}${btn("5年", "advance", "5", disabled, "next-btn")}${btn(`下一节点 <span>· ${next}年</span>`, "advance", "next", disabled, "next-btn emph")}</div>`}<nav class="bottom-tabs" aria-label="主要页面">${[
    ["修行", "bolt"],
    ["机缘", "compass"],
    ["应劫", "shield"],
    ["轮回", "cycle"],
    ["设置", "settings"],
  ]
    .map(
      ([id, ic]) =>
        `<button data-cmd="tab" data-arg="${id}" class="bottom-tab ${tab === id ? "active" : ""}" ${id !== "设置" && !isUnlocked(g, TAB_FEATURE[id]) ? `disabled title="${FEATURE_BY_ID[TAB_FEATURE[id]].unlockHint}"` : ""} aria-current="${tab === id ? "page" : "false"}"><span>${icon(ic)}</span><b>${id}</b></button>`,
    )
    .join("")}</nav></div>`;
}

export function renderDesktopInscription() {
  return `<aside class="desktop-inscription" aria-hidden="true"><span class="inscription-kicker">浮岚界 · 照世碑</span><div class="calligraphy">百世劫录</div><span class="red-seal">劫尽<br/>成仙</span><p>一念一世<br/>劫尽成仙</p><div class="inscription-rule"></div><small>山河为卷，众生为墨<br/>你我皆在百世劫中<br/>寻那一线永恒</small><span class="roman-title">BAI SHI<br/>JIE LU</span></aside>`;
}
