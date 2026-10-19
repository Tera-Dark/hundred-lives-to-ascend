import { FEATURES, FEATURE_BY_ID } from "../content/features.mjs";

/** 只维护发现与阅读状态；不发奖励、不改变经济产出、不覆盖剧情。 */
export function initializeGuide(g, { existing = false } = {}) {
  if (!g.meta.guide || g.meta.guide.version !== 1) {
    g.meta.guide = { version: 1, unlocked: [], seen: [], muted: false };
    syncUnlocks(g);
    // 旧存档保留已开放的能力，不补弹以前每一次介绍。
    if (existing && (g.worldYear > g.life.birthYear || g.life.id > 1)) {
      const previouslyVisible = [
        "time",
        "plans",
        "career",
        "study",
        "food",
        "home",
        "regions",
        "explore",
        "relics",
        "foundation",
        "alchemy",
        "companions",
        "legacy",
        "reincarnation",
      ];
      g.meta.guide.unlocked = [
        ...new Set([...g.meta.guide.unlocked, ...previouslyVisible]),
      ];
      g.meta.guide.seen = [...g.meta.guide.unlocked];
    }
  } else {
    const valid = (ids) => [
      ...new Set(
        (Array.isArray(ids) ? ids : []).filter((id) => FEATURE_BY_ID[id]),
      ),
    ];
    g.meta.guide.unlocked = valid(g.meta.guide.unlocked);
    g.meta.guide.seen = valid(g.meta.guide.seen);
    g.meta.guide.muted = Boolean(g.meta.guide.muted);
    syncUnlocks(g);
  }
  return g.meta.guide;
}

export function syncUnlocks(g) {
  const guide = g.meta.guide;
  if (!guide) return [];
  const added = [];
  for (const item of FEATURES) {
    if (!guide.unlocked.includes(item.id) && item.when(g)) {
      guide.unlocked.push(item.id);
      added.push(item.id);
    }
  }
  return added;
}

export const isUnlocked = (g, id) =>
  Boolean(g.meta.guide?.unlocked.includes(id));
export function nextIntroduction(g) {
  if (g.pending || g.meta.guide?.muted) return null;
  return (
    FEATURES.find(
      (item) => isUnlocked(g, item.id) && !g.meta.guide.seen.includes(item.id),
    ) || null
  );
}
export function acknowledge(g, id) {
  if (!isUnlocked(g, id)) return false;
  if (!g.meta.guide.seen.includes(id)) g.meta.guide.seen.push(id);
  return true;
}
export function nextLocked(g) {
  return FEATURES.find((item) => !isUnlocked(g, item.id)) || null;
}
export function replayIntroductions(g) {
  g.meta.guide.seen = [];
  g.meta.guide.muted = false;
}
