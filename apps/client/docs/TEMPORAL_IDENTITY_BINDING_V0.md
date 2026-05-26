# Temporal Identity Binding V0 — Time Ownership Contract

**Tag:** `RESEARCH-ONLY` / `CORE-ELIGIBLE` (`temporalIdentityBindingV0.js`)

**Phase:** 2.4 — closes the gap: *which past is correct?* → *which node may run which past?*

---

## Jurisdiction stack (not truth stack)

```
state → interpretation → permission → execution
```

| Layer | Question |
|-------|----------|
| Boot guard | Physically consistent? |
| Repair kernel | Structurally fixable? |
| Orchestrator | Execution-safe past? (`mayRehydrate` = **permission**) |
| **Temporal identity** | **Which node owns time on this timeline?** |

Rhizoh as **Epistemic Execution Authority Layer** — reality is permitted, not merely stored.

---

## Time Ownership Contract

`issueTimeOwnershipContractV0` — epistemic passport / reconciliation key:

- `nodeId`, `diskKey`, `jurisdictionId`
- `epistemicPast`, `trustedCheckpointTick`, `trustedThroughTick`, `replayFromTick`
- `executionPermitted` (derived from `mayRehydrate`)

`trustedCheckpointTick` is identity seed + multi-node anchor.

---

## Anti-hallucination for history

Repair Eligibility (orchestrator): `replayFromTick >= lastTrustedCheckpoint`

Temporal binding (node): `assertNodeExecutionJurisdictionV0` — same law at execution gate.

> Accessible past ≠ right to rebuild past.

---

## Multi-node arbitration

`arbitrateTemporalJurisdictionV0(local, remote)` — not “who is newer?” but **who holds execution right**.

Verdicts: `local_executes` | `remote_executes` | `divergent_jurisdiction` | `no_execution_right`

Barcelona vs Istanbul: higher checkpoint precedence wins when both permitted.

---

## Debug

```js
const r = await __rhizoh.runContinuityRecovery({ applyRepair: true });
r.timeOwnership;
r.temporalIdentity;
```

---

## Faz 2.5.1 — Temporal Conflict Resolution

[`temporalConflictResolutionV0.js`](../src/rhizoh/runtime/continuity/temporalConflictResolutionV0.js)

Same checkpoint, different **issuance path** → question becomes:

| Outcome | Meaning |
|---------|---------|
| `shared_jurisdiction_equal_rights` | hak eşitliği — same path + equal authority score |
| `temporal_conflict` | hak çatışması — different paths, tied authority |
| `local_wins_authority` / `remote_wins_authority` | lineage × witness decay × path weight |

**Authority score** = checkpoint core × issuance path weight × witness decay × lineage weight × witness strength.

## Faz 2.5.2 — Temporal Execution Binding

[`temporalExecutionBindingV0.js`](../src/rhizoh/runtime/continuity/temporalExecutionBindingV0.js)

**Conflict → execution policy** (karar değil, yürütme modu):

| Conflict outcome | Local execution mode | Gate | Concurrency |
|------------------|----------------------|------|-------------|
| `local_wins_authority` | `local_sovereign` | OPEN | sovereign single |
| `remote_wins_authority` | `remote_sovereign` / observe | MUTATION_FROZEN / OBSERVE_ONLY | sovereign single |
| `shared_jurisdiction_equal_rights` | elected executor OPEN, peer OBSERVE_ONLY | single_executor_elected | |
| `temporal_conflict` (prod) | `temporal_freeze` | MUTATION_FROZEN | none_frozen |
| `temporal_conflict` (lab `allowSpeculativeBranch`) | `speculative_branch_lab` | OBSERVE_ONLY | dual observe — **no mutation** |

`deriveEffectiveExecutionPermissionV0(recovery, binding)` — `mayRehydrate = orchestrator OPEN ∧ temporal OPEN`.

## Faz 2.5.3 — Temporal Execution Synchronization

[`temporalExecutionSyncV0.js`](../src/rhizoh/runtime/continuity/temporalExecutionSyncV0.js) · [`temporalExecutionSyncWireV0.js`](../src/rhizoh/runtime/continuity/temporalExecutionSyncWireV0.js)

**Problem:** policy local hesaplanıyor → A ve B ikisi de `local_sovereign` sanabilir.

**Çözüm:** peer feed’e `temporalExecutionPolicy` ekle → `stabilizeNetworkExecutionAuthorityV0`:

