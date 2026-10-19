import test from "node:test";
import assert from "node:assert/strict";
import { createGame, respond, persist } from "../game.mjs";
import { initializeGuide, syncUnlocks } from "../application/onboarding.mjs";
import { createUiState, dispatch } from "../application/commands.mjs";
import {
  availableHints,
  hintForCommand,
} from "../application/notifications.mjs";
import {
  normalizePreferences,
  loadPreferences,
  savePreferences,
  confirmationFor,
  DEFAULT_PREFERENCES,
  PREFERENCES_KEY,
} from "../application/preferences.mjs";
import { renderApp } from "../ui/render.mjs";

function ready() {
  const g = createGame();
  respond(g, "xuan");
  initializeGuide(g);
  g.worldYear = 30;
  g.life.age = 46;
  g.life.realm = "炼气";
  g.life.money = 100;
  g.life.herbs = 6;
  g.life.qi = 1800;
  syncUnlocks(g);
  g.meta.guide.seen = [...g.meta.guide.unlocked];
  return g;
}
test("偏好只允许已知字段与正确类型，音量限制在0–100", () => {
  const p = normalizePreferences({
    music: true,
    sfx: "false",
    musicVolume: 250,
    sfxVolume: -20,
    injected: true,
  });
  assert.equal(p.music, true);
  assert.equal(p.sfx, true);
  assert.equal(p.musicVolume, 100);
  assert.equal(p.sfxVolume, 0);
  assert.equal(p.injected, undefined);
  assert.deepEqual(normalizePreferences(null), DEFAULT_PREFERENCES);
});
test("偏好独立持久化，不读取或覆盖游戏存档；失败仍可使用默认设置", () => {
  const entries = new Map([["bsjl-v12-current", "original-progress"]]);
  const storage = {
    getItem: (key) => entries.get(key),
    setItem: (key, value) => entries.set(key, value),
  };
  assert.equal(
    savePreferences(storage, { ...DEFAULT_PREFERENCES, largeText: true }),
    "",
  );
  assert.ok(entries.has(PREFERENCES_KEY));
  assert.equal(loadPreferences(storage).preferences.largeText, true);
  assert.equal(entries.get("bsjl-v12-current"), "original-progress");
  entries.set(PREFERENCES_KEY, "{broken");
  assert.ok(loadPreferences(storage).warning);
  assert.ok(
    savePreferences(
      {
        setItem() {
          throw Error();
        },
      },
      DEFAULT_PREFERENCES,
    ),
  );
});
test("红点必须同时满足功能开放、资源与行动资格，查询不修改游戏", () => {
  const g = ready(),
    before = persist(g);
  let hints = availableHints(g);
  assert.ok(hintForCommand(hints, "action", "foundation"));
  assert.ok(hintForCommand(hints, "pill", "common"));
  assert.ok(hintForCommand(hints, "tab", "应劫"));
  assert.equal(persist(g), before);
  g.life.money = 0;
  hints = availableHints(g);
  assert.equal(hintForCommand(hints, "action", "foundation"), "");
  assert.equal(hintForCommand(hints, "pill", "common"), "");
  g.life.money = 100;
  g.meta.guide.unlocked = [];
  assert.deepEqual(availableHints(g), []);
});
test("未读功能有红点，已读即消失，普通推进和已购买项目不反复提醒", () => {
  const g = ready();
  g.meta.guide.seen = g.meta.guide.seen.filter((id) => id !== "study");
  assert.ok(hintForCommand(availableHints(g), "details", "study"));
  g.meta.guide.seen.push("study");
  assert.equal(hintForCommand(availableHints(g), "details", "study"), "");
  assert.equal(hintForCommand(availableHints(g), "advance", "1"), "");
  g.life.food = "spirit";
  g.life.home = "cottage";
  assert.equal(hintForCommand(availableHints(g), "buy", "food"), "");
  assert.equal(hintForCommand(availableHints(g), "buy", "home"), "");
});
test("进行中的事件和行动不标记付费操作，永久传承不提示已拥有项目", () => {
  const g = ready();
  g.pending = "warning";
  assert.ok(
    !availableHints(g).some((h) => ["action", "buy", "pill"].includes(h.cmd)),
  );
  g.pending = null;
  g.life.action = { id: "explore", remaining: 1, total: 3 };
  assert.ok(
    !availableHints(g).some((h) => ["action", "buy", "pill"].includes(h.cmd)),
  );
  g.meta.rp = 10;
  syncUnlocks(g);
  g.meta.perks = ["learn"];
  assert.equal(hintForCommand(availableHints(g), "perk", "learn"), "");
  assert.ok(hintForCommand(availableHints(g), "perk", "meridian"));
});
test("快进与轮回确认只改变交互，不消耗年份或资源", () => {
  const g = ready(),
    before = persist(g),
    p = { ...DEFAULT_PREFERENCES, confirmYears: true };
  assert.ok(confirmationFor(g, p, "advance", "5", 3));
  assert.equal(confirmationFor(g, p, "advance", "1", 3), "");
  assert.ok(confirmationFor(g, p, "advance", "next", 3));
  assert.ok(confirmationFor(g, p, "reincarnate", "", 3));
  assert.equal(persist(g), before);
  assert.equal(
    confirmationFor(g, { ...p, confirmYears: false }, "advance", "5", 3),
    "",
  );
});
test("设置无需解锁，不显示快进栏；重看指引返回修行", () => {
  const g = createGame();
  respond(g, "xuan");
  initializeGuide(g);
  const ui = createUiState();
  assert.ok(dispatch(g, ui, "tab", "设置").ok);
  const html = renderApp(g, ui);
  assert.match(html, /settings-page/);
  assert.doesNotMatch(html, /class="next-buttons"/);
  assert.match(html, /role="switch"/);
  assert.match(html, /data-arg="设置"/);
  dispatch(g, ui, "guide-replay");
  assert.equal(ui.tab, "修行");
});
