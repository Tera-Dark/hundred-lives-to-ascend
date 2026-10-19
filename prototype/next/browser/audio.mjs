/** 流式BGM与本地CC0音效；设备行为不影响游戏时间。 */
import { createSoundBank } from "./sound-bank.mjs";
import { createMusicPlayer } from "./music.mjs";
export function createAudioFeedback({
  fetcher = globalThis.fetch,
  onChange = () => {},
  musicOptions = {},
} = {}) {
  let context, musicBus, effectBus, music, preferences, soundBank;
  let status = "";
  const active = () => context?.state === "running" && !document.hidden;
  function tone(bus, frequency, start, duration, gain = 0.12, type = "sine") {
    const voice = context.createOscillator(),
      envelope = context.createGain();
    voice.type = type;
    voice.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(
      gain,
      start + Math.min(0.04, duration / 4),
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    voice.connect(envelope).connect(bus);
    voice.start(start);
    voice.stop(start + duration + 0.02);
    voice.onended = () => {
      voice.disconnect();
      envelope.disconnect();
    };
  }
  function update(p) {
    const musicChanged = preferences?.music !== p.music;
    preferences = { ...p };
    if (!context) return;
    musicBus.gain.setTargetAtTime(
      p.music && !document.hidden ? (p.musicVolume / 100) * 0.55 : 0,
      context.currentTime,
      0.08,
    );
    effectBus.gain.setTargetAtTime(
      p.sfx && !document.hidden ? (p.sfxVolume / 100) * 0.5 : 0,
      context.currentTime,
      0.01,
    );
    if (musicChanged) {
      if (p.music && !document.hidden) void music.play();
      else music.pause();
    }
    if (!p.sfx) soundBank?.stop();
  }
  async function unlock(p) {
    preferences ??= { ...p };
    if (!p.music && !p.sfx) return;
    try {
      const created = !context;
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) {
          status = "当前浏览器不支持音频播放，其他功能可正常使用。";
          return;
        }
        context = new Audio();
        musicBus = context.createGain();
        effectBus = context.createGain();
        musicBus.connect(context.destination);
        effectBus.connect(context.destination);
        soundBank = createSoundBank(context, effectBus, fetcher);
        music = createMusicPlayer(context, musicBus, {
          ...musicOptions,
          onChange,
        });
      }
      const wasPaused = context.state !== "running";
      await context.resume();
      update(p);
      if (p.music && (wasPaused || created)) void music.play();
      if (p.sfx) soundBank.preload();
      status = "";
    } catch {
      status = "声音尚未启动，请再次点击音乐开关或试听按钮。";
    }
  }
  function play(kind = "tap") {
    if (!active() || !preferences?.sfx) return;
    if (soundBank?.play(kind)) return;
    const notes = {
      tap: [660],
      success: [440, 660],
      event: [330, 494, 660],
      breakthrough: [440, 554, 660, 880],
      error: [220, 196],
    }[kind] || [660];
    notes.forEach((freq, i) =>
      tone(
        effectBus,
        freq,
        context.currentTime + i * 0.08,
        kind === "tap" ? 0.09 : 0.22,
        0.13,
      ),
    );
  }
  async function visibility() {
    if (!context) return;

    if (document.hidden) {
      music.pause();
      soundBank.stop();
      await context.suspend();
    } else {
      try {
        await context.resume();
        update(preferences);
        if (preferences.music) void music.play();
      } catch {
        status = "点击任意按钮可恢复声音。";
      }
    }
  }
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("pagehide", () => {
    music?.pause();
    soundBank?.stop();
    context?.suspend();
  });
  return {
    unlock,
    update,
    play,
    restartMusic() {
      return music?.restart();
    },
    get status() {
      if (status) return status;
      if (document.hidden) return "当前在后台，声音已暂停。";
      if (preferences?.music && context?.state === "running")
        return preferences.musicVolume
          ? music.status
          : "背景音乐已开启，音量为0。";
      return soundBank?.failed ? "部分音效暂不可读取，已使用备用提示音。" : "";
    },
  };
}
