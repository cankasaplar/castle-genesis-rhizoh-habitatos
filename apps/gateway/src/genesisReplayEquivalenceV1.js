/**
 * Temporal equivalence: two replay bands share the same fingerprint manifold ⇔ equivalent class.
 */
import { resolveGenesisReplayRouterV1 } from "./genesisReplayRouterV1.js";

export const GENESIS_REPLAY_EQUIVALENCE_SCHEMA = "castle.genesis.replay_equivalence.v1";

/**
 * @param {{
 *   from1: number, to1: number,
 *   from2: number, to2: number,
 *   type?: string,
 *   includeCheckpoints?: boolean
 * }} opts
 */
export async function compareGenesisReplayEquivalenceV1(opts) {
  const typeFilter = String(opts?.type ?? "").trim();
  const includeCheckpoints = opts?.includeCheckpoints !== false;

  const r1 = await resolveGenesisReplayRouterV1({
    from: opts.from1,
    to: opts.to1,
    type: typeFilter,
    includeCheckpoints
  });
  if (!r1.ok) return { ...r1, side: 1, schema: GENESIS_REPLAY_EQUIVALENCE_SCHEMA };

  const r2 = await resolveGenesisReplayRouterV1({
    from: opts.from2,
    to: opts.to2,
    type: typeFilter,
    includeCheckpoints
  });
  if (!r2.ok) return { ...r2, side: 2, schema: GENESIS_REPLAY_EQUIVALENCE_SCHEMA };

  const fp1 = String(r1.replayFingerprint || "");
  const fp2 = String(r2.replayFingerprint || "");
  const equivalent = fp1.length === 64 && fp2.length === 64 && fp1 === fp2;

  return {
    ok: true,
    schema: GENESIS_REPLAY_EQUIVALENCE_SCHEMA,
    band1: { from: r1.from, to: r1.to, replayFingerprint: fp1 },
    band2: { from: r2.from, to: r2.to, replayFingerprint: fp2 },
    equivalent,
    /** Manifold id = fingerprint (same class iff equivalent). */
    equivalenceClassId1: fp1,
    equivalenceClassId2: fp2
  };
}
