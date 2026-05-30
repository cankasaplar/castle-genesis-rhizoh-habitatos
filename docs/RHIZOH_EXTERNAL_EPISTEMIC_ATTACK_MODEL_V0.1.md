# Rhizoh External Epistemic Attack Model (v0.1)

**Status:** SECURED — red-team / auditor lens (non-executable)  
**Tag:** `RESEARCH-ONLY` · adversarial review before centralized observability  
**Prerequisite:** [`RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md`](RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md) `allPassed` does **not** mean “unbreakable” — it means **documented law held under simulated faults**.

**Observability (v0.1 shipped):** [`RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md`](RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md) — `violationObservationLogV0.js` (READ-ONLY append trace). Compound + gateway correlation: v0.2.

---

## Auditor premise

You are an external reviewer, not a believer. Your job is to find where:

1. **Language** outruns **enforcement**
2. **UI** outruns **log**
3. **Captain** becomes hidden central authority
4. **Simulation** creates false confidence
5. **Distributed enforcement** hides cross-layer contradictions

Rhizoh claims: *distributed epistemic kernel with simulated violation response guarantees* — test that claim, do not admire it.

---

## Six-layer stack (what you are attacking)

| # | Layer | Artifact | Attacker focus |
|---|--------|----------|----------------|
| 1 | Charter | Honest Baseline | Moral language without tests |
| 2 | Protocol | Manifesto §0–§9 | Checksum theater |
| 3 | Interface | Outreach packs | Tone without membrane |
| 4 | Operational | Constitution I–III | Law without enforcement path |
| 5 | Playbook | 4 response modes | Mode confusion under compound fault |
| 6 | Simulation | 9 law scenarios | Happy coverage bias |

**Literal claim under review:**  
*Rhizoh behaves as a distributed epistemic kernel with formally simulated violation response guarantees.*

**Falsify if:** any attack below produces **silent wrong reality** (user believes sealed state that log denies) without a detectable signal.

---

## Attack taxonomy (A1–A12)

### A1 — Semantic trust creep (doc > code)

| | |
|---|---|
| **Attack** | Ship compelling Narrative (D); slowly drop `source_chain` in prod UI while docs still cite §0.10. |
| **Expected failure** | Users trust voice/UI; execution layer unchanged but **perception integrity** breaks. |
| **Defense** | `detectOrphanNarrativeOutputsV0` · `postGoLiveIntegrityLoop` layer trace · manifesto §3 |
| **Sim** | `ui_orphan_narrative`, `ui_missing_provenance_gate` |
| **Residual risk** | **High** if prod hides provenance UI but still shows authoritative copy — sim does not render DOM. |

**Auditor ask:** Show provenance on every user-visible narrative line in production build, or downgrade claim.

---

### A2 — Observation → execution leakage (classic agentic bug)

| | |
|---|---|
| **Attack** | Companion or Lab AI tool call wired to seal/WAL “for convenience.” |
| **Expected failure** | LLM output becomes state — charter spine destroyed. |
| **Defense** | `executive: false` · EXTERNAL_LAB_AI spec · Observation Fabric |
| **Sim** | Not E2E — grep/CI boundary scans |
| **Residual risk** | **Medium** — one bad PR bypassing review; graph validation helps frozen core, not all runtime wiring. |

**Auditor ask:** `rg` for narrative paths writing `bootValidityToken`, seal, or WAL without derived chain.

---

### A3 — Ghost bootstrap / half-revoked context

| | |
|---|---|
| **Attack** | Inject stale token in memory; UI still shows “world live.” |
| **Expected failure** | User acts on dead authority. |
| **Defense** | `enforceRuntimeBootValidityTokenV0` → revoke + hard reload |
| **Sim** | `ghost_bootstrap_injection` ✔ |
| **Residual risk** | **Low** in tested path; **Medium** if UI ignores `hardReload` flag. |

---

### A4 — WAL drift with plausible UI (log/UI split)

| | |
|---|---|
| **Attack** | Cursor/segment mismatch while map and companion still feel “fine.” |
| **Expected failure** | Epistemic inversion — UI as truth. |
| **Defense** | `validateCursorSegmentAnchorV0` · recovery orchestrator · constitution Article II |
| **Sim** | `wal_cursor_segment_mismatch`, `correction_hash_mutation_repair` |
| **Residual risk** | **Medium** — no continuous UI↔log diff HUD (observability gap). |

