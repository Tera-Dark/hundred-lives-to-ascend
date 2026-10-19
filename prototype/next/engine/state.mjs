import { SAVE_VERSION, CAREERS } from "../content/catalog.mjs";
import { has } from "./shared.mjs";
const named = { gu: "顾南枝", shen: "沈望川" };
export function life(id, yr) {
  return {
    id,
    birthYear: yr,
    age: 16,
    lifeCap: 80,
    realm: "凡人",
    qi: 0,
    money: 8,
    herbs: 0,
    path: null,
    career: "merchant",
    level: { merchant: 1, herbal: 1 },
    xp: { merchant: 0, herbal: 0 },
    plan: "earn",
    study: "stillness",
    studyProgress: { stillness: 0, trade: 0, herbs: 0 },
    studied: [],
    home: "hut",
    food: "plain",
    region: "town",
    relation: null,
    flags: [],
    herbWork: 0.0,
    action: null,
    suspendedActions: [],
    pill: null,
    jade: false,
    origin: "market",
    trialToken: 0,
    focus: false,
    foundationReduction: 0,
    decisions: [],
    trialResolved: false,
  };
}
export function createGame() {
  const g = {
    version: SAVE_VERSION,
    worldYear: 0,
    status: "playing",
    pending: "intro",
    life: life(1, 0),
    world: {
      tide: "waiting",
      warning: false,
      vein: "untouched",
      veinDone: false,
      veinWarning: false,
      jade: "hidden",
      jadeId: "HEART-JADE-001",
      npc: {
        gu: { birth: -20, cap: 90, blessed: false, helped: false },
        shen: { birth: -18, cap: 85, helped: false },
      },
      flags: [],
    },
    meta: {
      rp: 0,
      bestCareer: { merchant: 1, herbal: 1 },
      bestStudy: {},
      perks: [],
      relics: ["W01"],
      equipped: ["W01"],
      achievements: [],
      lives: [],
    },
    journal: [],
    notice: "选择这一世的营生与主修。",
  };
  log(g, "照世碑苏醒。浮岚界仍是一个需要谋生的世界。", "world");
  return g;
}
export const lifeYear = (g) => g.worldYear - g.life.birthYear;
export function log(g, text, type = "story") {
  g.journal.push({
    seq: (g.journal.at(-1)?.seq || 0) + 1,
    worldYear: g.worldYear,
    age: g.life.age,
    lifeId: g.life.id,
    text,
    type,
  });
  if (g.journal.length > 180) g.journal.splice(0, g.journal.length - 180);
  g.notice = text;
}
export function mark(l, x) {
  if (!has(l.flags, x)) l.flags.push(x);
}
export function achievement(g, id) {
  if (!has(g.meta.achievements, id)) g.meta.achievements.push(id);
}
export function have(g, perk) {
  return has(g.meta.perks, perk);
}
export function equipped(g, id) {
  return has(g.meta.equipped, id);
}
export function careerRole(g, career = g.life.career) {
  return CAREERS[career].roles[g.life.level[career] >= 5 ? 1 : 0];
}
export function npcState(g, id) {
  const c = g.world.npc[id];
  const age = g.worldYear - c.birth;
  const alive = age < c.cap + (id === "gu" && c.blessed ? 30 : 0);
  return {
    name: named[id],
    age,
    alive,
    status: alive ? (age >= 70 ? "年迈" : "在世") : "已故",
    helped: c.helped,
  };
}
