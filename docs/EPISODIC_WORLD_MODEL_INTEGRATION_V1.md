# Episodic World Model Integration (EWM-1)

**Durum:** `PLANNED` — **final abstraction** katmanı; teknik borç değil, **anlamsal birleştirme** hedefi.  
**Sürüm:** EWM-1  
**İlişkili:** [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) · [`EPISODIC_QUERY_RECONSTRUCTION_V1.md`](EPISODIC_QUERY_RECONSTRUCTION_V1.md) · [`GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md`](GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md) · [`WORLDSTATE_V0_SPEC.md`](WORLDSTATE_V0_SPEC.md) · [`GLOBAL_CONSISTENCY_RECONCILIATION_V1.md`](GLOBAL_CONSISTENCY_RECONCILIATION_V1.md) · [`GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md`](GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md) · [`GLOBAL_BOOTSTRAP_PREDICATE_ALGEBRA_V1.md`](GLOBAL_BOOTSTRAP_PREDICATE_ALGEBRA_V1.md) (G3 witness şeması) · [`GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md) (`Bind` → `EWM.project`)

---

## 1. Amaç

Tüm operasyonel katmanların (execution, failure, memory, retrieval) altında **tek bir gözlemlenebilir çekirdek** üzerinden birleşmesi:

- **World state semantic model** — TEK canonical şema değil; **katmanlar arası morphism** + doğrulama kuralları  
- **Observer-independent global coherence** — aynı EQR `planId` + GCR witness ile uyumlu birleşik okuma  
- **Runtime + memory + retrieval unified semantics** — aynı ETSS yüzey ayrımının **tek sözlükte** ifadesi

**İlke:** EWM **yeni hakikat üretmez**; **haritalama + tutarlılık kapısı**dır.

**Bileşim:** [`CSB-1`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md) içinde `EWM.project`, boot tanığı (`PAL`/`VG`), `GCR` reconcile tanığı ve `EQR` plan tanığını **aynı anchor** altında **Pack** eder; çok boyutlu kapanış burada **tek fonksiyon** zincirinin son halkasıdır.

---

## 2. Girdi katmanları (mevcut OS)

| Katman | Sembolik rol |
|--------|----------------|
| ETSS | Truth isolation |
| CIL | Invariant law |
| CAECL | Mutation law |
| ECG | Read-only reasoning graph (export) |
| TAL | Execution trace |
| AEE / ASE | Execution + apply semantics |
| CEE / CESE / CLFB | Failure + scheduling + feedback |
| GCR | Convergence |
| GEMC | Memory consolidation |
| EQR | Reconstruction compiler |

---

## 3. Çıktı (hedef)

- Birleşik **EWM manifest** (sürümlü) — hangi alt modelin hangi sürümde **compose** edildiği  
- **Coherence checks** — ETSS ihlali = build kırmızı; çıktı **tek boolean değil**, **vektörleştirilmiş kısıt tatmini** + gap manifesti ([`GBS-VG-1`](GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md) Gate 3)  
- İsteğe bağlı **ValidityBundle** — [`CSB-1`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md) birleşik salt okunur tanık  
- İsteğe bağlı **WorldState v0+** genişlemesi veya ayrı şema ailesi

---

## 4. Mutation policy

EWM-1 bu dosyada **append-only** tanım; implementasyon ayrı anayasal amendment.

---

*EWM-1 — Planned unified world-state semantic integration across the temporal epistemic OS.*
