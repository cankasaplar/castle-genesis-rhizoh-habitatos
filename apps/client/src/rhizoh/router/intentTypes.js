/**
 * Rhizoh Conversation Intent Engine — sabit sözleşme (gateway + istemci).
 */

export const RHIZOH_INTENT = Object.freeze({
  CHAT: "CHAT",
  BUILD: "BUILD",
  PLAY: "PLAY",
  CRISIS: "CRISIS",
  REFLECT: "REFLECT",
  SILENCE: "SILENCE"
});

/** Alt niyet: BUILD ve CRISIS için anlamlı; diğerlerinde NONE */
export const RHIZOH_SUB_INTENT = Object.freeze({
  NONE: "NONE",
  CODE: "CODE",
  DESIGN: "DESIGN",
  ARCHITECTURE: "ARCHITECTURE",
  WORLD: "WORLD",
  MEMORY: "MEMORY",
  SYSTEM: "SYSTEM",
  BUG: "BUG",
  GATEWAY: "GATEWAY",
  PERFORMANCE: "PERFORMANCE",
  CONFUSION: "CONFUSION"
});

/** LLM / araç seçimi için ipuçları */
export const RHIZOH_TOOL = Object.freeze({
  CODEX: "codex",
  STUDIO: "studio",
  GATEWAY: "gateway",
  WORLD: "world",
  CESIUM: "cesium",
  SANDBOX: "sandbox",
  MEMORY: "memory"
});

/**
 * @param {string} intent
 * @param {string} subIntent
 * @param {Record<string, unknown>} [runtime]
 * @returns {string[]}
 */
export function toolHintsForIntent(intent, subIntent, runtime = {}) {
  const hints = new Set();
  const i = String(intent || "");
  const s = String(subIntent || "");

  if (i === RHIZOH_INTENT.CRISIS) {
    hints.add(RHIZOH_TOOL.CODEX);
    if (s === RHIZOH_SUB_INTENT.GATEWAY || /gateway|ağ geçidi|bağlantı/i.test(String(runtime?.lastErrorSnippet || ""))) {
      hints.add(RHIZOH_TOOL.GATEWAY);
    }
    if (s === RHIZOH_SUB_INTENT.PERFORMANCE || s === RHIZOH_SUB_INTENT.BUG) {
      hints.add(RHIZOH_TOOL.STUDIO);
    }
  }
  if (i === RHIZOH_INTENT.BUILD) {
    if (s === RHIZOH_SUB_INTENT.CODE || s === RHIZOH_SUB_INTENT.SYSTEM) {
      hints.add(RHIZOH_TOOL.STUDIO);
      hints.add(RHIZOH_TOOL.CODEX);
    }
    if (s === RHIZOH_SUB_INTENT.DESIGN || s === RHIZOH_SUB_INTENT.ARCHITECTURE) {
      hints.add(RHIZOH_TOOL.STUDIO);
    }
    if (s === RHIZOH_SUB_INTENT.WORLD) {
      hints.add(RHIZOH_TOOL.WORLD);
      hints.add(RHIZOH_TOOL.CESIUM);
    }
    if (s === RHIZOH_SUB_INTENT.MEMORY) {
      hints.add(RHIZOH_TOOL.MEMORY);
      hints.add(RHIZOH_TOOL.CODEX);
    }
  }
  if (i === RHIZOH_INTENT.PLAY) {
    hints.add(RHIZOH_TOOL.SANDBOX);
    hints.add(RHIZOH_TOOL.WORLD);
  }
  if (i === RHIZOH_INTENT.REFLECT) {
    hints.add(RHIZOH_TOOL.MEMORY);
    hints.add(RHIZOH_TOOL.CODEX);
  }
  if (i === RHIZOH_INTENT.CHAT) {
    /* açık araç yok — sohbet öncelikli */
  }

  return [...hints];
}
