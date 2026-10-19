import test from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../game.mjs";
import { initializeGuide, isUnlocked } from "../application/onboarding.mjs";
import { createUiState, dispatch } from "../application/commands.mjs";

for (const origin of ["market", "herbal"])
  for (const path of ["xuan", "dan"])
    for (const career of ["merchant", "herbal"]) {
      test(`渐进开放后仍存在首劫生路：${origin}/${path}/${career}`, () => {
        const g = createGame(),
          ui = createUiState();
        initializeGuide(g);
        assert.ok(dispatch(g, ui, "origin", origin).ok);
        assert.ok(dispatch(g, ui, "reply", path).ok);
        dispatch(g, ui, "guide-mute");
        let changed = false;
        for (
          let i = 0;
          i < 400 && g.status === "playing" && g.worldYear <= 60;
          i++
        ) {
          if (g.pending) {
            const key = {
              materials18: "herbs",
              materials34: "herbs",
              npc: "ignore",
              jade: "ok",
              warning: "ok",
              trial: "retreat",
              tide: "face",
            }[g.pending];
            assert.ok(dispatch(g, ui, "reply", key).ok, `事件${g.pending}`);
            if (g.world.tide === "survived") break;
            continue;
          }
          if (!changed && isUnlocked(g, "career")) {
            assert.ok(dispatch(g, ui, "career", career).ok);
            changed = true;
          }
          if (path === "xuan") {
            if (g.worldYear === 8) dispatch(g, ui, "buy", "food");
            if (g.worldYear >= 20 && g.life.plan !== "cultivate")
              dispatch(g, ui, "plan", "cultivate");
            if (
              g.worldYear >= 43 &&
              g.life.realm === "炼气" &&
              g.life.qi >= 1650 &&
              g.life.money >= 45 &&
              g.life.herbs >= 3
            ) {
              assert.ok(dispatch(g, ui, "action", "foundation").ok);
              continue;
            }
          } else {
            if (g.worldYear >= 20 && g.life.plan !== "balance")
              dispatch(g, ui, "plan", "balance");
            if (
              g.worldYear >= 40 &&
              !g.life.pill &&
              g.life.money >= 55 &&
              g.life.herbs >= 5
            ) {
              assert.ok(dispatch(g, ui, "pill", "common").ok);
              continue;
            }
          }
          assert.ok(dispatch(g, ui, "advance", "1").ok);
        }
        assert.equal(g.world.tide, "survived");
        assert.equal(g.status, "playing");
        assert.ok(isUnlocked(g, "alchemy"));
        assert.ok(isUnlocked(g, "reincarnation"));
      });
    }
