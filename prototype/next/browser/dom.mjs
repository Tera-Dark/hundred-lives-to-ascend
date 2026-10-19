import {
  availableHints,
  hintForCommand,
} from "../application/notifications.mjs";
export function decorateNotifications(root, g, enabled) {
  if (!enabled) return;
  const hints = availableHints(g);
  for (const control of root.querySelectorAll(
    "button[data-cmd]:not(:disabled)",
  )) {
    const hint = hintForCommand(
      hints,
      control.dataset.cmd,
      control.dataset.arg || "",
    );
    if (!hint) continue;
    control.setAttribute(
      "aria-label",
      `${control.getAttribute("aria-label") || control.textContent.trim()}，${hint}`,
    );
    control.classList.add("has-notification");
    const dot = document.createElement("i");
    dot.className = "notification-dot";
    dot.setAttribute("aria-hidden", "true");
    control.append(dot);
  }
}
export function findControl(root, identity) {
  return (
    identity &&
    [...root.querySelectorAll("button[data-cmd]")].find(
      (el) =>
        el.dataset.cmd === identity.cmd &&
        el.dataset.arg === (identity.arg || "") &&
        !el.disabled &&
        !el.closest("[inert]"),
    )
  );
}
export function controlIdentity(element) {
  return element?.dataset?.cmd
    ? { cmd: element.dataset.cmd, arg: element.dataset.arg || "" }
    : null;
}
export function trapDialogKey(event, dialog) {
  if (event.key !== "Tab") return;
  const controls = [
    ...dialog.querySelectorAll(
      "button:not(:disabled),summary,a[href],input:not(:disabled)",
    ),
  ].filter((el) => el.getClientRects().length);
  const first = controls[0],
    last = controls.at(-1);
  if (
    (event.shiftKey && document.activeElement === first) ||
    (!event.shiftKey && document.activeElement === last)
  ) {
    (event.shiftKey ? last : first)?.focus();
    event.preventDefault();
  }
}
