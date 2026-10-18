# 07 · 技术与 TapTap 适配预案 V0.2

> 技术暂定 Cocos Creator 3.8.8 + TypeScript。**本阶段只修改文档，未经另行批准不创建游戏代码/工程。** 官方平台规则和接口在实际构建/提审时应复核。

## 一、技术栈
| 层 | 方案 |
|---|---|
| 游戏引擎 | Cocos Creator 3.8.8（具体版本及 Tap 扩展需 M0 验证） |
| 语言与组织 | TypeScript；增量逻辑不直接依赖 Cocos 场景 |
| UI | Cocos 原生 2D、9:16 竖屏、安全区适配 |
| 增量数值 | 独立大数模块（修为、倍率），与精确世界年/年龄分离 |
| 时间与事件 | 两个协调但不相同的时钟状态：`age / lifeCap` 与 `worldYear / worldlineId` |
| 随机 | 种子 PRNG，机缘可复现，首次奖励/纪元事件有稳定唯一 ID |
| 存档 | 版本化快照、原子提交、恢复/迁移测试；保护遗物唯一性 |
| 平台 | Tap 小游戏适配插件、独立平台适配层、广告 mock → Dirichlet/TapADN |
| 验证 | 纯逻辑模拟 + 真机调试，重点覆盖长期轮回与时间边界 |

## 二、双时间轴的状态机
**必须同时保存** `age`、`lifeCap`、`worldYear`、`worldlineId`、`currentLifeId`、`epochEventFlags`、`worldConsequences`、`safeSpawnState`、`gameClockPaused` 与 `rngState`。

建议推进顺序：
1. 确认这次行动实际消耗的游戏年份；显示预计寿龄变化与世界关口是否将到。
2. 应用自动修行/资源转化与玩家行动，并处理**已成功完成的延寿或突破**；精确判断寿尽。
3. 检查被跨越的世界事件年份，不可因一次快速跳年漏过；事件进入 `PENDING_PLAYER_DECISION`，暂停推进直到玩家处理。
4. 结算关口生存路线。若角色死亡，进入一份**不可重复结算**的轮回快照；世界历史依规则保存。
5. 轮回/回溯分支单独执行且具幂等保护；重入游戏不能重复发 RP、复制遗藏或重置纪录。

**同年寿尽与灾劫冲突**：明确固定优先级（建议“完成本次行动→结算生存事件→结算寿尽”，若因行动已寿尽且不可能参与事件，则相应历史事件照世界规则发生）；在正式 PRD 与测试中确定精确边界，以免代码顺序改变结果。

## 三、实体遗藏持久化
- 实物永久唯一 ID + 当前 `worldlineId` + `itemState` + `ownerOrLocation` + `originLifeId` + `clueKnown`。
- 寻回、拆解、出售、迁移、回溯必须通过唯一所有权转移事务，**不能直接给角色生成第二份相同物品**。
- `魂印遗泽`持久化为独立的跨世能力记录，和实体 ID 的存取严格分离。
- 世界里程碑首次奖励使用**账号层的已获得记录**，不跟随纪元锚点回溯重置。
- 世界线切换：旧世界线档案只读保留历史，旧线实物不再可被当前线寻回；魂印、RP/道痕保留。

## 四、测试必须覆盖
- 在世界年 59 使用加速跳过 5 年：不能漏掉世界年60的致命关口。
- 寿限剩 1 年时突破成功/失败、事件出现与战死的优先级必须一致。
- 角色连续存活数百年，世界事件只按历史 ID 触发一次，不因轮回状态重复。
- 已死角色不会在离线恢复后又完成一年修炼；后台恢复不会静默超越斩杀线。
- 将上世护心玉埋藏、死亡、下世取回、再出售、再轮回：任意时刻只有一件实体。
- 读档重复领取 RP、纪元锚点回溯复制遗物、世界状态极端失败后一出生即死的回归测试。
- 大数运算、移动端内存、老存档升级与失败回滚。

## 五、小游戏运行环境
Tap 小游戏并非普通浏览器 DOM/BOM 运行环境。游戏必须经 Cocos 适配扩展打包并在目标设备验证 UI、生命周期、持久化、音频和广告接口。离线玩法意味着游戏逻辑可进行限定性的本地收益计算，**不意味着 Tap 小游戏平台始终无需网络启动**。

## 六、官方核验入口
- [Cocos/Laya/Egret 适配说明](https://developer.taptap.cn/minigameapidoc/dev/engine/Cocos-Laya-Egret/)
- [小游戏运行环境及 API](https://developer.taptap.cn/minigameapidoc/dev/tutorial/overview/)
- [小游戏创建与上传](https://developer.taptap.cn/minigameapidoc/quick-start/guide/creation-improvement/)
- [小游戏前置备案](https://developer.taptap.cn/minigameapidoc/quick-start/guide/pre-filing/)
- [Tap 小游戏 IAA](https://developer.taptap.cn/minigameapidoc/quick-start/monetization/IAA-game/)

技术实现细节以 [10 时间规则](10-TIME-EPOCH.md)和 [11 遗藏规则](11-LEGACY-ITEMS.md)为系统权威来源；此文仅列未来工程要解决的状态与测试。
