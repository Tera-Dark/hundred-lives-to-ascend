# 百世劫录 · Hundred Lives to Ascend

> **一世争长生，万世改天命。**  
> 前期经营「法·财·侣·地」，中期逐步自动化，后期以功法、流派、机缘和纪元应劫追寻长生。

**当前阶段：V1.2 纯浏览器可玩纵向切片。** 不是正式 Cocos Creator/TapTap 发行版；19项状态机回归测试通过，长期数值与真人手感仍待验证。

## 试玩入口

| 版本 | 本地入口 | 内容 |
|---|---|---|
| **V1.2 新版（推荐）** | [prototype/next/index.html](prototype/next/index.html) | 两出身、两营生职业、年度经营、功法研究、生活投资、两NPC旧约、世界持续与轮回 |
| V1.0 旧版（保留） | [prototype/index.html](prototype/index.html) | 玄修/丹修、世界60灵潮和两世基本流程 |

如已启用 GitHub Pages：**[打开新版网页试玩](https://tera-dark.github.io/hundred-lives-to-ascend/prototype/next/)**；[旧版入口](https://tera-dark.github.io/hundred-lives-to-ascend/prototype/index.html)。若 Pages 尚未在仓库 Settings → Pages 中配置 `gh-pages / (root)`，公网网址可能显示404；发布代码已位于该分支，启用须仓库管理权限。

**本地运行：**

```bash
python -m http.server 8000 -d prototype
# 打开 http://localhost:8000/next/
```

**执行验证：**

```bash
node --test prototype/next/tests/*.test.mjs
```

无 npm 依赖、无需服务器后端；ES Modules 请通过本地HTTP或Pages运行，不建议直接用 `file://` 双击。新版 `localStorage` 使用 `bsjl-v12-current`，不覆盖旧版存档。

## 游戏里到底玩什么？

**一世有限的寿元中，选择营生和修行道途 → 用多年计划分配赚钱/修行/研习 → 职业晋升、改善灵食与居处、结识同道、研究功法 → 应对个人命关和世界灾劫 → 把真实的经历留给下一世。**

- **法**：修为与功法，学习一个当前项目，有时解锁新方案而不是只有倍率。
- **财**：商行或采药营生，职业级别、收入/材料、生活维护；钱用于改善效率。
- **侣**：顾南枝与沈望川的有价合作和真实寿元；帮助谁决定后世的旧约和账本。
- **地**：浮潮集与青药谷，工资和灵气不可能两头白占；迁居与历史会改变生产环境。
- **轮回**：职业/研习最高纪录、RP、永久灵藏图谱留在账号；人物现金、职业等级与真实实物不能无限复制。
- **世界**：普通轮回后世界历仍继续。世界60首次灵潮在同世界线只发生一次，世界95地方余波会留下结果，世界160内容尚未制作会安全暂停。

**设计纪律：** 早期值得花脑力经营，熟悉的事务逐渐自动化，后期手动精力重点放在修仙而不是每天领工资。移动端底部只保持 **修行 / 机缘 / 应劫 / 轮回** 四入口。商业方向为 TapTap Tap 小游戏、自愿激励广告、不以内购或强制广告阻塞基本生路。

## 文档怎么读（避免旧版冲突）

**先看 [当前唯一导航与权威目录](docs/CURRENT-DESIGN.md)**，不要将 V0.5/V0.9 的固定灵石产出数字与V1.2经营模型直接拼在一起。

| 主题 | 最新主要文档 |
|---|---|
| 世界观、核心体验 | [38 法财侣地](docs/38-FA-CAI-LV-DI-CORE-VISION.md) |
| 营生、工作时间、生活与法门 | [39 经济与日程](docs/39-LIVELIHOOD-AND-SCHEDULE.md) |
| 地理、NPC、世界线社会关系 | [40 关系与地区](docs/40-COMPANIONS-AND-PLACES.md) |
| 最小两世体验目标 | [41 体验PRD](docs/41-TWO-PHASE-EXPERIENCE-PRD.md) |
| **当前剧情架构与NPC** | [42 叙事系统](docs/42-NARRATIVE-AND-NPC.md) |
| **V1.2实际可玩范围及测试** | [43 可玩审计](docs/43-V12-PLAYABLE-AUDIT.md) |
| **事件条件/后果矩阵** | [44 剧情事件表](docs/44-STORY-EVENT-MATRIX.md) |
| 时间与实体所有权 | [10 双时钟](docs/10-TIME-EPOCH.md)、[11 前世遗物](docs/11-LEGACY-ITEMS.md) |
| 七档灵藏长期计划 | [25 遗物库](docs/25-RELIC-VAULT.md)、[26 碎片经济](docs/26-RELIC-ECONOMY.md) |
| 核心乐趣和道途 | [30 游戏性](docs/30-CORE-FUN-THESIS.md)、[31 五道途](docs/31-CULTIVATION-PATHS.md) |
| 开发路线与工程说明 | [09 Roadmap](docs/09-ROADMAP.md)、[07 TapTap技术](docs/07-TECH-TAPTAP.md)、[37 旧MVP记录](docs/37-MVP0-IMPLEMENTATION.md) |

其余 `docs/00–36` 均作为设计过程和历史测试保留，**不是当前原型的全量实装目录**。参照项目《连续黑白》的独立研究在 [research/](research/continuous-black-white-mechanics-technical-report.md)。

## 近期验收焦点

**不急于增加新NPC和新币种。** 首先观察实际玩家是否理解“工作挣钱→改善生活→修行提速”，是否愿意在心魔/灵潮前改变计划，以及第二世能否感知职业纪录、NPC旧约、旧物和世界地区发生的变化。

下一阶段优先修复前10–15分钟的无聊或混乱操作，再补全顾南枝、沈望川的三幕叙事。**网页切片暂不代表正式数值平衡、付费运营、手机性能或后期世界线闭环。**
