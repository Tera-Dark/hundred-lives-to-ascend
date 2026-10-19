import { LIFE_UNLOCK_YEARS, WORLD_UNLOCK_YEARS } from "../content/features.mjs";
import { isUnlocked } from "./onboarding.mjs";
import { rates, lifeYear, STUDIES } from "../game.mjs";
const numberFormat = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 1,
});
const number = (n) => numberFormat.format(n);
export function nextDelta(g) {
  const l = g.life,
    r = rates(g),
    w = g.worldYear,
    y = lifeYear(g),
    target = [];
  if (g.meta.guide && !g.meta.guide.muted) {
    for (const [id, n] of Object.entries(LIFE_UNLOCK_YEARS))
      if (!isUnlocked(g, id) && n > y) target.push(n - y);
    for (const [id, n] of Object.entries(WORLD_UNLOCK_YEARS))
      if (!isUnlocked(g, id) && n > w) target.push(n - w);
  }
  if (l.action?.remaining > 0) target.push(l.action.remaining);
  for (const n of l.id > 1 ? [12, 18, 22, 24, 34, 39] : [18, 22, 24, 34, 39])
    if (n > y) target.push(n - y);
  if (g.world.tide === "waiting") {
    for (const n of [45, 60]) if (n > w) target.push(n - w);
  } else if (!g.world.veinDone) {
    for (const n of [92, 95]) if (n > w) target.push(n - w);
  }
  if (w < 160) target.push(160 - w);
  target.push(l.lifeCap - l.age);
  if (l.realm === "炼气" && r.qi > 0 && l.qi < 1650 - l.foundationReduction)
    target.push(Math.ceil((1650 - l.foundationReduction - l.qi) / r.qi));
  if (l.realm === "凡人" && r.qi > 0 && l.qi < 180)
    target.push(Math.ceil((180 - l.qi) / r.qi));
  const rankReq = 10 + l.level[l.career] * 6;
  if (r.xp > 0) target.push(Math.ceil((rankReq - l.xp[l.career]) / r.xp));
  const study = STUDIES[l.study];
  if (study && !l.studied.includes(l.study) && r.research > 0)
    target.push(
      Math.ceil((study.cost - l.studyProgress[l.study]) / r.research),
    );
  const positive = target.filter((n) => Number.isFinite(n) && n > 0);
  return Math.max(
    1,
    Math.min(positive.length ? Math.min(...positive) : 5, 400),
  );
}
export function currentGoal(g) {
  const l = g.life;
  if (g.status === "ended") return "本世已终 · 可进入下一世";
  if (g.status === "boundary") return "世界160年 · 原型安全终点";
  if (l.action) return `行动中 · 还需${l.action.remaining}年`;
  if (l.realm === "凡人") return `引气入体 · ${number(l.qi)}/180修为`;
  if (g.world.tide === "waiting" && g.worldYear < 60)
    return `首劫剩${60 - g.worldYear}年 · ${l.realm === "筑基" || l.pill ? "已经具备生路" : "优先突破或炼丹"}`;
  if (g.world.veinDone) return "余潮已定 · 继续修炼或轮回";
  return "寻找前世线索 · 筹备余潮";
}

/** 目标卡只导航到相关功能，不暗中发起付费行动。 */
export function goalFeature(g) {
  if (g.status !== "playing") return "reincarnation";
  if (g.life.realm === "凡人") return isUnlocked(g, "plans") ? "plans" : "time";
  if (g.world.tide === "waiting" && !g.life.pill && g.life.realm !== "筑基")
    return "alchemy";
  return isUnlocked(g, "reincarnation") ? "reincarnation" : "foundation";
}
