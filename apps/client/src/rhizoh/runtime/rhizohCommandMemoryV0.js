/**
 * Command memory — last local command + system state hook (no LLM).
 */

export const RHIZOH_COMMAND_MEMORY_SCHEMA_V0 = "castle.rhizoh.command_memory.v0";

/** @type {object | null} */
let lastLocalCommand = null;

/**
 * @param {{ canonical: string, layer: string, action: string, atMs?: number }} entry
 */
export function recordLocalCommandMemoryV0(entry) {
  lastLocalCommand = Object.freeze({
    schema: RHIZOH_COMMAND_MEMORY_SCHEMA_V0,
    canonical: String(entry.canonical || ""),
    layer: String(entry.layer || ""),
    action: String(entry.action || ""),
    atMs: Number(entry.atMs) || Date.now()
  });
  if (typeof window !== "undefined") {
    window.__CASTLE_COMMAND_MEMORY__ = lastLocalCommand;
  }
  return lastLocalCommand;
}

export function readLocalCommandMemoryV0() {
  return lastLocalCommand;
}

/** @internal vitest */
export function __resetCommandMemoryForTestV0() {
  lastLocalCommand = null;
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_COMMAND_MEMORY__;
    } catch {
      /* noop */
    }
  }
}