| Verdict | Anlam |
|---------|--------|
| `consensus_sovereign` | Tek mutator |
| `split_brain_resolved` | Çoklu sovereign → `computeNetworkExecutorNodeIdV0` (authority score + election) |
| `network_freeze` | Global authority tie + farklı issuance path |

Self binding network executor’a göre yeniden bağlanır (`network_stabilized`).

## Faz 2.5.4 — Temporal Authority Fixation

[`temporalAuthorityFixationV0.js`](../src/rhizoh/runtime/continuity/temporalAuthorityFixationV0.js)

**Problem:** authority oscillation — executor flips every sync pass.

**Fixation policy (defaults):**

- `minStablePassesToLock: 3` — ardışık aynı executor → `fixed`
- `fixationCooldownMs: 30s` — flip cooldown
- `authorityFlipMarginRatio: 1.15` — challenger skoru incumbent × 1.15 üstü olmalı
- `minPassIntervalMs: 500` — pass-rate damping
- `maxOscillationFlips: 4 / 60s` → `oscillation_freeze`

Entry: `runTemporalExecutionSyncWithFixationV0` (wire default `useFixation !== false`).

## Faz 2.6 — Temporal Audit + Re-Fixation

[`temporalAuditRefixationV0.js`](../src/rhizoh/runtime/continuity/temporalAuditRefixationV0.js)

**Soru:** Bu fixation hâlâ epistemik olarak geçerli mi, yoksa sadece tarihsel bir karar mı?

**Zorunlu sıra (false stability önleme):**

```
sync → audit → fixation
```

| Audit verdict | Trigger |
|---------------|---------|
| `epistemically_valid` | none |
| `historical_only` | invalidate — fixed ≠ fresh epistemic executor |
| `stale_witness` / `contract_revoked` / `drift_exceeded` | invalidate |

Entry: `runTemporalExecutionPipelineV0` (wire default).

## Faz 2.7 — Temporal Audit Integrity (audit of audit)

[`temporalAuditIntegrityV0.js`](../src/rhizoh/runtime/continuity/temporalAuditIntegrityV0.js)

**Soru:** Audit doğru mu, yoksa sadece geçmişte doğru kabul edilmiş bir yorum mu?

- **Grounding fingerprint** — audit yalnızca bu zemine göre anlamlı
- **Hash chain seal** — her audit kaydı `recordHash` zinciri
- **Meta-audit** — prior seal vs current ground → `stale_audit_interpretation` | `grounding_shift` | `verdict_contradiction`

**Pipeline (2.7):** `sync → audit → audit_integrity → fixation`

## Faz 2.8 — Temporal World Selection

[`temporalWorldSelectionV0.js`](../src/rhizoh/runtime/continuity/temporalWorldSelectionV0.js)

**Soru:** Birden fazla epistemically-valid geçmiş varsa, hangisi **yaşayan gerçeklik** olarak başlatılır?

| Verdict | Anlam |
|---------|--------|
| `living_world_selected` | Tek yaşayan world — `mayBootstrapRuntime` |
| `ambiguous_multi_valid` | Tie resolved (executor alignment / election) |
| `no_eligible_world` | Bootstrap kapalı |
| `deferred_selection` | Audit kirli veya seçim ertelendi |

`activeContract` + `livingWorldBootstrap` → fixation ve runtime hydrate anchor.

**Pipeline (güncel):** `sync → audit → audit_integrity → world_selection → fixation`

## Faz 2.8 seal — World Sealer & Hydrate Gate

[`worldSealerV0.js`](../src/rhizoh/runtime/continuity/worldSealerV0.js)

- `persistLivingWorldBootstrapV0` / `readLivingWorldBootstrapV0` — IDB `living_world_bootstrap_store` + `fixation_state_store` (continuity IDB v2)
- `enforceHydrateGateV0` — Cesium/map öncesi execution gate
- `sealPipelineLivingWorldV0` — pipeline çıktısını diske mühürle

## Faz 2.9 — Living World Drift & Re-Election

[`livingWorldDriftReelectionV0.js`](../src/rhizoh/runtime/continuity/livingWorldDriftReelectionV0.js)

World selection tek seferlik değil — `runLivingWorldLegitimizationV0` sürekli re-legitimization:

| Verdict | Anlam |
|---------|--------|
| `still_legitimate` | Yaşayan world geçerli |
| `drift_detected` / `re_election_required` | Yeniden seç + mühürle |
| `quarantine` | Bootstrap reddedildi |

*Wire: boot → `enforceHydrateGateFromDiskV0` before visual layer.*
