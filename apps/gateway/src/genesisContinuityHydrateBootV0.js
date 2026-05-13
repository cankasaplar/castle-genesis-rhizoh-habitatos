import { applyGenesisCheckpointHydrationV0 } from "./genesisContinuityCheckpointV0.js";
import {
  hydrateGenesisCheckpointLogFromDiskV0,
  readGenesisContinuityHeadLastSeqV0,
  genesisContinuityDiskPersistEnabled
} from "./genesisContinuityPersistenceV0.js";
import { rehydrateGenesisContinuitySeqFromBootV0 } from "./genesisContinuityStreamHubV0.js";

/**
 * Boot: replay checkpoint JSONL into memory + continuity seq floor from head file / checkpoints.
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function hydrateGenesisContinuityPersistenceBootV0() {
  if (!genesisContinuityDiskPersistEnabled()) return { ok: true };
  const r = await hydrateGenesisCheckpointLogFromDiskV0();
  if (!r.ok) {
    console.error("[GENESIS_PERSIST] checkpoint hydrate failed:", r.error);
    return { ok: false, error: r.error };
  }
  if (r.latestCp && r.ledgerHeadHex) {
    applyGenesisCheckpointHydrationV0(r.ledgerHeadHex, r.latestCp);
  }
  const headSeq = await readGenesisContinuityHeadLastSeqV0();
  const floor = Math.max(headSeq, r.maxSeqCommitted || 0);
  if (floor > 0) rehydrateGenesisContinuitySeqFromBootV0(floor);
  return { ok: true };
}
