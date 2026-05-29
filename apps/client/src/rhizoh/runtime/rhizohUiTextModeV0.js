/**
 * UI text visibility modes — FULL / CLEAN / ZEN (default prod: zen).
 */

export const RHIZOH_UI_TEXT_MODE_V0 = Object.freeze({
  FULL: "full",
  CLEAN: "clean",
  ZEN: "zen"
});

const LS_KEY = "rhizoh.uiTextMode.v0";

function readEnvDefaultMode() {
  try {
    const raw = String(import.meta.env?.VITE_RHIZOH_UI_TEXT_MODE || "").trim().toLowerCase();
    if (raw === "full" || raw === "clean" || raw === "zen") return raw;
    if (import.meta.env?.DEV && import.meta.env?.VITE_DEBUG === "1") return RHIZOH_UI_TEXT_MODE_V0.FULL;
    return RHIZOH_UI_TEXT_MODE_V0.ZEN;
  } catch {
    return RHIZOH_UI_TEXT_MODE_V0.ZEN;
  }
}

export function getRhizohUiTextModeV0() {
  try {
    if (typeof window !== "undefined") {
      const stored = String(window.localStorage.getItem(LS_KEY) || "").trim().toLowerCase();
      if (stored === "full" || stored === "clean" || stored === "zen") return stored;
    }
  } catch {
    /* noop */
  }
  return readEnvDefaultMode();
}

export function setRhizohUiTextModeV0(mode) {
  const m = String(mode || "").trim().toLowerCase();
  if (m !== "full" && m !== "clean" && m !== "zen") return getRhizohUiTextModeV0();
  try {
    window.localStorage.setItem(LS_KEY, m);
  } catch {
    /* noop */
  }
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.uiTextMode = m;
    window.__rhizoh.uiTextVisibility = getRhizohUiTextVisibilityV0(m);
  }
  return m;
}

/**
 * @param {string} [modeOverride]
 */
export function getRhizohUiTextVisibilityV0(modeOverride) {
  const mode = modeOverride || getRhizohUiTextModeV0();
  const full = mode === RHIZOH_UI_TEXT_MODE_V0.FULL;
  const clean = mode === RHIZOH_UI_TEXT_MODE_V0.CLEAN;
  const zen = mode === RHIZOH_UI_TEXT_MODE_V0.ZEN;
  return Object.freeze({
    schema: "castle.rhizoh.ui_text_visibility.v0",
    mode,
    hud: !zen,
    eventStream: full,
    debugLogs: full,
    agentSubtitles: !zen,
    castleLabels: full,
    mapAnnotations: full,
    systemLog: full,
    minimalLabels: zen || clean,
    commandHints: !zen
  });
}

export function cycleRhizohUiTextModeV0() {
  const order = [RHIZOH_UI_TEXT_MODE_V0.ZEN, RHIZOH_UI_TEXT_MODE_V0.CLEAN, RHIZOH_UI_TEXT_MODE_V0.FULL];
  const cur = getRhizohUiTextModeV0();
  const i = order.indexOf(cur);
  return setRhizohUiTextModeV0(order[(i + 1) % order.length]);
}
