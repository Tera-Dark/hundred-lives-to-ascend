/** 稳定模拟接口。浏览器功能解锁与指引由 application/commands.mjs 管理。 */
export {
  SAVE_VERSION,
  PLANS,
  CAREERS,
  STUDIES,
  RELICS,
} from "./content/catalog.mjs";
export { createGame, lifeYear, careerRole, npcState } from "./engine/state.mjs";
export { rates } from "./engine/economy.mjs";
export {
  advance,
  respond,
  begin,
  setCareer,
  setOrigin,
  setPlan,
  setStudy,
  buy,
  buyPerk,
  equip,
  reincarnate,
  actionAvailability,
  actionStatus,
} from "./engine/runtime.mjs";
export { persist, restore } from "./engine/persistence.mjs";