---

### A5 — Peer poison (distributed lie)

| | |
|---|---|
| **Attack** | Broadcast stale or replay-mismatch WAL from peer; hope local merge. |
| **Expected failure** | Cross-node canonical corruption. |
| **Defense** | `peerWalConvergenceWireV0` → **quarantine**, no merge |
| **Sim** | `peer_quarantine_stale` ✔ |
| **Residual risk** | **Low** per peer frame; **Medium** if captain manually overrides quarantine. |

---

### A6 — Geography theater (lore as proof)

| | |
|---|---|
| **Attack** | Marketing “Serencebey genesis” while runtime allows any `node:*_satellite`; or reverse — claim distributed anchors but force single city in outreach. |
| **Expected failure** | Symbolic place replaces verifiable WGS84 anchor. |
| **Defense** | Outreach geography policy · dynamic slug catalog |
| **Sim** | None (social/process) |
| **Residual risk** | **High** for **Interface** layer drift; **Low** for runtime if map pick enforced. |

**Auditor ask:** Compare live outreach copy to [`OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md`](OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md) pre-flight block.

---

### A7 — Frozen core theater (hash lock as marketing)

| | |
|---|---|
| **Attack** | Claim “immutable forever” while shipping behavior changes via ungated runtime flags. |
| **Expected failure** | Frozen core becomes brand, not graph. |
| **Defense** | `stabilization:validate-graph` on CI · constitution Article I |
| **Sim** | CI only — not in violation suite |
| **Residual risk** | **Low** for v562–570; **Medium** for membrane flags changing prod behavior without SESSION_LOG. |

---

### A8 — Simulation false confidence

| | |
|---|---|
| **Attack** | `allPassed: true` → team skips staging; assumes law = production. |
| **Expected failure** | Tested law ⊂ deployed law. |
| **Defense** | Go-Live §0 precondition · Launch Polish · captain Denetim |
| **Sim** | 9 scenarios — **not** browser, gateway, or captain SPOF |
| **Residual risk** | **High** if deploy without §6 gate — simulation is necessary not sufficient. |

**Auditor ask:** Same commit hash for CI law tests and production artifact; log `violation-sim` in SESSION_LOG before shift.

---

### A9 — Distributed enforcement blind spot (no global arbiter)

| | |
|---|---|
| **Attack** | Trigger **two** violations in different modules simultaneously (orphan narrative + peer stale + ordering drift). |
| **Expected failure** | Conflicting modes (revoke vs quarantine vs repair); captain sees contradictory signals. |
| **Defense** | Playbook priority (not yet unified bus) · captain judgment |
| **Sim** | Per-tick: `compound_orphan_and_ordering` · cross-tick: `epistemicTickLedger` A9 closure |
| **Residual risk** | **Medium** — ledger closes multi-tick compound; still no execution arbiter |

**Auditor ask:** Export `window.__rhizoh.epistemicTickLedger.exportHistory()` after staging regression; verify `a9Closed` when compound spans ≥2 ticks. See [`RHIZOH_EPISTEMIC_TICK_LEDGER_V0.1.md`](RHIZOH_EPISTEMIC_TICK_LEDGER_V0.1.md).

---

### A10 — Captain / console as SPOF

| | |
|---|---|
| **Attack** | All truth in `window.__rhizoh_*`; captain absent; no gateway alert. |
| **Expected failure** | System “correct” only for insiders with console. |
| **Defense** | `postGoLiveIntegrityLoop` · `realityHealthMetricsV0` (counters) |
| **Sim** | Partial |
| **Residual risk** | **High** — observability not first-class product surface. |

---

### A11 — Gateway §7 vacuum

| | |
|---|---|
| **Attack** | Client shows `LIVE_OK` while gateway stream regresses (multi-client desync). |
| **Expected failure** | Per-client truth ≠ network truth. |
| **Defense** | [`RHIZOH_EXTERNAL_BOUNDARY_VALIDATION_V0.1.md`](RHIZOH_EXTERNAL_BOUNDARY_VALIDATION_V0.1.md) — `externalBoundaryValidationV0` |
| **Sim** | `external_boundary_divergence` · `externalBoundaryValidationV0.test.js` |
| **Residual risk** | **Medium** — v0.1 seq scalar; §7 auto-tick hook v0.2 |

