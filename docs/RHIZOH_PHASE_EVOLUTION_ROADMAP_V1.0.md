# Rhizoh Phase Evolution Roadmap v1.0

**Status:** ACTIVE (planning)  
**Current position:** **PHASE 0–0.5 — Safe Reality Layer** (active) · **PHASE 1 — spec sealed, switch off**

Boundary map: [`RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md`](RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md)

**Status name:** **Deterministic control-plane, zero active data-plane** (*spec-complete, execution-inert / cold architecture*).

> *Control-plane fully defined; data-plane intentionally absent.*  
> *Deployment (DNS/TLS/connectivity) ≠ activation (signal on / reality injection).*

---

## Hard reality

| Today (Phase 0) | Not yet |
|-----------------|---------|
| UI ingress, routing, legal freeze | Live device onboarding |
| WAL + audit at **simulation** level | Edge node registry (production) |
| Identity / causality **graphs** (read-only) | Camera / full telemetry pipeline |
| Cohort sim + passive sanity | Permissioned data plane (live) |
| Distributed system **model** | CSP / device trust / auth **live** boundary |

Forcing Phase 2–3 now risks **security**, **data consistency**, **legal exposure**, and **non-debuggable** production simultaneously.

---

## Phases

| Phase | Name | Real world | Rhizoh posture |
|-------|------|------------|----------------|
| **0–0.5** | SAFE REALITY LAYER | None (controlled sim) | Surface + control real paths; data plane off — boundary map |
| **0** | MODEL (subset) | None | Structure — [`RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md`](RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md) |
| **1** | CONTROLLED REAL SIGNAL | **One** signal type | Read, don’t execute — [`RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md`](RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md) |
| **2** | EDGE NODE INTRODUCTION | Permitted devices, minimal sensor | Read-only ingestion |
| **3** | GLOBAL DISTRIBUTED TOPLOGY | Multi-region world nodes | Telemetry + WAL sync (live) |

---

## Critical distinction

| Goal | Meaning |
|------|---------|
| **“Gerçek dünyayı okuyabilir”** | Phase 1 — one verified observation channel into append-only / audit surface |
| **“Bağlanmış gibi çalışsın”** | Anti-pattern in Phase 0–1 — simulation must not masquerade as live topology |

---

## Phase 0 completion (before Phase 1 code)

- [ ] Legal thaw or counsel-approved signal class in privacy notice  
- [ ] Ingress UI freeze + routing stable  
- [ ] `npm run ops:passive-coherence-check` green  
- [ ] Go-live cohort decision documented  
- [ ] Phase 1 spec reviewed (this roadmap + Phase 1 doc)

---

## Infrastructure parallel rule

| Order | What |
|-------|------|
| Now | Spec, UI, routing — heartbeat **disabled** |
| Next | DNS / Cloudflare / Firebase shell — ingress on, **signal off** |
| Last | `VITE_RHIZOH_PHASE1_SIGNAL=1` after legal + WAL isolation CI |

See Phase 1 §11 in [`RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md`](RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md) — **no feedback loop** into admission, routing, or identity graph.

---

*Rhizoh Systems — Phase Evolution v1.0 — 2026-05-19*
