# Rhizoh Operational Constitution (V1)

**Status:** SECURED — engineering reading of time / data / perception integrity  
**Tag:** `CORE-ELIGIBLE` (maps to frozen graph, WAL, seals, UI membrane) · `RESEARCH-ONLY` (philosophical framing only where labeled)

**Stack position:**

| Layer | Document |
|-------|----------|
| Charter | [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md) |
| Protocol | [`MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](MANIFESTO_DISTRIBUTION_PACK_V0.1.md) §0–§9 |
| Interface | Outreach packs (verified projection **language** only) |
| **Execution law** | This doc + Go-Live + Stability Contract |

**Evaluation question (post–Go-Live):** Not only “does it run?” but **“does it break a reality promise?”**

---

## Preamble: closed epistemic loop

Rhizoh is architected so **production, verification, and display** share one constitution:

```text
Canonical log (truth substrate)
    → seal / derive (law)
        → UI projection (verified display only)
```

When this loop holds, the system cannot silently manufacture **false reality** for the user: it may be wrong about the world (ingress failure), but not about **what it has sealed**.

---

## Article I — Time integrity (immutable history)

### Principle

Frozen execution (`apps/client/src/ghost/phase562.js` … `phase570.js`) is not “a version you can casually rewrite.” The stabilization subgraph + [`STABILIZATION_GRAPH.md`](../STABILIZATION_GRAPH.md) + `scripts/stabilization-graph.sha256.lock` treat that graph as a **historical reality trace**.

| Mainstream git mental model | Rhizoh frozen-core model |
|----------------------------|---------------------------|
| History editable (rebase, force-push narrative) | **History = physical constraint** for the execution class |
| Change = patch | Change to frozen subgraph = **causality violation** unless explicit graph + lock + CI pass |
| Log for debugging | Log for **audit and replay** |

### Engineering rules

- **Debug:** yes — read traces, replay, diff seals.  
- **Rewrite frozen causality:** no — not without intentional stabilization change set.  
- **Forward correction:** yes — new layers, habitat, membrane flags, Derived/Narrative under seal — **forward-only** remediation.

**Prove unchanged:** `npm run stabilization:validate-graph`

---

## Article II — Data integrity (canonical log)

### Principle

> **What the system is, the UI does not declare — the log does.**

| Classic stack | Rhizoh (epistemic inversion) |
|---------------|------------------------------|
| UI often **is** truth (optimistic state, engagement UX) | **UI = projection** |
| Log secondary, for ops | **WAL + Reality Seal = truth substrate** |

### Anchors (code)

| Mechanism | Role |
|-----------|------|
| WAL / substrate IDB | Append-only continuity segments — `substrateContinuityIdbV0.js` |
| Reality Seal disk | Sealed runtime snapshot discipline — `realitySealDiskV0.js`, `realitySealingCoreV0.js` |
| Boot validity token | No ghost context / half-revoked boot — `bootValidityTokenV0.js` |
| Layer trace (§0) | `∀ narrative ⇒ derived`, Real ingress for Derived — production architecture §0 |
| Narrative provenance | Orphan / fold / entropy guards — `narrativeSourceProvenanceV0.js` |

**State provenance is mandatory.** If it is not in the trace, it is not admissible as reality.

---

## Article III — Perception integrity (UI constraint)

### Principle

> **The UI must not present as real any state the core has not verified.**

This removes (by design intent):

- optimistic UI hallucination masquerading as fact  
- predictive rendering that **writes** authority  
- ghost-state smoothing that hides revoke/drift  
- “user happiness” fake state

### Critical nuance (not anti-beauty)

| Forbidden | Allowed |
|-----------|---------|
| Unverified state shown as sealed truth | Polished UI **bound to** verified snapshot / hint layer |
| Narrative → execution | Narrative → **display** with provenance |
| Smoothing that mutates world truth | `projectionSmoothingV0` — **hints only** ([`PERCEPTUAL_STABILITY_LAYER_V0.md`](PERCEPTUAL_STABILITY_LAYER_V0.md)) |

**Observation fabric:** *Agents may influence interpretation, never execution.* — [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md)

---

## Three articles = operational constitution

| Article | Integrity | Violation examples |
|---------|-----------|-------------------|
| **I — Time** | Immutable execution history | Silent `phase*.js` edit; graph lock drift |
| **II — Data** | Log is canonical | Orphan narrative; missing `source_chain`; WAL segment mismatch |
| **III — Perception** | UI = verified projection | Token mismatch ignored; UI shows sealed fact without seal |

Together: **time + data + perception** = what outreach calls *honest baseline* in **enforceable** form.

---

## Go-Live §6 — ontological freeze gate (not “just deploy”)

[`RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md) §6 (shift sequence) is operationally a **freeze gate**: the moment the deployment defines **what counts as real** in production.