---

### A12 — Anti-manipulation claim overreach

| | |
|---|---|
| **Attack** | Position Rhizoh as “no attention economy” while studio UX still optimizes engagement elsewhere. |
| **Expected failure** | Ethical charter without UX audit. |
| **Defense** | Manifesto §7 · surface reduction pass |
| **Sim** | None |
| **Residual risk** | **Medium** — cultural/product review, not vitest. |

---

## Mode precedence (compound fault — v0.1 manual law)

Until `violationEnvelopeV0` exists, auditors should apply **this order** (highest wins):

```text
1. REVOKE      (boot / identity corruption — stop authority immediately)
2. QUARANTINE  (stop propagation — peer, system_state, orphan flood)
3. CORRECTION  (repair only when execution permission can be re-earned)
4. SHADOW      (only when explicitly onboarding — never upgrade to seal via narrative)
```

If revoke and quarantine both fire: **revoke first**, then assess whether shadow re-onboarding is required.

---

## What the simulation suite actually proves

| Proves | Does not prove |
|--------|----------------|
| 4 modes fire on **injected** unit faults | Compound multi-fault arbitration |
| Playbook ↔ module mapping is real | Production DOM / voice / Cesium |
| `centralizedArbitrationBus: false` is explicit | Global semantic consistency under load |
| Law is **executable**, not PDF-only | External attacker cannot social-engineer captain |

**`allPassed: true` means:**  
Under production-like **failure injection**, observed behavior matched playbook modes — not “thesis verified for all time.”

---

## External reviewer checklist (90 min)

1. Run `npm run test -w apps/client -- src/rhizoh/runtime/__tests__/violationSimulationSuiteV0.test.js` — record commit hash.  
2. Run `npm run stabilization:validate-graph` — frozen subgraph unchanged.  
3. Staging: friend onboarding → confirm `bootValidityTokenCreated: false` ([`CAPTAIN_BACKSTAGE_VERIFICATION_V0.1.md`](CAPTAIN_BACKSTAGE_VERIFICATION_V0.1.md)).  
4. Staging: inject wrong token in console (captain only) → expect revoke path (A3).  
5. Read outreach post against §0–§9 pre-flight ([`OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md`](OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md)).  
6. Search codebase: narrative → seal write paths (A2).  
7. Ask for gateway §7 evidence or mark A11 **open**.  
8. Attempt compound fault narrative: orphan + ordering — document which signals appear (A9).  

**Pass bar for external audit:** No **silent** A1/A2/A4/A11 without a documented detector or accepted residual risk in SESSION_LOG.

---

## Suggested v0.2 simulation additions (from attacks)

| ID | Attack | Closes |
|----|--------|--------|
| `compound_orphan_and_ordering` | Dual fault | A9 |
| `forward_adopt_vs_ghost` | Legitimate seal bump vs injection | A3 nuance |
| `ui_shows_sealed_without_probe` | Mock UI state vs `goLiveIntegrity` | A4 |
| `gateway_seq_regression` | Mock gateway signal | A11 |

---

## Reality Breach Observability v0.1 (shipped)

See [`RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md`](RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md).

**v0.2:** `correlationId` for A9 compound faults · gateway §7 observer · `realityHealthMetrics` merge into breach trace.

---

## Verdict template (for SESSION_LOG)

```text
External epistemic audit v0.1 — <date>
Violation sim: PASS/FAIL @ <commit>
Graph lock: PASS/FAIL
Top residual risks: A9, A11, A10 (or revised)
Go-Live §6: PROCEED / HOLD
```

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md`](RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md) | Ceza sistemi |
| [`RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md`](RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md) | Anayasa mahkemesi harness |
| [`RHIZOH_OPERATIONAL_CONSTITUTION_V1.md`](RHIZOH_OPERATIONAL_CONSTITUTION_V1.md) | Yürütme kanunu |
| [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) | Observer isolation |

---

*The valuable test is not whether Rhizoh sounds right to builders — it is whether an external mind can find silent wrong reality. This document is the attack map.*
