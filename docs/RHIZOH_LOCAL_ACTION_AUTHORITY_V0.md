# Rhizoh — Local Action Authority (LAA) v0 SSOT

**Status:** ACTIVE — local vs remote routing  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-02  
**Parents:** [`RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md`](RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md) · [`RHIZOH_PRODUCT_LANGUAGE_LAYER_V0.md`](RHIZOH_PRODUCT_LANGUAGE_LAYER_V0.md)

**Binding sentence (locked):**

> **Local Rhizoh acts first — surface, grammar, and continuity without the remote model.**

---

## 1. Two authorities

| Authority | Role | Examples |
|-----------|------|----------|
| **Local Rhizoh** | Surface OS · grammar · navigation · continuity pulses | *Stüdyo'ya geç*, *dünya*, *salon*, *keşfet* |
| **Remote LLM** | Interpretation · generation · research · explanation | Open questions, creative copy, analysis |

```
USER
  ↓
LOCAL RHIZOH (resolveLocalActionAuthorityV0)
  ↓
Action?
  ├─ yes → apply immediately (no gateway round-trip)
  └─ no  → queryRhizohLLM
```

---

## 2. Routing rules (v0)

| Grammar action | Local? | User sees |
|----------------|--------|-----------|
| `ENTER_SURFACE` | yes | `{Dünya|Stüdyo|…} açıldı.` |
| `SET_INTENT` | yes | Intent mode line (Keşif / Üret / …) |
| no match | remote | Normal LLM path |

Code: [`rhizohLocalActionAuthorityV0.js`](../apps/client/src/rhizoh/runtime/rhizohLocalActionAuthorityV0.js) · [`rhizohGrammarConstitutionV0.js`](../apps/client/src/rhizoh/runtime/rhizohGrammarConstitutionV0.js)

Event: `rhizoh:local-action` · log: `[CASTLE_local_action]`

---

## 3. OS command layer (roadmap — post cohort gate)

v0 ships surface + intent routing. **Next expansion** (local, no LLM):

| Command class | Examples |
|---------------|----------|
| Map tool | *haritaya geç* → `OPEN_MAP_TOOL` (not WORLD replacement) |
| Place | *pin bırak*, *şurayı işaretle* |
| Castle | *kale kur*, *castle oluştur* |
| Live | *yayın başlat*, *mikrofonu aç* |
| Memory | *anı kaydet*, *event oluştur* |
| Navigate | *şuraya git*, *şunu bağla* |

Until wired: remote LLM may answer, but product identity treats these as **Local Rhizoh** targets.

---

## 4. Copy SSOT (Turkish-first cohort)

[`rhizohProductCopyV0.js`](../apps/client/src/rhizoh/runtime/rhizohProductCopyV0.js) — shell labels:

| id | Label |
|----|-------|
| world | Dünya |
| hall | Salon |
| greenroom | Green Room |
| broadcast | Yayın |
| studio | Stüdyo |
| profile | Profil |

Product bar: [`UnifiedProductShellBar.jsx`](../apps/client/src/studio/ui/UnifiedProductShellBar.jsx)

---

## 4. Not in scope (v0)

| Deferred | Why |
|----------|-----|
| **NCL / Coach Voice** | Needs reliable local actions first |
| Full ontology toggle UI | First-match hides welcome wall; drawer = Detay |
| Academy as separate surface | Routes via profile/settings until v1 |

---

## 5. Sahaya çıkış sırası (aligned)

1. Local Action Authority (this doc)  
2. Capability wheel + grammar surfaces  
3. Yazı / dil SSOT  
4. Toggle (uzun metinler)  
5. Surface geçişleri  
6. Mobil  
7. İlk cohort  
8. Coach Voice  

---

*LAA v0 — Rhizoh's first language is action; text is the second layer.*
