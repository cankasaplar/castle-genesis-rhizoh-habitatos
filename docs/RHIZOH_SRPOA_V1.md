# SRPOA v1 — Single Runtime + Passive Observer Architecture

**Status:** ACTIVE · **SPECFLOW:** ops SSOT  
**Alias:** [`RHIZOH_LAB_SINGLE_RUNTIME_OBSERVER_V0.md`](RHIZOH_LAB_SINGLE_RUNTIME_OBSERVER_V0.md) (redirect stub)  
**Parent:** [`RHIZOH_DISTRIBUTED_OBSERVE_LAB_V0.md`](RHIZOH_DISTRIBUTED_OBSERVE_LAB_V0.md) · [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md)

> **Observation ≠ Production.** One truth stream; observers are projections only.

---

## Lock (2026-06-04)

| Count | Layer |
|-------|--------|
| **1** | Producer runtime (truth generator) |
| **1** | Passive observer shell (read-only) |
| **0** | Dual ontological identity · **no “A vs B”** on new L1+ ops |

```
SRPOA-v1 — single-stream system (not dual-truth)

| Layer    | Role              | context field        |
|----------|-------------------|----------------------|
| Runtime  | state generator   | forbidden (never)    |
| Observer | state projector   | computed only        |
| Archive  | immutable history | set on import wrapper|

├── Runtime (producer)
│     origin: "runtime"          ← only attribution runtime writes
│     organismRhythm.ok          ← temporal SSOT
│     capture() · report()         ← lab log append only (not prod mutation)
└── Observer (passive)
      observer_context: mirror | archive  ← inferred; never written back to runtime
      snapshot() · importArchive() · summarizeArchive() · diffView()
      ❌ capture · ❌ mutation · ❌ runtime injection
```

---

## Runtime (producer)

**Script:** [`scripts/rhizohLabL1ProbeV0.js`](scripts/rhizohLabL1ProbeV0.js) (+ optional [`rhizohLabL1HybridControllerV0.js`](scripts/rhizohLabL1HybridControllerV0.js))

| Global | Value |
|--------|--------|
| `__rhizoh.runtimeMode` | `"single"` |
| `__rhizoh.observeMode` | `false` |
| `__rhizoh_lab.role` | `"producer"` |

```javascript
rhizohLabL1.capture({ label: "L1_t0", origin: "runtime" });
```

**`context` on runtime capture → throw** (forbidden write field). Observer computes `observer_context` only; never writes into `window.__rhizoh` production fields.

**Deprecated:** `meta.laptop` · `context` on capture · dual-runtime as parallel truth.

---

## Observer (passive)

**Script:** [`scripts/rhizohLabObserverShellV0.js`](scripts/rhizohLabObserverShellV0.js)

| Global | Value |
|--------|--------|
| `__rhizoh.runtimeMode` | `"single"` |
| `__rhizoh.observeMode` | `true` |
| `__rhizoh_lab.role` | `"observer"` |

| API | Role |
|-----|------|
| `snapshot()` | **Serialization layer only** — normalized frames; use before heavy `diffView` |
| `importArchive(payload)` | Immutable archive wrapper (`observer_context: archive`) |
| `summarizeArchive()` | Thin series projection (built on `snapshot()`) |
| `diffView(pin?)` | Compare snapshot + optional pin — no live runtime merge |
| `inferContext()` | `mirror` \| `archive` |
| `capture()` | **Always throws** `OBSERVERS ARE READ-ONLY (SRPOA-v1)` |

**Context rule (semantic safety):**

| Side | `context` |
|------|-----------|
| Runtime | **forbidden** — field must not exist on capture meta |
| Observer | **computed only** — `observer_context`; never copied onto runtime |

| Inferred `observer_context` | When |
|-----------------------------|------|
| `mirror` | Shell loaded · no archive |
| `archive` | After `importArchive()` |

---

## Read-only guards

1. `rhizohLabObserver.capture` → throw (frozen on shell install).  
2. `runtimeMode === "single"` + `observeMode === true` → `rhizohLabL1Probe` installs **read-only facade** (no producer `capture`).  
3. Producer `capture()` throws if `observeMode === true`.  
4. **Fail-fast:** `runtimeMode !== "single"` → `SRPOA VIOLATION: MULTI-RUNTIME DETECTED` (probe · hybrid · observer).  
5. **No runtime injection:** observer must not set `__rhizoh_lab.role = producer` or push archive into live `organismRhythm` — compare via `snapshot()` only.

Prevents accidental dual-runtime · silent mutation · debug polluting production path.

---

## Archive handoff

**Producer** (after `report()`):

```javascript
copy(JSON.stringify({
  schema: "castle.rhizoh.lab_l1_archive.v0",
  architecture: "SRPOA-v1",
  origin: "runtime",
  exported_at_ms: Date.now(),
  report: rhizohLabL1.report(),
  log: window.__rhizoh_lab_l1_log
}, null, 2));
```

**Observer:** `rhizohLabObserver.importArchive(JSON.parse(...))` → observer assigns `context: "archive"`.

---

## Historical note

L0–L0.5 **two-laptop experiment** remains archived (not deleted). L1+ ops and new captures follow SRPOA-v1 only.

**Closure sentence:**

> Tek gerçeklik akıyor, observer sadece gölgesini çiziyor.  
> **Observation ≠ Production.**

---

## `snapshot()` boundary (do not regress)

**LOCK:** `snapshot()` = **serialization only** — shape archive rows into frozen frames.

| Allowed in `snapshot()` | Forbidden (→ half-hybrid drift) |
|-------------------------|----------------------------------|
| Field normalize · freeze · `observer_context` tag | Inference · aggregation · rhythm scoring |
| Pass-through from immutable archive | Live `__rhizoh` merge · runtime fallback injection |

**Inference / diff / compare** belong in `summarizeArchive()` · `diffView()` · future Inspector — **not** inside `snapshot()`.

---

## Future (not in v1)

**SRPOA Inspector Panel V1** — single-screen live diff · timeline · jitter heatmap (visual control room). Builds on `snapshot()` + `diffView()`; spec-only until requested.
