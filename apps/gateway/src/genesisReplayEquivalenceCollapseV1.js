/**
 * (B) Equivalence collapse: disjoint seq bands, both non-trivial continuity, identical replay fingerprint.
 */
import { resolveGenesisReplayRouterV1 } from "./genesisReplayRouterV1.js";

export const GENESIS_REPLAY_EQUIVALENCE_COLLAPSE_SCHEMA = "castle.genesis.replay_equivalence_collapse.v1";

const MAX_WINDOWS = 8;

/**
 * @param {{ from: number, to: number, type?: string, windowCount?: number }} opts
 */
export async function detectEquivalenceCollapseWindowsV1(opts) {
  const from = Math.floor(Number(opts?.from) || 0);
  const to = Math.floor(Number(opts?.to) || 0);
  const typeFilter = String(opts?.type ?? "").trim();
  const span = to - from + 1;
  const rawW = Math.floor(Number(opts?.windowCount) || 0);
  const winCount = Math.min(MAX_WINDOWS, Math.max(2, rawW > 0 ? rawW : Math.min(6, Math.max(2, Math.ceil(span / 48)))));

  if (from <= 0 || to < from) {
    return { ok: false, error: "invalid_range", schema: GENESIS_REPLAY_EQUIVALENCE_COLLAPSE_SCHEMA };
  }

  const step = Math.max(1, Math.floor(span / winCount));
  /** @type {{ from: number, to: number, replayFingerprint: string, continuityEventCount: number }[]} */
  const windows = [];

  for (let i = 0; i < winCount; i++) {
    const a = from + i * step;
    const b = i === winCount - 1 ? to : Math.min(to, a + step - 1);
    if (a > b || a > to) break;
    const r = await resolveGenesisReplayRouterV1({
      from: a,
      to: b,
      type: typeFilter,
      includeCheckpoints: false
    });
    if (!r.ok) {
      return { ...r, schema: GENESIS_REPLAY_EQUIVALENCE_COLLAPSE_SCHEMA };
    }
    windows.push({
      from: a,
      to: b,
      replayFingerprint: String(r.replayFingerprint || ""),
      continuityEventCount: Math.floor(Number(r.continuityEventCount) || 0)
    });
  }

  /** @type {{ windowA: { from: number, to: number }, windowB: { from: number, to: number }, replayFingerprint: string }[]} */
  const collapses = [];
  function disjoint(a, b) {
    return a.to < b.from || b.to < a.from;
  }
  for (let i = 0; i < windows.length; i++) {
    for (let j = i + 1; j < windows.length; j++) {
      const wi = windows[i];
      const wj = windows[j];
      if (!disjoint(wi, wj)) continue;
      if (wi.continuityEventCount <= 0 || wj.continuityEventCount <= 0) continue;
      if (wi.replayFingerprint.length !== 64 || wi.replayFingerprint !== wj.replayFingerprint) continue;
      collapses.push({
        windowA: { from: wi.from, to: wi.to },
        windowB: { from: wj.from, to: wj.to },
        replayFingerprint: wi.replayFingerprint
      });
    }
  }

  return {
    ok: true,
    schema: GENESIS_REPLAY_EQUIVALENCE_COLLAPSE_SCHEMA,
    windowCount: windows.length,
    windows,
    collapseCount: collapses.length,
    collapses
  };
}
