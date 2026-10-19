import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createMusicPlayer } from "../browser/music.mjs";
test("媒体设备初始化失败会报告状态，不产生未处理的拒绝或调度", async () => {
  const player = createMusicPlayer(
    {},
    {},
    {
      audioFactory() {
        throw Error("device unavailable");
      },
      schedule() {
        throw Error("must not schedule");
      },
    },
  );
  assert.equal(await player.play(), false);
  assert.match(player.status, /重试/);
});
function setup() {
  const media = [],
    curves = [];
  let callback = null;
  const context = {
    currentTime: 0,
    createGain() {
      return {
        connect() {
          return this;
        },
        gain: {
          value: 0,
          cancelScheduledValues() {},
          setValueAtTime() {},
          setValueCurveAtTime(values) {
            curves.push([...values]);
          },
        },
      };
    },
    createMediaElementSource() {
      return {
        connect() {
          return this;
        },
      };
    },
  };
  const player = createMusicPlayer(
    context,
    {},
    {
      audioFactory() {
        const m = {
          paused: true,
          currentTime: 0,
          duration: 198,
          addEventListener() {},
          async play() {
            this.paused = false;
          },
          pause() {
            this.paused = true;
          },
        };
        media.push(m);
        return m;
      },
      schedule(fn) {
        callback = fn;
        return 1;
      },
      unschedule() {
        callback = null;
      },
    },
  );
  return {
    player,
    context,
    media,
    curves,
    tick() {
      callback?.();
    },
  };
}
test("BGM默认不创建媒体/请求，手势启用后只创建两个流，暂停后位置保留", async () => {
  const f = setup();
  assert.equal(f.media.length, 0);
  await f.player.play();
  assert.equal(f.media.length, 2);
  assert.equal(f.media[0].preload, "none");
  assert.match(f.media[0].src, /guqin-youhuang.mp3$/);
  f.media[0].currentTime = 50;
  f.player.pause();
  assert.ok(f.media.every((m) => m.paused));
  await f.player.play();
  assert.equal(f.media[0].currentTime, 50);
  assert.match(f.player.status, /古琴幽篁/);
  f.player.pause();
});
test("曲尾只触发一次双流淡化，完成后回收旧流，重播从头开始", async () => {
  const f = setup();
  await f.player.play();
  f.media[0].currentTime = 196;
  f.tick();
  await Promise.resolve();
  assert.equal(f.curves.length, 2);
  f.tick();
  assert.equal(f.curves.length, 2);
  assert.equal(f.curves[0][0], 1);
  assert.ok(f.curves[0].at(-1) < 1e-6);
  assert.equal(f.curves[1][0], 0);
  f.context.currentTime = 3.1;
  f.tick();
  assert.equal(f.media[0].paused, true);
  assert.equal(f.media[0].currentTime, 0);
  f.media[1].currentTime = 20;
  await f.player.restart();
  assert.equal(f.media[0].currentTime, 0);
  assert.equal(f.media[1].paused, true);
  f.player.pause();
});
for (const outcome of ["resolve", "reject"]) {
  test(`快速关闭再开启后，旧播放请求${outcome}不会打断新播放`, async () => {
    const f = setup();
    await f.player.play();
    f.player.pause();
    let finish;
    f.media[0].play = function () {
      this.paused = false;
      return new Promise((resolve, reject) => {
        finish = outcome === "resolve" ? resolve : () => reject(Error("old request"));
      });
    };
    const oldPlay = f.player.play();
    f.player.pause();
    f.media[0].play = async function () { this.paused = false; };
    assert.equal(await f.player.play(), true);
    finish();
    assert.equal(await oldPlay, false);
    assert.equal(f.media[0].paused, false);
    assert.match(f.player.status, /正在播放/);
    f.media[0].currentTime = 196;
    f.tick();
    await Promise.resolve();
    assert.equal(f.curves.length, 2);
    f.player.pause();
  });
}
test("等待播放期间关闭音乐，旧请求结束不会恢复播放或调度", async () => {
  const f = setup();
  await f.player.play();
  f.player.pause();
  let finish;
  f.media[0].play = function () {
    this.paused = false;
    return new Promise((resolve) => { finish = resolve; });
  };
  const pending = f.player.play();
  f.player.pause();
  finish();
  assert.equal(await pending, false);
  assert.ok(f.media.every((m) => m.paused));
  assert.match(f.player.status, /已暂停/);
  f.media[0].currentTime = 196;
  f.tick();
  assert.equal(f.curves.length, 0);
});
test("用户BGM的运行副本体积、校验与来源记录一致", async () => {
  const meta = JSON.parse(
    await readFile(
      new URL("../assets/audio/music-manifest.json", import.meta.url),
      "utf8",
    ),
  );
  const data = await readFile(
    new URL(`../assets/audio/${meta.file}`, import.meta.url),
  );
  assert.equal(createHash("sha256").update(data).digest("hex"), meta.sha256);
  assert.equal(data.length, meta.bytes);
  assert.ok(meta.bytes < meta.sourceBytes * 0.6);
  assert.ok(meta.seconds > 190 && meta.seconds < 200);
  assert.equal(meta.channels, 2);
});
