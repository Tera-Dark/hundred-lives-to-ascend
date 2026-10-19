import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  respond,
  advance,
  begin,
  reincarnate,
  npcState,
  persist,
  restore,
} from "../game.mjs";

function choose(g) {
  const key = {
    intro: "xuan",
    materials18: "herbs",
    npc: "ignore",
    jade: "ok",
    materials34: "herbs",
    trial: "retreat",
    warning: "ok",
    past: "ok",
    "vein-warning": "ok",
    vein: "labor",
    tide: "face",
  }[g.pending];
  assert.ok(respond(g, key), g.pending);
}
function until(g, year, policy = () => {}) {
  for (
    let n = 0;
    n < 500 && g.status === "playing" && g.worldYear < year;
    n++
  ) {
    if (g.pending) choose(g);
    else {
      policy(g);
      advance(g, 1);
    }
  }
  return g;
}
const start = () => {
  const g = createGame();
  respond(g, "xuan");
  return g;
};

test("59年轮回仍登记60年世界历史，不向新身体追补旧灾劫", () => {
  const g = until(start(), 59);
  assert.ok(reincarnate(g));
  assert.equal(g.worldYear, 61);
  assert.equal(g.world.tide, "unwitnessed");
  choose(g);
  advance(g, 1);
  assert.notEqual(g.pending, "tide");
  assert.equal(g.status, "playing");
});
test("世界95与本世18年碰撞时，材料机会延期保留", () => {
  const g = start();
  until(g, 60, (x) => {
    if (
      x.worldYear >= 40 &&
      !x.life.pill &&
      x.life.money >= 55 &&
      x.life.herbs >= 5
    )
      begin(x, "pill", "common");
  });
  choose(g);
  assert.equal(g.world.tide, "survived");
  until(g, 75);
  reincarnate(g);
  choose(g);
  until(g, 95);
  assert.equal(g.pending, "vein");
  respond(g, "labor");
  assert.equal(g.pending, "materials18");
  assert.ok(g.life.flags.includes("materials18"));
  choose(g);
  until(g, 98);
  assert.ok(g.world.veinDone);
});
test("NPC合作挂起原探索，存取后仍可恢复并结算奖励", () => {
  let g = until(start(), 21);
  assert.ok(begin(g, "explore"));
  assert.equal(g.pending, "npc");
  assert.equal(g.life.action.remaining, 2);
  assert.ok(respond(g, "shen"));
  assert.equal(g.life.action.id, "explore");
  assert.equal(g.life.action.remaining, 2);
  g = restore(persist(g));
  until(g, 26);
  if (g.pending) choose(g);
  if (g.life.action) advance(g, 3);
  assert.ok(g.meta.relics.includes("G01"));
  assert.equal(g.life.action, null);
});
test("已故NPC不能通过本世合作事件再次立约", () => {
  const g = until(start(), 60);
  choose(g);
  reincarnate(g);
  choose(g);
  until(g, 84);
  assert.equal(npcState(g, "shen").alive, false);
  const money = g.life.money;
  assert.equal(respond(g, "shen"), false);
  assert.equal(g.life.money, money);
  assert.equal(g.pending, "npc");
  respond(g, "ignore");
});
test("迁居完成写入目标地区，并能安全读回存档", () => {
  const g = until(start(), 8);
  assert.ok(begin(g, "move", "valley"));
  assert.equal(g.life.region, "valley");
  assert.equal(restore(persist(g)).life.region, "valley");
});
