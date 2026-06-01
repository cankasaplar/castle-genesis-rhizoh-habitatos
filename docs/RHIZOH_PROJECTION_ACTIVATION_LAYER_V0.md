# Rhizoh — Projection Activation Layer v0

**Status:** ACTIVE — UX threshold SSOT (between L2 bundle and UI)  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**Parent:** [`RHIZOH_L2_ENTITY_CORE_V0.md`](RHIZOH_L2_ENTITY_CORE_V0.md) · [`RHIZOH_CALM_TECHNOLOGY_PRINCIPLE.md`](RHIZOH_CALM_TECHNOLOGY_PRINCIPLE.md)  
**Code:** [`projectionActivationLayerV0.js`](../apps/gateway/src/rhizoh/projectionActivationLayerV0.js)

**One-line:** L2 computes **what could be shown**; PAL v0 decides **what may be shown now** — evidence-gated emergence, not instant map spam.

---

## 0. Stack position

```text
L1 store → Resolver → L2 graph → ProjectionBridge (raw bundle)
                                        ↓
                          Projection Activation Layer v0  ← this doc
                                        ↓
                                   UI (read only)
```

| Layer | Question |
|-------|----------|
| L2 | What is true in the graph? |
| **PAL v0** | What has earned visibility? |
| UI | How to render `activation.visible`? |

---

## 1. Castle reveal stages

| Stage | Code | User-visible feel |
|-------|------|-------------------|
| **hidden** | `hidden` | No place semantics — chat only |
| **hinted** | `hinted` | Text continuity (“Continue at …”) — **no map** |
| **revealed** | `revealed` | `map_pin` eligible — first geographic emergence |
| **anchored** | `anchored` | Stable pin + thread list — “harita hissi” |

Stages are **per castle** (`entity_id`), derived from **L1 turn counts** on `linked_thread` — not from LLM confidence.

---

## 2. Default thresholds (v0)

Configurable via env integers; defaults below.

| Projection | Visible when |
|------------|----------------|
| `continuity_strip` | ≥ **1** user turn on linked thread |
| `thread_list` | ≥ **2** user turns **or** ≥ **4** total turns |
| `map_pin` | ≥ **3** user turns **and** ≥ **4** total turns **and** valid `located_at` (lat/lon) |

**First visual emergence:** first session where `map_pin` flips `visible: false → true` for a castle → `emergence: true` on that pin (once per castle per user graph session; persisted later).

### 2.1 “Harita hissi” UX model

| User turns (castle thread) | Typical feel |
|----------------------------|--------------|
| 0 | Sohbet — dünya yok |
| 1 | İpucu — isim/continuity strip |
| 2 | Liste — “burada konuşuyoruz” |
| **3+** | **Harita** — pin ilk kez hak edilmiş |

**Rationale (calm tech):** Map before place is earned = demo leak ([`RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md`](RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md)). PAL enforces **slow reveal**.

---

## 3. `map_pin` visibility contract

Each `map_pin` in the **activated** bundle includes:

```json
{
  "projection_kind": "map_pin",
  "activation": {
    "visible": true,
    "stage": "revealed",
    "emergence": true,
    "threshold": {
      "user_turns": 3,
      "total_turns": 5,
      "has_location": true
    },
    "reason": "threshold_met"
  }
}
```

When below threshold:

```json
{
  "activation": {
    "visible": false,
    "stage": "hinted",
    "emergence": false,
    "reason": "below_map_pin_user_turns",
    "threshold": { "user_turns": 1, "required_user_turns": 3 }
  }
}
```

**UI rule:** `visible: false` → **do not** mount map camera / pin; may show strip only.

---

## 4. Castle reveal logic (deterministic)

For each `castle` node with `linked_thread` → `thread_id`:

1. Count L1 turns: `user_turns`, `assistant_turns`, `total_turns`
2. `has_location` = graph has `located_at` with finite lat/lon
3. Compute `stage`:
   - `total_turns === 0` → `hidden`
   - `user_turns < 1` → `hidden`
   - `user_turns < 2` → `hinted`
   - `user_turns < map_pin_min_user_turns` OR `!has_location` → `hinted` (strip/list may still show)
   - `user_turns >= map_pin_min` AND `total_turns >= map_pin_min_total` AND `has_location` → `revealed`
   - `user_turns >= anchored_min` (default 5) → `anchored`

4. Filter or annotate each projection with `activation` block

---

## 5. Env flags (gateway)

| Env | Default | Meaning |
|-----|---------|---------|
| `CASTLE_PROJECTION_ACTIVATION` | off | `1` = run PAL on `lifeEntityProjection` |
| `CASTLE_PAL_MAP_PIN_MIN_USER_TURNS` | `3` | map_pin user-turn floor |
| `CASTLE_PAL_MAP_PIN_MIN_TOTAL_TURNS` | `4` | map_pin total-turn floor |
| `CASTLE_PAL_CONTINUITY_STRIP_MIN_USER_TURNS` | `1` | strip floor |
| `CASTLE_PAL_THREAD_LIST_MIN_USER_TURNS` | `2` | list floor |
| `CASTLE_PAL_ANCHORED_MIN_USER_TURNS` | `5` | anchored stage |

Requires `CASTLE_LIFE_ENTITY_RESOLVER=1` path to produce raw bundle first.

---

## 6. Non-goals (v0)

- Animation / Cesium camera curves (UI)
- Embedding-based “readiness”
- Trust scores gating map
- Cross-user discovery pins
- Persisted emergence ledger (v0.1 — Firestore)

---

## 7. Success tests

| Test | Pass |
|------|------|
| Turn 1 with castle context | `continuity_strip` visible; `map_pin.visible === false` |
| Turn 3 user + location | `map_pin.visible === true`, `emergence === true` |
| Castle without lat/lon | Never `map_pin.visible` — stage stays `hinted` |
| Calm | No projection kind appears before its threshold |

---

## 8. Related

- [`RHIZOH_L1_LIFE_CONTINUITY_V0.md`](RHIZOH_L1_LIFE_CONTINUITY_V0.md)  
- [`schemas/projection-activation-v0.schema.json`](schemas/projection-activation-v0.schema.json)

---

*Projection Activation Layer v0 — earned visibility before map.*
