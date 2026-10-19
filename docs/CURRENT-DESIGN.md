# 当前规则与实现导航

当前维护版本：2026-10-19网页切片，墨青留白触控呈现、体验设置、19项渐进指引、存档v3。这里区分现行实现与历史策划，避免把早期试算或未来系统当成已完成游戏。

## 当前实现与开发入口

| 内容 | 唯一维护入口 |
|---|---|
| 玩法、运行与验证概览 | [根README](../README.md) |
| 源码组织、三层状态、时间与存档 | [ARCHITECTURE](ARCHITECTURE.md) |
| 功能条件、基础介绍、首次提示和手册 | [ONBOARDING](ONBOARDING.md)，规则源 `prototype/next/content/features.mjs` |
| 开发运行、测试和恢复 | [RUNBOOK](RUNBOOK.md) |
| 现行缺口及优先级 | [BACKLOG](BACKLOG.md) |
| 触控、红点、设备设置与声音 | [EXPERIENCE](EXPERIENCE.md) |
| 采样来源、授权与Suno提示词 | [AUDIO](AUDIO.md) |
| 本轮QoL实测与限制 | [QOL-VALIDATION](QOL-VALIDATION.md) |
| 阶段变更 | [CHANGELOG](CHANGELOG.md) |

运行规则以 `prototype/next/content/`、`engine/` 为准；浏览器操作与功能门槛在 `application/`，界面在 `ui/`。`game.mjs`是兼容模拟出口，不再承担全部实现。

## 产品方向与叙事

先经营有限寿元、逐步自动化旧劳动，再把注意力投入修仙与持续世界因果。两出身、两主修、两营生、四日程、三研究、两地区、两NPC首次合作、浅层RP、两槽灵藏、同线唯一旧玉已可玩。

长期产品意图：[38法财侣地](38-FA-CAI-LV-DI-CORE-VISION.md)、[39经济日程](39-LIVELIHOOD-AND-SCHEDULE.md)、[40同道地域](40-COMPANIONS-AND-PLACES.md)、[41两世体验目标](41-TWO-PHASE-EXPERIENCE-PRD.md)。这些文件中的未来目标与候选数字不覆盖实际源码。

当前故事骨架：[42叙事NPC](42-NARRATIVE-AND-NPC.md)、[44事件矩阵](44-STORY-EVENT-MATRIX.md)。完整人物三幕、后人交互仍未制作。

## 必须保留的规则

- 一个人物寿元时钟，一个持续世界历；任何跨年动作只结算一次年份，行动中不领满普通生产。
- 人物、世界、账号三层状态分开；轮回不复制现金、实物或NPC，不重播历史。
- 世界60/95事件可在转世间隔无人见证时发生；同年个人机会不能被另一事件永久吞掉。
- NPC按照绝对世界历老化，已故本人不能再合作；既有旧约和账本可以被后世追索。
- 基本生路不依赖广告、罕见遗物或强制关系。四主入口不变，不新增日常币/能量条。
- 世界160后尚未制作，安全暂停且不虚构死亡或RP结算。

## 历史资料如何读

`docs/00–37`主要保留世界观、旧模型、策划实验与旧原型验收；`38–41`含长期方向及未实装候选；[43 V1.2审计](43-V12-PLAYABLE-AUDIT.md)是旧版本的范围证据，[43美术资源](43-INK-GOLD-ART-ASSETS.md)是V1.4素材接入记录。不要把其中“无代码/19项/单文件实现/旧固定年产”等阶段陈述当作现行状态。

三层时间/物件原则可追溯至[10时间规则](10-TIME-EPOCH.md)、[11实物规则](11-LEGACY-ITEMS.md)，但多世界线回溯、高阶经济和七档遗物等不是当前全量能力。参照游戏的独立研究在[research](../research/continuous-black-white-mechanics-technical-report.md)，不作为已实施需求。

[仓库评估](../reports/project-assessment-2026-10-19.md)针对 `1614017`，是修复前快照；缺陷现状见BACKLOG和当前回归。
