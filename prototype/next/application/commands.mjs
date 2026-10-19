import * as game from "../game.mjs";
import { FEATURE_BY_ID, TAB_FEATURE } from "../content/features.mjs";
import {
  initializeGuide,
  syncUnlocks,
  isUnlocked,
  acknowledge,
  replayIntroductions,
  nextIntroduction,
} from "./onboarding.mjs";
import { nextDelta } from "./selectors.mjs";

export const createUiState = () => ({
  tab: "修行",
  logFilter: "all",
  detailsOpen: false,
  handbook: null,
  flash: "",
});

const ACTION_FEATURE = {
  foundation: "foundation",
  xuan: "foundation",
  focus: "foundation",
  explore: "explore",
  jade: "legacy",
  "trial-boon": "trial",
  "trial-herb": "trial",
};
export function requiredFeature(command, arg) {
  return (
    {
      plan: "plans",
      career: "career",
      study: "study",
      equip: "relics",
      pill: "alchemy",
      move: "regions",
      perk: "perks",
      reincarnate: "reincarnation",
    }[command] ||
    (command === "buy" ? (arg === "home" ? "home" : "food") : null) ||
    (command === "action" ? ACTION_FEATURE[arg] : null) ||
    (command === "tab" ? TAB_FEATURE[arg] : null) ||
    (command === "details"
      ? { plan: "plans", study: "study", life: "food" }[arg]
      : null)
  );
}

/** 每年检查一次新发现，快进不会越过首次介绍；故事仍由引擎优先暂停。 */
function advanceGuided(g, requested) {
  const count = Math.max(0, Math.min(400, Math.floor(requested)));
  const initialYear = g.worldYear;
  for (let i = 0; i < count && g.status === "playing" && !g.pending; i++) {
    game.advance(g, 1);
    const unlocked = syncUnlocks(g);
    if (unlocked.length && !g.meta.guide.muted) break;
  }
  return g.worldYear !== initialYear;
}

export function dispatch(g, ui, command, arg = "") {
  initializeGuide(g);
  const previousUnlockCount = g.meta.guide.unlocked.length;
  ui.flash = "";
  const feature = requiredFeature(command, arg);
  if (feature && !isUnlocked(g, feature)) {
    ui.flash = `${FEATURE_BY_ID[feature].title}尚未开放：${FEATURE_BY_ID[feature].unlockHint}。`;
    return { ok: false };
  }
  let ok = true;
  let scroll = null;
  switch (command) {
    case "tab":
      if (!["修行", "机缘", "应劫", "轮回", "设置"].includes(arg)) {
        ok = false;
        break;
      }
      ui.tab = arg;
      ui.detailsOpen = false;
      scroll = "top";
      break;
    case "details":
      ui.detailsOpen = true;
      scroll = {
        plan: ".plan-panel",
        study: ".study-panel",
        life: ".life-panel",
      }[arg];
      break;
    case "filter":
      ui.logFilter = arg;
      break;
    case "guide-open":
      ui.handbook = FEATURE_BY_ID[arg] ? arg : "all";
      break;
    case "guide-close":
      ui.handbook = null;
      break;
    case "guide-ack":
      ok = acknowledge(g, arg);
      break;
    case "guide-go": {
      const item = FEATURE_BY_ID[arg];
      if (!item || !isUnlocked(g, arg)) {
        ok = false;
        break;
      }
      acknowledge(g, arg);
      ui.handbook = null;
      ui.tab = item.tab;
      ui.detailsOpen = Boolean(
        item.section && ["plan", "study", "life"].includes(item.section),
      );
      scroll = item.section ? `[data-feature="${item.section}"]` : "top";
      break;
    }
    case "guide-mute":
      g.meta.guide.muted = true;
      break;
    case "guide-resume":
      g.meta.guide.muted = false;
      break;
    case "guide-replay":
      ui.tab = "修行";
      replayIntroductions(g);
      ui.handbook = null;
      scroll = "top";
      break;
    case "advance":
      ok = advanceGuided(g, arg === "next" ? nextDelta(g) : Number(arg));
      break;
    case "reply":
      ok = game.respond(g, arg);
      break;
    case "origin":
      ok = game.setOrigin(g, arg);
      break;
    case "career":
      ok = game.setCareer(g, arg);
      break;
    case "plan":
      ok = game.setPlan(g, arg);
      break;
    case "study":
      ok = game.setStudy(g, arg);
      break;
    case "buy":
      ok = game.buy(g, arg);
      break;
    case "perk":
      ok = game.buyPerk(g, arg);
      break;
    case "equip":
      ok = game.equip(g, arg);
      break;
    case "pill":
      ok = game.begin(g, "pill", arg);
      break;
    case "move":
      ok = game.begin(g, "move", arg);
      break;
    case "action":
      ok = game.begin(g, arg);
      break;
    case "reincarnate":
      ok = game.reincarnate(g);
      break;
    default:
      ok = false;
  }
  syncUnlocks(g);
  if (
    ok &&
    !scroll &&
    nextIntroduction(g) &&
    (g.meta.guide.unlocked.length > previousUnlockCount || command === "reply")
  )
    scroll = ".guide-card";
  if (!ok && !ui.flash)
    ui.flash =
      command === "action" || command === "pill" || command === "move"
        ? g.notice
        : "当前条件不足，或请先处理事件及进行中的行动。";
  return { ok, scroll };
}
