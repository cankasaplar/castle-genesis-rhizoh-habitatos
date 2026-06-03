# Rhizoh Surface Binding Layer (RSBL) v0

**Status:** ACTIVE  
**SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohSurfaceBindingLayerV0.js`

---

## Problem

**Temporal surface fragmentation:** T0, Cesium, 2D, Cap Wheel ayrı “şimdi” yaşar.

---

## Çözüm

```text
T0 presenceFrame = tek gerçek
        ↓
      RSBL (render etmez)
        ↓
t0_strip · ui_2d · cesium · globe_three · cap_wheel · presence_field
= projection only
```

| Surface | Rol |
|---------|-----|
| `t0_strip` | truth (strip authority) |
| `ui_2d` | projection |
| `cesium` / `globe_three` | projection (`readCesiumSurfaceProjectionV0`) |
| `cap_wheel` | tool_lens |

Globe modülü RSBL’den `breathe01` okur — ayrı clock yok.

**Sonraki:** RSBL publish → SSL → **SCR** (`publishSurfaceCitizenshipV0`) otomatik zincir.

---

## SSOT

```javascript
window.__rhizoh.surfaceBindings
window.__rhizoh.surfaceBindingAuthority
```

Event: `rhizoh:surface-binding-v0`

---

## Kilit

```text
Dışarıda tek dünya = aynı coherence_id, aynı experiential_now_id, farklı projection.
```
