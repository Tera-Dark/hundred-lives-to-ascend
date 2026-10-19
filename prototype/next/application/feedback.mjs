import { rates, PLANS, STUDIES, CAREERS } from "../game.mjs";
const format = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 });
export const MUTATING_COMMANDS = new Set([
  "advance",
  "reply",
  "origin",
  "career",
  "plan",
  "study",
  "buy",
  "perk",
  "equip",
  "pill",
  "move",
  "action",
  "reincarnate",
  "guide-ack",
  "guide-go",
  "guide-mute",
  "guide-resume",
  "guide-replay",
]);
export function progressSnapshot(g) {
  return {
    lifeId: g.life.id,
    year: g.worldYear,
    money: g.life.money,
    qi: g.life.qi,
    herbs: g.life.herbs,
    rp: g.meta.rp,
  };
}
export function commandFeedback(before, g, cmd, arg) {
  if (before.lifeId !== g.life.id)
    return `第${g.life.id}世开始，前世纪录与世界历史已保留。`;
  if (cmd === "plan") {
    const r = rates(g);
    return `已改为${PLANS[arg]?.name || "当前日程"} · 灵石净${format.format(r.net)}/年 · 修为+${format.format(r.qi)}/年`;
  }
  if (cmd === "study") return `正在研习${STUDIES[arg]?.name || "当前功法"}`;
  if (cmd === "career") return `已切换为${CAREERS[arg]?.name || "当前营生"}`;
  const changes = [];
  if (g.worldYear !== before.year)
    changes.push(`度过${g.worldYear - before.year}年`);
  for (const [key, label, value] of [
    ["money", "灵石", g.life.money],
    ["qi", "修为", g.life.qi],
    ["herbs", "灵材", g.life.herbs],
    ["rp", "RP", g.meta.rp],
  ]) {
    const diff = Math.round((value - before[key]) * 10) / 10;
    if (diff)
      changes.push(`${label}${diff > 0 ? "+" : ""}${format.format(diff)}`);
  }
  if (changes.length) return changes.join(" · ");
  if (cmd === "equip") return "遗物佩戴已更新";
  return "";
}
