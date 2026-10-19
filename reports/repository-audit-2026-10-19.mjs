/**
 * 1614017 版本的评估复现脚本，不是要求保留缺陷行为的回归测试。
 * node reports/repository-audit-2026-10-19.mjs
 * 只在内存中运行，不修改游戏源码、浏览器存档或远程仓库。
 * 修复缺陷后，相应观察断言应失败；届时应将正确行为写进正式测试。
 */
import assert from 'node:assert/strict';
import * as M from '../prototype/next/game.mjs';

function chooseDefault(g) {
  const keys = {
    intro: 'xuan', materials18: 'herbs', npc: 'ignore', jade: 'ok',
    materials34: 'herbs', trial: 'retreat', warning: 'ok', past: 'ok',
    'vein-warning': 'ok', tide: 'face', vein: 'labor',
  };
  assert.equal(M.respond(g, keys[g.pending]), true, `事件：${g.pending}`);
}

function start() {
  const g = M.createGame();
  assert.equal(M.respond(g, 'xuan'), true);
  return g;
}

function until(g, year, policy = () => {}) {
  for (let i = 0; i < 600 && g.status === 'playing' && g.worldYear < year; i++) {
    if (g.pending) chooseDefault(g);
    else {
      policy(g);
      M.advance(g, 1);
    }
  }
  assert.ok(g.worldYear >= year || g.status !== 'playing');
  return g;
}

function preparePill(g) {
  if (g.worldYear >= 40 && !g.life.pill && g.life.money >= 55 && g.life.herbs >= 5) {
    M.begin(g, 'pill', 'common');
  }
}

const observations = [];
function observe(name, run) {
  observations.push({ name, ...run() });
}

const routes = [];
for (const origin of ['market', 'herbal']) {
  for (const path of ['xuan', 'dan']) {
    for (const career of ['merchant', 'herbal']) {
      const g = M.createGame();
      assert.ok(M.setOrigin(g, origin));
      assert.ok(M.respond(g, path));
      assert.ok(M.setCareer(g, career));
      until(g, 60, x => {
        if (path === 'xuan') {
          if (x.worldYear === 8) M.buy(x, 'food');
          if (x.worldYear >= 20 && x.life.plan !== 'cultivate') M.setPlan(x, 'cultivate');
          if (x.worldYear >= 43 && x.life.realm === '炼气' &&
              x.life.qi >= 1650 && x.life.money >= 45 && x.life.herbs >= 3) {
            M.begin(x, 'foundation');
          }
        } else {
          if (x.worldYear >= 20 && x.life.plan !== 'balance') M.setPlan(x, 'balance');
          preparePill(x);
        }
      });
      assert.equal(g.pending, 'tide');
      chooseDefault(g);
      assert.equal(g.world.tide, 'survived');
      assert.equal(g.status, 'playing');
      routes.push({ origin, path, career, survived: true });
    }
  }
}

observe('轮回跳过历史60年', () => {
  const g = until(start(), 59);
  assert.equal(g.life.realm, '炼气');
  assert.equal(g.life.pill, null);
  assert.ok(M.reincarnate(g));
  chooseDefault(g);
  M.advance(g, 1);
  assert.equal(g.worldYear, 62);
  assert.equal(g.world.tide, 'waiting');
  assert.equal(g.pending, null);
  return { worldYear: g.worldYear, tide: g.world.tide };
});

observe('NPC任务覆盖已付费探索', () => {
  const g = until(start(), 21);
  assert.ok(M.begin(g, 'explore'));
  assert.equal(g.pending, 'npc');
  assert.equal(g.life.action.id, 'explore');
  assert.equal(g.life.action.remaining, 2);
  assert.ok(M.respond(g, 'shen'));
  assert.equal(g.life.action, null);
  assert.equal(g.meta.relics.includes('G01'), false);
  return { worldYear: g.worldYear, relics: g.meta.relics, action: g.life.action };
});

observe('可以与已故NPC本人合作', () => {
  const g = until(start(), 60);
  chooseDefault(g); // 没有准备，正常在灵潮死亡。
  assert.equal(g.status, 'ended');
  assert.ok(M.reincarnate(g));
  chooseDefault(g);
  until(g, 84);
  const npcBefore = M.npcState(g, 'shen');
  assert.equal(npcBefore.alive, false);
  assert.equal(npcBefore.age, 102);
  assert.ok(M.respond(g, 'shen'));
  assert.equal(g.world.npc.shen.helped, true);
  return { npcBefore, worldYear: g.worldYear, notice: g.notice };
});

observe('同年世界事件吞掉个人资源事件', () => {
  const g = M.createGame();
  M.respond(g, 'dan');
  until(g, 60, preparePill);
  chooseDefault(g);
  assert.equal(g.world.tide, 'survived');
  until(g, 75);
  assert.ok(M.reincarnate(g)); // 新生年77，正常触发95年事件。
  chooseDefault(g);
  until(g, 95);
  assert.equal(M.lifeYear(g), 18);
  assert.equal(g.pending, 'vein');
  assert.ok(M.respond(g, 'labor'));
  assert.equal(g.worldYear, 98);
  assert.equal(g.life.flags.includes('materials18'), false);
  assert.equal(g.pending, null);
  return { worldYear: g.worldYear, missingEvent: 'materials18', flags: g.life.flags };
});

observe('结构残缺但版本匹配的存档会被接受', () => {
  const g = M.restore(JSON.stringify({
    version: 2, worldYear: 1, life: {}, meta: {}, world: {}, journal: [],
  }));
  assert.deepEqual(g.life, {});
  assert.throws(() => M.rates(g), TypeError);
  return { acceptedEmptyLife: true, ratesThrows: 'TypeError' };
});

observe('隐藏focus行动承诺的效率没有生效', () => {
  const g = until(start(), 11);
  const before = M.rates(g).qi;
  assert.ok(M.begin(g, 'focus'));
  assert.equal(g.life.focus, true);
  assert.equal(M.rates(g).qi, before);
  return { before, after: M.rates(g).qi, reachableInCurrentUI: false };
});

observe('幸存后轮回没有进入额外RP分支', () => {
  const g = M.createGame();
  M.respond(g, 'dan');
  until(g, 60, preparePill);
  chooseDefault(g);
  assert.equal(g.world.tide, 'survived');
  assert.ok(M.reincarnate(g));
  assert.equal(g.meta.lives[0].reason, '主动轮回');
  assert.equal(g.meta.achievements.includes('tide-survivor'), false);
  return { summary: g.meta.lives[0], survivorAchievement: false };
});

const growth = until(start(), 20);
assert.equal(growth.life.studied.length, 3);
console.log(JSON.stringify({
  baseline: '1614017',
  note: '观察断言通过表示复现了当前缺陷，不表示这些行为正确。固定策略不代表玩家胜率。',
  routes, observations,
  growthAtYear20: { studied: growth.life.studied, careerLevel: growth.life.level.merchant },
}, null, 2));
