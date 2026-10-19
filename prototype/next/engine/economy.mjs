import { PLANS, STUDIES, CAREERS } from "../content/catalog.mjs";
import { has, round } from "./shared.mjs";
import { have, equipped, achievement, log, careerRole } from "./state.mjs";
export function rates(g) {
  const l = g.life,
    p = PLANS[l.plan],
    prior = g.meta.bestCareer[l.career] || 1;
  const history = 1 + Math.min(0.3, Math.floor((prior - 1) / 5) * 0.05);
  const balance = have(g, "learn") ? 1.1 : 1;
  const valleyState =
    g.world.vein === "stable" ? 1.12 : g.world.vein === "ruined" ? 0.76 : 1;
  const careerArea =
    l.career === "merchant"
      ? l.region === "town"
        ? 1
        : 0.68
      : l.region === "valley"
        ? 1.3 * valleyState
        : 0.78;
  const historicalContract =
    l.id > 1 && g.world.npc.shen.helped && l.career === "merchant" ? 1.06 : 1;
  let wage =
    (l.career === "merchant" ? 7 : 5) + (l.level[l.career] >= 5 ? 4 : 0);
  if (l.career === "merchant" && has(l.studied, "trade")) wage *= 1.15;
  let earn = round(p.work * wage * careerArea * historicalContract);
  let upkeep =
    (l.food === "spirit" ? 0.7 : 0) + (l.home === "cottage" ? 0.9 : 0);
  let luxury =
    (l.food === "spirit" ? 1.08 : 1) * (l.home === "cottage" ? 1.1 : 1);
  const base = l.realm === "凡人" ? 55 : l.realm === "炼气" ? 125 : 190;
  let qiRelic = 0;
  if (equipped(g, "W01")) qiRelic += 0.03;
  if (equipped(g, "G01")) qiRelic += 0.05;
  let qi = round(
    base *
      p.train *
      luxury *
      (l.region === "valley"
        ? g.world.vein === "stable"
          ? 1.13
          : g.world.vein === "ruined"
            ? 1
            : 1.07
        : 1) *
      (has(l.studied, "stillness") ? 1.12 : 1) *
      (l.path === "xuan" ? 1.06 : 1) *
      (have(g, "meridian") ? 1.15 : 1) *
      (1 + qiRelic),
  );
  let xp = round(
    p.work *
      24 *
      history *
      balance *
      (has(l.studied, "trade") && l.career === "merchant" ? 1.1 : 1),
  );
  let research = round(
    p.study *
      18 *
      (l.home === "cottage" ? 1.1 : 1) *
      (g.meta.bestStudy[l.study] || 0 ? 1.08 : 1),
  );
  let gather =
    l.career === "herbal"
      ? round(
          p.work *
            0.3 *
            (l.region === "valley" ? 1.35 * valleyState : 1) *
            (has(l.studied, "herbs") ? 1.2 : 1) *
            (l.id > 1 && g.world.npc.gu.helped ? 1.1 : 1),
        )
      : 0;
  return {
    wage: earn,
    upkeep,
    net: round(earn - upkeep),
    qi,
    xp,
    research,
    gather,
    history: round(history),
  };
}
export function tryQi(g) {
  const l = g.life;
  if (l.realm === "凡人" && l.qi >= 180) {
    l.qi = round(l.qi - 180);
    l.realm = "炼气";
    l.lifeCap = Math.max(120, l.lifeCap);
    achievement(g, "first-qi");
    log(g, "引气入体，踏入炼气，寿元提升至120岁。", "breakthrough");
  }
}
export function addStudy(g, amount) {
  const l = g.life,
    id = l.study;
  if (has(l.studied, id)) return;
  l.studyProgress[id] = round(l.studyProgress[id] + amount);
  if (l.studyProgress[id] >= STUDIES[id].cost) {
    l.studied.push(id);
    g.meta.bestStudy[id] = Math.max(g.meta.bestStudy[id] || 0, 1);
    const next = [
      l.career === "merchant" ? "trade" : "herbs",
      "stillness",
      "trade",
      "herbs",
    ].find((k) => !has(l.studied, k));
    if (next) l.study = next;
    log(
      g,
      `研习完成《${STUDIES[id].name}》：${STUDIES[id].desc}。${next ? "下一项研习已自动安排。" : ""}`,
      "study",
    );
  }
}
export function revenue(g) {
  const l = g.life;
  if (l.action) {
    const u =
      (l.food === "spirit" ? 0.7 : 0) + (l.home === "cottage" ? 0.9 : 0);
    l.money = round(l.money - u);
    if (l.money < 0) {
      l.money = 0;
      l.food = "plain";
      l.home = "hut";
      log(g, "维持费用不足，自动改用朴素灵食与借宿棚屋。", "economy");
    }
    return;
  }
  const r = rates(g);
  l.qi = round(l.qi + r.qi);
  l.money = round(l.money + r.net);
  if (l.money < 0) {
    l.money = 0;
    l.food = "plain";
    l.home = "hut";
    log(g, "维护费用超出收入，生活条件降档，未产生债务。", "economy");
  }
  l.xp[l.career] = round(l.xp[l.career] + r.xp);
  let levelUps = 0;
  while (levelUps++ < 20 && l.xp[l.career] >= 10 + l.level[l.career] * 6) {
    l.xp[l.career] = round(l.xp[l.career] - (10 + l.level[l.career] * 6));
    l.level[l.career]++;
    if (l.level[l.career] === 5) {
      log(
        g,
        `${CAREERS[l.career].name}晋升至「${careerRole(g)}」！全职工资上涨，并开启新的经营资格。`,
        "career",
      );
    }
  }
  addStudy(g, r.research);
  l.herbWork += r.gather;
  while (l.herbWork >= 1) {
    l.herbWork -= 1;
    l.herbs++;
  }
  tryQi(g);
}
