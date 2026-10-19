import { isUnlocked } from "../application/onboarding.mjs";
import { TAB_FEATURE } from "../content/features.mjs";
export const PAGE_HASH = {
  修行: "cultivation",
  机缘: "fate",
  应劫: "calamity",
  轮回: "rebirth",
  设置: "settings",
};
export function allowedPage(g, page) {
  return (
    page === "设置" ||
    Boolean(PAGE_HASH[page] && isUnlocked(g, TAB_FEATURE[page]))
  );
}
export function pageFromHash(hash) {
  return Object.keys(PAGE_HASH).find((page) => `#${PAGE_HASH[page]}` === hash);
}
export function createViewMemory(storage, key) {
  let memory = { page: "修行", scroll: {}, details: false };
  try {
    const saved = JSON.parse(storage.getItem(`${key}-view`) || "null");
    if (saved && PAGE_HASH[saved.page]) {
      memory.page = saved.page;
      memory.details = Boolean(saved.details);
      for (const page of Object.keys(PAGE_HASH)) {
        const value = saved.scroll?.[page];
        if (Number.isFinite(value))
          memory.scroll[page] = Math.max(0, Math.min(100000, value));
      }
    }
  } catch {}
  return {
    get page() {
      return memory.page;
    },
    get details() {
      return memory.details;
    },
    position(page) {
      return memory.scroll[page] || 0;
    },
    remember(page, scroll, details) {
      memory.page = page;
      memory.scroll[page] = scroll;
      if (page === "修行") memory.details = details;
    },
    save() {
      try {
        storage.setItem(`${key}-view`, JSON.stringify(memory));
      } catch {}
    },
  };
}
