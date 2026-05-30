# Post-Go-Live Autonomous Stability Contract (V1)

**Status:** SECURED — companion to [`RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md) §7  
**Tag:** `CORE-ELIGIBLE` (thresholds + schemas) · enforcement via read-only probes (no execution write)

**Purpose:** After activation, Rhizoh **self-audits** for silent drift (ordering, layer orphans, node desync). This is observability + determinism — not “AI self-awareness.”

---

## 1. System state output

| `system_state` | Meaning | Captain action |
|----------------|---------|----------------|
| `LIVE_OK` | All §7 checks green | Continue monitoring |
| `DEGRADED` | One check failed | Investigate; hold new Guardian invites |
| `QUARANTINE` | Two+ checks failed | Level A kill switch; no new Derived publish |

**Surface (client):** `window.__rhizoh_go_live_integrity` · `window.__rhizoh.goLiveIntegrity.evaluate()` · `startLoop(300000)`.

**Module:** `apps/client/src/rhizoh/runtime/postGoLiveIntegrityLoopV0.js`

---

## 2. Post-activation window (T+0 → T+300s)

| Phase | Duration | Action |
|-------|----------|--------|
| T+0 | Instant | Last Guardian seal → `startPostGoLiveIntegrityLoopV0()` |
| T+30…300 | Every 30 s | Run §7 three checks |
| T+300 | End | Loop stops; captain logs final `system_state` in SESSION_LOG |

---

## 3. Check definitions and thresholds

### 3.1 Event consistency

| Signal | Source | Pass |
|--------|--------|------|
| `eventSeqs[]` monotonic | `getEpistemicEventTraceV0()` (staging) or gateway stream cursor | No regression |
| Duplicate `seq` | Same trace | `duplicate_ingestion` → fail |
| Fallback | `window.__rhizoh_shadow_continuity.walTick` | Non-negative, non-decreasing across ticks |

**Drift threshold:** > 3 ordering regressions in 300 s → `DEGRADED`; > 10 → `QUARANTINE`.

**Event entropy (observational):** unique `kind` count / total events in 60 s window; alert if > 0.85 (noise storm) — captain review only, no auto-kill.

### 3.2 Layer trace validation (§0 Reality Seal)

| Rule | Pass |
|------|------|
| `∀ narrative_output ⇒ ∃ derived_source` | No orphan companion lines in trace export |
| `∀ derived_output ⇒ ∃ real_source_trace` | `atm_*` epoch or API ingest timestamp present |
| Production sim off | `VITE_EPISTEMIC_SIM_RESEARCH=0` — bus empty is OK; Narrative must stay baseline |

**Orphan narrative:** companion text without §0.10 `source_chain` / `trust_class` → `detectOrphanNarrativeOutputsV0()` → fail `layerTrace`.

**Probe:** `runOperationalContinuityProbeV1` — `primaryDriftClass` not in `projection_regressed` | `operational_gap` for 2 consecutive ticks.

### 3.3 Node health echo (Guardian heartbeat)

**Schema `guardian_heartbeat_v0`:**

```json
{
  "schema": "castle.rhizoh.guardian_heartbeat.v0",
  "nodeId": "node:ankara_satellite",
  "emittedAtMs": 1710000000000,
  "shadowWalTick": 0,
  "realIngressOk": true,
  "derivedLastComputedMs": 1710000000000
}
```

| Field | Layer | Required |
|-------|-------|----------|
| `nodeId` | A | Yes |
| `emittedAtMs` | A | Yes |
| `shadowWalTick` | A | Yes (onboarding) |
| `realIngressOk` | A | Weather/traffic last fetch ok |
| `derivedLastComputedMs` | B | Last resonance/compression compute |

**Pass:** Each activated Guardian emits ≥ 1 heartbeat within **120 s** (`heartbeatStaleMs`).

**Desync tolerance:** clock skew ≤ 5 s between nodes; ordering uses gateway `seq`, not client `Date.now` alone.

---

## 4. Automatic quarantine rules

| Condition | Auto action |
|-----------|-------------|
| `system_state === QUARANTINE` for 2 consecutive ticks | Recommend Level A (onboarding off) |
| `orphanNarrativeDetected` | Block new companion suggestions (policy filter) |
| `replayMismatchEvents` > 0 (`realityHealth`) | Recommend Level B review |
| `unsignedRejectEvents` spike | Gateway WAL auth audit |

No automatic Level B without human captain — protocol safety.

---

## 5. Kill switch recovery states (post §4)

| Level | After brake | System rests in |
|-------|-------------|-----------------|
| **A** Soft | Onboarding halted | **`GENESIS_BASELINE_READONLY`** — immutable genesis anchor + satellite registry **read-only**; Real ingress continues; Narrative = neutral baseline |
| **B** Hard | Stream truncated + replay | **`LAST_KNOWN_GOOD_SNAPSHOT`** — last verified `SealedRuntimeSnapshot` epoch; clients rehydrate; Derived recomputed from replay only |

**Invariant:** Neither recovery state writes `bootValidityToken` from Narrative or Derived. Genesis anchor is **never** mutated by rollback — only append streams after LKG point are discarded.

---

## 6. Continuous validation (post T+300s)

| Interval | Probe |
|----------|-------|
| 60 s | `VITE_SUBSTRATE_HEALTH_REPORT=1` → gateway `/rhizoh/substrate/health` |
| On seal tick | `realityHealthMetricsV0` counters |
| On boot | `runTemporalOntologicalWatchdogPassV0` when `VITE_ONTOLOGICAL_WATCHDOG=1` |

---

## 7. Related documents

| Doc | Topic |
|-----|--------|
| [`RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md`](RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md) | **Revoke / quarantine / shadow / correction** decision matrix |
| [`RHIZOH_OPERATIONAL_CONSTITUTION_V1.md`](RHIZOH_OPERATIONAL_CONSTITUTION_V1.md) | Time / Data / Perception integrity |
| [`RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md) | Activation + §7 loop |
| [`RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md`](RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md) | §0 ESM |
| [`CAPTAIN_BACKSTAGE_VERIFICATION_V0.1.md`](CAPTAIN_BACKSTAGE_VERIFICATION_V0.1.md) | Per-Guardian seal |

---

*Silent drift is the most dangerous production failure. This contract makes it visible before it becomes mythology.*
