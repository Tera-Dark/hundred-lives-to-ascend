/** 到期事件可延期处理；世界事件先于个人事件，处理完同年继续检查。 */
import { lifeYear, log, mark } from "./state.mjs";
import { has } from "./shared.mjs";
export function event(g) {
  if (g.pending || g.status !== "playing") return;
  let y = lifeYear(g),
    w = g.worldYear,
    l = g.life;
  if (w >= 60 && g.world.tide === "waiting") {
    g.pending = "tide";
    return;
  }
  const resolvingVein = [l.action, ...(l.suspendedActions || [])].some((a) =>
    a?.id.startsWith("vein-"),
  );
  if (w >= 95 && !g.world.veinDone && !resolvingVein) {
    g.pending = "vein";
    return;
  }
  if (w >= 160) {
    g.status = "boundary";
    log(
      g,
      "世界历160年以后的史劫尚未制作，当前人物安全暂停；不会凭空死亡。",
      "world",
    );
    return;
  }
  if (y >= 12 && l.id > 1 && !has(l.flags, "past")) {
    mark(l, "past");
    g.pending = "past";
    return;
  }
  if (y >= 18 && !has(l.flags, "materials18")) {
    mark(l, "materials18");
    g.pending = "materials18";
    return;
  }
  if (y >= 22 && !has(l.flags, "npc22")) {
    mark(l, "npc22");
    g.pending = "npc";
    return;
  }
  if (y >= 24 && !has(l.flags, "jade24")) {
    mark(l, "jade24");
    g.pending = "jade";
    return;
  }
  if (y >= 34 && !has(l.flags, "materials34")) {
    mark(l, "materials34");
    g.pending = "materials34";
    return;
  }
  if (y >= 39 && !has(l.flags, "trial39")) {
    mark(l, "trial39");
    g.pending = "trial";
    return;
  }
  if (w >= 45 && !g.world.warning && g.world.tide === "waiting") {
    g.world.warning = true;
    g.pending = "warning";
    return;
  }
  if (w >= 92 && !g.world.veinWarning && g.world.tide !== "waiting") {
    g.world.veinWarning = true;
    g.pending = "vein-warning";
    return;
  }
}
