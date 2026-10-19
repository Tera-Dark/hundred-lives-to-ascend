import { SOUND_EFFECTS } from "../content/audio.mjs";

/** 本地WAV缓冲池：首次手势后加载一次，失败交回合成音后备。 */
export function createSoundBank(context, bus, fetcher = globalThis.fetch) {
  const buffers = new Map(),
    voices = new Set();
  let loading,
    failed = 0,
    lastTap = -Infinity;
  function preload() {
    loading ??= Promise.all(
      Object.entries(SOUND_EFFECTS).map(async ([kind, sound]) => {
        try {
          const url = new URL(`../assets/audio/${sound.file}`, import.meta.url);
          const response = await fetcher(url);
          if (!response.ok) throw Error("audio unavailable");
          const buffer = await context.decodeAudioData(
            await response.arrayBuffer(),
          );
          buffers.set(kind, buffer);
        } catch {
          failed++;
        }
      }),
    );
    return loading;
  }
  function stop() {
    for (const source of voices) {
      try {
        source.stop();
      } catch {}
    }
    voices.clear();
  }
  function play(kind) {
    const sound = SOUND_EFFECTS[kind],
      buffer = buffers.get(kind);
    if (!sound || !buffer) return false;
    if (kind === "tap" && context.currentTime - lastTap < 0.045) return true;
    if (kind === "tap") lastTap = context.currentTime;
    if (voices.size >= 4) {
      const oldest = voices.values().next().value;
      oldest.stop();
      voices.delete(oldest);
    }
    const source = context.createBufferSource(),
      volume = context.createGain();
    source.buffer = buffer;
    volume.gain.value = sound.level;
    source.connect(volume).connect(bus);
    voices.add(source);
    source.onended = () => {
      voices.delete(source);
      source.disconnect();
      volume.disconnect();
    };
    source.start();
    return true;
  }
  return {
    preload,
    play,
    stop,
    get failed() {
      return failed;
    },
  };
}
