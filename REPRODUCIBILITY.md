# Rhizoh Paper v0.1 — Reproducibility

**Tag:** `RESEARCH-ONLY`  
**Paper:** [`docs/academic/RHIZOH_DISTRIBUTED_REALITY_CONSTRUCTION_PAPER_V0.1.md`](docs/academic/RHIZOH_DISTRIBUTED_REALITY_CONSTRUCTION_PAPER_V0.1.md)  
**Preprint PDF:** [`docs/academic/preprint/paper-v0.1.pdf`](docs/academic/preprint/paper-v0.1.pdf)

This document describes how to reproduce the claims in the Rhizoh v0.1 preprint.

---

## What is claimed (falsifiable)

| Claim | Evidence |
|-------|----------|
| Event-sourced authoritative truth | `truth_log_v0` + deterministic `replay()` |
| Client is not commit authority | `clientIsCommitAuthority: false`, `commitAuthority: null` |
| Server single-writer finalization | `effectiveCommitWriter: server` after gateway ack |
| Drift is detectable and recoverable | `verifyDriftInjection()` harness |
| Preview vs commit separation | `TRUTH_LOG_PREVIEW` vs `TRUTH_LOG_APPEND` |

**Not claimed:** production multiplayer fan-out, cross-tower consensus, daily-life OS readiness.

---

## One-command CI reproduction

From repository root:

```bash
npm install
npm run academic:reproduce-paper
```

This runs:

1. `npm run ops:validate-matchmaking-spec-v1` — doc/schema/runtime boundary checks
2. Truth kernel unit tests (`matchmakingTruthKernelV0.test.js`)
3. Authority boundary tests (`matchmakingTruthAuthorityBoundaryV0.test.js`)

CI-only (faster):

```bash
node scripts/reproduce-paper-v0.1.mjs --ci-only
```

---

## Browser harness (live client)

Requires a running Rhizoh client (`npm run dev:client` locally, or https://rhizoh.com after boot completes).

Open DevTools console:

```javascript
await window.__rhizoh.matchmaking.verifyProduction({ reset: true })
await window.__rhizoh.matchmaking.verifyAuthorityBoundary({ reset: true })
await window.__rhizoh.matchmaking.verifyDriftInjection({ reset: true })
window.__rhizoh.matchmaking.truthStatus()
```

### Expected outcomes

| Harness | Pass condition |
|---------|----------------|
| `verifyProduction` | `ok: true`, `moveCount >= 1`, `produced === replayed` |
| `verifyAuthorityBoundary` | `ok: true`, `clientIsCommitAuthority: false` |
| `verifyDriftInjection` | `driftDetected: true`, reconciliation applied |

Console log vocabulary to inspect:

```text
TRUTH_LOG_PREVIEW | TRUTH_LOG_APPEND
MATCH_EVENT_APPENDED | MATCH_EVENT_VALIDATED | MATCH_EVENT_REJECTED
MATCH_EVENT_COMMITTED | MATCH_STATE_REDUCED
DRIFT_DETECTED | RECONCILIATION_APPLIED | DRIFT_RESOLVED
```

---

## Code anchors (reviewer audit)

| Concept | Module |
|---------|--------|
| Truth kernel | `apps/client/src/rhizoh/runtime/matchmakingTruthKernelV0.js` |
| Single-writer policy | `apps/client/src/rhizoh/runtime/matchmakingSingleWriterPolicyV0.js` |
| Gateway commit | `apps/gateway/src/rhizoh/matchMoveAuthorityV0.js` |
| Broadcast transport | `apps/client/src/rhizoh/runtime/matchmakingBroadcastTransportV0.js` |

---

## Export preprint PDF

```bash
npm run academic:export-preprint
```

Outputs:

- `docs/academic/preprint/paper-v0.1.md`
- `docs/academic/preprint/paper-v0.1.pdf`
- `docs/academic/preprint/figures/*.png`

---

## Cite this preprint

```bibtex
@misc{rhizoh2025preprint,
  title={Rhizoh: Event-Sourced Authority Arbitration for Reconciliation-Based Distributed Reality Construction},
  author={[Founder] and Rhizoh Habitat},
  year={2025},
  howpublished={GitHub preprint v0.1-preprint},
  url={https://github.com/cankasaplar/castle-genesis-rhizoh-habitatos},
  note={RESEARCH-ONLY; harness-verified prototype}
}
```

Replace `url` and `author` with release tag URL and affiliation before arXiv submission.

---

*RESEARCH-ONLY — claims bind to harness output, not marketing narrative.*
