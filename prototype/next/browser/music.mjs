/** 双媒体流交叉淡化；不会把整首音乐解码为常驻AudioBuffer。 */
export function createMusicPlayer(
  context,
  bus,
  {
    audioFactory = () => new Audio(),
    onChange = () => {},
    schedule = setInterval,
    unschedule = clearInterval,
  } = {},
) {
  let channels,
    active = 0,
    timer,
    transition,
    wanted = false,
    generation = 0,
    error = "";
  const fade = 3;
  function gain(index, value) {
    const param = channels[index].gain.gain;
    param.cancelScheduledValues(context.currentTime);
    param.setValueAtTime(value, context.currentTime);
  }
  function setup() {
    if (channels) return;
    channels = [0, 1].map((index) => {
      const media = audioFactory();
      media.preload = "none";
      media.loop = true;
      media.src = new URL(
        "../assets/audio/guqin-youhuang.mp3",
        import.meta.url,
      ).href;
      const node = context.createMediaElementSource(media),
        volume = context.createGain();
      volume.gain.value = index === active ? 1 : 0;
      node.connect(volume).connect(bus);
      media.addEventListener("error", () => {
        error = "音乐加载失败，可关闭后重试。";
        onChange();
      });
      media.addEventListener("playing", onChange);
      media.addEventListener("loadedmetadata", onChange);
      return { media, gain: volume };
    });
  }
  function tick() {
    if (!wanted || !channels) return;
    if (transition) {
      if (
        transition.start !== null &&
        context.currentTime >= transition.start + fade
      ) {
        channels[transition.old].media.pause();
        channels[transition.old].media.currentTime = 0;
        active = transition.next;
        gain(active, 1);
        gain(1 - active, 0);
        transition = null;
      }
      return;
    }
    const current = channels[active].media;
    if (
      !Number.isFinite(current.duration) ||
      current.duration < fade * 2 ||
      current.currentTime < current.duration - fade
    )
      return;
    const old = active,
      next = 1 - active,
      run = generation;
    const pending = (transition = { old, next, start: null });
    channels[next].media.currentTime = 0;
    channels[next].media
      .play()
      .then(() => {
        if (!wanted || generation !== run || transition !== pending) return;
        pending.start = context.currentTime;
        for (const [index, rising] of [
          [old, false],
          [next, true],
        ]) {
          const curve = Float32Array.from({ length: 32 }, (_, i) =>
            rising
              ? Math.sin(((i / 31) * Math.PI) / 2)
              : Math.cos(((i / 31) * Math.PI) / 2),
          );
          const param = channels[index].gain.gain;
          param.cancelScheduledValues(context.currentTime);
          param.setValueCurveAtTime(curve, context.currentTime, fade);
        }
      })
      .catch(() => {
        if (transition === pending) transition = null;
      });
  }
  async function play() {
    let run = generation;
    try {
      setup();
      if (wanted && !channels[active].media.paused) return true;
      wanted = true;
      run = ++generation;
      await channels[active].media.play();
      // pause()已同步停止旧请求；旧Promise不能再暂停或改写新一轮播放。
      if (!wanted || generation !== run) return false;
      error = "";
      unschedule(timer);
      timer = schedule(tick, 200);
      onChange();
      return true;
    } catch {
      if (generation !== run) return false;
      wanted = false;
      error = "点击音乐开关可重试播放。";
      onChange();
      return false;
    }
  }
  function pause() {
    wanted = false;
    generation++;
    unschedule(timer);
    timer = null;
    if (!channels) return;
    if (
      transition?.start !== null &&
      transition &&
      context.currentTime - transition.start > fade / 2
    )
      active = transition.next;
    transition = null;
    channels.forEach(({ media }) => media.pause());
    gain(active, 1);
    gain(1 - active, 0);
    onChange();
  }
  function restart() {
    pause();
    if (channels)
      channels.forEach(({ media }) => {
        media.currentTime = 0;
      });
    active = 0;
    if (channels) {
      gain(0, 1);
      gain(1, 0);
    }
    return play();
  }
  return {
    play,
    pause,
    restart,
    get status() {
      return (
        error ||
        (wanted
          ? "正在播放《古琴幽篁》 · 曲尾自动柔和衔接"
          : "《古琴幽篁》已暂停")
      );
    },
  };
}
