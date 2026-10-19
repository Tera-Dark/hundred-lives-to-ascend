export const SAVE_VERSION = 3;
export const PLANS = Object.freeze({
  earn: { name: "营生优先", work: 0.55, train: 0.3, study: 0.15 },
  balance: { name: "均衡养道", work: 0.4, train: 0.45, study: 0.15 },
  cultivate: { name: "潜心苦修", work: 0.15, train: 0.7, study: 0.15 },
  study: { name: "研悟攻关", work: 0.15, train: 0.3, study: 0.55 },
});
export const CAREERS = {
  merchant: { name: "坊市商行", roles: ["坊市学徒", "行脚灵商"] },
  herbal: { name: "青药采集", roles: ["识草学徒", "山野采药客"] },
};
export const STUDIES = {
  stillness: { name: "静息诀", cost: 16, desc: "修为生产+12%", effect: "qi" },
  trade: {
    name: "坊市算经",
    cost: 13,
    desc: "商行工资+15%，职业经验+10%",
    effect: "merchant",
  },
  herbs: {
    name: "辨草小解",
    cost: 13,
    desc: "合法采材增益+1，草药经营更可靠",
    effect: "herbal",
  },
};
export const RELICS = {
  W01: { name: "旧纹吐纳玉", desc: "修行效率+3%", bonus: "qi" },
  W02: { name: "山药篓", desc: "一次采材选择额外+1灵材", bonus: "herb" },
  G01: { name: "凝息珠", desc: "修行效率+5%", bonus: "qi" },
  G03: { name: "旧井指针", desc: "寻回前世实体少耗2年", bonus: "trace" },
};
