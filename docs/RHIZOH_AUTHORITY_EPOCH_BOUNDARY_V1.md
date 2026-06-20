# Rhizoh Authority Epoch Boundary v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`

**Prerequisites:** [`RHIZOH_WORKER_AUTHORITY_REPLAY_ALIGNMENT_V1.md`](RHIZOH_WORKER_AUTHORITY_REPLAY_ALIGNMENT_V1.md)

**Code:** `apps/client/src/rhizoh/runtime/authorityEpochBoundaryV1.js`

---

## 0. SSOT sentence

> **Client boots mint a new authority epoch; gateway witnesses per epoch; alignment compares only within the same timeline.**

Divergence across epochs is `session_resync`, not `hard_divergence`.

---

## 1. Problem class: epoch boundary ambiguity

| Layer | Ontology |
|-------|----------|
| Client | Stateless reality generator (tab RAM) |
| Gateway | Stateful witness archive (server) |

Without `epochId`, height=1 on both sides is a **misleading match**.

---

## 2. Epoch mint (client boot)

```javascript
epochId = foldWalSegmentHash(genesis, { bootAtMs, clientSeed, schema })
```

- Minted once in `ensureAuthorityLedgerSealPipelineV1()`
- Attached to every sealed ledger entry (`entry.epoch`)
- Boot log: `boot.authority_epoch · epoch=h…`

---

## 3. Gateway per-epoch chains

Chain key: `subjectId::epochId`

- New epoch → fresh height=1 chain (no cross-epoch height regression)
- Witness HMAC includes `epochId`
- `GET /rhizoh/authority/ledger/replay?epochId=…`

---

## 4. Alignment rules (#223 precursor)

| Condition | `divergenceType` | `severity` |
|-----------|------------------|------------|
| `epochId` mismatch | `session_resync` | `soft_drift` |
| same epoch + seal mismatch | `seal_mismatch` | `hard_divergence` |
| same epoch + aligned | `none` | `none` |

---

## 5. Maturity

| Level | Status |
|-------|--------|
| L3i Replay alignment | ✔ |
| L3j **Epoch boundary primitive** | ✔ this module |
| L3k Divergence classifier | ❌ #223 |
