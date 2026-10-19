import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  advance,
  respond,
  reincarnate,
  persist,
  restore,
  actionStatus,
  begin,
} from "../game.mjs";
import { FEATURES } from "../content/features.mjs";
import {
  initializeGuide,
  syncUnlocks,
  isUnlocked,
  nextIntroduction,
} from "../application/onboarding.mjs";
import { dispatch, createUiState } from "../application/commands.mjs";
import {
  loadGame,
  saveGame,
  storageKey,
  SAVE_KEY,
} from "../application/storage.mjs";
import { renderApp } from "../ui/render.mjs";

const start = () => {
  const g = createGame(),
    ui = createUiState();
  initializeGuide(g);
  dispatch(g, ui, "reply", "xuan");
  return { g, ui };
};

test("开局只开放基础修炼，锁定操作不能提前扣款或执行", () => {
  const { g, ui } = start();
  assert.deepEqual(g.meta.guide.unlocked, ["time"]);
  const before = persist(g);
  for (const [cmd, arg] of [
    ["plan", "cultivate"],
    ["career", "herbal"],
    ["study", "herbs"],
    ["buy", "food"],
    ["buy", "home"],
    ["action", "explore"],
    ["move", "valley"],
    ["equip", "W01"],
    ["tab", "机缘"],
    ["pill", "common"],
  ])
    assert.equal(dispatch(g, ui, cmd, arg).ok, false);
  assert.equal(persist(g), before);
});
test("快进在首次开放的年份停下，介绍顺序可逐项确认", () => {
  const { g, ui } = start();
  assert.equal(nextIntroduction(g).id, "time");
  dispatch(g, ui, "guide-ack", "time");
  dispatch(g, ui, "advance", "5");
  assert.equal(g.worldYear, 1);
  assert.ok(isUnlocked(g, "plans"));
  assert.equal(nextIntroduction(g).id, "plans");
  const route = dispatch(g, ui, "guide-go", "plans");
  assert.equal(ui.detailsOpen, true);
  assert.equal(ui.tab, "修行");
  assert.match(route.scroll, /plan/);
  dispatch(g, ui, "plan", "cultivate");
  assert.equal(g.life.plan, "cultivate");
  dispatch(g, ui, "advance", "5");
  assert.equal(g.worldYear, 2);
  assert.ok(isUnlocked(g, "career"));
  dispatch(g, ui, "advance", "5");
  assert.equal(g.worldYear, 3);
  assert.ok(isUnlocked(g, "study"));
  dispatch(g, ui, "advance", "5");
  assert.equal(g.worldYear, 4);
  assert.ok(isUnlocked(g, "food"));
});
test("提前阅读、收起或重看提示不会赠送资源或提前开放功能", () => {
  const { g, ui } = start();
  const before = { money: g.life.money, year: g.worldYear, qi: g.life.qi };
  dispatch(g, ui, "guide-open", "alchemy");
  assert.equal(ui.handbook, "alchemy");
  assert.equal(dispatch(g, ui, "guide-go", "alchemy").ok, false);
  dispatch(g, ui, "guide-mute");
  assert.equal(nextIntroduction(g), null);
  assert.deepEqual(
    { money: g.life.money, year: g.worldYear, qi: g.life.qi },
    before,
  );
  dispatch(g, ui, "advance", "5");
  assert.equal(g.worldYear, 5);
  assert.equal(isUnlocked(g, "alchemy"), false);
  dispatch(g, ui, "guide-replay");
  assert.equal(nextIntroduction(g).id, "time");
});
test("剧情优先于功能介绍，不会以引导覆盖重大事件", () => {
  const { g } = start();
  g.pending = "materials18";
  assert.equal(nextIntroduction(g), null);
  assert.match(renderApp(g, createUiState()), /药庐的委托/);
});
test("全部19项功能都有条件、基础介绍、提示和可达目标", () => {
  assert.equal(FEATURES.length, 19);
  const { g } = start();
  g.life.id = 2;
  g.life.realm = "筑基";
  g.life.jade = true;
  g.worldYear = 100;
  g.meta.rp = 6;
  g.meta.perks.push("auto");
  syncUnlocks(g);
  assert.equal(g.meta.guide.unlocked.length, FEATURES.length);
  for (const item of FEATURES) {
    assert.ok(item.intro.length >= 2);
    assert.ok(item.tip);
    assert.ok(item.unlockHint);
    assert.ok(["修行", "机缘", "应劫", "轮回"].includes(item.tab));
  }
});
test("轮回和读档保留开放及已读状态，新身体不被重新锁回开局", () => {
  const { g, ui } = start();
  dispatch(g, ui, "guide-mute");
  while (g.worldYear < 25) {
    if (g.pending)
      respond(
        g,
        { materials18: "herbs", npc: "ignore", jade: "ok" }[g.pending],
      );
    else dispatch(g, ui, "advance", "1");
  }
  const unlocked = [...g.meta.guide.unlocked];
  dispatch(g, ui, "guide-ack", "plans");
  assert.ok(dispatch(g, ui, "reincarnate").ok);
  assert.equal(g.life.id, 2);
  assert.ok(isUnlocked(g, "perks"));
  assert.ok(isUnlocked(g, "history"));
  for (const id of unlocked) assert.ok(isUnlocked(g, id));
  const loaded = restore(persist(g));
  initializeGuide(loaded);
  assert.ok(loaded.meta.guide.seen.includes("plans"));
});
test("v2旧存档迁移到v3，保留原进度并免去批量补弹介绍", () => {
  const g = createGame();
  respond(g, "xuan");
  advance(g, 7);
  g.version = 2;
  const raw = persist(g);
  const memory = new Map([[SAVE_KEY, raw]]);
  const loaded = loadGame({
    getItem: (k) => memory.get(k),
    setItem: (k, v) => memory.set(k, v),
  });
  assert.equal(loaded.game.version, 3);
  assert.equal(loaded.game.worldYear, 7);
  assert.equal(loaded.game.life.money, g.life.money);
  assert.ok(isUnlocked(loaded.game, "regions"));
  assert.ok(isUnlocked(loaded.game, "reincarnation"));
  assert.equal(nextIntroduction(loaded.game), null);
});
test("残缺存档安全拒绝，原始内容先备份后才能覆盖", () => {
  const raw = JSON.stringify({
    version: 2,
    worldYear: 1,
    life: {},
    meta: {},
    world: {},
    journal: [],
  });
  const memory = new Map([[SAVE_KEY, raw]]),
    storage = {
      getItem: (k) => memory.get(k),
      setItem: (k, v) => memory.set(k, v),
    };
  const loaded = loadGame(storage);
  assert.equal(loaded.game.pending, "intro");
  assert.match(loaded.warning, /备份/);
  assert.ok(
    [...memory].some(([k, v]) => k.includes("-recovery-") && v === raw),
  );
  assert.equal(saveGame(storage, SAVE_KEY, loaded.game), "");
  assert.equal(JSON.parse(memory.get(SAVE_KEY)).version, 3);
});
test("备份失败时保护原始存档，独立体验槽不覆盖默认玩家", () => {
  const loaded = loadGame({
    getItem: () => "{bad",
    setItem: () => {
      throw Error("quota");
    },
  });
  assert.equal(loaded.writeProtected, true);
  assert.match(loaded.warning, /停止覆盖/);
  assert.notEqual(storageKey("?slot=guide-test"), SAVE_KEY);
  assert.equal(storageKey("?slot=../../bad"), SAVE_KEY);
});
test("行动条件查询没有推进、扣款或日志副作用", () => {
  const { g } = start();
  const before = persist(g);
  assert.equal(actionStatus(g, "foundation").ok, false);
  assert.equal(persist(g), before);
});
test("新视图可渲染四页与全部功能手册，不依赖浏览器全局", () => {
  const { g, ui } = start();
  g.worldYear = 100;
  g.life.id = 2;
  g.life.realm = "筑基";
  g.life.jade = true;
  g.meta.rp = 6;
  g.meta.perks.push("auto");
  syncUnlocks(g);
  for (const tab of ["修行", "机缘", "应劫", "轮回"]) {
    ui.tab = tab;
    assert.ok(renderApp(g, ui).length > 1000);
  }
  ui.handbook = "all";
  assert.match(renderApp(g, ui), /已开放 19 \/ 19/);
});
