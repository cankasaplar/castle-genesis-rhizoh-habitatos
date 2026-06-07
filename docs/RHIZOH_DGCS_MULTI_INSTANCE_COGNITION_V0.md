# Distributed Geometric Cognition System (DGCS) — Multi-Instance v0

**Status:** RESEARCH-ONLY  
**Tag:** `RESEARCH-ONLY` per [`SPECFLOW_MARKERS.md`](../SPECFLOW_MARKERS.md)

**Stabilization invariant (locked):** `cube.topology is never agent-owned` — enforced in [`cubeTopologyOwnershipInvariantV0.js`](../apps/client/src/studio/cubeTopologyOwnershipInvariantV0.js).

---

## Core shift

| Before | After |
|--------|-------|
| 1 cube · 1 Octo · 1 Rhizoh | **N users → N cube universes** |
| Single shared reality | **Shared engine · private cognition** |
| Observer = entity | Observer = **species system** |
| Rhizoh = UI/chat | Rhizoh = **cultural companion renderer** |

This is not “one AI system.” It is a **multi-user geometric cognition engine** where each user owns a world seed and private evolution path.

---

## Layer stack

```
User (world seed owner)
  ↓
Cube (instance-specific world — schema shared, state private)
  ↓
Observer nodes (species: Octo default, Fox experimental, …)
  ↓
Companion layer (Rhizoh instance — personality shell, not controller)
```

### Global layer (shared)

- Cube engine (`octoCognitiveGeometryCompilerV1`)
- Observation system (journal, report, inbox)
- Coupling rules (Sprint E caps)
- Geometry classification rules
- **Topology ownership invariant**

### Local layer (per user / instance)

- Cube state (`targetTopology`, `currentTopology`, energy, drift)
- Observer species selection (Octo, Fox, …)
- Companion personality embedding (Rhizoh variant)
- Memory + attention field
- Cultural / geographic seed bias (e.g. Serencebey Castle vs Argentina)

---

## Invariant: cube.topology is never agent-owned

| Allowed | Forbidden |
|---------|-----------|
| `cognition_ingress` — user draft / session sentence semantic compile | Observer deposits |
| | Companion inbox coupling |
| | Attention field write-back |
| | Any `octo` / `rhizoh` / `fox` topology mutation |

Observers **read** via `readCubeTopologySnapshotV0`. They **interpret** via inbox + attention. They never **own** deformation.

Console audit: `window.__RHIZOH_COMPANION_OBSERVABILITY__.topologyOwnership`

---

## Observer species registry

[`observerSpeciesRegistryV0.js`](../apps/client/src/studio/observerSpeciesRegistryV0.js)

| Species | Role | Geometry affinity emphasis |
|---------|------|---------------------------|
| `octo_v1` | Baseline cognition | Balanced 0.25 across regimes |
| `fox_v1` | Divergence stress test | branching 0.8 · spike 0.6 · fast scan |

Fox tests **non-Octo observer capacity**: high attention shift, low stability tolerance, pattern jump.

Personality = **geometry interaction profile**, not chat style alone.

---

## Rhizoh role (reframed)

| Not | Is |
|-----|-----|
| UI chrome | Companion **renderer** grammar |
| Chatbot | Per-user personality **shell** |
| Cube controller | Interpretation bridge over observation inbox |

`Rhizoh = global framework` · `Rhizoh instance = user-specific embedding`

---

## Cube state sharing model (decision: A)

**Selected for current phase:** **A — Fully isolated cubes**

| Option | Status |
|--------|--------|
| A) Isolated cubes | **Active** — measurable, debuggable, controlled evolution |
| B) Weak coupling | Future research |
| C) Ecosystem cross-observe | Advanced / deferred |

- Schema shared (`createCognitiveGeometryEngineV1`)
- Evolution private per `instanceId`
- No cross-user state leak in v0

---

## Multi-instance mental model

```
Engine (shared rules)
 ├── User A → cube instance A → Octo → Rhizoh-A
 ├── User B → cube instance B → Fox  → Rhizoh-B
 └── User C → cube instance C → Octo → Rhizoh-C
```

Same engine → different ontological worlds (cultural seed, species, drift).

---

## Stage gates

| Gate | Criterion |
|------|-----------|
| **S0** | Topology invariant sealed + audited in observability |
| **S1** | Species registry wired (read-only bias on deposits) |
| **S2** | Per-user `instanceId` on cube seal |
| **S3** | Fox observer rendered in Lab (second witness, cube-centric camera) |
| **S4** | Weak coupling research doc only (no runtime) |

---

## Related

- [`RHIZOH_OBSERVER_FIELD_NODE_V0.md`](RHIZOH_OBSERVER_FIELD_NODE_V0.md) — Stage 2 field nodes
- [`RHIZOH_COMPANION_OBSERVATION_PRESENCE_V0.md`](RHIZOH_COMPANION_OBSERVATION_PRESENCE_V0.md)
- [`RHIZOH_WORLD_MESH_MENTAL_MODEL_V1.0.md`](RHIZOH_WORLD_MESH_MENTAL_MODEL_V1.0.md) — originless mesh
- [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) — interpretation ≠ execution
