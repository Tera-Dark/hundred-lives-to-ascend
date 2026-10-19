import test from "node:test";
import assert from "node:assert/strict";
import { createGame, respond, persist } from "../game.mjs";
import { initializeGuide, syncUnlocks } from "../application/onboarding.mjs";
import { createSaveWriter } from "../application/storage.mjs";
import {
  inspectImport,
  commitReplacement,
  readReplacementBackup,
} from "../application/save-transfer.mjs";
import { createUiState, dispatch } from "../application/commands.mjs";
import {
  DEFAULT_PREFERENCES,
  confirmationFor,
} from "../application/preferences.mjs";
import { progressSnapshot, commandFeedback } from "../application/feedback.mjs";
import {
  createViewMemory,
  pageFromHash,
  allowedPage,
} from "../browser/view-state.mjs";
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
const memory = () => {
  const data = new Map(),
    writes = [];
  return {
    data,
    writes,
    getItem: (key) => data.get(key),
    setItem(key, value) {
      writes.push(key);
      data.set(key, value);
    },
  };
};
test("保存去重，相同状态与重复绘制不写盘，失败时可以重试", () => {
  const store = memory(),
    g = ready(),
    writer = createSaveWriter(store, "game");
  writer.write(g);
  writer.write(g);
  writer.write(JSON.parse(persist(g)));
  assert.equal(store.writes.length, 1);
  g.life.money++;
  writer.write(g);
  assert.equal(store.writes.length, 2);
  let fail = true;
  const flaky = createSaveWriter(
    {
      setItem() {
        if (fail) throw Error();
      },
    },
    "game",
  );
  assert.ok(flaky.write(g));
  fail = false;
  assert.equal(flaky.write(g), "");
});
test("坏档和过大导入不能替换进度；有效旧档仍可迁移", () => {
  assert.ok(inspectImport("{broken").error);
  assert.ok(inspectImport("x".repeat(1024 * 1024 + 1)).error);
  const g = ready();
  g.version = 2;
  delete g.meta.guide;
  const result = inspectImport(persist(g));
  assert.equal(result.error, "");
  assert.equal(result.game.version, 3);
  assert.equal(result.game.worldYear, 30);
});
test("替换严格先备份后写入，备份失败不覆盖，备份可以再次恢复", () => {
  const store = memory(),
    current = ready(),
    next = ready();
  next.life.money = 999;
  store.data.set("game", persist(current));
  assert.equal(commitReplacement(store, "game", current, next).ok, true);
  assert.deepEqual(store.writes, ["game-before-replace", "game"]);
  const backup = readReplacementBackup(store, "game");
  assert.equal(backup.game.life.money, current.life.money);
  assert.equal(commitReplacement(store, "game", next, backup.game).ok, true);
  assert.equal(
    JSON.parse(store.data.get("game")).life.money,
    current.life.money,
  );
  const before = store.data.get("game");
  const blocked = {
    getItem: (key) => store.data.get(key),
    setItem() {
      throw Error();
    },
  };
  assert.equal(commitReplacement(blocked, "game", current, next).ok, false);
  assert.equal(store.data.get("game"), before);
});
test("浏览记忆限于有效页面与有限滚动值，锁定页不能通过hash提前打开", () => {
  const store = memory(),
    view = createViewMemory(store, "slot");
  view.remember("机缘", 430, true);
  view.save();
  const loaded = createViewMemory(store, "slot");
  assert.equal(loaded.page, "机缘");
  assert.equal(loaded.position("机缘"), 430);
  assert.equal(pageFromHash("#settings"), "设置");
  assert.equal(pageFromHash("#unknown"), undefined);
  const g = createGame();
  respond(g, "xuan");
  initializeGuide(g);
  assert.equal(allowedPage(g, "应劫"), false);
  assert.equal(allowedPage(g, "设置"), true);
});
test("常用日程和机会直接可见，折叠管理不生成隐藏控件，关闭插画不生成图片", () => {
  const g = ready(),
    ui = createUiState();
  ui.preferences = { ...DEFAULT_PREFERENCES, showScenery: false };
  const closed = renderApp(g, ui);
  assert.match(closed, /quick-plan-options/);
  assert.match(closed, /现在可做/);
  assert.doesNotMatch(closed, /class="study-panel"/);
  assert.doesNotMatch(closed, /<img /);
  assert.doesNotMatch(closed, /class="world-scene"/);
  ui.detailsOpen = true;
  assert.match(renderApp(g, ui), /study-panel/);
});
test("机会入口只定位不花费；跨年付费确认使用真实条件", () => {
  const g = ready(),
    ui = createUiState(),
    before = progressSnapshot(g);
  dispatch(g, ui, "guide-go", "home");
  assert.equal(ui.detailsOpen, true);
  assert.deepEqual(progressSnapshot(g), before);
  assert.match(
    confirmationFor(g, DEFAULT_PREFERENCES, "action", "foundation", 2),
    /2年.*45灵石/,
  );
  g.life.money = 0;
  assert.equal(
    confirmationFor(g, DEFAULT_PREFERENCES, "action", "foundation", 2),
    "",
  );
});
test("结果提示反映真实资源差额，不把跨世重置显示为当世亏损", () => {
  const g = ready(),
    before = progressSnapshot(g);
  g.worldYear++;
  g.life.money += 3.5;
  g.life.qi += 40;
  const text = commandFeedback(before, g, "advance", "1");
  assert.match(text, /度过1年/);
  assert.match(text, /灵石\+3.5/);
  assert.match(text, /修为\+40/);
  g.life.id++;
  assert.match(commandFeedback(before, g, "reincarnate", ""), /第2世开始/);
});

test("替换写入失败时保留原存档和已创建的备份", () => {
  const store = memory(),
    current = ready(),
    next = ready();
  next.life.money = 500;
  store.data.set("game", persist(current));
  const limited = {
    getItem: (key) => store.data.get(key),
    setItem(key, value) {
      if (key === "game") throw Error("quota");
      store.data.set(key, value);
    },
  };
  const result = commitReplacement(limited, "game", current, next);
  assert.equal(result.ok, false);
  assert.equal(store.data.get("game"), persist(current));
  assert.equal(store.data.get("game-before-replace"), persist(current));
});
