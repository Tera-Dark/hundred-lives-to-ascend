# 当前网页原型

维护对象：`prototype/next/`。独立ES Modules、无运行时依赖，保留现有墨青留白美术、四个玩法入口与设置页。

从仓库根目录运行：

```powershell
npm run dev
npm run check
npm test
```

打开 `http://127.0.0.1:8000/next/`。新手独立体验使用 `http://127.0.0.1:8000/next/?slot=guide-demo`，不要清空默认玩家存档。

- [架构与模块职责](../../docs/ARCHITECTURE.md)
- [19项功能的开放条件与文案维护](../../docs/ONBOARDING.md)
- [运行、测试、浏览器与存档排障](../../docs/RUNBOOK.md)
- [触控、声音与QoL设置](../../docs/EXPERIENCE.md)
- [现行限制](../../docs/BACKLOG.md)
- [变更记录](../../docs/CHANGELOG.md)

默认存档键保持 `bsjl-v12-current`。v2读档迁移到v3，保留已有玩家功能；功能开放与介绍已读记录在账号层跨世保留。旧版 `prototype/` 不共用存档。

当前玩法止于筑基、两位NPC初次合作与有限跨世回响、世界60/95事件和160安全边界。无完整高境界、复杂产业委托、76遗物或正式平台接入。当前69项测试验证确定边界与固定策略，不宣称全数值平衡或真人成功率。

美术文件在 `assets/`，没有新增烘焙UI图片；`styles/theme.css`管理主题，`styles/onboarding.css`管理介绍与手册，`styles/mobile.css`管理触控与设备偏好，`styles/qol.css`管理双栏、常用操作与滑杆。原型截图在仓库根 `output/preview/`，属于对应日期的历史效果记录。

本轮新增首页日程/机会、位置记忆、浏览器返回、结果提示、导入与恢复、用户BGM流式播放；验证见[QOL-VALIDATION](../../docs/QOL-VALIDATION.md)。
