# Rhizoh Shadow Production — 3-Day Soak Checklist v0

**SPECFLOW:** `RESEARCH-ONLY`  
**Window:** 3-day shadow prod soak (not 7–14 day activation gate)  
**Companion:** [RHIZOH_SHADOW_PROD_3DAY_SPRINT_V0.md](RHIZOH_SHADOW_PROD_3DAY_SPRINT_V0.md)

---

## Daily gate (all 3 days)

```js
window.__rhizoh.refreshShadowDevTools?.()
console.table({
  mode: window.__rhizoh.executionGovernance?.mode,
  externalEffect: window.__rhizoh.executionGovernance?.externalEffectPermitted,
  legalHold: window.__rhizoh.executionGovernance?.legalGateHardBlock,
  shadowMode: window.__rhizoh.executionGovernance?.shadowModeActive
})
```

Expect: `externalEffect === false`, `legalGateHardBlock === true`, shadow mode active.

---

## Day 3 exit criteria

| # | Check | Pass signal |
|---|--------|-------------|
| 1 | Unlisted YouTube test uploaded (manual OBS) | Studio shows unlisted VOD or live test |
| 2 | Compliance bundle export | `exportShadowComplianceSnapshot('youtube_test_broadcast')` has `interpretationOnly`, `replayLock.replayFingerprint` |
| 3 | Cluster learning loop | `learningReport().clusterSession.gamesEnded >= 1` after ~90s |
| 4 | Invited cohort authority lock | Quarantine user: `injectEpistemicStress` blocked; founder DevTools OK |
| 5 | Cohort enforce path (when env on) | `completeCohortGateV0` calls admission engine; HOLD → hold screen |

---

## Chess cluster soak (Day 2–3 carry)

```js
window.__rhizoh.chessGameCluster?.slots?.[0]?.clock?.timeControlId
// cluster_sim_45_0 — must not bleed to blitz_3_2 from arena session

const lr = await window.__rhizoh.learningReport()
console.table({
  sessionGamesEnded: lr.clusterSession?.gamesEnded,
  gamesCompleted: lr.gamesCompleted,
  timeControl: window.__rhizoh.chessGameCluster?.timeControlId
})
```

---

## Broadcast pre-flight (YT1–YT4)

```js
window.__rhizoh.chessBroadcastOpponentMatrix?.()
// featuredMatch: RhizohAI vs Stockfish MAX · slot 0

window.__rhizoh.exportShadowComplianceSnapshot?.('youtube_test_broadcast_pre')
```

OBS: see [RHIZOH_CHESS_BROADCAST_8CAM_RUNBOOK_V0.md](RHIZOH_CHESS_BROADCAST_8CAM_RUNBOOK_V0.md).

---

## Invited cohort (C5)

When `VITE_RHIZOH_CLOSED_ADMISSION=1` and `VITE_RHIZOH_CLOSED_ADMISSION_ENFORCE=1`:

```js
// After cohort accept on ingress:
window.__rhizoh.cohortGate?.hook  // "engine_evaluation"
window.__rhizoh.closedAdmission?.verdict  // "admit" | "hold" | "reject"
window.__rhizoh.executionGovernance?.quarantineCohort?.inQuarantineCohort
```

Quarantine user must not pass:

```js
window.__rhizoh.injectEpistemicStress?.({ actor: 'user' })
// → blocked / quarantine_cohort_no_stress_injection
```

---

## Post-soak archive

1. `exportShadowComplianceSnapshot('day3_soak_close')` — copy JSON to `docs/exports/ops/` (manual)
2. Note bundle hash: `replayLock.replayFingerprint`
3. YouTube test URL (unlisted) in ops log — no secrets in repo

---

## Non-goals (soak window)

- Legal gate open / `VITE_RHIZOH_LIVE_READY`
- In-app RTMP / automated YouTube publish
- Frozen core `phase562–570` edits
