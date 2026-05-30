# Rhizoh Authority Graph Audit v1.0 (Phase 2.3)

**Status:** Permission topology verification — **static analysis only**  
**Class:** Graph-level authority elimination — not behavioral control, not new metrics

**One sentence:** Prove **no unauthorized dependency path** exists between phase gate, derived measurement runtime, and interpret layers.

---

## 0. What Phase 2.3 is / is not

| Is | Is not |
|----|--------|
| Import-edge map + forbidden path detection | New risk model or abstraction |
| Verification that control surface is **closed** | New feature or gate logic |
| Export JSON for ops evidence | Runtime behavior change |

> **Phase 2.3 is not behavioral control; it is graph-level authority elimination.**

---

## 1. Zone model (permission topology)

| Zone | Files (representative) | May influence Core / `isDataPlaneActive`? |
|------|------------------------|----------------------------------------|
| **AUTHORITY_GATE** | `phase1ActivationGateV0.js` | **Only** via env `VITE_RHIZOH_PHASE1_SIGNAL` |
| **ENFORCEMENT** | `postGoLiveIntegrityLoopV0`, `externalBoundaryValidationV0`, admission engine | Observation / playbook state — not phase env |
| **DERIVED** | `epistemicStabilityControllerV0`, `epistemicAuditBundleV0`, `replayFeedbackAnalysisV0` | **No** — `DERIVED_RUNTIME_ONLY` |
| **INTERPRET** | `breachCorrelationSynthesisV0`, cohort sim | **No** — human / offline |
| **OBSERVATION_HUB** | `epistemicTickEngineV0` | Tick observe; may call DERIVED **after** ledger append only |
| **UI_CAPTAIN** | `AppRhizoh528` stability hooks | Display / Captain — not wired to gate (verified) |

**ROKS / CMM** live in `docs/architecture/` — not importable as code; no `runtime → ROKS` path exists.

---

## 2. Forbidden direct edges

```text
AUTHORITY_GATE  ──X──►  DERIVED | INTERPRET | ENFORCEMENT | OBSERVATION_HUB
ENFORCEMENT     ──X──►  DERIVED
DERIVED         ──X──►  AUTHORITY_GATE
OBSERVATION_HUB ──X──►  AUTHORITY_GATE
```

**Implicit authority via indirect imports:** audit uses **1-hop** direct import rules in v1.0; 2-hop scan is Phase 2.4 if needed.

---

## 3. Known-good wiring (manual invariant)

| Check | Result |
|-------|--------|
| `phase1ActivationGateV0.js` imports | **None** (env-only SSOT) |
| `isDataPlaneActiveV0` call sites | Gate file + test only (not stability-driven) |
| `gateHints.driftBand` in audit bundle | **Human hint** — not imported by gate module |
| `epistemicTickEngine` → stability | Post-tick ledger record only — does not set env gate |

---

## 4. Run audit

```bash
npm run formal:authority-graph-audit
```

**Output:** [`docs/exports/ops/authority_graph_audit_v1.0.json`](../ops/export/authority_graph_audit_v1.0.json)

| Exit | Meaning |
|------|---------|
| 0 | No forbidden direct edge in scanned roots |
| 1 | Violation list printed — fix import or add time-boxed exemption in script |

**Scan roots:** `apps/client/src/rhizoh/**`, `AppRhizoh528.jsx` (Captain surface).

---

## 5. Relationship to epistemic firewall

| Layer | Lock |
|-------|------|
| 2.0–2.1 | Role + temporal narrativization |
| 2.2 | Lexical normalization |
| **2.3** | **Graph** — silent import escape |

---

## 6. Honest limits

| Verified | Not verified |
|----------|--------------|
| Direct `import` edges in scan roots | Dynamic `import()`, reflection |
| Phase gate isolation from DERIVED | Full-repo 2-hop graph |
| | Production webpack alias side paths |

---

## 7. Phase status

| Phase | Status |
|-------|--------|
| 2.3 Authority graph audit | **Done** (script + SSOT) |
| 2.4 Optional 2-hop / dynamic import | Not started |

---

*Authority graph audit v1.0 — May 2026.*
