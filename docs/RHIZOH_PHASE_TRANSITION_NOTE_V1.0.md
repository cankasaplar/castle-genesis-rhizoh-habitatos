# Rhizoh Phase Transition Note v1.0

**Status:** ACTIVE (ops snapshot — short)  
**As of:** 2026-05-19  
**AUTO readiness:** `AUTO_PASS_MANUAL_PENDING` · [`activation_readiness_v1.0.json`](ops/export/activation_readiness_v1.0.json)

---

## Phase state

| Field | Value |
|-------|--------|
| **Current phase** | **0.5 — Safe Reality Layer** |
| **State** | Control-plane stable · data-plane **inert** |
| **Production surface** | **Active** (static ingress + frozen perception shell) |
| **Activation** | **Deferred** (signal switch off) |
| **Remaining blockers** | Legal review + MANUAL readiness (DNS/TLS evidence, ops READY/HOLD) |
| **Forbidden actions** | New runtime primitives · ingestion wiring · external-state coupling · design expansion (L-layers, perception sprint, Concept→Code SSOT) |
| **Allowed actions** | Ops · docs · hosting · regression-only fixes · passive audit · readiness dry-run · formal specs (no new runtime) |
| **Next valid transition** | **Phase 1** — O1 contract + `device_heartbeat_v1` staging probe (post-READY) — [`RHIZOH_PHASE1_O1_CONSTRAINT_SPEC_V1.0.md`](RHIZOH_PHASE1_O1_CONSTRAINT_SPEC_V1.0.md) |

**Definition:** Rhizoh is an **activation-controlled control-plane spec** with a frozen UI shell — not a continuously executing data-plane.

---

## Two gates (unchanged)

| Gate | Status |
|------|--------|
| **Ready?** | AUTO ✔ · MANUAL ⏳ · signed decision ⏳ |
| **Open?** | **Forbidden** until `READY` in [`activation_decision_LOG`](ops/activation_decision_LOG.template.json) |

Deployment / connected domains ≠ activation.

---

## Hosting surface (Firebase — ops input)

| Domain | Status | Notes |
|--------|--------|--------|
| `castle-genesis.web.app` | Default | Firebase default host |
| `castle-genesis.firebaseapp.com` | Default | Firebase default host |
| `castle-genesis.com` | Custom · **Connected** | Primary custom |
| `app.castle-genesis.com` | Custom · **Connected** | App subdomain |
| `rhizoh.com` | **Redirect** | Not primary app origin until ops maps product surface |
| `www.rhizoh.com` | **Connected** | Rhizoh ingress / legal surface target |

**Ops implication:** Castle genesis hosts are live-connected; Rhizoh product path is **`www.rhizoh.com`** (verify TLS + ingress smoke there). `rhizoh.com` redirect must be intentional (apex → www or holding).

---

## MUST → SHOULD (this phase)

| Priority | Action |
|----------|--------|
| **MUST** | Complete MANUAL A1–A5 in [`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md) |
| **MUST** | Legal review / PRIMARY PDF placeholders |
| **MUST** | `npm run activation:readiness-check` before any READY claim |
| **SHOULD** | Staging deploy scaffold + ingress smoke (**signal off**) |
| **SHOULD** | Confirm `isDataPlaneActiveV0() === false` on staging build |
| **OPTIONAL** | L6/L15 regression only if perception broke |

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md`](RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md) | A freeze + B readiness |
| [`RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md`](RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md) | Perception frozen |
| [`RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md`](RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md) | Next transition spec (no new design) |

*Transition note v1.0 — update hosting table when Firebase console changes.*
