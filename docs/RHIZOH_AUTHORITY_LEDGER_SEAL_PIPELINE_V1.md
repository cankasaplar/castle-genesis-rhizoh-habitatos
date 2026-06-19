# Rhizoh Authority Ledger + Seal Pipeline v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`

**Prerequisites:** [`RHIZOH_ADMISSION_ARBITRATION_LAYER_V1.md`](RHIZOH_ADMISSION_ARBITRATION_LAYER_V1.md) · [`RHIZOH_EXECUTION_PHASE_SYNCHRONIZER_V0.md`](RHIZOH_EXECUTION_PHASE_SYNCHRONIZER_V0.md)

**Code:** `apps/client/src/rhizoh/runtime/authorityLedgerSealPipelineV1.js`

---

## 0. SSOT sentence

> **Rhizoh knows what reality is active, how realities fuse, and why it cannot mutate — Authority Ledger writes the official history.**

`ledger height = 0` / `seal = none` ends at client-local sealed entries. Gateway worker replay remains phase-gated until data-plane READY.

---

## 1. Authority chain

```
Admission Request → Human Attestation → Authority Decision → Ledger Seal → Reality Mutation
                                                                              ↑
                                                                    phase-gated (off)
```

| Stage | Role |
|-------|------|
| Admission Request | Arbitration verdict snapshot |
| Human Attestation | Elevation path only — no auto-admit |
| Authority Decision | `inference_read_only` \| `hold_no_downstream` \| `pending_human` \| `mutation_blocked` |
| Ledger Seal | Hash-chained append-only entry |
| Reality Mutation | **always false** on auto path (v1) |

---

## 2. Invariants

- `fusion ≠ authority` — ledger never written by fusion
- `realityMutationPermitted` — false unless signed READY (future data-plane)
- Local `replayAuthorityLedger()` verifies hash chain
- `workerReplayAvailable: false` until gateway data-plane activation

---

## 3. DevTools

```javascript
window.__rhizoh.authorityLedger()        // height, lastSeal, diagnosis
window.__rhizoh.replayAuthorityLedger()  // local hash-chain verify
window.__rhizoh.sealAuthorityDecision()
window.__rhizoh.recordHumanAttestation()
```

---

## 4. Maturity

| Level | Status |
|-------|--------|
| L3f Admission arbitration | ✔ |
| L3g **Authority ledger + seal** | ✔ this module |
| L3h Gateway witness persistence | ✔ [`RHIZOH_GATEWAY_AUTHORITY_PERSISTENCE_BRIDGE_V1.md`](RHIZOH_GATEWAY_AUTHORITY_PERSISTENCE_BRIDGE_V1.md) (deploy-gated) |
| L3i Worker authority replay alignment | ✔ [`RHIZOH_WORKER_AUTHORITY_REPLAY_ALIGNMENT_V1.md`](RHIZOH_WORKER_AUTHORITY_REPLAY_ALIGNMENT_V1.md) |
| L3j Distributed worker replay (full) | ❌ data-plane READY |
