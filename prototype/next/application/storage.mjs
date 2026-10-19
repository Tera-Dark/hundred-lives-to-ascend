import { createGame, persist } from "../game.mjs";
import { decodeSave } from "../engine/persistence.mjs";
import { initializeGuide } from "./onboarding.mjs";

export const SAVE_KEY = "bsjl-v12-current";
export function storageKey(search = "") {
  const slot = new URLSearchParams(search).get("slot");
  // 独立试玩/浏览器验收槽；默认键始终兼容已有玩家。
  return slot && /^[a-z0-9-]{1,32}$/.test(slot)
    ? `${SAVE_KEY}-${slot}`
    : SAVE_KEY;
}

export function loadGame(storage, key = SAVE_KEY) {
  let raw;
  try {
    raw = storage.getItem(key);
  } catch {
    const g = createGame();
    initializeGuide(g);
    return { game: g, warning: "本地存档不可用，可继续游玩并导出进度。" };
  }
  const result = decodeSave(raw);
  initializeGuide(result.game, { existing: result.existing });
  let warning = result.error || "";
  if (result.error && raw) {
    try {
      storage.setItem(`${key}-recovery-${Date.now()}`, raw);
      warning = "原始存档已另存为恢复备份，当前使用新开局。";
    } catch {
      return {
        game: result.game,
        warning: "存档无法读取且备份失败，已停止覆盖原始存档；可导出当前进度。",
        writeProtected: true,
      };
    }
  }
  return { game: result.game, warning };
}

export function saveGame(storage, key, g) {
  try {
    storage.setItem(key, persist(g));
    return "";
  } catch {
    return "本地保存失败，请先导出进度，避免关闭后丢失。";
  }
}

/** 只由游戏变更调用；相同快照不重复写入，失败后允许重试。 */
export function createSaveWriter(storage, key) {
  let last = null;
  return {
    write(g) {
      const serialized = persist(g);
      if (last === serialized) return "";
      try {
        storage.setItem(key, serialized);
        last = serialized;
        return "";
      } catch {
        return "本地保存失败，请先导出进度，避免关闭后丢失。";
      }
    },
    accept(g) {
      last = persist(g);
    },
  };
}
