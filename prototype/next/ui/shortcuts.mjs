import { PLANS, rates } from "../game.mjs";
import { availableHints } from "../application/notifications.mjs";
import { isUnlocked } from "../application/onboarding.mjs";
import { icon, number, esc, btn } from "./components.mjs";

export function quickPlans(g) {
  if (!isUnlocked(g, "plans")) return "";
  const r = rates(g);
  return `<section class="panel quick-plans"><div class="panel-head"><h2>${icon("chart")} 日程</h2><span class="panel-meta">${esc(PLANS[g.life.plan].name)}</span></div><div class="quick-plan-options">${[
    ["earn", "营生"],
    ["balance", "均衡"],
    ["cultivate", "苦修"],
    ["study", "研习"],
  ]
    .map(
      ([id, label]) =>
        `<button data-cmd="plan" data-arg="${id}" aria-pressed="${g.life.plan === id}" class="${g.life.plan === id ? "selected" : ""}">${label}</button>`,
    )
    .join(
      "",
    )}</div><p>灵石净收入 <b>${number(r.net)}</b>/年 · 修为 <b>+${number(r.qi)}</b>/年</p>${g.life.action ? `<small>行动期间暂停普通日程；完成后使用此安排。</small>` : ""}</section>`;
}
function destination(hint) {
  if (hint.cmd === "guide-open") return hint.arg;
  if (hint.cmd === "action")
    return {
      foundation: "foundation",
      xuan: "foundation",
      explore: "explore",
      jade: "legacy",
      "trial-boon": "trial",
      "trial-herb": "trial",
    }[hint.arg];
  return {
    buy: hint.arg,
    pill: "alchemy",
    equip: "relics",
    perk: "perks",
    reincarnate: "reincarnation",
  }[hint.cmd];
}
export function opportunityList(g) {
  const hints = availableHints(g),
    unique = [];
  for (const hint of hints) {
    const feature = destination(hint);
    if (feature && !unique.some((h) => h.feature === feature))
      unique.push({ ...hint, feature });
  }
  return `<section class="panel opportunities"><div class="panel-head"><h2>${icon("spark")} 现在可做</h2><span class="panel-meta">${unique.length ? `${unique.length}项机会` : "按自己的节奏"}</span></div>${
    unique.length
      ? `<div class="opportunity-list">${unique
          .slice(0, 3)
          .map((h) =>
            btn(
              `${esc(h.text)}${icon("arrow")}`,
              "guide-go",
              h.feature,
              false,
              "opportunity-link",
            ),
          )
          .join(
            "",
          )}</div><small>点击查看位置；不会直接花费资源或推进时间。</small>`
      : `<p>暂时没有新的达标操作，继续修行或调整日程。</p>`
  }${g.life.studied.includes(g.life.study) ? `<p class="research-reminder">${g.life.studied.length < 3 ? "当前功法已完成，可在详细安排中更换研习目标。" : "本世三项功法已完成，研习份额暂不产生新功法收益。"}</p>` : ""}</section>`;
}
