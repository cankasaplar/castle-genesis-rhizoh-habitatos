# Rhizoh — World surface hierarchy v0

**Status:** ACTIVE — product layout SSOT (not execution engine)  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**Parents:** [`RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md`](RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md) · [`RHIZOH_T0_CONTINUITY_SURFACE_V0.md`](RHIZOH_T0_CONTINUITY_SURFACE_V0.md) · [`RHIZOH_LOCAL_ACTION_AUTHORITY_V0.md`](RHIZOH_LOCAL_ACTION_AUTHORITY_V0.md)

## Binding rule

> **WORLD is the main stage. T0 is an overlay on that stage — not a replacement shell.**

## Red line (locked)

> **Harita Dünya değildir.**

| Katman | Rol |
|--------|-----|
| **T0** | Overlay / giriş koreografisi (CEOL, rail, product bar) |
| **WORLD** | Ana sahne — GLOBE + swarm + orb + anchor + continuity |
| **Map** | WORLD içindeki **araç** (`REAL_MAP` yalnızca açık niyetle: `MAP_TOOL_EXPLICIT`, `/map`, Salon…) |
| **Capability Wheel** | Ürün etkileşim merkezi (viewport ortası) |
| **Voice + Chat** | Birincil giriş |
| **Studio / Hall / Broadcast** | İkincil yüzeyler + alt çekmece |

Enforced in code: `coerceRhizohProductRealityModeV0` inside `setRealityMode` — `PRODUCT_SHELL_WORLD*` cannot commit `REAL_MAP`.

Istanbul / Serencebey may exist as **semantic seeds** or **returning-user anchors** — never as a hardcoded default world center for every session. **No “İstanbul'a ışınla” on boot.**

---

## Screen tree (deploy checklist)

```text
AppRhizoh528 (router)
└── AppRhizoh528T0          ← rhizoh.com default (NOT spatial shell unless VITE_RHIZOH_SPATIAL_SHELL=1)
    └── ROOT (full viewport)
        └── WORLD (productSurface === "world", realityMode === GLOBE)
            ├── agent swarm      (Three.js + SwarmCollectiveAuraV1)
            ├── core orb         (epistemic gravity / field pulses)
            ├── map              (Cesium REAL_MAP — sub-layer only; not default WORLD)
            ├── capability wheel (RhizohCapabilityHaloV1 — above chat, z > dock)
            ├── voice            (mic — always visible when VITE_RHIZOH_VOICE_ENGINE_V3=1)
            ├── chat             (RhizohT0ShellChromeV1 — fixed bottom dock)
            └── drawers          (RhizohProductSurfaceDrawerV0 — hall/studio/…; world = no drawer)

        T0 overlay (non-authoritative for execution)
            ├── T0ContinuitySurfaceRailV0   (context strip + intent anchors)
            ├── CEOL choreography           (first 5s — visibility only)
            ├── FCL / ACL strips            (continuity pulses)
            └── UnifiedProductShellBar      (Dünya · Salon · …)
```

**Opt-in track (not main product):** `VITE_RHIZOH_SPATIAL_SHELL=1` → `RhizohSpatialWorldShell` (map-first research shell).

---

## Layer ownership

| Layer | Owner component | WORLD default | Notes |
|-------|-----------------|---------------|-------|
| Swarm | `AppRhizoh528T0` + engine | ON | Must not be hidden in prod first-match |
| Globe | `realityMode GLOBE` | ON | Abstract globe home |
| Map | `CesiumRealMapLayer` | OFF on WORLD | `active === mapSurfaceActive`; REAL_MAP only |
| Wheel | `RhizohCapabilityHaloV1` | ON on `productSurface===world` | `z-[68]`, above chat `z-[64]` (not gated on drawer) |
| Voice | `RhizohT0ShellChromeV1` mic + camera in unified input | ON (v3 env) | Not “Gelişmiş only” |
| Chat | `RhizohT0ShellChromeV1` | ON | Clears rail + product bar |
| Drawers | `RhizohProductSurfaceDrawerV0` | OFF on world | Bottom sheet for non-world surfaces |
| T0 rail | `T0ContinuitySurfaceRailV0` | overlay | Does not replace WORLD |

Policy module: [`rhizohWorldSurfacePolicyV0.js`](../apps/client/src/rhizoh/runtime/rhizohWorldSurfacePolicyV0.js)

