/** 浏览器协调入口：游戏命令、视图记忆、设备偏好、存档传输。 */
import { createGame, persist } from "./game.mjs";
import {
  loadGame,
  createSaveWriter,
  storageKey,
} from "./application/storage.mjs";
import { initializeGuide } from "./application/onboarding.mjs";
import { createUiState, dispatch } from "./application/commands.mjs";
import {
  loadPreferences,
  savePreferences,
  DEFAULT_PREFERENCES,
  confirmationFor,
} from "./application/preferences.mjs";
import { nextDelta } from "./application/selectors.mjs";
import {
  progressSnapshot,
  commandFeedback,
  MUTATING_COMMANDS,
} from "./application/feedback.mjs";
import {
  inspectImport,
  commitReplacement,
  readReplacementBackup,
  MAX_IMPORT_BYTES,
} from "./application/save-transfer.mjs";
import { createAudioFeedback } from "./browser/audio.mjs";
import {
  decorateNotifications,
  controlIdentity,
  findControl,
  trapDialogKey,
} from "./browser/dom.mjs";
import {
  createViewMemory,
  PAGE_HASH,
  pageFromHash,
  allowedPage,
} from "./browser/view-state.mjs";
import { renderApp } from "./ui/render.mjs";

const root = document.getElementById("app");
const key = storageKey(location.search);
const unavailable = {
  getItem() {
    throw Error("unavailable");
  },
  setItem() {
    throw Error("unavailable");
  },
};
let storage, session;
try {
  storage = window.localStorage;
} catch {
  storage = unavailable;
}
try {
  session = window.sessionStorage;
} catch {
  session = unavailable;
}
const loaded = loadGame(storage, key),
  writer = createSaveWriter(storage, key);
let game = loaded.game,
  warning = loaded.warning,
  writeProtected = Boolean(loaded.writeProtected);
let ui = createUiState(),
  preferenceWarning = "",
  preferences;
({ preferences, warning: preferenceWarning } = loadPreferences(storage));
const memory = createViewMemory(session, key);
const initialPage =
  pageFromHash(location.hash) ||
  (preferences.rememberPage ? memory.page : "修行");
if (game.pending !== "intro" && allowedPage(game, initialPage))
  ui.tab = initialPage;
ui.detailsOpen = preferences.rememberPage && memory.details;
ui.hasBackup = Boolean(readReplacementBackup(storage, key).game);
let opener = null,
  toastTimer,
  scrollTimer,
  preferenceDirty = false;