| Step (§6) | Ontological meaning |
|-----------|---------------------|
| DNS + TLS | Public **coordinate** for truth exchange |
| Gateway + client flags §1 | **Which membranes** are legally open |
| §5 checklist | Pre-freeze verification |
| §3 Guardians | First **witnessed** anchors |
| §7 integrity loop | **Post-freeze self-audit** (T+0→300s) |

What crosses the gate is not merely binaries — it is the **definition of admissible reality** (flags, seals, observation-only onboarding, sim bus off).

**After gate:** evaluate with `window.__rhizoh.goLiveIntegrity.evaluate()` → `LIVE_OK` | `DEGRADED` | `QUARANTINE` — [`POST_GO_LIVE_AUTONOMOUS_STABILITY_CONTRACT_V1.md`](POST_GO_LIVE_AUTONOMOUS_STABILITY_CONTRACT_V1.md).

---

## Enforcement layer — runtime violation detection (law, not lore)

**Operational closure (response modes):** [`RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md`](RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md) — on violation: **shadow** (intended pre-seal) · **revoke** (ghost boot) · **quarantine** (isolate) · **correction chain** (forward-only repair / LKG).

Post–§6, continuous enforcement detects violations; the playbook defines **what the system does next**.

| Enforcement role | Current module / probe | Status |
|------------------|------------------------|--------|
| **Epistemic violation detector** | `postGoLiveIntegrityLoopV0.js` — layer trace, orphan narrative | **V0** (client T+300s + manual) |
| **UI mismatch validator** | `bootValidityTokenV0.js` — `enforceRuntimeBootValidityTokenV0`; revoke on mismatch | **V0** |
| **Log–state divergence monitor** | `substrateContinuityIdbV0.js` segment integrity; `temporalAuditIntegrityV0.js` | **V0** |
| **Causal integrity watchdog** | `temporalOntologicalWatchdogV0.js` (`VITE_ONTOLOGICAL_WATCHDOG=1`); `worldSealerV0.js` / sealer schedule | **V0** |
| **Operational continuity probe** | `operationalContinuityProbeV1.js` — drift class | **V1** |
| **Gateway-side §7 automation** | Spec in Go-Live §7.4 | **Roadmap** — client loop exists |

### Violation classes (use in logs / SESSION_LOG)

| Class | Article | Example signal |
|-------|---------|----------------|
| `TIME_INTEGRITY` | I | Graph hash mismatch vs lock |
| `DATA_INTEGRITY` | II | `cursor_hash_segment_mismatch`, orphan narrative |
| `PERCEPTION_INTEGRITY` | III | `boot_validity_token_mismatch`, unprovenanced UI copy |
| `CAUSAL_INTEGRITY` | I+II | `ordering_regression`, `chain_breach` (sealer) |

**Captain surfaces:** `window.__rhizoh_go_live_integrity` · `window.__rhizoh.goLiveIntegrity` · `window.__rhizoh_shadow_continuity` · `window.__rhizoh_boot_validity_token`

---

## Full stack (current engineering reading)

```text
Charter          → reality constraints (honest baseline)
Protocol         → behavioral invariants (§0–§9 checksum)
Interface        → verified projection language (outreach)
Operational law  → this document
Go-Live §6       → ontological freeze gate
Enforcement      → watchdog + integrity loop + seals (V0, expanding)
```

**Rhizoh is not primarily:** an AI product · a lore universe · a hype surface.

**Rhizoh is:** a **geographically verifiable, time-bound, ethically bounded digital reality protocol** whose consistency is **testable** — graph CI, WAL integrity, seal chain, post-go-live probes, [`RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md`](RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md) (9 law scenarios).

---

## Related documents

| Doc | Use |
|-----|-----|
| [`RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md`](RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md) | EFIR layers, Reality Seal |
| [`RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md) | Shift + §7 loop |
| [`POST_GO_LIVE_AUTONOMOUS_STABILITY_CONTRACT_V1.md`](POST_GO_LIVE_AUTONOMOUS_STABILITY_CONTRACT_V1.md) | Thresholds |
| [`STABILIZATION.md`](../STABILIZATION.md) | Freeze discipline |

---

*Forward correction only. The past of execution is not rewritten — it is witnessed.*
