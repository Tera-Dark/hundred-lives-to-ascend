import { event } from "./events.mjs";
import { endLife, advanceBetweenLives } from "./chronicle.mjs";
import { PLANS, STUDIES, CAREERS } from "../content/catalog.mjs";
import { round, has, charge, canSpend } from "./shared.mjs";
import {
  life,
  lifeYear,
  log,
  mark,
  achievement,
  have,
  equipped,
  npcState,
  careerRole,
} from "./state.mjs";
import { revenue, tryQi } from "./economy.mjs";
function resolveAction(g) {
  const l = g.life,
    a = l.action;
  if (!a || a.remaining > 0 || g.pending || g.status !== "playing") return;
  l.action = null;
  switch (a.id) {
    case "foundation":
      l.realm = "筑基";
      l.lifeCap = Math.max(l.lifeCap, 240);
      achievement(g, "first-foundation");
      log(g, "道基已成，寿元上限达到240岁。", "breakthrough");
      break;
    case "pill":
      l.pill = a.variant;
      if (a.variant === "long") l.lifeCap = Math.max(l.lifeCap, 140);
      log(
        g,
        `炼成「${{ common: "护脉丹", economy: "省材护脉丹", long: "驻元护脉丹" }[a.variant]}」，获得一次灵潮防护。`,
        "action",
      );
      break;
    case "move":
      l.region = a.region;
      log(
        g,
        `迁居${a.region === "town" ? "浮潮集" : "青药谷南麓"}。工作机会与修行效率随地区改变。`,
        "world",
      );
      break;
    case "gu_help":
      g.world.npc.gu.helped = true;
      g.world.npc.gu.blessed = true;
      l.relation = "gu";
      mark(l, "npc-helped");
      log(g, "顾南枝与你修好了药圃，留下了一份彼此认可的药谷旧约。", "npc");
      break;
    case "shen_help":
      g.world.npc.shen.helped = true;
      l.relation = "shen";
      mark(l, "npc-helped");
      log(g, "沈望川把你们的名字写进商号账本，许诺来日互相照应。", "npc");
      break;
    case "explore":
      if (!has(g.meta.relics, "G01")) {
        g.meta.relics.push("G01");
        if (g.meta.equipped.length < 2) g.meta.equipped.push("G01");
        log(
          g,
          "荒谷历练获得「凝息珠」，收录灵藏图谱，可在下世继续携带。",
          "relic",
        );
      } else {
        l.herbs++;
        log(g, "探索收获一份灵材。", "explore");
      }
      break;
    case "jade":
      if (g.world.jade === "stashed") {
        g.world.jade = "held";
        l.jade = true;
        if (!has(g.meta.relics, "G03")) g.meta.relics.push("G03");
        log(
          g,
          `你找到了前世旧玉，器物编号${g.world.jadeId}始终只有一个。`,
          "legacy",
        );
      }
      break;
    case "xuan":
      l.foundationReduction = 140;
      mark(l, "xuan-used");
      log(
        g,
        "推演完成：下一次筑基所需修为减少140。但它并不一定比直接突破更快。",
        "action",
      );
      break;
    case "focus":
      l.focus = true;
      log(g, "专注吐纳法入门；今后修行基础效率提高。", "study");
      break;
    case "vein-cult":
    case "vein-med":
      g.world.vein = "stable";
      g.world.veinDone = true;
      log(g, "你参与修复余潮断脉，后世的药谷还将记得这片灵脉。", "world");
      break;
    case "vein-leave":
      g.world.vein = "ruined";
      g.world.veinDone = true;
      log(g, "你选择离开断脉地区。当地衰败，但保住了继续修行的机会。", "world");
      break;
    case "trial-boon":
      l.qi += 120;
      log(g, "心定印转为修为感悟+120，仅本世一次。", "trial");
      break;
    case "trial-herb":
      l.herbs++;
      log(g, "心定印换到灵材+1，仅本世一次。", "trial");
      break;
  }
  if (!l.action && l.suspendedActions?.length) {
    l.action = l.suspendedActions.pop();
    log(g, `继续此前的行动，尚余${l.action.remaining}年。`, "action");
    if (l.action.remaining <= 0) resolveAction(g);
  }
}
export function advance(g, years = 1) {
  if (g.status !== "playing" || g.pending) return g;
  let limit = Math.max(0, Math.min(400, Math.floor(years)));
  for (let k = 0; k < limit; k++) {
    if (g.pending || g.status !== "playing") break;
    if (g.worldYear >= 160) {
      g.status = "boundary";
      break;
    }
    g.worldYear++;
    g.life.age++;
    revenue(g);
    if (g.life.action) g.life.action.remaining--;
    if (g.life.age >= g.life.lifeCap) {
      endLife(g, "寿元耗尽");
      break;
    }
    event(g);
    if (g.pending || g.status !== "playing") break;
    resolveAction(g);
    if (!g.life.action) tryQi(g);
    if (have(g, "auto") && g.life.plan === "earn" && g.life.money >= 55) {
      g.life.plan = "cultivate";
      log(
        g,
        "照世传承按已设策略：灵石达到55，自动由营生切换为苦修。",
        "automation",
      );
    }
  }
  return g;
}
function actionSpec(g, id, variant) {
  const l = g.life;
  return {
    foundation: {
      time: 2,
      money: 45,
      herbs: 3,
      qi: 1650 - l.foundationReduction,
      ok: l.realm === "炼气",
    },
    pill: {
      time: variant === "long" ? 5 : variant === "economy" ? 4 : 3,
      money: variant === "long" ? 80 : 55,
      herbs: variant === "economy" ? 4 : 5,
      ok:
        l.realm !== "凡人" &&
        !l.pill &&
        (variant === "common" || l.path === "dan"),
    },
    xuan: {
      time: 2,
      money: 18,
      ok: l.path === "xuan" && !has(l.flags, "xuan-used") && l.realm === "炼气",
    },
    move: {
      time: 2,
      money: 8,
      ok: variant !== l.region && (variant === "town" || variant === "valley"),
    },
    explore: { time: 3, money: 8, ok: !has(l.flags, "explored") },
    jade: {
      time: 4 - (equipped(g, "G03") ? 2 : 0),
      money: 8,
      ok: g.world.jade === "stashed" && !l.jade,
    },
    "trial-boon": { time: 2, ok: l.trialToken > 0 },
    "trial-herb": { time: 2, money: 10, ok: l.trialToken > 0 },
    focus: { time: 2, money: 24, ok: l.realm === "炼气" && !l.focus },
  }[id];
}
export function actionStatus(g, id, variant = "") {
  if (g.status !== "playing")
    return { ok: false, reason: "当前人生已停止，无法开始行动。" };
  if (g.pending) return { ok: false, reason: "请先处理眼前的事件。" };
  if (g.life.action) return { ok: false, reason: "请先完成进行中的跨年行动。" };
  if (!g.life.path) return { ok: false, reason: "请先选择主修。" };
  const cfg = actionSpec(g, id, variant),
    l = g.life;
  if (
    !cfg?.ok ||
    (id === "pill" && !["common", "economy", "long"].includes(variant))
  )
    return { ok: false, reason: "尚未满足此行动的境界、资格或一次性条件。" };
  if (l.age + cfg.time > l.lifeCap)
    return { ok: false, reason: "剩余寿元不足以完成此行动。" };
  if (
    (id === "foundation" || id === "pill") &&
    g.world.tide === "waiting" &&
    g.worldYear + cfg.time >= 60
  )
    return {
      ok: false,
      reason: "此行动无法在世界60年灵潮之前完成，请选择更短的方案或提前准备。",
    };
  for (const [key, name] of [
    ["money", "灵石"],
    ["herbs", "灵材"],
    ["qi", "修为"],
  ])
    if (l[key] < (cfg[key] || 0))
      return { ok: false, reason: `还需${round(cfg[key] - l[key])}${name}。` };
  return { ok: true, reason: "", spec: cfg };
}
export function begin(g, id, variant = "") {
  const check = actionStatus(g, id, variant);
  if (!check.ok) {
    g.notice = check.reason;
    return false;
  }
  const cfg = check.spec,
    l = g.life;
  charge(l, cfg);
  if (id === "explore") mark(l, "explored");
  if (id.startsWith("trial-")) l.trialToken = 0;
  l.action = {
    id,
    variant,
    region: id === "move" ? variant : undefined,
    remaining: cfg.time,
    total: cfg.time,
  };
  log(
    g,
    `开始${{ foundation: "筑基突破", pill: "炼制护脉丹", xuan: "闭关推演", move: "迁居", explore: "荒谷历练", jade: "寻回旧玉", "trial-boon": "心定印参悟", "trial-herb": "心定印寻材", focus: "专注吐纳" }[id]}，占用${cfg.time}年日程，期间不重复领取普通工作/修行收益。`,
    "action",
  );
  advance(g, cfg.time);
  return true;
}
function interruptAction(g, action) {
  if (g.life.action) (g.life.suspendedActions ??= []).push(g.life.action);
  g.life.action = action;
}
function npcAction(g, id) {
  const l = g.life;
  const spec =
    id === "gu_help" ? { money: 4, herbs: 1, time: 2 } : { money: 12, time: 1 };
  if (!canSpend(l, spec)) return false;
  charge(l, spec);
  interruptAction(g, { id, remaining: spec.time, total: spec.time });
  advance(g, spec.time);
  return true;
}
export function respond(g, key) {
  if (g.status !== "playing" || !g.pending) return false;
  const l = g.life,
    p = g.pending;
  let ok = true;
  switch (p) {
    case "intro":
      if (!["xuan", "dan"].includes(key)) return false;
      l.path = key;
      g.pending = null;
      log(
        g,
        `这一世主修${key === "xuan" ? "玄修" : "丹修"}。营生、修炼与研习由年度计划共同分配。`,
      );
      return true;
    case "materials18":
      if (key === "herbs") {
        l.herbs +=
          3 + (equipped(g, "W02") ? 1 : 0) + (has(l.studied, "herbs") ? 1 : 0);
      } else if (key === "money") l.money += 22;
      else return false;
      mark(l, "materials18-choice");
      break;
    case "materials34":
      if (key === "herbs") l.herbs += 3 + (has(l.studied, "herbs") ? 1 : 0);
      else if (key === "qi") l.qi += 180;
      else return false;
      break;
    case "npc":
      if (key === "gu") {
        if (l.herbs < 1 || l.money < 4 || !npcState(g, "gu").alive)
          return false;
        g.pending = null;
        mark(l, "npc-gu");
        l.decisions.push("help-gu");
        return npcAction(g, "gu_help");
      } else if (key === "shen") {
        if (l.money < 12 || !npcState(g, "shen").alive) return false;
        g.pending = null;
        mark(l, "npc-shen");
        l.decisions.push("help-shen");
        return npcAction(g, "shen_help");
      } else if (key !== "ignore") return false;
      break;
    case "jade":
      if (l.id === 1 && g.world.jade === "hidden") {
        l.jade = true;
        g.world.jade = "held";
        log(
          g,
          "在旧井边得到一枚护心玉。这是真实器物，离世时会留在同一世界线。",
          "legacy",
        );
      } else if (g.world.jade === "stashed")
        log(
          g,
          "旧井留下前世旧物的线索，可用探索行动寻回同一个实体。",
          "legacy",
        );
      break;
    case "trial":
      if (key === "qi") {
        if (l.qi < 900) return false;
        l.qi -= 150;
        l.trialToken = 1;
      } else if (key === "herbs") {
        if (l.herbs < 1 || l.money < 15) return false;
        l.herbs--;
        l.money -= 15;
        l.trialToken = 1;
      } else if (key !== "retreat") return false;
      l.trialResolved = true;
      achievement(g, "first-trial");
      break;
    case "warning":
      if (key !== "ok") return false;
      log(
        g,
        "灵潮将至：筑基或炼成护脉丹方能抵御。其他生存条件尚未实装。",
        "world",
      );
      break;
    case "tide":
      if (key !== "face") return false;
      g.world.tide = l.realm === "筑基" || !!l.pill ? "survived" : "failed";
      if (g.world.tide === "failed") {
        g.pending = null;
        endLife(g, "灵潮中陨落");
        return true;
      }
      achievement(g, "tide60");
      mark(l, "survived60");
      log(
        g,
        "浮岚历60年灵潮逆涌，你活了下来。灾劫在这条世界线不会重演。",
        "world",
      );
      break;
    case "past":
      if (key === "gu-record" && g.world.npc.gu.helped) {
        l.studyProgress.herbs = Math.min(
          STUDIES.herbs.cost - 1,
          l.studyProgress.herbs + 7,
        );
        l.herbs++;
        log(
          g,
          "药谷留下旧约与辨草手稿：本世辨草研习进度增加，灵材+1。",
          "legacy",
        );
      } else if (key === "shen-record" && g.world.npc.shen.helped) {
        l.money += 12;
        log(
          g,
          "浮潮集账房查到旧商路分红，今世领取12灵石，一生一次。",
          "legacy",
        );
      } else if (key === "ok") {
        log(g, "前世人物与旧地并未重置，你开始循着历史继续修行。", "legacy");
      } else return false;
      break;
    case "vein-warning":
      if (key !== "ok") return false;
      log(g, "世界95年将出现地方灵脉危机，越接近此年越应注意准备。", "world");
      break;
    case "vein":
      if (key === "cult") {
        if (l.realm !== "筑基" || l.money < 10) return false;
        g.pending = null;
        l.money -= 10;
        interruptAction(g, { id: "vein-cult", remaining: 2, total: 2 });
        return advance(g, 2) && true;
      }
      if (key === "med") {
        if (l.herbs < 2 || l.money < 35) return false;
        g.pending = null;
        charge(l, { money: 35, herbs: 2 });
        interruptAction(g, { id: "vein-med", remaining: 3, total: 3 });
        return advance(g, 3) && true;
      }
      if (key === "leave") {
        if (l.money < 15) return false;
        g.pending = null;
        charge(l, { money: 15 });
        interruptAction(g, { id: "vein-leave", remaining: 1, total: 1 });
        return advance(g, 1) && true;
      }
      if (key === "labor") {
        g.pending = null;
        interruptAction(g, { id: "vein-leave", remaining: 3, total: 3 });
        return advance(g, 3) && true;
      }
      return false;
    default:
      return false;
  }
  if (ok) {
    g.pending = null;
    l.decisions.push(p + ":" + key);
    resolveAction(g);
    event(g);
    return true;
  }
  return false;
}
export function setOrigin(g, id) {
  if (g.pending !== "intro" || !["market", "herbal"].includes(id)) return false;
  const l = g.life;
  l.origin = id;
  l.career = id === "market" ? "merchant" : "herbal";
  l.region = id === "market" ? "town" : "valley";
  l.herbs = id === "herbal" ? 1 : 0;
  l.money = id === "market" ? 8 : 7;
  g.notice =
    id === "market"
      ? "出身浮潮集散修：经商较方便，灵材需寻觅。"
      : "出身药谷学徒：已有少量灵材，商路和灵石相对紧张。";
  return true;
}
export function setCareer(g, id) {
  if (g.pending || g.status !== "playing" || g.life.action || !CAREERS[id])
    return false;
  g.life.career = id;
  log(g, `现在营生：${careerRole(g)}。职业经验继续保留在本世。`, "career");
  return true;
}
export function setPlan(g, id) {
  if (g.pending || g.status !== "playing" || g.life.action || !PLANS[id])
    return false;
  g.life.plan = id;
  log(g, `修行计划切换为「${PLANS[id].name}」。`, "schedule");
  return true;
}
export function setStudy(g, id) {
  if (
    g.pending ||
    g.status !== "playing" ||
    g.life.action ||
    !STUDIES[id] ||
    has(g.life.studied, id)
  )
    return false;
  g.life.study = id;
  log(g, `开始研习《${STUDIES[id].name}》。`, "study");
  return true;
}
export function buy(g, id) {
  if (g.pending || g.status !== "playing" || g.life.action) return false;
  const l = g.life;
  const items = {
    food: { money: 12, ok: l.food !== "spirit" },
    home: { money: 28, ok: l.home !== "cottage" },
  };
  const c = items[id];
  if (!c?.ok || !canSpend(l, c)) return false;
  charge(l, c);
  if (id === "food") l.food = "spirit";
  else l.home = "cottage";
  log(
    g,
    `改善${id === "food" ? "灵食" : "居处"}，长期提高修行效率，也须支付维护费。`,
    "lifestyle",
  );
  return true;
}
export function buyPerk(g, id) {
  const cfg = {
    learn: { price: 3, name: "旧业识途：职业经验额外+10%" },
    auto: { price: 5, name: "生财有道：灵石达到55自动切换苦修" },
    meridian: { price: 4, name: "旧识经脉：修行效率+15%" },
  }[id];
  if (g.status === "boundary" || !cfg || have(g, id) || g.meta.rp < cfg.price)
    return false;
  g.meta.rp -= cfg.price;
  g.meta.perks.push(id);
  log(g, `永久传承「${cfg.name}」已解锁。`, "legacy");
  return true;
}
export function equip(g, id) {
  if (!has(g.meta.relics, id) || g.status === "boundary") return false;
  const a = g.meta.equipped;
  if (has(a, id)) {
    g.meta.equipped = a.filter((x) => x !== id);
    return true;
  }
  if (a.length >= 2) return false;
  a.push(id);
  return true;
}
export function reincarnate(g) {
  if (g.status === "boundary") return false;
  if (g.status === "playing") {
    if (g.pending || g.life.action || lifeYear(g) < 25) return false;
    endLife(g, "主动轮回");
  }
  if (g.status !== "ended") return false;
  const old = g.life;
  if (!advanceBetweenLives(g, 2)) {
    g.status = "boundary";
    g.pending = null;
    log(g, "转世间隔抵达世界160年内容边界，进度安全暂停。", "world");
    return true;
  }
  const start = g.worldYear;
  g.life = life(old.id + 1, start);
  g.status = "playing";
  g.pending = "intro";
  log(
    g,
    `第${g.life.id}世出生。你并未重置浮岚界的历史；新的身体重新开始谋生。`,
    "reincarnation",
  );
  return true;
}
export function actionAvailability(g, id, variant = "") {
  if (g.pending || g.status !== "playing" || g.life.action) return false;
  return actionStatus(g, id, variant).ok;
}
