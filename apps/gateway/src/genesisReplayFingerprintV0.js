import crypto from "node:crypto";

/**
 * Deterministic replay-oriented **identity slice** over gateway-visible continuity fields (not tick-driven
 * UI noise; not a full merkle ledger root). Pairs with causal `seq` transport; proof chain is a separate artifact.
 * @param {Record<string, unknown>} surfacePayload — output of `buildGenesisRuntimeSurfacePayload`
 */
export function computeGenesisReplayFingerprintV0(surfacePayload) {
  const basis = {
    schema: "castle.genesis.replay_fingerprint.v0",
    ledgerTotal: Number(surfacePayload?.epistemicLedger?.entriesPersistedTotal ?? 0),
    replayAlignment: String(surfacePayload?.replay?.alignment ?? ""),
    divergenceTotal: surfacePayload?.replay?.divergenceTotal ?? null,
    infraStatus: String(surfacePayload?.infra?.status ?? "")
  };
  const canon = JSON.stringify(basis);
  const hex = crypto.createHash("sha256").update(canon, "utf8").digest("hex");
  return {
    schema: basis.schema,
    short: `${hex.slice(0, 4)}:${hex.slice(4, 8)}:${hex.slice(8, 12)}`,
    hex,
    basis
  };
}
