import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createSoundBank } from "../browser/sound-bank.mjs";
import { SOUND_EFFECTS } from "../content/audio.mjs";

function fixture() {
  const sources = [];
  const node = () => ({
    gain: { value: 1 },
    connect() {
      return this;
    },
    disconnect() {},
  });
  const context = {
    currentTime: 1,
    async decodeAudioData(data) {
      return { data };
    },
    createGain: node,
    createBufferSource() {
      const source = {
        ...node(),
        started: false,
        stopped: false,
        start() {
          this.started = true;
        },
        stop() {
          this.stopped = true;
        },
      };
      sources.push(source);
      return source;
    },
  };
  return { context, sources };
}
test("采样只加载一次，首个手势前不请求；成功后使用真实缓冲，连点和复音受限", async () => {
  const { context, sources } = fixture();
  const requests = [];
  const bank = createSoundBank(context, {}, async (url) => {
    requests.push(String(url));
    return {
      ok: true,
      async arrayBuffer() {
        return new ArrayBuffer(8);
      },
    };
  });
  assert.equal(requests.length, 0);
  assert.equal(bank.play("tap"), false);
  await Promise.all([bank.preload(), bank.preload()]);
  assert.equal(requests.length, 5);
  assert.equal(bank.failed, 0);
  assert.ok(requests.every((url) => url.endsWith(".wav")));
  assert.equal(bank.play("tap"), true);
  assert.equal(sources.length, 1);
  assert.ok(sources[0].buffer);
  bank.play("tap");
  assert.equal(sources.length, 1);
  context.currentTime += 0.1;
  bank.play("tap");
  assert.equal(sources.length, 2);
  for (const kind of ["success", "event", "breakthrough", "error"])
    bank.play(kind);
  assert.equal(sources.filter((source) => !source.stopped).length, 4);
  bank.stop();
  assert.ok(sources.every((source) => source.stopped));
});
test("单个采样下载或解码失败不阻断其他采样，并允许合成音后备", async () => {
  const { context } = fixture();
  const bank = createSoundBank(context, {}, async (url) => ({
    ok: !String(url).endsWith("tap.wav"),
    async arrayBuffer() {
      return new ArrayBuffer(8);
    },
  }));
  await bank.preload();
  assert.equal(bank.failed, 1);
  assert.equal(bank.play("tap"), false);
  assert.equal(bank.play("success"), true);
});
test("五种运行音效都随仓库提供，WAV格式、体积与来源校验完整", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../assets/audio/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(manifest.license, "CC0-1.0");
  assert.equal(manifest.assets.length, Object.keys(SOUND_EFFECTS).length);
  let total = 0;
  for (const [id, sound] of Object.entries(SOUND_EFFECTS)) {
    const entry = manifest.assets.find((asset) => asset.id === id);
    assert.equal(entry.file, sound.file);
    const data = await readFile(
      new URL(`../assets/audio/${sound.file}`, import.meta.url),
    );
    assert.equal(data.subarray(0, 4).toString(), "RIFF");
    assert.equal(data.subarray(8, 12).toString(), "WAVE");
    assert.equal(createHash("sha256").update(data).digest("hex"), entry.sha256);
    assert.equal(data.length, entry.bytes);
    assert.ok(entry.seconds <= 1);
    total += data.length;
  }
  assert.ok(total < 100000);
  assert.match(
    await readFile(
      new URL("../assets/audio/KENNEY-LICENSE.txt", import.meta.url),
      "utf8",
    ),
    /CC0/,
  );
});
