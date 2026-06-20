# Rhizoh Worker Authority Replay Alignment v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`

**Prerequisites:** [`RHIZOH_GATEWAY_AUTHORITY_PERSISTENCE_BRIDGE_V1.md`](RHIZOH_GATEWAY_AUTHORITY_PERSISTENCE_BRIDGE_V1.md)

**Code:** `apps/client/src/rhizoh/runtime/workerAuthorityReplayAlignmentV1.js`

---

## 0. SSOT sentence

> **Alignment asks where the same authority state can be computed — not which node owns truth.**

Distributed epistemic transition: single-runtime simulation → multi-node replay equivalence.

---

## 1. Scope (authority replay only)

```
Client Authority Ledger (local replay)
        ↓
Gateway Witness Replay (GET /rhizoh/authority/ledger/replay)
        ↓
Worker slot (optional — data-plane READY)
        ↓
workerAuthorityReplayAlignmentV1()
```

**Excluded:** fusion · REC · projection · arbitration

---

## 2. API

```javascript
workerAuthorityReplayAlignmentV1({
  ledger: AuthorityLedgerV1,
  gatewayWitness: GatewayWitnessV1,
  replayMode: "deterministic-only",
  compare: ["sealHead", "height", "entryHashChain"],
  workerReplay: { available: false }  // optional
})
```

### Output

| Field | Values |
|-------|--------|
| `aligned` | boolean |
| `divergenceType` | `none` \| `session_resync` \| `seal_mismatch` \| `height_desync` \| `entry_hash_drift` \| `missing_entry` |
| `severity` | `none` \| `soft_drift` \| `hard_divergence` |
| `sourceOfTruth` | `client` \| `gateway` \| `worker` \| `undetermined` |
| `witnessPropagation` | `complete` \| `incomplete` \| `epoch_boundary` \| `unknown` |
| `sameTimeline` | `true` when client + gateway share `epochId` |

---

## 3. Divergence semantics

| Type | Meaning (not "error") |
|------|------------------------|
| `session_resync` | Epoch boundary — expected cross-boot drift |
| `height_desync` | Transport lag / ordering drift (same epoch) |
| `missing_entry` | Witness not yet received — **incomplete witness propagation** when `sameTimeline: true` |
| `seal_mismatch` | Hard divergence — quarantine path |
| `entry_hash_drift` | Per-height hash chain differs |

**Policy:** mismatch → quarantine → block mutation → human investigation (no silent repair).

When `divergenceType: missing_entry` + `sameTimeline: true` + `severity: soft_drift` + `sourceOfTruth: client`:

> Reality exists locally but gateway has not yet witnessed this epoch partition — **not** authority divergence, consensus break, or hash bug.

---

## 4. DevTools

```javascript
window.__rhizoh.authorityReplayAlignment({ ledger, gatewayWitness })
await window.__rhizoh.runAuthorityReplayAlignment()  // fetches gateway replay
```

Boot: `boot.authority_replay_alignment · armed deterministic-only`

---

## 5. PR chain

| PR | Module |
|----|--------|
| **#222** | `workerAuthorityReplayAlignmentV1` (this) |
| **#223** | epoch boundary — `session_resync` vs `hard_divergence` |
| **#224** | gateway entry guarantee + partition enforcement |

---

## 6. Maturity

| Level | Status |
|-------|--------|
| L3h Gateway witness persistence | ✔ |
| L3i **Worker authority replay alignment** | ✔ this module |
| L3j Gateway entry guarantee | ✔ #224 |
| L3k Distributed consensus shadow | ❌ data-plane READY |
