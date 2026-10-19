import {
  rates,
  careerRole,
  npcState,
  lifeYear,
  actionStatus,
  PLANS,
  STUDIES,
  CAREERS,
  RELICS,
} from "../game.mjs";
import {
  section,
  title,
  icon,
  btn,
  progress,
  number,
  esc,
  pct,
} from "./components.mjs";
import { featureBlock } from "./guide.mjs";
import { isUnlocked } from "../application/onboarding.mjs";

const row = (ic, name, detail, control) =>
  `<div class="investment"><span class="square-icon">${icon(ic)}</span><div><b>${name}</b><small>${detail}</small></div>${control}</div>`;
const actionButton = (g, label, id, variant = "", cmd = "action") => {
  const status = actionStatus(g, id, variant);
  return `<div class="available-action">${btn(label, cmd, cmd === "action" ? id : variant, !status.ok, "action-btn secondary")}${!status.ok ? `<small>${esc(status.reason)}</small>` : ""}</div>`;
};
function planBox(g) {
  const l = g.life,
    r = rates(g),
    p = PLANS[l.plan];
  const choices = [
    ["earn", "coin", "谋生"],
    ["balance", "chart", "均衡"],
    ["cultivate", "bolt", "苦修"],
    ["study", "book", "研习"],
  ];
  return featureBlock(
    g,
    "plans",
    section(
      title("修行计划", "每年按同一份时间执行", "time") +
        `<div class="plan-options">${choices.map(([id, ic, name]) => `<button data-cmd="plan" data-arg="${id}" class="plan-choice ${l.plan === id ? "selected" : ""}" aria-pressed="${l.plan === id}">${icon(ic)}<b>${name}</b></button>`).join("")}</div><div class="alloc-compact"><span style="width:${pct(p.work)}"></span><span style="width:${pct(p.train)}"></span><span style="width:${pct(p.study)}"></span></div><div class="allocation-values"><span>营生 ${pct(p.work)}</span><span>修行 ${pct(p.train)}</span><span>研习 ${pct(p.study)}</span></div><div class="compact-metrics"><span>净收入 <b>${number(r.net)}</b>/年</span><span>修为 <b>+${number(r.qi)}</b>/年</span><span>研习 <b>+${number(r.research)}</b>/年</span></div>`,
      "plan-panel",
    ),
    "plan",
  );
}
export function cultivatePage(g) {
  const l = g.life,
    current = STUDIES[l.study];
  let html = l.action
    ? section(
        `<div class="action-current">${icon("time")}<div><b>行动进行中</b><span>还需${l.action.remaining}年，推进年份继续。</span></div></div>`,
      )
    : "";
  html += planBox(g);
  html += featureBlock(
    g,
    "study",
    section(
      title("研习法门", `当前：${current.name}`, "book") +
        `<div class="research-current"><div><strong>${current.name}</strong><span>${current.desc}</span></div><b>${l.studied.includes(l.study) ? "已完成" : `${number(l.studyProgress[l.study])}/${current.cost}`}</b></div>${progress(l.studyProgress[l.study], current.cost, false)}<div class="study-pills">${Object.entries(
          STUDIES,
        )
          .map(
            ([id, st]) =>
              `<button data-cmd="study" data-arg="${id}" class="study-pill ${l.study === id ? "selected" : ""}" ${l.studied.includes(id) ? "disabled" : ""}>${st.name}${l.studied.includes(id) ? " ✓" : ""}</button>`,
          )
          .join("")}</div>`,
      "study-panel",
    ),
    "study",
  );
  const food = row(
    "bowl",
    `灵食 · ${l.food === "spirit" ? "灵米药膳" : "粗茶淡饭"}`,
    "修行+8% · 维护0.7石/年",
    btn(
      l.food === "spirit" ? "已拥有" : "12石",
      "buy",
      "food",
      l.food === "spirit" || l.money < 12,
      "mini-action",
    ),
  );
  const home = isUnlocked(g, "home")
    ? row(
        "house",
        `居所 · ${l.home === "cottage" ? "清静小院" : "借宿棚屋"}`,
        "修行/研习+10% · 维护0.9石/年",
        btn(
          l.home === "cottage" ? "已拥有" : "28石",
          "buy",
          "home",
          l.home === "cottage" || l.money < 28,
          "mini-action",
        ),
      )
    : `<div class="locked-row">${icon("lock")} 清静小院 · 度过8年或营生Lv5后开放 ${btn("了解", "guide-open", "home", false, "guide-text")}</div>`;
  html += featureBlock(
    g,
    "food",
    section(
      title("生活投资", "先买得起，再看维护费", "house") +
        `<div class="list-condensed">${food}${home}</div>`,
      "life-panel",
    ),
    "life",
  );
  return html;
}
export function fatePage(g) {
  const l = g.life,
    r = rates(g),
    lv = l.level[l.career],
    limit = 10 + lv * 6;
  let html = featureBlock(
    g,
    "career",
    section(
      title("营生职业", "工作换取灵石与经验", "coin") +
        `<div class="career-main"><div><small>当前职位</small><strong>${careerRole(g)}</strong><span>${CAREERS[l.career].name}</span></div><span class="career-lv">Lv.${lv}</span></div><div class="meter-head"><span>职业经验</span><b>${number(l.xp[l.career])}/${limit}</b></div>${progress(l.xp[l.career], limit, false)}<div class="career-stats"><div><small>灵石净收入</small><b>${number(r.net)} <i>/年</i></b></div><div><small>营生经验</small><b>+${number(r.xp)} <i>/年</i></b></div><div><small>历史最高</small><b>Lv.${g.meta.bestCareer[l.career]}</b></div></div><div class="career-switch">${Object.entries(
          CAREERS,
        )
          .map(
            ([id, c]) =>
              `<button data-cmd="career" data-arg="${id}" class="career-choice ${id === l.career ? "selected" : ""}">${icon(id === "merchant" ? "bag" : "leaf")}<span><b>${c.name}</b><small>${c.roles[l.level[id] >= 5 ? 1 : 0]} · Lv.${l.level[id]}</small></span><span>${id === l.career ? "经营中" : "切换"}</span></button>`,
          )
          .join("")}</div>`,
    ),
  );
  html += featureBlock(
    g,
    "regions",
    section(
      title("地域与洞府", "迁居消耗8石与2年", "mountain") +
        `<div class="list-condensed">${[
          ["town", "浮潮集", "商行收入较高"],
          ["valley", "青药谷南麓", "采药与修炼更有利"],
        ]
          .map(([id, name, desc]) =>
            row(
              "mountain",
              name,
              desc,
              l.region === id
                ? '<span class="status-tag">当前</span>'
                : actionButton(g, "迁居", "move", id, "move"),
            ),
          )
          .join("")}</div>`,
    ),
    "region",
  );
  html += featureBlock(
    g,
    "companions",
    section(
      title("同道旧约", "承诺有代价，故人会老去", "people") +
        `<div class="list-condensed">${[npcState(g, "gu"), npcState(g, "shen")].map((n) => row("people", n.name, `${n.status} · ${n.age}岁`, `<span class="${n.helped ? "pass" : "muted"}">${n.helped ? "已有旧约" : "尚未立约"}</span>`)).join("")}</div>`,
    ),
  );
  html += featureBlock(
    g,
    "explore",
    section(
      title("机缘探索", "占用整段日程", "compass") +
        actionButton(g, "荒谷历练 · 8石 / 3年", "explore"),
    ),
  );
  html += featureBlock(
    g,
    "legacy",
    section(
      title(
        "前世实体旧物",
        g.world.jade === "stashed" ? "世界留有旧物" : "旧物随世界保存",
        "scroll",
      ) +
        `<p class="short-hint">${l.jade ? "本世持有同一件护心玉。" : g.world.jade === "hidden" ? "本世24年的旧井事件可发现一件实物。" : "离世后的旧玉需要在同一世界线寻回。"}</p>` +
        actionButton(g, "寻回旧玉 · 8石", "jade"),
    ),
    "legacy",
  );
  html += featureBlock(
    g,
    "relics",
    section(
      title("灵藏遗物", `${g.meta.equipped.length}/2 佩戴`, "spark") +
        `<div class="list-condensed">${Object.entries(RELICS)
          .filter(([id]) => g.meta.relics.includes(id))
          .map(([id, item]) =>
            row(
              "spark",
              item.name,
              item.desc,
              btn(
                g.meta.equipped.includes(id) ? "卸下" : "装备",
                "equip",
                id,
                !g.meta.equipped.includes(id) && g.meta.equipped.length >= 2,
                "mini-action",
              ),
            ),
          )
          .join("")}</div>`,
    ),
  );
  return html;
}
export function calamityPage(g) {
  const l = g.life,
    first = g.world.tide === "waiting",
    done = !first && g.world.veinDone,
    until = (first ? 60 : 95) - g.worldYear;
  let html = section(
    title("下一场危机", first ? "历史灵潮" : "地方余波", "shield") +
      `<div class="calamity-head"><div><span>${first ? "灵潮逆涌" : "余潮断脉"}</span><strong>${done ? "已结算" : `${Math.max(0, until)} 年`}</strong></div><small>${done ? "结果写入世界史" : "提前安排生存路线"}</small></div><p class="short-hint">${first ? "首劫需筑基或提前炼成护脉丹。" : done ? "历史不重播，地区将延续本次结果。" : "95年可稳脉、药材调脉或撤离。"}</p>`,
    "calamity-panel",
  );
  html += featureBlock(
    g,
    "alchemy",
    section(
      title("护脉丹方", `现有灵材 ${l.herbs}`, "bowl") +
        `<div class="list-condensed">${[
          ["common", "普通护脉", "55石 · 5材 · 3年"],
          ...(l.path === "dan"
            ? [
                ["economy", "省材护脉", "55石 · 4材 · 4年"],
                ["long", "驻元护脉", "80石 · 5材 · 5年 · 寿限140"],
              ]
            : []),
        ]
          .map(([id, name, cost]) =>
            row(
              "bowl",
              name,
              cost,
              l.pill
                ? '<span class="pass">已炼成</span>'
                : actionButton(g, "炼制", "pill", id, "pill"),
            ),
          )
          .join("")}</div>`,
    ),
  );
  html += featureBlock(
    g,
    "trial",
    section(
      title("心魔与心定印", "本世39年出现命关", "spark") +
        (l.trialToken
          ? `<div class="btn-row">${actionButton(g, "感悟 +120修为 / 2年", "trial-boon")}${actionButton(g, "寻材 +1 / 10石 / 2年", "trial-herb")}</div>`
          : `<p class="short-hint">${l.trialResolved ? "本世命关已经处理；心定印若已使用，不能重复领取。" : "心魔事件可用修为或药材应对，也允许退避。"}</p>`),
    ),
  );
  if (isUnlocked(g, "vein"))
    html += featureBlock(
      g,
      "vein",
      section(
        title("地方余波", "世界92/95年", "mountain") +
          `<p class="short-hint">药谷地脉${g.world.vein === "stable" ? "已经稳定" : g.world.vein === "ruined" ? "受到破坏" : "尚待历史抉择"}。修复或撤离改变后世的地方收益。</p>`,
      ),
    );
  return html;
}
export function rebirthPage(g, logFilter = "all") {
  const l = g.life;
  let html = featureBlock(
    g,
    "reincarnation",
    section(
      title("轮回与世录", `已历 ${g.meta.lives.length} 世`, "cycle") +
        `<p class="short-hint">现金、职业等级和本世功法重置；世界历史、灵藏与账号纪录保留。主动轮回至少需度过25年。</p><div class="rebirth-buttons">${btn(g.status === "ended" ? "进入下一世" : "主动轮回", "reincarnate", "", g.status === "boundary" || (g.status === "playing" && (lifeYear(g) < 25 || g.pending || l.action)), "action-btn primary")}</div>`,
    ),
  );
  html += featureBlock(
    g,
    "perks",
    section(
      title("永久传承", `${g.meta.rp} RP`, "cycle") +
        `<div class="list-condensed">${[
          ["learn", "旧业识途", "职业经验+10%", 3],
          ["meridian", "旧识经脉", "修为产出+15%", 4],
          ["auto", "生财有道", "55灵石自动转苦修", 5],
        ]
          .map(([id, name, desc, cost]) =>
            row(
              "spark",
              name,
              desc,
              btn(
                g.meta.perks.includes(id) ? "已解锁" : `${cost} RP`,
                "perk",
                id,
                g.meta.perks.includes(id) || g.meta.rp < cost,
                "mini-action",
              ),
            ),
          )
          .join("")}</div>`,
    ),
  );
  html += `<div data-feature="journal">${section(
    title("百世札记", `${g.journal.length} 条记录`, "scroll") +
      `<div class="log-filter">${[
        ["all", "全部"],
        ["world", "世界"],
        ["npc", "故人"],
        ["career", "营生"],
        ["breakthrough", "突破"],
        ["legacy", "遗物"],
      ]
        .map(([id, name]) =>
          btn(
            name,
            "filter",
            id,
            false,
            `filter-chip ${id === logFilter ? "selected" : ""}`,
          ),
        )
        .join("")}</div><div class="log-list">${
        g.journal
          .filter((x) => logFilter === "all" || x.type === logFilter)
          .slice(-12)
          .reverse()
          .map(
            (x) =>
              `<div class="log-entry"><small>第${x.lifeId}世 · 世界${x.worldYear}年</small><span>${esc(x.text)}</span></div>`,
          )
          .join("") || '<p class="short-hint">此类记录尚为空。</p>'
      }</div>`,
  )}</div>`;
  html += section(
    title("存档与指引", "", "flag") +
      `<div class="btn-row">${btn("导出进度", "save", "", false, "mini-action")}${btn("指引手册", "guide-open", "all", false, "mini-action")}${btn("重开当前世界", "reset", "", false, "mini-action")}</div>`,
  );
  return html;
}
