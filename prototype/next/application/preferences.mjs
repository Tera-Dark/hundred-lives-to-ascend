import { actionStatus } from "../game.mjs";
/** 本机体验设置独立于游戏存档，不随轮回或重开重置。 */
export const PREFERENCES_KEY = "bsjl-device-preferences-v1";
export const DEFAULT_PREFERENCES = Object.freeze({
  music: false,
  sfx: true,
  musicVolume: 30,
  sfxVolume: 45,
  haptics: false,
  redDots: true,
  largeText: false,
  reduceMotion: true,
  showScenery: true,
  confirmYears: false,
  confirmRebirth: true,
  confirmActions: true,
  compactLayout: true,
  rememberPage: true,
  keyboardShortcuts: true,
  feedback: true,
});
export function normalizePreferences(value = {}) {
  const result = { ...DEFAULT_PREFERENCES };
  for (const [key, initial] of Object.entries(result)) {
    if (typeof initial === "boolean" && typeof value?.[key] === "boolean")
      result[key] = value[key];
    if (typeof initial === "number" && Number.isFinite(value?.[key]))
      result[key] = Math.max(0, Math.min(100, Math.round(value[key])));
  }
  return result;
}
export function loadPreferences(storage) {
  try {
    return {
      preferences: normalizePreferences(
        JSON.parse(storage.getItem(PREFERENCES_KEY) || "{}"),
      ),
      warning: "",
    };
  } catch {
    return {
      preferences: { ...DEFAULT_PREFERENCES },
      warning: "体验设置暂不可读取，当前使用默认值。",
    };
  }
}
export function savePreferences(storage, preferences) {
  try {
    storage.setItem(
      PREFERENCES_KEY,
      JSON.stringify(normalizePreferences(preferences)),
    );
    return "";
  } catch {
    return "体验设置未能保存，当前会话内仍然生效。";
  }
}
export function confirmationFor(g, preferences, cmd, arg, next) {
  if (
    cmd === "reincarnate" &&
    g.status === "playing" &&
    preferences.confirmRebirth
  )
    return "主动轮回会结束此世，现金、职业和本世功法将重置。确定进入下一世？";
  if (
    cmd === "advance" &&
    preferences.confirmYears &&
    Number(arg === "next" ? next : arg) > 1
  )
    return `将最多推进${arg === "next" ? next : arg}年，消耗相同寿元；事件和新功能仍会中途暂停。确定继续？`;
  if (preferences.confirmActions && ["action", "pill", "move"].includes(cmd)) {
    const check = actionStatus(
      g,
      cmd === "action" ? arg : cmd,
      cmd === "action" ? "" : arg,
    );
    if (check.ok) {
      const c = check.spec,
        costs = [];
      for (const [key, label] of [
        ["money", "灵石"],
        ["herbs", "灵材"],
        ["qi", "修为"],
      ])
        if (c[key]) costs.push(`${c[key]}${label}`);
      return `此行动将占用${c.time}年日程${costs.length ? `，消耗${costs.join("、")}` : ""}。期间不领取普通日程产出，确定开始？`;
    }
  }
  return "";
}
