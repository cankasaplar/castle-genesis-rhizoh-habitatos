# Sprint bootstrap — şablon

**Kullanım:** Yeni bir habitat sprinti (ör. Nisa ile Academic) başlatırken bu dosyayı kopyalayın: `docs/sprints/SPRINT_<ID>_<KISA_AD>.md` veya mevcut habitat dosyasına **Sprint bölümü** olarak yapıştırın.

**Gerçeklik:** ChatGPT / Nisa / Cursor **ortak kalıcı bellek paylaşmaz**. Süreklilik = **repoda yeniden kurulan bağlam** (bu dosya + habitat doc + `SESSION_LOG`).

---

## Meta

| Alan | Değer |
|------|--------|
| **Sprint ID** | `SPRINT-YYYY-MM-DD-…` |
| **Habitat** | Academic \| Robotics (ileride) \| … |
| **Birincil SPECFLOW etiketi** | `RESEARCH-ONLY` \| `CORE-ELIGIBLE` \| `FUTURE-PROOF-ONLY` |
| **Başlangıç — bitiş** | |
| **Orchestrator** | |
| **Aktif araştırmacı (ör. Nisa)** | ChatGPT oturumu — rol: fikir / birlikte düşünme |
| **Execution agent** | Cursor — rol: repo diff, CI |

---

## Üç adım protokolü

1. **Sprint start (orchestrator + araştırmacı):** Bu bootstrap + ilgili [`SPRINT_HABITAT_*.md`](SPRINT_HABITAT_ACADEMIC.md) hedefleri doldurulur.  
2. **Execution (Cursor):** Yalnız repo + DAG + freeze kuralları; frozen core’a dokunuş yalnız `CORE-ELIGIBLE` + validator yeşil.  
3. **Review (dış mimari / ChatGPT):** [`CONTEXT_RECONSTRUCTION_PROMPT.md`](CONTEXT_RECONSTRUCTION_PROMPT.md) içindeki Architecture Review protokolü.

---

## Hedef ve sınırlar

**Hedef (bir paragraf):**


**Non-goals (yapılmayacaklar):**


**Beklenen artifact’lar:**


**İzinli dosya alanı:** `docs/**` \| `experimental/**` \| diğer: ___


**Frozen core (v562–v570 `phase*.js` subgraph):** dokunulmayacak \| istisna (gerekçe + PR checklist): ___

---

## Truth source linkleri (oturum başında yapıştır)

- [`ARCHITECTURE_POST_FREEZE_SUMMARY.md`](ARCHITECTURE_POST_FREEZE_SUMMARY.md)
- [`STABILIZATION.md`](../STABILIZATION.md) · [`SPECFLOW_MARKERS.md`](../SPECFLOW_MARKERS.md)
- [`STABILIZATION_GRAPH.md`](../STABILIZATION_GRAPH.md)
- [`AGENTS.md`](../AGENTS.md) · [`.cursor/rules/frozen-core-habitat.mdc`](../.cursor/rules/frozen-core-habitat.mdc)

---

## Oturum sonu

- [ ] [`docs/academic/SESSION_LOG.md`](academic/SESSION_LOG.md) güncellendi  
- [ ] `npm run stabilization:validate-graph` (core PR ise zorunlu)  
- [ ] `npm run stabilization:validate-specflow`  

**İmza / tarih (isteğe bağlı):**
