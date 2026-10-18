# 07 · 技术栈与 TapTap 适配预案

> **技术决策是预案，非开发授权。** 正式编码前先做平台构建/广告可用性的小范围验证。本文件依据 2026-10-18 检索到的官方开发文档编写，提审时复核最新条款。

## 技术建议
| 层 | 选型 |
|---|---|
| 游戏引擎 | **Cocos Creator 3.8.8**（已在本地安装的版本，3.8.x 符合 Tap 扩展要求） |
| 代码 | **TypeScript**，业务规则和 Cocos 场景/组件分离 |
| 游戏 UI | Cocos 原生 2D UI，9:16 竖屏、适配安全区 |
| 增量数值 | 独立大数模型（指数/对数或可靠定点/大数库）；进行确定性比较、序列化 |
| 游戏时钟 | 显式年推进/暂停/倍速，离线恢复边界可控 |
| 随机 | 可保存状态的 seeded PRNG，事件可复现，测试可重放 |
| 存储 | 有版本号、校验、原子写入思想的本地存档；必要时再研究 TapTap 登录/云存档 |
| 广告 | 独立 AdAdapter + mock 实现，开发后期接 Dirichlet/TapADN |
| 测试 | 逻辑层单测、固定种子批量轮回模拟、真机内存/帧率/后台恢复验证 |

## 为什么不是网页 React + H5 直接上传？
目标是 **Tap 小游戏**（不是普通 H5 页面，也不是 APK）：宿主 JavaScript 环境和浏览器不同，不能依赖 DOM、window、本地浏览器存储等标准 Web API。Cocos 官方/平台适配扩展能处理部分兼容问题，**但必须在真实 Tap 小游戏环境中验证**，不能以 PC 浏览器预览成功作为交付标准。

## 官方适配路径（在 M0 核验）
1. 在 Cocos Creator 3.8.x 中导入并启用 Tap 小游戏适配扩展。
2. 官方文档流程是先构建微信小游戏，再勾选“转换为 Tap 小游戏”，配置平台 AppID，由扩展生成 Tap 可上传的 game.zip。
3. 以官方示例构建最小空项目，验证 Touch/暂停恢复/音频/大数序列化与本地存储能力。
4. 按提审当时有效的包体/首包/分包要求调整资源。官方不同页面可能针对不同游戏形态或更新阶段给出不同限制，**不锁死一个统一 MB 值**。
5. 发布前核实登录、主体认证、小游戏前置备案、隐私、广告审核、版号适用性与当地要求，不能假设简单单机就可以跳过平台环节。

## 推荐逻辑边界（尚未建目录）
- **Simulation / Clock**：世界年与 Tick、暂停/加速、年度事件。
- **Cultivation**：修为生产、境界/突破、功法效果。
- **Encounter**：命格、概率池与稀有事件。
- **Calamity**：阶段压力、护界效果、成绩计算。
- **Reincarnation**：RP、道痕、遗泽、跨世成就与新世初始化。
- **Economy**：灵石、灵材和投入转化。
- **Save / Platform**：存档适配、生命周期、登录、广告和分析。
- **Presentation**：Cocos UI、动画、文字、声音；只订阅快照状态，不持有权威数值。
规则层应不依赖引擎即可执行千次模拟。大数格式化与内部原值分开，存档不能只存显示字符串。

## 单机与网络的边界
Tap 小游戏不应被假定为完全离线可启动；即使逻辑能本地运行，平台本身可能需要联网进入。游戏可使用离线时间差计算**有限的修炼收益**，但未经玩家确认不得在后台自动触发终局、扣光永久资源或完成不可逆轮回。
存档迁移须有旧版本回滚/备份策略；手动改系统时间和崩溃重入属于风险测试场景。

## 官方核查入口
- [Cocos/Laya/Egret 适配说明](https://developer.taptap.cn/minigameapidoc/dev/engine/Cocos-Laya-Egret/)
- [小游戏运行环境及 API](https://developer.taptap.cn/minigameapidoc/dev/tutorial/overview/)
- [创建小游戏和上传包体](https://developer.taptap.cn/minigameapidoc/quick-start/guide/creation-improvement/)
- [小游戏前置备案](https://developer.taptap.cn/minigameapidoc/quick-start/guide/pre-filing/)
- [Tap 小游戏 IAA 说明](https://developer.taptap.cn/minigameapidoc/quick-start/monetization/IAA-game/)

## M0 技术风险清单
- 插件与本机 Cocos 3.8.8 兼容、构建/打包稳定性
- 真机前后台事件与时钟是否正确
- 移动端大数性能、长时间存档和 RNG 可复现性
- 首屏加载包大小、字体/图集内存、异常断网处理
- 广告 SDK 的游戏形态要求、回调幂等与激励发放安全
