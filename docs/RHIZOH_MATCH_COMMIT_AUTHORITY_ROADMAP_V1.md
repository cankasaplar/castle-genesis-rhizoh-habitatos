# Rhizoh Match Commit Authority Roadmap v1

**Tag:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`  
**Parent:** [`RHIZOH_MATCHMAKING_CORE_SPEC_V1.md`](RHIZOH_MATCHMAKING_CORE_SPEC_V1.md) · [`RHIZOH_MATCH_AUTHORITY_LAYER_V1.md`](RHIZOH_MATCH_AUTHORITY_LAYER_V1.md)

---

## 0. Stage model (current)

| Stage | Name | Status |
|-------|------|--------|
| 1 | Observer Runtime | ✓ |
| 2 | Frozen API Surface | ✓ |
| 3 | Truth Kernel (`truth_log_v0`) | ✓ |
| 4 | Event-Sourced Replay (`produced === replayed`) | ✓ |
| 5 | Server Authority (single-writer rule) | ✓ simulated · ◐ live WS |
| 6 | Distributed Consensus | ✗ |

**SSOT sentence today:**

> Rhizoh enforces **single-writer rule**: client = `TRUTH_LOG_PREVIEW` + proposal only · server = sole `TRUTH_LOG_APPEND` commit writer via `MATCH_MOVE_ACK`.

| Field | Policy (always) | Effective (until live gateway) |
|-------|-----------------|--------------------------------|
| `commitAuthority` | `server_primary` | — |
| `effectiveCommitWriter` | — | `client_shadow` → `server` after ack |
| `proposalAuthority` | `client_shadow` | — |

Client `COMMIT_MOVE` without `provenance=gateway_ack` → `single_writer_violation`.

---

## 0.1 Pipeline (target)

```text
Client → ProposeMove → TRUTH_LOG_PREVIEW (prediction lane)
       → MATCH_MOVE (gateway WS)
Server → validate (authority_gateway)
       → commit (sole writer)
       → MATCH_MOVE_ACK → TRUTH_LOG_APPEND → reduce → broadcast
```

**Anti-pattern removed:** Client → Commit → Log → Reconcile → Fix

---

## 1. PR chain

### PR-1 — Validation layer (this branch, client-local)

Epistemic chain extension:

```text
TRUTH_LOG_APPEND
  ↓
MATCH_EVENT_APPENDED
  ↓
MATCH_EVENT_VALIDATED   (chess.js_local today · authority_gateway later)
  ↓
MATCH_EVENT_COMMITTED
  ↓
MATCH_STATE_REDUCED
```

On validation failure:

```text
MATCH_EVENT_REJECTED
```

**Console harness:** `verifyAuthorityBoundary({ reset: true })`

### PR-2 — Authority split (gateway READY)

Split log vocabulary:

| Phase | `source` |
|-------|----------|
| `PROPOSE_MOVE` | `proposalAuthority=client_shadow` |
| `VALIDATE_MOVE` | `authority_gateway` |
| `COMMIT_MOVE` | `commitAuthority=server` |
| `REDUCE_STATE` | `truth_kernel` |

Target log line:

```text
serverAuthoritative: true
commitAuthority: gateway
truthOrigin: gateway_ack
```

Gateway handler: `MATCH_MOVE_ACK` → truth dispatch `CommitMove` with `gatewayReady: true`.

### PR-3 — Drift injection proof

Forced divergence:

```text
clientShadowHash ≠ serverHash
  → DRIFT_DETECTED
  → RECONCILE_STATE
  → RECONCILIATION_APPLIED
  → DRIFT_RESOLVED
```

**Console harness:** `verifyDriftInjection({ reset: true })`

---

## 2. Verification order (before InviteOps)

```javascript
// 1. Truth kernel health
await window.__rhizoh.matchmaking.verifyProduction({ reset: true })

// 2. Authority boundary (proposal → validate → commit → replay)
await window.__rhizoh.matchmaking.verifyAuthorityBoundary({ reset: true })

// 3. Drift + reconciliation
await window.__rhizoh.matchmaking.verifyDriftInjection({ reset: true })
```

Do **not** advance to `__rhizoh.inviteOps` until PR-2 flips `serverAuthoritative: true` on a real gateway ack.

---

## 3. Honest baseline

- `MATCH_EVENT_VALIDATED` with `validationSource=chess.js_local` is **not** gateway authority — it proves the validation *slot* exists.
- `verifyAuthorityBoundary` reports `stage: "PARTIAL"` until gateway commit is wired.
- No fake `serverAuthoritative: true` in shadow rehearsal.

---

## Related

- `apps/client/src/rhizoh/runtime/matchmakingTruthAuthorityBoundaryV0.js`
- `apps/client/src/rhizoh/runtime/matchmakingTruthAuthorityObservabilityV0.js`
