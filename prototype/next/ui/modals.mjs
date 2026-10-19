import { npcState } from "../game.mjs";
import { button, esc } from "./components.mjs";
export function statusPane(g) {
  if (g.status === "ended")
    return `<div class="overlay"><div class="modal" role="dialog" aria-modal="true" aria-label="本世结束"><p class="eyebrow">又一世 · 照世碑</p><h2>这一世已经结束</h2><p>${esc(g.notice)}</p><p class="muted">RP、灵藏与历史纪录保留；现金、职业等级和所学功法重置。转世间隔占2个世界年，故人也会继续老去。</p>${button("带着历史进入下一世", "reincarnate", "", { cls: "main-btn wide" })}</div></div>`;
  if (g.status === "boundary")
    return `<div class="overlay"><div class="modal" role="dialog" aria-modal="true" aria-label="原型内容边界"><h2>原型内容边界</h2><p>世界历160年之后尚未制作；当世与历史安全保存，没有凭空死亡或领取RP。</p>${button("导出/保存当前进度", "save", "", { cls: "small-btn" })}</div></div>`;
  if (!g.pending) return "";
  return modal(g, g.pending);
}
function modal(g, type) {
  const l = g.life;
  let title = "",
    desc = "",
    ops = [],
    extra = "";
  const op = (text, arg, disabled = false, detail = "") =>
    ops.push({ text, arg, disabled, detail });
  switch (type) {
    case "intro":
      extra = `<div class="birth-choice"><p class="muted">先选择出身（不限制之后转岗）</p><div class="btn-grid"><button class="plan ${l.origin === "market" ? "selected" : ""}" data-cmd="origin" data-arg="market">浮潮散修<small>坊市较便于赚钱</small></button><button class="plan ${l.origin === "herbal" ? "selected" : ""}" data-cmd="origin" data-arg="herbal">药谷学徒<small>有1份起步灵材</small></button></div></div>`;
      title = `第${l.id}世 · 修行从谋生开始`;
      desc =
        "选择出身，再选择这一世的主修。开始后先推进1年，了解资源与寿元；日程、职业、功法和后续功能将按进度逐步开放，首次都有介绍。";
      op("玄修 · 以境破劫", "xuan", false, "更擅长稳定突破与成长");
      op("丹修 · 以药续命", "dan", false, "保留灵材，允许省材或驻元丹方");
      break;
    case "materials18":
      title = "药庐的委托";
      desc = "你得到一次真正可用的机会，当前阶段缺灵材还是灵石？";
      op("领取3份灵材", "herbs");
      op("把药材卖成22灵石", "money");
      break;
    case "materials34":
      title = "荒谷的两条路";
      desc = "旧山道留下了材料与修为两种机缘，你没有足够时间两者兼得。";
      op("获得3份灵材", "herbs");
      op("静心参悟 +180修为", "qi");
      break;
    case "npc":
      title = "修仙路上的同行者";
      desc =
        "同道的承诺会留在世界里。帮助需要时间和资源，也可以拒绝；只有仍在世的故人才能与你本人合作。";
      op(
        "帮顾南枝守药圃 ·4石/1材/2年",
        "gu",
        l.money < 4 || l.herbs < 1 || !npcState(g, "gu").alive,
      );
      op(
        "帮沈望川护商队 ·12石/1年",
        "shen",
        l.money < 12 || !npcState(g, "shen").alive,
      );
      op("各自谋生，暂不立约", "ignore");
      break;
    case "jade":
      title = "旧井旁的玉";
      desc =
        l.id === 1
          ? "青苔下埋着一块刻有奇异纹路的护心玉。它不是可跨世界复制的永久增益图谱。"
          : "旧井仍在。前世留下的器物也许就藏在这里。";
      op("收下旧玉/记录旧迹", "ok");
      break;
    case "trial":
      title = "心魔问境";
      desc =
        "对任何道途而言，迈出下一步都需要放弃某些东西。成功获得本世一次性「心定印」资格，不能反复刷永久碎片。";
      op("以修为镇心 ·至少900，消耗150", "qi", l.qi < 900);
      op("以药稳神 ·15石/1材", "herbs", l.money < 15 || l.herbs < 1);
      op("暂退，不领取命关收益", "retreat");
      break;
    case "warning":
      title = "灵潮将至";
      desc =
        "天衡星环的灵潮将在世界60年袭来。筑基或提前炼成护脉丹可以幸存，缺少准备会陨落。";
      op("查看计划，继续准备", "ok");
      break;
    case "tide":
      title = "浮岚界 · 灵潮逆涌";
      desc =
        l.realm === "筑基" || l.pill
          ? "你做的准备足以对抗灵潮。世界将记住这一刻。"
          : "你的境界与护脉准备仍不足以抵御这场历史灾劫。此世或将在这里终结。";
      op("面对这场历史", "face");
      break;
    case "past":
      title = "前世在这片土地上的回响";
      desc =
        "往昔之人已经老去，有些约定却成为留给后世的线索与凭证。今世的你可以凭照世碑寻找它们。";
      if (g.world.npc.gu.helped)
        op("追查药谷遗方 ·辨草进度+7/灵材+1", "gu-record");
      if (g.world.npc.shen.helped) op("核对商路旧账 ·灵石+12", "shen-record");
      op("继续今世的道路", "ok");
      break;
    case "vein-warning":
      title = "余潮断脉的预兆";
      desc =
        "灵潮后的地脉依然不稳。世界95年将有一场地方危机，这不是世界60年灵潮重播。";
      op("提前查看应劫路线", "ok");
      break;
    case "vein":
      title = "世界95年 · 余潮断脉";
      desc =
        "地方灵脉将断，你可以付出修为与财物修复它，也可以撤离，让后世面对另一种地区生态。";
      op("筑基稳脉 ·10石/2年", "cult", l.realm !== "筑基" || l.money < 10);
      op("药材调脉 ·35石/2材/3年", "med", l.money < 35 || l.herbs < 2);
      op("支付15灵石撤离 ·1年", "leave", l.money < 15);
      op("3年救济劳动后撤离", "labor");
      break;
    default:
      title = "命运抉择";
      op("继续", "ok");
  }
  return `<div class="overlay"><div class="modal" role="dialog" aria-modal="true" aria-label="${title}"><p class="eyebrow">浮岚纪事 · 第${l.id}世</p><h2>${title}</h2><p>${desc}</p>${extra}<div class="modal-options">${ops.map((x) => `<button data-cmd="reply" data-arg="${x.arg}" ${x.disabled ? "disabled" : ""}><strong>${x.text}</strong>${x.detail ? `<span>${x.detail}</span>` : ""}</button>`).join("")}</div></div></div>`;
}
