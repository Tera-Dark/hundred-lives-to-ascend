# 界面音效 · Kenney Interface Sounds

来源：[Kenney Interface Sounds 1.0](https://kenney.nl/assets/interface-sounds)，作者Kenney。官方资源页与包内授权标注CC0；允许个人、教育、商业项目使用，无强制署名。保留原始[包内授权](KENNEY-LICENSE.txt)和[原文件、下载地址、SHA-256清单](manifest.json)。授权说明见[官方Support](https://kenney.nl/support)。

| 运行文件 | 原文件 | 用途 |
|---|---|---|
| tap.wav | Audio/click_001.ogg | 轻点、切页与设置 |
| success.wav | Audio/confirmation_001.ogg | 年份推进、购买、装备成功 |
| event.wav | Audio/question_002.ogg | 新故事事件 |
| breakthrough.wav | Audio/confirmation_004.ogg | 境界突破 |
| error.wav | Audio/back_004.ogg | 条件不满足的轻微反馈 |

五个运行文件合计61,942字节。由原OGG做80–4500Hz二阶带通、单声道24kHz重采样、4ms首尾淡化，限制峰值≤0.5、RMS≤0.13后导出PCM16 WAV；播放时再按类别与用户音效音量衰减。没有叠加新音色，也不是古琴实录。处理数值与原文件校验见manifest。

`content/audio.mjs`配置文件名与相对音量，`browser/sound-bank.mjs`加载和播放。只在用户手势后且音效开启时从本站加载一次，不访问第三方CDN；未加载或失败时使用现有合成短音，不阻止游戏。最多4个并发采样，轻点间隔至少45ms，静音/后台切换停止未结束采样。设置页可分别试听五类声音。

## BGM

已接入用户提供的《古琴幽篁》，与CC0音效分开记录。运行MP3为2,379,888字节；来源、原始/运行文件SHA-256和压缩参数见[music-manifest](music-manifest.json)。此曲不沿用Kenney授权。用户启用后流式播放，曲尾3秒交叉淡化，后台暂停并保留位置。详细说明和生成描述见[音频说明](../../../../docs/AUDIO.md)。
