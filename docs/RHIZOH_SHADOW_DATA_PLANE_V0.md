# Rhizoh Shadow Data-plane v0

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`

**Parent:** [`RHIZOH_PHASE_EVOLUTION_ROADMAP_V1.0.md`](RHIZOH_PHASE_EVOLUTION_ROADMAP_V1.0.md) · [`SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md`](SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md) · [`RHIZOH_DOMAIN_FABRIC_V0.md`](RHIZOH_DOMAIN_FABRIC_V0.md)

**Code:**
- `apps/client/src/rhizoh/runtime/shadowCastleEventBusV0.js`
- `apps/client/src/rhizoh/runtime/shadowDataPlaneLoopV0.js`

---

## 0. SSOT sentence

> **Shadow data-plane is the nervous-system rehearsal** — castle-to-castle **meaning transfer** via events, without production WAL or reality mutation.

Production data-plane remains phase-gated (`READY/HOLD`). Shadow plane is client-local Phase A.

---

## 1. Three phases (product arc)

| Phase | Name | What flows | Authority |
|-------|------|------------|-----------|
| **A** | Shadow (this doc) | Event bus read-only · UGL interpret · projection echo | `realityMutationPermitted: false` |
| **B** | Soft | Chess + map + live event on shared bus | Partial executive (future) |
| **C** | Full Living | All domain plugins on bus | Separate legal/ops gate |

---

## 2. Phase A pipeline

```text
Castle A emit → shadowCastleEventBusV0 (append-only ring)
                    ↓
              interpretShadowCastleEventV0 (UGL meaning)
                    ↓
              projectShadowCastleReactionV0 (Castle B echo)
                    ↓
         map pin pulse + optional toast (perception only)
```

**Not shared:** execution state · WAL · cross-castle truth merge.

**Shared:** event envelope · interpreted meaning · visible reaction.

---

## 3. Milestone castles

| Castle | ID | Role |
|--------|-----|------|
| HOME | `origin_home_serencebey` | Event source (Serencebey) |
| Peer sim | `peer_castle_sim_istanbul` | Reaction target pin on map |

---

## 4. DevTools (`/world/space`)

```javascript
// Full inspect
window.__rhizoh.shadowDataPlane?.();
// or
window.__rhizoh.inspectShadowDataPlaneV0?.();

// Demo loop (resource discovered → peer pulse)
window.__rhizoh.demoCastleToCastleEventLoopV0?.();

// Custom event
window.__rhizoh.emitShadowCastleEventV0?.({
  type: "resource.discovered.v0",
  fromCastleId: "origin_home_serencebey",
  toCastleId: "peer_castle_sim_istanbul",
  payload: { resourceId: "crystal_beta", scalar: 0.75 }
});
```

---

## 5. Event types (v0)

| Type | Meaning |
|------|---------|
| `resource.discovered.v0` | Positive/muted discovery → warm atmosphere echo |
| `atmosphere.shift.v0` | Atmosphere scalar shift |
| `castle.echo.v0` | Neutral echo / heartbeat |

---

## 6. Boundaries

| Allowed | Forbidden |
|---------|-----------|
| Append-only shadow ring (localStorage) | WAL / ledger height mutation |
| UGL interpret route metadata | Cross-castle state merge |
| Map pin pulse + toast | Admission / routing authority |
| CustomEvent fan-out | Production `data-plane READY` claims |

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v0.1 — Phase B soft: UGL chess → shadow bus bridge (`shadowChessUglBridgeV0.js`) |
| 2026-06-19 | v0.0 — Phase A shadow bus + castle event loop + peer sim pin |

---

## 8. Phase B (soft) — chess on bus

| Piece | Role |
|-------|------|
| `shadowChessUglBridgeV0.js` | Listens `rhizoh:ugl-event-v0` → emits `chess.move.v0` / `chess.game_end.v0` |
| `ensureRhizohUglV0()` | Booted with shadow loop on `/world/space` |
| `phase` | `inspectShadowDataPlaneV0().phase === "B_soft"` |

**DevTools:**

```javascript
// Simulated chess move → peer pulse (no board required)
const demo = window.__rhizoh.demoChessShadowMoveV0?.({ san: "Nf3", reward: 0.6 });
// demo.pulseRemainingMs > 0 → pulse still active
// demo.inspect.lastReaction.pulseActive → true while glowing
window.__rhizoh.flyToShadowPeerCastleV0?.(13);

// Live path: play in Satranç arena — UGL events auto-bridge when loop running
window.__rhizoh.inspectShadowDataPlaneV0?.();
```

**Flow:**

## 9. Phase B+ — real Castle-to-Castle reaction

Aligns with [`SESSION_GRAPH_V1.md`](SESSION_GRAPH_V1.md) · [`MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md`](MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md).

| Piece | Role |
|-------|------|
| `shadowCastlePeerRegistryV0.js` | Remote `active_castles` + bound C2C peer → reaction target |
| `shadowCastleSessionGraphV0.js` | Local `SessionEdge` read-model (`visit`, `invite`, …) |
| Target priority | bound peer → nearest remote → sim fallback |

**User flow:**

1. Toggle **peer kale göster** (or click remote pin)
2. Click **remote_castle_*** pin → `SessionEdge(visit)` + `castle.visit.echo.v0`
3. Chess / demo reactions pulse **that** pin (not sim)

**DevTools:**

```javascript
window.__rhizoh.inspectShadowDataPlaneV0().phase           // "B_soft_real" when peer bound
window.__rhizoh.inspectShadowDataPlaneV0().reactionTarget // { pinId, isSim, uid, ... }
window.__rhizoh.flyToShadowReactionTargetV0(13);
window.__rhizoh.demoChessShadowMoveV0({ san: "e4" });     // hits bound/nearest real peer
```
