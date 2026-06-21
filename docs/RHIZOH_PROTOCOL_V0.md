# Rhizoh Protocol v0

**Status:** Public reference (v0.0.1) · `RESEARCH-ONLY`  
**Type:** Continuity + observation protocol (not a game genre label)  
**Public identity:** https://rhizoh.com/.well-known/rhizoh-identity.json

---

## One sentence

**Rhizoh is a protocol for persisting world continuity under observation — without granting observers execution authority.**

---

## Core principles

### 1. Observation ≠ Execution

Agents, LLMs, and human observers may influence **interpretation** and perception. They do **not** hold execution authority over WAL truth, admission gates, or ontological freeze boundaries.

### 2. Identity derives from causal continuity

`epi_id_*` handles are **derived** from the epistemic audit stack (root digest, ledger identity hash, tick graph). They are observability projections — not SSOT personas and not marketing IDs.

### 3. World state derives from event history

Simulation persistence, replay, and audit bundles treat **event sourcing** as the spine. UI is verified projection; it does not silently replace sealed history.

### 4. Authority is ledgered

Admission arbitration, authority ledger height/seals, and epoch merge paths are **ledgered and deterministic** within the frozen execution subgraph. Bypass is a violation, not a feature flag.

### 5. Spatial projection is optional

Geographic and 3D presentation (map fly-to, castle ritual, Cesium commit) is **optional** and user-initiated. Bootstrap coordinates (e.g. Serencebey reference window) are observation anchors, not lore centrality.

---

## Protocol stack (v0 sketch)

```
┌─────────────────────────────────────────┐
│  Observer / invite ingress (read-only)  │
├─────────────────────────────────────────┤
│  Perception shell (UI projection)       │
├─────────────────────────────────────────┤
│  Causal graph (ECG) + epistemic tick    │
├─────────────────────────────────────────┤
│  Event-sourced persistence + seals      │
├─────────────────────────────────────────┤
│  Authority ledger + admission gates     │
├─────────────────────────────────────────┤
│  Frozen execution subgraph (v562–v570)  │
└─────────────────────────────────────────┘
```

Upper layers may expand per [LAYER_EXPANSION_PROTOCOL.md](./LAYER_EXPANSION_PROTOCOL.md). The frozen core changes only via intentional stabilization graph updates.

---

## What the protocol is not

- Not an open multi-agent execution bus for untrusted producers
- Not a guarantee that every LLM output is "true"
- Not a replacement for legal review, KVKK/GDPR process, or counsel sign-off
- Not a public MMO launch — closed admission + legal hold until READY

---

## Public surfaces (v0)

| Surface | URL |
|---------|-----|
| Identity manifest (JSON) | `https://rhizoh.com/.well-known/rhizoh-identity.json` |
| Causal snapshot (JSON) | `https://rhizoh.com/.well-known/rhizoh-causal-snapshot.json` |
| System overview (Markdown) | `https://rhizoh.com/rhizoh/system-overview.md` |
| This protocol (Markdown) | `https://rhizoh.com/rhizoh/protocol-v0.md` |

---

## Versioning

| Field | Value |
|-------|-------|
| Protocol | `v0` |
| Public identity schema | `castle.rhizoh.public_identity_manifest.v0` |
| Identity projection phase | `read_only_v0` |

Breaking changes to public JSON schemas bump the schema id suffix (`v1`, …) and require a published migration note.

---

## Related

- [RHIZOH_SYSTEM_OVERVIEW.md](./RHIZOH_SYSTEM_OVERVIEW.md)
- [RHIZOH_IDENTITY_MANIFEST_V0.md](./RHIZOH_IDENTITY_MANIFEST_V0.md)
- [RHIZOH_OPERATIONAL_CONSTITUTION_V1.md](./RHIZOH_OPERATIONAL_CONSTITUTION_V1.md)
- [OBSERVATION_FABRIC_V1.md](./OBSERVATION_FABRIC_V1.md)

---

*Rhizoh Protocol v0 — Observation ≠ Execution*
