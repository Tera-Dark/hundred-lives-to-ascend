import {
  SAVE_VERSION,
  PLANS,
  CAREERS,
  STUDIES,
  RELICS,
} from "../content/catalog.mjs";
import { createGame } from "./state.mjs";

const finite = (n, min = 0) => Number.isFinite(n) && n >= min;
const strings = (value) =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const object = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function validSnapshot(g) {
  if (
    !object(g) ||
    ![2, SAVE_VERSION].includes(g.version) ||
    !Number.isInteger(g.worldYear) ||
    !finite(g.worldYear)
  )
    return false;
  const { life: l, meta: m, world: w } = g;
  if (!object(l) || !object(m) || !object(w) || !Array.isArray(g.journal))
    return false;
  const pendingIds = [
    null,
    "intro",
    "materials18",
    "materials34",
    "npc",
    "jade",
    "trial",
    "warning",
    "tide",
    "past",
    "vein-warning",
    "vein",
  ];
  if (!pendingIds.includes(g.pending)) return false;
  if (
    !g.journal.every(
      (item) =>
        object(item) &&
        typeof item.text === "string" &&
        typeof item.type === "string" &&
        finite(item.seq) &&
        finite(item.worldYear) &&
        finite(item.lifeId),
    )
  )
    return false;
  if (
    !["hut", "cottage"].includes(l.home) ||
    !["plain", "spirit"].includes(l.food) ||
    ![null, "common", "economy", "long"].includes(l.pill)
  )
    return false;
  if (
    ![l.herbWork, l.foundationReduction, l.trialToken].every((n) => finite(n))
  )
    return false;
  if (
    !["playing", "ended", "boundary"].includes(g.status) ||
    !(g.pending === null || typeof g.pending === "string")
  )
    return false;
  if (
    !Number.isInteger(l.id) ||
    l.id < 1 ||
    !finite(l.birthYear) ||
    l.birthYear > g.worldYear
  )
    return false;
  if (![l.age, l.lifeCap, l.qi, l.money, l.herbs].every((n) => finite(n)))
    return false;
  if (
    !["凡人", "炼气", "筑基"].includes(l.realm) ||
    ![null, "xuan", "dan"].includes(l.path)
  )
    return false;
  if (
    !PLANS[l.plan] ||
    !CAREERS[l.career] ||
    !STUDIES[l.study] ||
    !["town", "valley"].includes(l.region)
  )
    return false;
  if (!object(l.level) || !object(l.xp) || !object(l.studyProgress))
    return false;
  if (
    !Object.keys(CAREERS).every(
      (id) =>
        Number.isInteger(l.level[id]) && l.level[id] >= 1 && finite(l.xp[id]),
    )
  )
    return false;
  if (!Object.keys(STUDIES).every((id) => finite(l.studyProgress[id])))
    return false;
  if (
    ![
      l.flags,
      l.studied,
      l.decisions,
      m.perks,
      m.relics,
      m.equipped,
      m.achievements,
    ].every(strings)
  )
    return false;
  if (
    !finite(m.rp) ||
    !object(m.bestCareer) ||
    !object(m.bestStudy) ||
    !Array.isArray(m.lives)
  )
    return false;
  if (!Object.keys(CAREERS).every((id) => finite(m.bestCareer[id], 1)))
    return false;
  if (
    m.equipped.length > 2 ||
    new Set(m.equipped).size !== m.equipped.length ||
    !m.equipped.every((id) => RELICS[id] && m.relics.includes(id))
  )
    return false;
  if (
    !object(w.npc) ||
    !["hidden", "held", "stashed"].includes(w.jade) ||
    typeof w.jadeId !== "string"
  )
    return false;
  if (
    !["gu", "shen"].every(
      (id) =>
        object(w.npc[id]) &&
        finite(w.npc[id].birth, -10000) &&
        finite(w.npc[id].cap, 1),
    )
  )
    return false;
  if (
    !["waiting", "survived", "failed", "unwitnessed"].includes(w.tide) ||
    !["untouched", "stable", "ruined"].includes(w.vein)
  )
    return false;
  if (
    l.action &&
    (!object(l.action) ||
      typeof l.action.id !== "string" ||
      !finite(l.action.remaining))
  )
    return false;
  if (
    l.suspendedActions &&
    (!Array.isArray(l.suspendedActions) ||
      !l.suspendedActions.every(
        (a) => object(a) && typeof a.id === "string" && finite(a.remaining),
      ))
  )
    return false;
  return true;
}

export const persist = (g) => JSON.stringify(g);
export function decodeSave(data) {
  if (!data) return { game: createGame(), existing: false, error: null };
  try {
    const value = JSON.parse(data);
    if (!validSnapshot(value)) throw new Error("存档结构或版本不受支持");
    const migrated = value.version !== SAVE_VERSION;
    value.version = SAVE_VERSION;
    value.life.suspendedActions ??= [];
    return { game: value, existing: true, migrated, error: null };
  } catch {
    return {
      game: createGame(),
      existing: false,
      error: "存档无法读取，原始内容将保留为恢复备份。",
    };
  }
}
export const restore = (data) => decodeSave(data).game;
