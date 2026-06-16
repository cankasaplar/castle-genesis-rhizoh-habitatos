# Rhizoh Geometry Layer — V0

**SPECFLOW:** `RESEARCH-ONLY` — observational substrate; no frozen core (`phase*.js`) authority.

**Status:** V0 pilot — Chess regret loop only.

**Objective:** Map domain actions into abstract topological patterns via a Universal Geometry Encoder (UGE), producing an Experience Coordinate System (Drift Cube) for cross-domain learning research **without** compromising deterministic execution.

---

## 1. Core philosophy

### Geometry ≠ Reality

The Geometry Layer does **not** learn the world. It learns the relationship:

```text
reality → projection → shape
```

The same topological shape may mean different things in different domains:

| `topologyType` | Chess (domain engine) | Map | Social |
|----------------|----------------------|-----|--------|
| `enclosure` | Mate net / king restriction | Target encirclement | Dense interaction cluster |
| `jump` | Knight leap / tactical shift | Ghost relocation | Topic shift |
| `cluster` | Battery / pawn chain | Node swarm | Conversation hub |

**UGE produces shape only.** Domain engines assign meaning.

### Governance (strict)

| Path | Status |
|------|--------|
| Observation Spaces → Geometry → Learning | **ALLOWED** |
| Geometry → Execution / WAL / gateway admission | **FORBIDDEN** |

Geometry is a passive observer. It emits drift vectors and pattern families; it **cannot** mutate canonical world state, frozen subgraph, or identity substrate.

See also: [`OBSERVATION_FABRIC_V1.md`](../OBSERVATION_FABRIC_V1.md), [`INTERACTION_GEOMETRY_V0.md`](../INTERACTION_GEOMETRY_V0.md), [`RHIZOH_CUBE_FIELD_V0.md`](../RHIZOH_CUBE_FIELD_V0.md).

---

## 2. Pipeline

```text
Observation Spaces
      ↓
UGE (Universal Geometry Encoder)
      ↓
Topology Events
      ↓
Pattern Families
      ↓
Domain Engines (meaning — not in V0)
      ↓
Drift Cube (X, Y, Z)
      ↓
Learning Graph (observation export)
```

**V0 implements:** Chess → UGE → TopologyEvent → Pattern Family → Drift Cube → `window.__rhizoh.geometryDriftCube` ring buffer.

---

## 3. Drift Cube — Experience Coordinate System

A localized experiential point in the Rhizoh lattice:

| Axis | Meaning | Chess V0 example |
|------|---------|------------------|
| **X** | Space | Destination square `[file, rank]` |
| **Y** | Time / layer | Move number (pilot); future: canonical cycle layer |
| **Z** | Drift | Expected topology vs played topology divergence |

The Cube is **not** a storage container. It is a coordinate system for experience.

---

## 4. V0 scope

| In scope | Out of scope |
|----------|--------------|
| Chess regret loop observer | Map / Ghost / Voice encoders |
| Three pattern families: `enclosure`, `jump`, `cluster` | Cross-domain pattern matching |
| `playedMove` vs `bestMove` drift | Execution / policy mutation from geometry |
| Observation logs + event dispatch | WAL writes |

### Pattern families (V0)

1. **enclosure** — reduces enemy king mobility or delivers check (shape only; not "mate").
2. **jump** — knight move, castling, or non-adjacent leap.
3. **cluster** — friendly piece concentration near destination.

### Success criteria

V0 succeeds if Drift Cube observations can **differentiate**:

- **Loss-avoidance stasis** — flat draw loops (low enclosure ratio, high cluster maintenance).
- **Killer trajectory** — rising enclosure pattern shifts before terminal phase.

---

## 5. Runtime modules

| Module | Role |
|--------|------|
| `rhizohGeometryPatternFamilyV0.js` | Allowed pattern family enum |
| `rhizohGeometryTopologyV0.js` | TopologyEvent schema + drift calculation |
| `rhizohGeometryChessEncoderV0.js` | Chess UGE encoder |
| `rhizohGeometryDriftCubeV0.js` | Observation-only Drift Cube ring buffer |
| `rhizohGeometryChessRegretObserverV0.js` | Regret trace → geometry pipeline |
| `chessLearningLoopV0.js` | Mounts observer after regret analysis |

### Console probe

```text
[CASTLE_geometry_drift] { matchId, moveNumber, z, playedFamily, expectedFamily }
```

### Window probe

```javascript
window.__rhizoh?.geometryDriftCube?.list?.()
window.__rhizoh?.geometryDriftCube?.summary?.()
```

---

## 6. TopologyEvent schema (V0)

```json
{
  "schema": "rhizoh.topology_event.v0",
  "sourceSpace": "chess",
  "topologyType": "enclosure",
  "patternFamily": "enclosure",
  "entity": "n",
  "from": [5, 2],
  "to": [4, 4],
  "deltaMagnitude": 0.375,
  "metrics": {
    "enclosureDelta": 3,
    "clusterCount": 2,
    "isJump": true
  }
}
```

**No semantic fields** (no `mate`, `blunder`, `encirclement`).

---

## 7. Related documents

- [`RHIZOH_CUBE_FIELD_V0.md`](../RHIZOH_CUBE_FIELD_V0.md) — cognitive projection / drift invariant
- [`RHIZOH_EPISTEMIC_CAUSALITY_GRAPH_V0.1.md`](../RHIZOH_EPISTEMIC_CAUSALITY_GRAPH_V0.1.md) — why-over-time (future merge)
- [`RHIZOH_EAERT_REALITY_MANIFOLD_TOPOLOGY_V1.md`](../RHIZOH_EAERT_REALITY_MANIFOLD_TOPOLOGY_V1.md) — distributed manifold vocabulary

---

*V0 — Chess pilot. Geometry learns escape-route closure shapes, not moves.*
