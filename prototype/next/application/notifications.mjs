/** 红点只查询真实开放和行动条件，不发资源、不改变已读状态。 */
import { actionStatus } from "../game.mjs";
import { FEATURES } from "../content/features.mjs";
import { isUnlocked } from "./onboarding.mjs";

const actions = [
  ["foundation", "foundation", "修行", "可筑基突破"],
  ["xuan", "foundation", "修行", "可闭关推演"],
  ["explore", "explore", "机缘", "可荒谷历练"],
  ["jade", "legacy", "机缘", "可寻回旧玉"],
  ["trial-boon", "trial", "应劫", "可使用心定印"],
  ["trial-herb", "trial", "应劫", "可用心定印寻材"],
];
export function availableHints(g) {
  const hints = [];
  const add = (cmd, arg, tab, text) => hints.push({ cmd, arg, tab, text });
  for (const item of FEATURES) {
    if (isUnlocked(g, item.id) && !g.meta.guide.seen.includes(item.id))
      add("guide-open", item.id, item.tab, `新功能：${item.title}`);
  }
  if (g.status === "playing" && !g.pending && !g.life.action) {
    for (const [id, feature, tab, text] of actions)
      if (isUnlocked(g, feature) && actionStatus(g, id).ok)
        add("action", id, tab, text);
    for (const [id, cost, owned, feature] of [
      ["food", 12, "spirit", "food"],
      ["home", 28, "cottage", "home"],
    ])
      if (
        isUnlocked(g, feature) &&
        g.life.money >= cost &&
        g.life[id] !== owned
      )
        add("buy", id, "修行", id === "food" ? "可添置灵食" : "可添置小院");
    if (isUnlocked(g, "alchemy") && !g.life.pill) {
      for (const id of [
        "common",
        ...(g.life.path === "dan" ? ["economy", "long"] : []),
      ])
        if (actionStatus(g, "pill", id).ok)
          add("pill", id, "应劫", "可炼制护脉丹");
    }
    if (isUnlocked(g, "relics") && g.meta.equipped.length < 2)
      for (const id of g.meta.relics.filter(
        (id) => !g.meta.equipped.includes(id),
      ))
        add("equip", id, "机缘", "有空位可装备遗物");
  }
  if (isUnlocked(g, "perks"))
    for (const [id, cost] of [
      ["learn", 3],
      ["meridian", 4],
      ["auto", 5],
    ])
      if (g.meta.rp >= cost && !g.meta.perks.includes(id))
        add("perk", id, "轮回", "可解锁永久传承");
  if (g.status === "ended" && isUnlocked(g, "reincarnation"))
    add("reincarnate", "", "轮回", "可进入下一世");
  return hints;
}
export function hintForCommand(hints, cmd, arg) {
  if (cmd === "tab") return hints.find((h) => h.tab === arg)?.text || "";
  if (cmd === "details") {
    const feature = { study: "study", plan: "plans", life: "food" }[arg];
    return (
      hints.find(
        (h) =>
          (h.cmd === "guide-open" && h.arg === feature) ||
          (arg === "life" && h.cmd === "buy"),
      )?.text || ""
    );
  }
  if (cmd === "guide-open" && arg === "all")
    return hints.find((h) => h.cmd === "guide-open")?.text || "";
  return hints.find((h) => h.cmd === cmd && h.arg === arg)?.text || "";
}
