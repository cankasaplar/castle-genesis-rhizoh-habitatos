# Rhizoh World Mesh — Mental Model v1.0

**Status:** ACTIVE (UX + boundary framing)  
**Not:** a new runtime primitive — coordinate framing + copy discipline only  
**Layer:** Surface. Perception SSOT: [`RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md`](RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md) (§5 seed city boundary).

**Engineering summary:** *Not a system that runs on a map — a system that redefines map concept at runtime.* **Originless world mesh** — no node is a special center.

---

## Wrong vs right

| Wrong mental model | Right mental model |
|------------------|-------------------|
| “Istanbul demo app” | **Multi-node reality mesh** — habitat is not single-city |
| “İstanbul merkez, diğer şehirler sonra eklenir” | **Her kullanıcı kendi coğrafi node’unu açar** |
| “Tek map dünyasına giriyorum” | **Global mesh, no center** — map is projection surface |
| Named agents (Nisa/Eren/Ceyda) = production users | **Research simulation profiles only** |

---

## Three layers (no leak)

### 1. Research-only (simulation)

| | |
|--|--|
| Examples | Nisa · Eren · Ceyda · Karden (harness / outreach **docs**) |
| Role | Test behavior profiles, witness runbooks, friend-flow **research** |
| Production | **No** ingress identity · **no** WAL · **no** state write |
| UI | **Must not** appear as “live agents” or product personas |

See [`AGENTS.md`](../AGENTS.md) § Simulation profiles.

### 2. Real user layer (future / sovereign)

| | |
|--|--|
| Identity | Opaque node presence · geographic pick |
| Names | None in product UI (this phase) |
| Roles | Deferred — cohort gate is access only, not persona |

### 3. World / place model

| Concept | Meaning |
|---------|---------|
| **Istanbul (Kadıköy coords)** | **Bootstrap observation window** — default camera for first open; **not** universe center, **not** “the” node |
| **Tokyo / Berlin / İzmir / user pick** | **Equal latent nodes** on same mesh |
| **Any user** | **Node initiator** — geographic origin is not fixed; same topology everywhere |
| **HOME_BASE** | Castle identity authority — ≠ map viewport ([`anchorTruthTableV0.js`](../apps/client/src/rhizoh/spatial/anchorTruthTableV0.js)) |

**Terminology nuance:** UI may shorten to “bootstrap window · Istanbul”. Avoid “seed **node**” in new copy if it reintroduces center bias — *node* implies special entity. Istanbul is a **world constructor trigger** (first observation surface), not a start screen.

**Fix is viewport/label logic, not ripping Istanbul data loaders.**

---

## UI copy rules (production-facing)

| Avoid | Use |
|-------|-----|
| “Istanbul map” / city-as-center | “Bootstrap window · Istanbul” |
| “İstanbul REAL_MAP” (as world title) | “REAL_MAP · bootstrap window” |
| “Istanbul anchor live” | “Bootstrap observation active — open your node on the mesh” |
| Named research personas in HUD | Remove / dev-only |

---

## Relation to activation checklist

Surface (DNS, map loads) ≠ data-plane activation.  
Seed viewport can load while `VITE_RHIZOH_PHASE1_SIGNAL=0`.

---

## Related

- [`RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md`](RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md) — RESEARCH-ONLY
- [`OUTREACH_FIRST_FIVE_SOVEREIGN_NODES_V0.1.md`](OUTREACH_FIRST_FIVE_SOVEREIGN_NODES_V0.1.md) — private outreach, not production HUD
- [`apps/client/src/rhizoh/spatial/anchorTruthTableV0.js`](../apps/client/src/rhizoh/spatial/anchorTruthTableV0.js)

*World mesh mental model v1.0 — 2026-05-19*