const audio = createAudioFeedback({ onChange: updateAudioStatus });
function updateAudioStatus() {
  const status = root.querySelector("[data-audio-status]");
  if (status)
    status.textContent =
      audio.status ||
      (preferences.music
        ? "点击任意按钮恢复《古琴幽篁》。"
        : "音乐默认关闭；切到后台暂停，返回后继续。");
}
function sound(kind = "tap") {
  void audio.unlock(preferences).then(() => {
    audio.play(kind);
    updateAudioStatus();
  });
}
function persistGame() {
  if (writeProtected) return;
  warning = writer.write(game);
  if (!warning)
    ui.savedAt = `已保存 ${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`;
}
function remember() {
  memory.remember(ui.tab, window.scrollY, ui.detailsOpen);
  memory.save();
}
function paint({ focusDialog = false } = {}) {
  const identity = controlIdentity(document.activeElement);
  const hadDialog = Boolean(root.querySelector('[role="dialog"]'));
  ui.preferences = preferences;
  ui.audioStatus = audio.status;
  const html = document.documentElement;
  for (const [attribute, value] of Object.entries({
    largeText: preferences.largeText,
    reduceMotion: preferences.reduceMotion,
    scenery: preferences.showScenery,
    compact: preferences.compactLayout,
  }))
    html.dataset[attribute] = String(value);
  root.innerHTML = renderApp(
    game,
    ui,
    [
      warning,
      preferenceWarning,
      ui.externalChanged
        ? "此存档已在另一个窗口更新。请刷新后继续，避免覆盖新进度。"
        : "",
    ]
      .filter(Boolean)
      .join(" "),
  );
  decorateNotifications(root, game, preferences.redDots);
  if (ui.externalChanged)
    for (const button of root.querySelectorAll("button[data-cmd]"))
      if (MUTATING_COMMANDS.has(button.dataset.cmd)) button.disabled = true;
  const musicButton = root.querySelector(".music-shortcut");
  if (musicButton) {
    musicButton.setAttribute("aria-pressed", String(preferences.music));
    musicButton.setAttribute(
      "aria-label",
      preferences.music ? "暂停背景音乐" : "开启背景音乐",
    );
  }
  const dialog = root.querySelector('[role="dialog"]');
  html.classList.toggle("modal-open", Boolean(dialog));
  if (dialog && (!hadDialog || focusDialog)) {
    if (!hadDialog && identity) opener = identity;
    dialog
      .querySelector("button:not(:disabled)")
      ?.focus({ preventScroll: true });
  } else if (!dialog && hadDialog) {
    findControl(root, opener)?.focus({ preventScroll: true });
    opener = null;
  } else findControl(root, identity)?.focus({ preventScroll: true });
}
function toast(message, error = false) {
  if (!message || (!preferences.feedback && !error)) return;
  const target = root.querySelector(".toast");
  if (!target) return;
  clearTimeout(toastTimer);
  target.textContent = message;
  target.hidden = false;
  target.classList.toggle("is-error", error);
  toastTimer = setTimeout(
    () => {
      const visible = root.querySelector(".toast");
      if (visible) visible.hidden = true;
    },
    error ? 6500 : 4000,
  );
}
function persistPreferences() {
  preferenceWarning = savePreferences(storage, preferences);
  preferenceDirty = false;
}
function exportProgress() {
  const url = URL.createObjectURL(
      new Blob([persist(game)], { type: "application/json" }),
    ),
    link = document.createElement("a");
  link.href = url;
  link.download = `百世劫录-世界${game.worldYear}年.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("进度已导出，可保留这份文件作备份。");
  sound("success");
}
function historyPage(replace = false) {
  const url = `${location.pathname}${location.search}#${PAGE_HASH[ui.tab]}`;
  if (location.hash !== `#${PAGE_HASH[ui.tab]}`)
    (replace
      ? history.replaceState.bind(history)
      : history.pushState.bind(history))({ page: ui.tab }, "", url);
}
function scrollToResult(result, oldPage, command) {
  if (result.scroll && result.scroll !== "top") {
    requestAnimationFrame(() => {
      const target = root.querySelector(result.scroll);
      target?.scrollIntoView({
        block: "start",
        behavior: preferences.reduceMotion ? "instant" : "smooth",
      });
      const heading = target?.querySelector("h2");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    });
  } else if (
    command === "tab" &&
    oldPage !== ui.tab &&
    preferences.rememberPage
  )
    window.scrollTo({ top: memory.position(ui.tab), behavior: "instant" });
  else if (result.scroll === "top")
    window.scrollTo({ top: 0, behavior: "instant" });
}
function previewReplacement(next, label) {
  const l = next.life;
  ui.confirm = {
    cmd: "import-apply",
    arg: "",
    candidate: next,
    message: `${label}\n第${l.id}世 · 世界${next.worldYear}年 · ${l.realm}\n寿元${l.age}/${l.lifeCap} · 灵石${Number(l.money).toFixed(1)}\n将替换当前槽进度，当前进度会先保存为可恢复备份。设备设置保持不变。`,
  };
  paint({ focusDialog: true });
}
function replaceGame(next) {
  const result = commitReplacement(storage, key, game, next);
  if (!result.ok) {
    ui.confirm = null;
    paint();
    toast(result.error, true);
    return;
  }
  game = next;
  writer.accept(game);
  writeProtected = false;
  warning = "";
  ui = createUiState();
  ui.tab = game.pending === "intro" ? "修行" : "设置";
  ui.hasBackup = true;
  ui.savedAt = "已导入并保存";
  memory.remember(ui.tab, 0, false);
  memory.save();
  historyPage(true);
  paint({ focusDialog: true });
  window.scrollTo({ top: 0 });
  sound("success");
  toast("替换完成；可在设置中恢复替换前备份。");
}
function execute(
  command,
  arg = "",
  { confirmed = false, candidate = null } = {},
) {
  if (
    ui.externalChanged &&
    (MUTATING_COMMANDS.has(command) ||
      ["reset", "import-apply"].includes(command))
  ) {
    toast("请先刷新此窗口，载入另一窗口的新进度。", true);
    return;
  }
  const selected = {
    plan: game.life.plan,
    study: game.life.study,
    career: game.life.career,
  };
  if (Object.hasOwn(selected, command) && selected[command] === arg) {
    sound();
    toast("当前已经采用此安排。");
    return;
  }
  if (command === "reload") {
    location.reload();
    return;
  }
  if (command === "preference" || command === "preferences-reset") {
    if (command === "preferences-reset")
      preferences = { ...DEFAULT_PREFERENCES };
    else if (typeof preferences[arg] === "boolean")
      preferences[arg] = !preferences[arg];
    persistPreferences();
    audio.update(preferences);
    paint();
    sound();
    return;
  }
  if (command === "audio-test") {
    sound(
      ["tap", "success", "event", "breakthrough", "error"].includes(arg)
        ? arg
        : "success",
    );
    return;
  }
  if (command === "music-restart") {
    if (preferences.music)
      void audio.unlock(preferences).then(() => audio.restartMusic());
    return;
  }
  if (command === "save") {
    exportProgress();
    return;
  }
  if (command === "import-open") {
    root.querySelector("#save-import")?.click();
    return;
  }
  if (command === "backup-restore") {
    const backup = readReplacementBackup(storage, key);
    if (backup.error) {
      toast(backup.error, true);
      return;
    }
    previewReplacement(backup.game, "恢复替换前备份");
    return;
  }
  if (command === "confirm-cancel") {
    ui.confirm = null;
    paint();
    sound();
    return;
  }
  if (command === "confirm-accept") {
    const pending = ui.confirm;
    if (!pending) return;
    ui.confirm = null;
    execute(pending.cmd, pending.arg, {
      confirmed: true,
      candidate: pending.candidate,
    });
    return;
  }
  if (command === "import-apply") {
    if (confirmed && candidate) replaceGame(candidate);
    return;
  }
  if (command === "reset") {
    if (
      !window.confirm(
        "重开当前世界？现有进度会先存为可恢复备份。建议另行导出重要进度。",
      )
    )
      return;
    const next = createGame();
    initializeGuide(next);
    replaceGame(next);
    return;
  }
  if (!confirmed) {
    const message = confirmationFor(
      game,
      preferences,
      command,
      arg,
      nextDelta(game),
    );
    if (message) {
      ui.confirm = { cmd: command, arg, message };
      paint({ focusDialog: true });
      sound();
      return;
    }
  }
  const oldPage = ui.tab,
    before = progressSnapshot(game),
    oldRealm = game.life.realm;
  if (command === "tab" || command === "guide-go" || command === "guide-replay")
    remember();
  const result = dispatch(game, ui, command, arg);
  if (result.ok && MUTATING_COMMANDS.has(command)) persistGame();
  if (command === "tab" && result.ok) {
    ui.detailsOpen =
      preferences.rememberPage && ui.tab === "修行" ? memory.details : false;
    historyPage();
  } else if (oldPage !== ui.tab) historyPage();
  paint({ focusDialog: command === "guide-open" });
  scrollToResult(result, oldPage, command);
  if (result.ok) {
    sound(
      game.pending
        ? "event"
        : oldRealm !== game.life.realm
          ? "breakthrough"
          : game.worldYear !== before.year ||
              ["buy", "equip", "perk"].includes(command)
            ? "success"
            : "tap",
    );
    if (preferences.haptics && navigator.vibrate) navigator.vibrate(12);
    if (MUTATING_COMMANDS.has(command))
      toast(commandFeedback(before, game, command, arg));
  } else {
    sound("error");
    toast(ui.flash || "当前条件不足。", true);
  }
}
root.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-cmd]");
  if (button && !button.disabled)
    execute(button.dataset.cmd, button.dataset.arg || "");
});
root.addEventListener(
  "toggle",
  (event) => {
    if (
      !event.target.matches?.(".management") ||
      event.target.open === ui.detailsOpen
    )
      return;
    ui.detailsOpen = event.target.open;
    remember();
    paint();
  },
  true,
);
root.addEventListener("input", (event) => {
  const field = event.target.dataset.volume;
  if (!["musicVolume", "sfxVolume"].includes(field)) return;
  preferences[field] = Math.max(0, Math.min(100, Number(event.target.value)));
  preferenceDirty = true;
  audio.update(preferences);
  const output = root.querySelector(`[data-volume-label="${field}"]`);
  if (output) output.textContent = `${preferences[field]}%`;
  updateAudioStatus();
});
root.addEventListener("change", async (event) => {
  if (event.target.dataset.volume) {
    persistPreferences();
    if (preferenceWarning) toast(preferenceWarning, true);
    return;
  }
  if (event.target.id !== "save-import") return;
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    toast("请选择不超过1MB的JSON存档。", true);
    return;
  }
  try {
    const result = inspectImport(await file.text());
    if (result.error) toast(result.error, true);
    else previewReplacement(result.game, `导入：${file.name}`);
  } catch {
    toast("文件读取失败，当前进度没有改变。", true);
  }
});
document.addEventListener("keydown", (event) => {
  const dialog = root.querySelector('[role="dialog"]');
  if (dialog) {
    if (event.key === "Escape" && !game.pending) {
      if (ui.confirm) execute("confirm-cancel");
      else if (ui.handbook) execute("guide-close");
      event.preventDefault();
      return;
    }
    trapDialogKey(event, dialog);
    return;
  }
  if (
    !preferences.keyboardShortcuts ||
    event.repeat ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.target.matches('input,textarea,select,[contenteditable="true"]')
  )
    return;
  const pages = Object.keys(PAGE_HASH),
    index = Number(event.key) - 1;
  if (index >= 0 && index < 5 && allowedPage(game, pages[index])) {
    execute("tab", pages[index]);
    event.preventDefault();
  } else if (event.key.toLowerCase() === "n" && ui.tab !== "设置") {
    execute("advance", "1");
    event.preventDefault();
  } else if (event.key.toLowerCase() === "m") {
    execute("preference", "music");
    event.preventDefault();
  }
});
window.addEventListener(
  "scroll",
  () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(remember, 180);
  },
  { passive: true },
);
window.addEventListener("popstate", () => {
  const page = pageFromHash(location.hash) || "修行";
  if (!allowedPage(game, page)) return;
  remember();
  ui.tab = page;
  ui.detailsOpen =
    preferences.rememberPage && page === "修行" ? memory.details : false;
  ui.handbook = null;
  ui.confirm = null;
  paint();
  window.scrollTo({
    top: preferences.rememberPage ? memory.position(page) : 0,
  });
});
window.addEventListener("storage", (event) => {
  if (event.key === key && event.newValue && event.newValue !== persist(game)) {
    writeProtected = true;
    ui.externalChanged = true;
    paint();
    toast("另一窗口更新了存档，请刷新后继续。", true);
  }
});
window.addEventListener("pagehide", () => {
  remember();
  if (preferenceDirty) persistPreferences();
});
persistGame();
historyPage(true);
paint({ focusDialog: true });
if (preferences.rememberPage && !game.pending)
  requestAnimationFrame(() =>
    window.scrollTo({ top: memory.position(ui.tab), behavior: "instant" }),
  );
