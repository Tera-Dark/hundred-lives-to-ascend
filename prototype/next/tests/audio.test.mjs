import test from "node:test";
import assert from "node:assert/strict";
import { createAudioFeedback } from "../browser/audio.mjs";
import { DEFAULT_PREFERENCES } from "../application/preferences.mjs";

test("音效由点击启动，后台暂停、静音及资源失败后备生效", async () => {
  const previous = { window: globalThis.window, document: globalThis.document };
  const events = {};
  let context,
    voices = 0;
  const node = () => ({
    connect() {
      return this;
    },
    disconnect() {},
    gain: {
      setValueAtTime() {},
      linearRampToValueAtTime() {},
      exponentialRampToValueAtTime() {},
      setTargetAtTime() {},
    },
  });
  class FakeContext {
    state = "running";
    currentTime = 0;
    destination = {};
    constructor() {
      context = this;
    }
    createGain() {
      return node();
    }
    createOscillator() {
      voices++;
      return { ...node(), frequency: { value: 0 }, start() {}, stop() {} };
    }
    async resume() {
      this.state = "running";
    }
    async suspend() {
      this.state = "suspended";
    }
  }
  globalThis.window = {
    AudioContext: FakeContext,
    addEventListener: (key, fn) => (events[key] = fn),
  };
  globalThis.document = {
    hidden: false,
    addEventListener: (key, fn) => (events[key] = fn),
  };
  const audio = createAudioFeedback({ fetcher: async () => ({ ok: false }) });
  try {
    assert.equal(context, undefined, "初始化不能自动播放");
    const p = { ...DEFAULT_PREFERENCES, music: false };
    await audio.unlock(p);
    assert.equal(voices, 0, "关闭音乐时不能创建占位旋律");
    audio.play("success");
    assert.equal(voices, 2);
    audio.update({ ...p, sfx: false, music: false });
    audio.play("success");
    assert.equal(voices, 2);
    document.hidden = true;
    await events.visibilitychange();
    assert.equal(context.state, "suspended");
    document.hidden = false;
    await events.visibilitychange();
    assert.equal(context.state, "running");
    assert.equal(voices, 2, "关闭音乐后切回前台不能重新发声");
  } finally {
    events.pagehide();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
