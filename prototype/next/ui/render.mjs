import { settingsPage, confirmationDialog } from "./settings.mjs";
import { DEFAULT_PREFERENCES } from "../application/preferences.mjs";
import * as components from "./components.mjs";
import {
  renderMasthead,
  renderWorld,
  renderSanctuary,
  renderDock,
  renderDesktopInscription,
} from "./sanctuary.mjs";
import {
  cultivatePage,
  fatePage,
  calamityPage,
  rebirthPage,
} from "./pages.mjs";
import { statusPane } from "./modals.mjs";
import { renderGuideCard, renderHandbook } from "./guide.mjs";
import {
  nextDelta,
  currentGoal,
  goalFeature,
} from "../application/selectors.mjs";
import { isUnlocked } from "../application/onboarding.mjs";

export function renderApp(g, ui, warning = "") {
  const preferences = ui.preferences || DEFAULT_PREFERENCES;
  const home = ui.tab === "修行";
  const settings = ui.tab === "设置";
  const body = settings
    ? settingsPage(g, preferences, ui.audioStatus, ui)
    : home
      ? renderSanctuary(
          g,
          components,
          () => cultivatePage(g),
          ui.detailsOpen,
          preferences,
        )
      : ui.tab === "机缘"
        ? fatePage(g)
        : ui.tab === "应劫"
          ? calamityPage(g)
          : rebirthPage(g, ui.logFilter);
  const dialog =
    statusPane(g) ||
    confirmationDialog(ui.confirm) ||
    renderHandbook(g, ui.handbook);
  const goalArg = goalFeature(g);
  const goalCommand = isUnlocked(g, goalArg) ? "guide-go" : "guide-open";
  const { icon, esc } = components;
  return `${renderDesktopInscription()}<div class="shell new-ui ${home ? "sanctuary" : "inner-page"}" ${dialog ? "inert" : ""}>
    ${renderMasthead(g, components, { compact: !home, settings })}
    ${warning ? `<div class="storage-warning" role="alert">${esc(warning)}${ui.externalChanged ? `<button data-cmd="reload">刷新载入新进度</button>` : ""}</div>` : ""}
    ${home ? (preferences.showScenery ? renderWorld(g, components) : "") : `<div class="page-banner"><span>${settings ? "安心修行 · 随心设置" : ui.tab === "机缘" ? "游历天地 · 寻访故人" : ui.tab === "应劫" ? "天道有数 · 早作筹谋" : "百世轮转 · 照见前尘"}</span><h2>${ui.tab}</h2></div>`}
    <main class="screen new-screen">${settings ? "" : renderGuideCard(g)}${settings ? "" : `<button class="goal-compact" data-cmd="${goalCommand}" data-arg="${goalArg}">${icon("target")}<span><small>此世所求</small><b>${esc(currentGoal(g))}</b></span>${icon("arrow")}</button>`}<div class="page-content">${body}</div><div class="foot-status" >${icon("scroll")}<span>${esc(ui.flash || g.notice)}</span></div></main>
    ${renderDock(g, components, ui.tab, nextDelta(g))}
    <div class="toast" role="status" aria-live="polite" hidden></div>
  </div>${dialog}<input id="save-import" type="file" accept=".json,application/json" hidden aria-label="导入游戏存档"/>`;
}
