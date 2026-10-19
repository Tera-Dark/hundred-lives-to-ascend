# 墨青留白 · 当前素材库（原V1.4保留）

当前网页使用两张新生成的轻量WebP，合计80,458字节：`backgrounds/quiet-mountains.webp`（1200×800）与`characters/quiet-meditation.webp`（474×480，透明）。通过内置imagegen生成，提示词见[PROMPTS](PROMPTS.md)，元数据见[manifest](manifest.json)。

原V1.4六张WebP保留作历史备选；以下是旧视觉用法，当前由`styles/mobile.css`覆盖，图片与按钮、文字始终分开。

| 分类 | 资源 | 用途 | 网页是否引用 |
|---|---|---|---|
| 背景 | `backgrounds/immortal-realm.webp` | 原仙山云海 | 旧主题备选 |
| 人物 | `characters/meditating-cultivator.webp` | 修行卡的独立静修插画 | 旧主题备选 |
| 人物 | `characters/wandering-cultivator.webp` | 行走修士独立立绘，后续人物/轮回页备用 | 备用 |
| 人物 | `characters/jade-companion.webp` | 通用女性同道立绘；**不是顾南枝正式人设** | 备用 |
| 场景 | `scenes/fated-journey.webp` | 职业/机缘卡片局部场景 | 旧主题备选 |
| 场景 | `scenes/calamity.webp` | 应劫卡片警示场景 | 旧主题备选 |

## 约束
- 数值文本、按钮、卡片边框和命关条件必须继续使用前端组件，**不能烘焙进图片**。
- 三张人物保留透明通道；其余图像不透明。资源文件经尺寸限制压缩后仍适合高分屏网页展示。
- 显示优先级：**数字、进度、明确行动 > 艺术背景**。为文字卡添加深色渐变遮罩，而不是让插画抢占点击区域。
- 完整元数据（路径、尺寸、文件体积、SHA-256）见 `manifest.json`；任何替换图片时同步更新它。
- 图层不能当成 PSD 可编辑笔画或矢量图。今后需要独立动画可额外为人物光效/法阵单独生成相应图层。
- 未给 NPC 正式造型进行立绘锚定，通用人物**不冒充角色官方立绘**。

## 资源校验
到仓库的 `prototype/next/assets/` 下查看 `manifest.json`，按 `sha256` 校验文件。可在 `assets/index.html` 浏览新旧八张图。

## 音效资源

当前五类音效使用[Kenney / CC0本地WAV](audio/README.md)，合计61,942字节。图片manifest只记录图片，音频来源、处理与校验独立保存在`audio/manifest.json`。BGM仍等待用户提供Suno音频，参见[音频说明](../../../docs/AUDIO.md)。
