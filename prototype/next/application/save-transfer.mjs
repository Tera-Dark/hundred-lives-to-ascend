import { persist } from "../game.mjs";
import { decodeSave } from "../engine/persistence.mjs";
import { initializeGuide } from "./onboarding.mjs";
export const MAX_IMPORT_BYTES = 1024 * 1024;
export function inspectImport(raw) {
  if (
    typeof raw !== "string" ||
    new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES
  )
    return { error: "文件过大，请选择本游戏导出的JSON存档（不超过1MB）。" };
  const result = decodeSave(raw);
  if (result.error || !result.existing)
    return { error: "这不是有效的游戏存档，现有进度保持不变。" };
  initializeGuide(result.game, { existing: result.existing });
  return { game: result.game, error: "" };
}
export function readReplacementBackup(storage, key) {
  try {
    const raw = storage.getItem(`${key}-before-replace`);
    return raw ? inspectImport(raw) : { error: "还没有可恢复的替换前备份。" };
  } catch {
    return { error: "备份暂不可读取。" };
  }
}
/** 先保存原始内容再替换；任一步失败都不改变运行中的人物。 */
export function commitReplacement(storage, key, current, replacement) {
  try {
    const previous = storage.getItem(key) || persist(current);
    storage.setItem(`${key}-before-replace`, previous);
    storage.setItem(key, persist(replacement));
    return { ok: true, error: "" };
  } catch {
    return {
      ok: false,
      error: "备份或写入失败，当前进度没有替换。可先导出再重试。",
    };
  }
}
