# 音效来源与BGM方向

## 已接入音效

采用[Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds)里的五个短音，经音量和高频处理后用于轻点、成功、新事件、突破、条件不足。官方资源页及包内文件标注CC0，[官方说明](https://kenney.nl/support)允许免费商用且不强制署名。项目保留包内授权、来源URL、原始文件名和SHA-256，见[音效目录](../prototype/next/assets/audio/README.md)。

实际播放链：玩家手势 → AudioContext恢复 → 本站WAV加载/解码 → 采样独立类别增益 → 用户音效音量总线。首次加载中或资源失败可使用原合成音后备。加载一次、最多4个并发、轻点45ms节流；关闭音效、切后台或离开页面停止采样。引擎不导入音频。BGM与音效分开控制。

修改入口：`content/audio.mjs`负责对应文件与类别音量，`browser/sound-bank.mjs`负责加载、并发与回收，`browser/audio.mjs`负责设备生命周期、BGM控制与合成后备。设置页的五个试听按钮不推进游戏。

## 给Suno的生成描述

曲名建议「浮岚·静修」。方向是耐听的日常修行背景，古琴为主、低音箫偶尔回应、少量环境铺底，空间留白，避免战斗配乐的强节奏和高潮。建议先生成一首主界面曲，合适后再发展机缘/劫难变奏。

在Create里开启Instrumental／纯音乐，描述放风格框，不作为歌词。此用法见[Suno官方纯音乐说明](https://suno.com/tools/instrumental-generator)。

```text
Minimal Chinese xianxia ambient instrumental for a calm cultivation game. Sparse guqin plucks lead, with occasional soft low-register xiao flute phrases and a very subtle warm ambient bed. Slow, around 60 BPM, gentle pentatonic melody, spacious pauses, restrained arrangement. Peaceful misty mountains, quiet meditation, a sense of time passing and distant immortality. Warm, intimate, organic acoustic textures, soft attacks, smooth high frequencies, modest reverb. Consistent low energy and volume, suitable for long background listening beneath reading and UI sounds. Gently evolving, loop-friendly, no dramatic introduction or final climax. Instrumental only: no vocals, humming, choir, spoken words, drums, heavy percussion, EDM, or trailer-style orchestration.
```

目标约3–4分钟；生成工具不保证严格长度或无缝循环。现已收到并接入用户提供的《古琴幽篁》MP3，以下提示词保留作生成方向参考。

## 已接入《古琴幽篁》

用户源文件4,534,678字节、48kHz立体声、约198.77秒，原文件保持不变。网页副本[guqin-youhuang.mp3](../prototype/next/assets/audio/guqin-youhuang.mp3)为44.1kHz立体声96kbps、2,379,888字节，约缩小47.5%；降低约1.77dB，去除曲尾0.5秒近静音。来源、SHA-256与处理参数见[music-manifest](../prototype/next/assets/audio/music-manifest.json)。这是用户提供的Suno音频，与Kenney CC0音效分开记录，不把CC0授权套用到BGM。

播放器在用户启用后才创建两路HTML媒体和MediaElementAudioSource；曲尾3秒等功率淡化到下一路，完成后暂停旧流并复用。音乐默认关闭；保存为开启的设置也需本次页面先交互以满足浏览器策略。原生循环作后备，不承诺所有手机/编码器无采样级间隙；优先采用低内存流式播放，避免完整PCM常驻。后台暂停、回前台继续当前位置，支持从头播放和独立滑杆。
