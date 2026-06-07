# Rhizoh T0 Experience Shell V1 — single production surface

**Tag:** `CORE-ELIGIBLE` (product surface rule)  
**Status:** Locked — default rhizoh.com experience  
**Ingress copy SSOT remains:** [`RHIZOH_INGRESS_UI_FREEZE_V1.0.md`](RHIZOH_INGRESS_UI_FREEZE_V1.0.md)  
**Related:** [`RHIZOH_COM_USER_EXPERIENCE_V1.md`](RHIZOH_COM_USER_EXPERIENCE_V1.md) · [`CASTLE_COGNITIVE_GRAPH_V1.md`](CASTLE_COGNITIVE_GRAPH_V1.md)

---

## 0. Product rule (founder lock)

> **User never chooses system. System adapts to user inside one continuous world.**

| Forbidden UX | Required UX |
|--------------|-------------|
| “Which world?” entry picker | Single open world |
| Empty shell / choose-your-mode | Rhizoh already active |
| Multi-entry research surfaces as product | One surface · many capabilities |
| Fracture / alignment / CI as visible systems | Felt only · never labeled |

**Boş ekran kaldırıldı.** Shell kapanmaz · bölünmez · entry seçtirmez.

---

## 1. Single entry (routing)

| Route | Surface | Audience |
|-------|---------|----------|
| `/` | **`AppRhizoh528T0`** | **All production users** |
| `*` (fallback) | `AppRhizoh528T0` | Same |
| `/dev/octo-lab` | Octo lab | Dev only |
| `/studio-live` | Studio live | Env gate `VITE_ENABLE_STUDIO_LIVE_ROUTE=1` |
| `/genesis/*` · `/academy/*` | Genesis / observatory | Separate hubs — not main product |
| `/rhizoh/examples/*` | Engine examples | Research |

**Code path:** `CastleShellRouter` → `AppRhizoh528` → `AppRhizoh528T0` (default).

**Opt-in only (not rhizoh.com default):**

- `VITE_RHIZOH_SPATIAL_SHELL=1` → `RhizohSpatialWorldShell` via `AppRhizoh528LivingEntry` — spatial **research** track, not main product ([`castleWorldLayerGateV0.js`](../apps/client/src/rhizoh/runtime/castleWorldLayerGateV0.js)).

Production `.env` must **not** set spatial shell unless intentional staging experiment.

---

## 2. Rhizoh Core Experience Layer (what user sees)

One unified screen — **not** separate systems:

```
┌─────────────────────────────────────────────────────────┐
│  RHIZOH T0 EXPERIENCE SHELL (single continuous surface) │
├─────────────────────────────────────────────────────────┤
│  🧠 Octo          — always present · reactive center     │
│  💬 Chat dock     — primary interaction                 │
│  🧭 Capability wheel — context actions                  │
│  🪟 Castle drawers — profile · map · studio · social    │
│  🌍 Map           — optional · collapsed default        │
│  👥 Companion     — passive overlay                      │
└─────────────────────────────────────────────────────────┘
```

User mental sentence:

> **“Rhizoh is active. Octo is present. You are inside Castle.”**

---

## 3. Single world model

```
1 world → many capabilities
```

| Layer (user feel) | Engineering (invisible) |
|-------------------|---------------------------|
| Octo — live presence | Cognitive projection + reactive field |
| Rhizoh — conversation | Mediator · not execution master |
| Drawers — features | Product surfaces |
| Map — optional extension | Cesium executor spine |
| Events / social / calls | Background capability ([`castleSocial/`](../apps/client/src/castleSocial/)) |

**RHIZOH EXPERIENCE LAYER = SINGLE WORLD SURFACE**

---

## 4. What never appears in product UI

| Engineering layer | User visibility |
|-------------------|-----------------|
| Fracture | Internal perception physics — sensation only |
| Alignment | Dev/debug mirror (`VITE_RHIZOH_PERCEPTION_ALIGNMENT_DEBUG`) |
| CI / P2-F / executor graph | Engineering only |
| Session graph contracts | Runtime DNA — not HUD |
| Multi-entry shell choice | **Banned** |

---

## 5. Monetization alignment (product truth)

Revenue surfaces attach to **T0 experience**, not engineering infra:

| Monetizable | Not monetizable |
|-------------|-----------------|
| T0 live interaction (Octo + Rhizoh) | Debug alignment strip |
| Event · social · call layer | Fracture engine as product |
| Premium Castle / event capacity | CI graph · multi-entry research shells |

---

## 6. Architecture under the shell (unchanged)

Post–Phase 3 stack remains valid:

- **Execution** — router · executor · input (never user-visible)
- **Cognitive** — Octo · Rhizoh
- **Presentation** — habitat · wheel · dock
- **Fracture** — post-render desync only ([`PERCEPTUAL_PHYSICS_KERNEL_V2.md`](PERCEPTUAL_PHYSICS_KERNEL_V2.md))

Social/event V1.1 contracts ([`castleSocial/`](../apps/client/src/castleSocial/)) wire into drawers and background runtime — **not** a second world entry.

---

## 7. Secondary routes policy

| Kind | Rule |
|------|------|
| Dev lab (`/dev/*`) | Never linked from prod chrome |
| Studio live | Env-gated; redirect `/` when off |
| Spatial shell flag | Staging/research only |
| Genesis / academy | Out-of-product observatory paths |

Prod chrome must not present “switch to spatial world” or “choose shell.”

---

## 8. Acceptance criteria (prod regression)

1. Fresh visit to `/` mounts `AppRhizoh528T0` without mode picker
2. Octo + chat dock visible in default habitat (no empty canvas)
3. No user-facing copy referencing alignment · fracture · executor
4. `VITE_RHIZOH_SPATIAL_SHELL` unset in production deploy template
5. Map collapsed/hidden by default policy (`habitatFocus` / product surface) — expandable via drawer/wheel only

---

## 9. Final state (locked)

| Decision | Value |
|----------|-------|
| Default production surface | **T0** |
| Core entities | **Octo + Rhizoh** |
| Feature access | **Castle drawers** |
| Spatial | **Optional context layer** |
| Everything else | **Future expansion inside same shell** |

**Single continuous Rhizoh reality shell** — the system does not “let the user in”; it is already open.

---

## 10. Soft open launch

Sunday progressive exposure plan: [`RHIZOH_SOFT_OPEN_PROD_PLAN_V1.md`](RHIZOH_SOFT_OPEN_PROD_PLAN_V1.md)
