import { section, title, btn, esc } from "./components.mjs";
const toggle = (p, key, name, detail) =>
  `<div class="setting-row"><div><b>${name}</b><small>${detail}</small></div><button class="setting-switch" role="switch" aria-checked="${p[key]}" aria-label="${name}" data-cmd="preference" data-arg="${key}"><span></span><b>${p[key] ? "开" : "关"}</b></button></div>`;
const volume = (p, key, name) =>
  `<label class="setting-volume"><b>${name}<output data-volume-label="${key}">${p[key]}%</output></b><input type="range" min="0" max="100" step="1" value="${p[key]}" data-volume="${key}" aria-label="${name}"/></label>`;
export function settingsPage(g, p, audioStatus = "", meta = {}) {
  return `<div class="settings-page">${section(
    title("声音与反馈", "本机独立保存", "sound") +
      toggle(
        p,
        "music",
        "背景音乐",
        "《古琴幽篁》 · 按需加载，曲尾柔和衔接。",
      ) +
      volume(p, "musicVolume", "音乐音量") +
      btn("从头播放", "music-restart", "", !p.music, "mini-action") +
      toggle(p, "sfx", "操作音效", "Kenney / CC0 · 轻柔采样，分场景反馈。") +
      volume(p, "sfxVolume", "音效音量") +
      toggle(p, "haptics", "轻触振动", "仅在支持振动的设备生效。") +
      `<p class="settings-note">${p.sfx ? "分别试听五类音效：" : "开启操作音效后可试听。"}</p><div class="btn-row">${[
        ["tap", "轻点试听"],
        ["success", "成功试听"],
        ["event", "事件试听"],
        ["breakthrough", "突破试听"],
        ["error", "不足试听"],
      ]
        .map(([id, label]) =>
          btn(label, "audio-test", id, !p.sfx, "mini-action"),
        )
        .join(
          "",
        )}</div><p class="settings-note" data-audio-status role="status">${esc(audioStatus || (p.music ? "点击任意按钮恢复《古琴幽篁》。" : "音乐默认关闭；切到后台自动静音，返回后继续。"))}</p>`,
  )}
    ${section(
      title("阅读与画面", "舒适优先", "book") +
        toggle(
          p,
          "largeText",
          "大字模式",
          "正文、说明和按钮文字增大，布局随内容展开。",
        ) +
        toggle(
          p,
          "compactLayout",
          "紧凑首页",
          "减少主景高度和重复入口，常用操作直接可见。",
        ) +
        toggle(p, "reduceMotion", "减少动态", "关闭装饰动画与平滑滚动。") +
        toggle(
          p,
          "showScenery",
          "显示山水与人物",
          "关闭后使用纯色界面，保留全部功能。",
        ) +
        toggle(
          p,
          "redDots",
          "可用功能红点",
          "红点表示新介绍、资源达标或有空位；不代表必须执行。",
        ),
    )}
    ${section(
      title("操作与指引", "少误触，更安心", "shield") +
        toggle(
          p,
          "rememberPage",
          "记住浏览位置",
          "切页保留滚动和展开状态；再点当前页回到顶部。",
        ) +
        toggle(
          p,
          "feedback",
          "操作结果提示",
          "简短显示资源变化和日程调整结果。",
        ) +
        toggle(
          p,
          "keyboardShortcuts",
          "键盘快捷键",
          "1–5切页，N推进1年，M切换音乐；输入和弹层中停用。",
        ) +
        toggle(
          p,
          "confirmActions",
          "跨年行动确认",
          "闭关、炼丹、探索和迁居前显示实际年份与花费。",
        ) +
        toggle(
          p,
          "confirmYears",
          "多年快进确认",
          "点击5年或多年下一节点时，先确认寿元消耗。",
        ) +
        toggle(
          p,
          "confirmRebirth",
          "主动轮回确认",
          "主动结束此世前再次确认。",
        ) +
        `<div class="setting-row"><div><b>首次功能介绍</b><small>当前${g.meta.guide.muted ? "已收起" : "已开启"}；重大故事事件始终暂停。</small></div>${btn(g.meta.guide.muted ? "恢复" : "收起", g.meta.guide.muted ? "guide-resume" : "guide-mute", "", false, "mini-action")}</div><div class="btn-row">${btn("指引手册", "guide-open", "all", false, "mini-action")}${btn("重看介绍", "guide-replay", "", false, "mini-action")}</div>`,
    )}
    ${section(title("存档与维护", "游戏进度自动保存", "scroll") + `<p class="settings-note">${esc(meta.savedAt || "游戏进度自动保存到本机")}。导入或重开前自动留一份可恢复备份；导出不含设备偏好。</p><div class="btn-row">${btn("导出进度", "save", "", false, "mini-action")}${btn("导入存档", "import-open", "", false, "mini-action")}${btn("恢复替换前备份", "backup-restore", "", !meta.hasBackup, "mini-action")}${btn("恢复体验默认值", "preferences-reset", "", false, "mini-action")}</div><div class="danger-zone">${btn("重开当前世界", "reset", "", false, "mini-action")}<small>将清空当前槽进度；操作前仍会确认。</small></div>`)}</div>`;
}
export function confirmationDialog(confirm) {
  if (!confirm) return "";
  return `<div class="overlay"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><h2 id="confirm-title">确认操作</h2><p class="confirm-message">${esc(confirm.message)}</p><div class="btn-row">${btn("取消", "confirm-cancel", "", false, "mini-action")}${btn("确定继续", "confirm-accept", "", false, "mini-action")}</div></section></div>`;
}
