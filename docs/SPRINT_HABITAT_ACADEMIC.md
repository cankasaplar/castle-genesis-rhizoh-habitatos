# Sprint habitat — Academic

**SPECFLOW varsayılan etiket:** `RESEARCH-ONLY` (frozen core’a dokunulmadığı sürece).

Yeni sprint başlatırken: [`SPRINT_BOOTSTRAP_TEMPLATE.md`](SPRINT_BOOTSTRAP_TEMPLATE.md) kopyala-doldur; Nisa/ChatGPT oturumları için [`CONTEXT_RECONSTRUCTION_PROMPT.md`](CONTEXT_RECONSTRUCTION_PROMPT.md) §1.

## Amaç

Formalizasyon, invariant listeleri, kanıt **taslakları** ve opsiyonel makale / teknik not — **çalıştırılabilir çekirdeği değiştirmeden**.

## Truth sources

- [`ARCHITECTURE_POST_FREEZE_SUMMARY.md`](ARCHITECTURE_POST_FREEZE_SUMMARY.md)
- [`STABILIZATION.md`](../STABILIZATION.md), [`SPECFLOW_MARKERS.md`](../SPECFLOW_MARKERS.md)
- [`SPRINT_PREP_ACADEMIC_ROBOTICS_FROZEN_CORE.md`](SPRINT_PREP_ACADEMIC_ROBOTICS_FROZEN_CORE.md)

## Oturum kaydı

Her anlamlı çalışma blokunu [`docs/academic/SESSION_LOG.md`](academic/SESSION_LOG.md) içine işleyin (karar izi + SPECFLOW etiketi).

## Çıktılar (artifact)

- [ ] Numaralı **invariant** listesi (hangisi kodda doğrulanıyor / hangisi hipotez)
- [ ] **İddia vs kanıt** tablosu (SAT/SMT, MFA, Lyapunov vb. için ayrı satır)
- [ ] İsteğe bağlı: internal paper draft (`docs/academic/` altında yeni dosya — klasör yoksa oluştur)
- [ ] Opsiyonel: kanıt **iskelesi** (Coq/Lean vb. repo dışı veya `experimental/` — çekirdeği kirletme)

## Done kriterleri

- Frozen subgraph’a **istenmedik** import veya davranış değişikliği yok
- Yeni iddialar **Executable / Spec / Epistemik** sütunlarından birine açıkça bağlı
- PR açıklamasında birincil etiket: `RESEARCH-ONLY` (veya yalnızca doc coherence ise `FUTURE-PROOF-ONLY`)

## İzinli değişiklik alanı

| İzinli | Değil |
|--------|--------|
| `docs/**` (yeni akademik notlar) | `apps/client/src/ghost/phase*.js` davranış / import |
| `experimental/**` (ileride açılırsa) | Graf/hash/script uyumsuzluğu |
| Bu habitat dosyasının sprint notları | Reality lock / gateway davranışını sessizce değiştirme |

## Doğrulama

```bash
npm run stabilization:validate-graph
npm run stabilization:validate-specflow
```

## Ortak çalışma

[Nisa + harici LLM / NASA-academic sıkılığı için süreç](HABITAT_COLLABORATION_ACADEMIC.md).

---

*Sprint adını ve tarih aralığını her oturumda üstte güncelleyin.*
