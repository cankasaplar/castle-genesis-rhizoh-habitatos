# Rhizoh Gateway Authority Persistence Bridge v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`

**Prerequisites:** [`RHIZOH_AUTHORITY_LEDGER_SEAL_PIPELINE_V1.md`](RHIZOH_AUTHORITY_LEDGER_SEAL_PIPELINE_V1.md)

**Code:** `apps/client/src/rhizoh/runtime/authorityGatewayPersistenceBridgeV1.js` · `apps/gateway/src/authorityLedgerWitnessStoreV1.js`

---

## 0. SSOT sentence

> **Client authority ledger writes local official history; Gateway Persistence Bridge witnesses sealed entries into shared official history — hold verdicts included.**

History = decisions, not successful mutations.

---

## 1. Bridge scope (transport only)

```
listen: rhizoh:authority-seal-v1
        ↓
shadow buffer
        ↓
batch flush
        ↓
POST /rhizoh/authority/ledger/batch
        ↓
gateway witness seal (HMAC)
        ↓
genesis surface counters (ledger height + last seal)
```

**Explicitly excluded from bridge:** fusion · REC · projection · arbitration recomputation

---

## 2. Witness invariants

| Rule | Policy |
|------|--------|
| Hold entries | **Written** — `holdRecorded: true` |
| Sealed-only transport | Only `castle.rhizoh.authority_ledger.v1.entry` |
| Gateway role | Append-only witness — validates `height`, `prevSealHash`, `sealHash` only |
| Client seal | Content hash chain (`foldWalSegmentHashV0`) |
| Gateway seal | HMAC witness over canonical witness payload |
| Mismatch | Quarantine — **no silent repair** |
| Mutation | Remains blocked (phase gate) |

---

## 3. Dual seal model

```
Client Seal (content chain)  →  Gateway Witness Seal (attestation)
```

Gateway does not replace client chain; it countersigns witnessed entries.

---

## 4. DevTools

```javascript
window.__rhizoh.authorityGatewayBridge()      // bridge snapshot + diagnosis
window.__rhizoh.flushAuthorityGatewayBridge() // manual shadow flush
```

Boot log: `boot.authority_gateway_bridge · armed shadow=N shared=false|true`

---

## 5. Genesis panel integration

On successful witness batch:

- `recordGenesisEpistemicLedgerPersisted(witnessed)` — ledger height increments
- `recordGenesisEpistemicSealIssued(clientSealHash)` — last seal updates

Until gateway deploys this route, client history remains local-only (expected).

---

## 6. Maturity

| Level | Status |
|-------|--------|
| L3g Authority ledger + client seal | ✔ |
| L3h **Gateway witness persistence** | ✔ this bridge (deploy-gated) |
| L3i Worker authority replay alignment | ✔ [`RHIZOH_WORKER_AUTHORITY_REPLAY_ALIGNMENT_V1.md`](RHIZOH_WORKER_AUTHORITY_REPLAY_ALIGNMENT_V1.md) |
| L3j Distributed worker replay (full) | ❌ data-plane READY |
