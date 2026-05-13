import crypto from "node:crypto";

const ANCHOR = "castle.genesis.ledger_chain.anchor|v0";

/** Genesis ledger chain fixed anchor (matches checkpoint materialize initial head). */
export function getGenesisLedgerChainAnchorHexV0() {
  return crypto.createHash("sha256").update(ANCHOR, "utf8").digest("hex");
}

export { ANCHOR as GENESIS_LEDGER_CHAIN_ANCHOR_V0 };
