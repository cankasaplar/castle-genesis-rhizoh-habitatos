# Rhizoh Arena Router v0

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — cross-domain UGL event routing.

**Prerequisites:** [`RHIZOH_DOMAIN_FABRIC_V0.md`](RHIZOH_DOMAIN_FABRIC_V0.md) · [`RHIZOH_UGL_V1.md`](RHIZOH_UGL_V1.md)

**Code:** `apps/client/src/rhizoh/runtime/rhizohArenaRouterV0.js`

**Not to confuse with:** `chessGameRouterV0.js` (single-engine · 8-slot **chess cluster** only).

---

## 0. SSOT sentence

> **UGL generalized, but scheduler + adapter layer not generalized — Arena Router closes the routing gap.**

```text
UGL Event
   ↓
domain resolver (Domain Fabric)
   ↓
adapter selection
   ↓
execution engine (per domain)
```

Without this step, **everything falls through to chess**.

---

## 1. Problem (routing, not algorithmic)

| Component | Status |
|-----------|--------|
| UGL semantic compiler | ✔ generic |
| Chess adapter + arena | ✔ full |
| Cross-game router | ❌ was missing |
| `chessGameRouterV0` | Chess cluster only — not domain router |

---

## 2. Router contract

```javascript
routeUglEventV0(uglEvent) → {
  gameType,
  domainId,
  adapterId,
  coverage,      // full_active | passive_stub | not_instantiated
  routable,      // can invoke adapter?
  executionClass // read_only for stubs
}
```

| Coverage | `routable` | Behavior |
|----------|------------|----------|
| `full_active` | true | Delegate to domain adapter |
| `passive_stub` | false | Return stub descriptor |
| `not_instantiated` | false | Return schema hint only |

---

## 3. Hybrid flows (UGL + ticket epistemic stack)

Arena play compiles to UGL events (`read_only` factual stream). Ticket drift/admission stack remains separate — router does not merge execution authority.

```text
Arena runtime → UGLEvent → Arena Router → Domain Adapter
Ticket pipeline → MutationRecord → Drift (suggest only)     [orthogonal]
Admission → CubeState                                        [sole write gate]
```

---

## 4. Multi-arena scheduler (future)

```text
rhizohArenaRouterV0
  ├─ chess pipeline (PLAY + LEARN) — existing ugl scheduler
  └─ sports pipeline (STREAM + LEARN) — future
```

Parallel execution requires router + fabric before sports arena UI.

---

## 5. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v0.0 — cross-domain router scaffold · fabric integration |
