import { log, achievement, lifeYear } from "./state.mjs";
import { has } from "./shared.mjs";
export function endLife(g, reason) {
  if (g.status !== "playing") return;
  const l = g.life;
  g.status = "ended";
  g.pending = null;
  l.action = null;
  l.suspendedActions = [];
  if (l.jade) {
    l.jade = false;
    g.world.jade = "stashed";
  }
  for (const id of ["merchant", "herbal"])
    g.meta.bestCareer[id] = Math.max(g.meta.bestCareer[id], l.level[id]);
  let points =
    Math.min(6, Math.floor(lifeYear(g) / 17)) +
    (l.realm === "筑基" ? 3 : l.realm === "炼气" ? 1 : 0) +
    Math.min(2, l.decisions.length >= 3 ? 2 : 1);
  if (!has(g.meta.achievements, "reincarnation")) {
    points += 1;
    achievement(g, "reincarnation");
  }
  if (
    reason === "灵潮幸存后主动转世" &&
    !has(g.meta.achievements, "tide-survivor")
  ) {
    points += 3;
    achievement(g, "tide-survivor");
  }
  g.meta.rp += points;
  g.meta.lives.push({
    id: l.id,
    path: l.path,
    career: l.career,
    year: g.worldYear,
    reason,
    points,
    realm: l.realm,
  });
  log(
    g,
    `第${l.id}世${reason}，获得${points}轮回点。旧世界、人脉和产业后果没有重置。`,
    "reincarnation",
  );
}

/** 无人物在场的转世间隔仍登记世界历史，不向新身体追补旧灾劫。 */
export function advanceBetweenLives(g, years) {
  const target = Math.min(160, g.worldYear + years);
  while (g.worldYear < target) {
    g.worldYear++;
    if (g.worldYear >= 60 && g.world.tide === "waiting") {
      g.world.tide = "unwitnessed";
      g.world.warning = true;
      log(
        g,
        "转世间隔中，世界60年灵潮已经发生；这段历史没有当世人物在场。",
        "world",
      );
    }
    if (g.worldYear >= 95 && !g.world.veinDone) {
      g.world.vein = "ruined";
      g.world.veinDone = true;
      g.world.veinWarning = true;
      log(g, "转世间隔中地方余潮发生，无人干预的药谷灵脉受损。", "world");
    }
  }
  return g.worldYear < 160;
}