**Plain Turkish UI copy (cohort):** [`rhizohProductPlainCopyV0.js`](../apps/client/src/rhizoh/runtime/rhizohProductPlainCopyV0.js) — no “CAPABILITY WHISPER”, “Keşif · Dünya açık”, or “güven 0.56” in the main strip.

**Minimal chrome (default closed):** [`rhizohProductChromePanelsV0.js`](../apps/client/src/rhizoh/runtime/rhizohProductChromePanelsV0.js) — **alt çubuk = tek navigasyon**: Dünya / Salon / … düğümü ilgili paneli açar-kapatır. Dünya → yetenek tekerleği + **harita katmanı** ([`rhizohWorldMapToolV0.js`](../apps/client/src/rhizoh/runtime/rhizohWorldMapToolV0.js): Küre · Şehir · Bağlantı; süreklilikte son seçim; LAA: *haritaya geç*, *küreye geç*, *bağlantı noktası*). Panel açıkken Dünya’ya tekrar dokun = sonraki harita; Küre’deyken tekrar dokun = panel kapanır.

---

## User journeys (must diverge)

### Returning user

- Has `readUserAnchorV0()` / castle continuity
- **Seamless entry** — no Istanbul flyTo, no empty screen
- WORLD opens on **GLOBE** + restored anchor label (PAL / display anchor)
- Map available via explicit intent (“haritaya git”, `/map`, or layer focus) — not boot default

### First-time user

- Optional prompts (not blocking): location · mic · camera
- User picks or skips origin (current GPS · pin · new place)
- First castle / anchor creation → then continuity
- Must **not** auto `flyToIstanbul` on WORLD

---

## Anti-patterns (cohort blockers)

| Symptom | Root cause |
|---------|------------|
| Sarıyer zoom on Dünya | `REAL_MAP` + `flyToIstanbul` on `productSurface === "world"` |
| Wheel under chat | Same `z-index` + halo before chat in DOM |
| No mic | `voice_v3_dock_mic` gated to “Gelişmiş” only |
| T0 feels like whole app | Swarm hidden; placeholder “İstanbul · dünya katmanı” |
| Studio/world only local | LAA grammar too narrow vs OS command layer |

---

## Pre-deploy product gate (sıra — cohort öncesi)

1. **WORLD ana sahne** — GLOBE + sürü + orb; Dünya seçiliyken düz İstanbul haritası yok.
2. **Capability Wheel merkezi** — viewport ortasında; metin kutusunun altında değil.
3. **Mikrofon görünür** — voice v3 env açıkken chat satırında mic.
4. **İstanbul merkezli başlangıç yok** — boot `flyToIstanbul` kapalı; kırmızı çizgi log’u yok.
5. **Returning / first-time** — anchor varsa “Continued”; yoksa boş dünya + isteğe bağlı izinler (tam sihirbaz = sonraki sprint).
6. **LAA** — `stüdyoya geç` / `dünya` yerel; `haritaya geç` → harita **katmanı** (OPEN_MAP_TOOL), Dünya ≠ harita.
7. **Deploy** — yalnızca 1–6 gözle ve konsolda doğrulandıktan sonra.

## Cohort verification (manual)

1. Open `https://rhizoh.com/` hard refresh — **GLOBE** + swarm visible, not flat OSM Istanbul.
2. Capability wheel at screen center; clickable nodes.
3. Mic icon left of send (when voice v3 env on).
4. Dünya → no bottom drawer; Salon → bottom drawer opens.
5. Returning: continuity strip shows anchor; no boot map zoom.
6. First-time: no forced Istanbul; location prompt optional.
7. “stüdyoya geç” → local action; “haritaya geç” → map layer only.

---

## Code entry points

| Concern | File |
|---------|------|
| Router | `apps/client/src/AppRhizoh528.jsx` |
| Main shell | `apps/client/src/AppRhizoh528T0.jsx` |
| WORLD reality | `rhizohWorldSurfacePolicyV0.js` + `productSurface` effect |
| Map surface | `reality/realityEngineSurface.js` |
| First-match chrome | `rhizohT0FirstMatchIdentityV0.js` |
| Local actions | `rhizohLocalActionAuthorityV0.js` |
