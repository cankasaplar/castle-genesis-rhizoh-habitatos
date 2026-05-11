# AEE Runtime State Machine (ARSM-1)

**Durum:** Canonical spec — Amendment Execution Engine’in **çalışma zamanı durumları**, geçişler, geri alma ve gözlemlenebilirlik.  
**Sürüm:** ARSM-1  
**İlişkili:** [`EPISTEMIC_PHASE2_EXECUTION_VALIDATION_V1.md`](EPISTEMIC_PHASE2_EXECUTION_VALIDATION_V1.md) · [`CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md`](CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md) · [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) · [`APPLY_SEMANTICS_ENGINE_V1.md`](APPLY_SEMANTICS_ENGINE_V1.md) · [`COMPENSATION_EXECUTION_ENGINE_V1.md`](COMPENSATION_EXECUTION_ENGINE_V1.md) · [`COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md`](COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md) · [`CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md) · [`ECGBINDING_INTERPRETER_V1.md`](ECGBINDING_INTERPRETER_V1.md)

---

## 1. Amaç

AEE, bir `CIL-AMENDMENT` kaydını yalnızca parse etmekle kalmaz; **yaşam döngüsü** içinde hangi aşamada olduğunu, **başarısızlıkta neden** ve **nasıl toparlanacağını** tanımlar. Bu belge **runtime state machine**’dir; **parse → verify** `validateCilAmendment.mjs` v0.2 ile kodlanmıştır; **apply** semantiği [`ASE-1`](APPLY_SEMANTICS_ENGINE_V1.md); **ecgBinding yorumu** [`ECGI-1`](ECGBINDING_INTERPRETER_V1.md).

---

## 2. Durumlar (states)

| State | Anlam |
|--------|--------|
| **IDLE** | Süreç dışı; amendment işi yok. |
| **RECEIVED** | Ham girdi alındı (PR, dosya, blok metni). |
| **PARSED** | `AmendmentRecord` çıkarıldı; alanlar okunabilir. |
| **ROUTED** | `Change-class` yönlendirildi (tier / politika). |
| **TARGETS_RESOLVED** | `Targets` yolları çözüldü ve (varsa) varlık doğrulandı. |
| **VERIFYING** | Dış doğrulayıcılar (graf, specflow, ileride ECV) çalışıyor. |
| **VERIFIED** | Tüm verify adımları yeşil. |
| **APPLYING** | Yama / içerik uygulaması (atomik veya politika ile adımlı) — [`ASE-1`](APPLY_SEMANTICS_ENGINE_V1.md). |
| **APPLIED** | Çalışma ağacı + artefakt pointer’ları tutarlı şekilde güncellendi. |
| **PROPAGATING** | *(ileri)* TAL / artefakt yayılımı. |
| **COMPLETE** | *(ileri)* Yayılım tamam; terminal başarı. |
| **FAILED** | Terminal hata; `findings` ile kodlanmış neden. |
| **ROLLED_BACK** | Operasyonel geri alma tamam; telafi metni [`CEE-1`](COMPENSATION_EXECUTION_ENGINE_V1.md) ile takip edilir. |
| **COMPENSATION_PENDING** | ASE/CEE: telafi amendment taslağı veya onay bekleniyor. |

**Kodlanmış kapsam (AEE v0.2):** `RECEIVED` → … → `VERIFIED` | `FAILED`. **`VERIFIED` → `APPLYING` → `APPLIED`** — otomasyon henüz yok; semantik **ASE-1** + insan PR / merge.

---

## 3. Geçişler (amendment → state transition)

| Olay | Önkoşul | Kaynak → hedef |
|------|---------|----------------|
| `ingest` | — | IDLE → RECEIVED |
| `parse_ok` | Blok ve alanlar okunabilir | RECEIVED → PARSED |
| `parse_fail` | Şema ihlali | * → FAILED |
| `route_ok` | Geçerli `Change-class` | PARSED → ROUTED |
| `route_fail` | Geçersiz sınıf | * → FAILED |
| `targets_ok` | En az bir hedef ve dosya varlığı | ROUTED → TARGETS_RESOLVED |
| `targets_fail` | Eksik hedef / yok path | * → FAILED |
| `verify_start` | `—verify` veya CI | TARGETS_RESOLVED → VERIFYING |
| `verify_ok` | Tüm hook’lar 0 exit | VERIFYING → VERIFIED |
| `verify_fail` | Bir hook kırmızı | VERIFYING → FAILED |
| `apply_start` | ASE-1 önkoşulları + onay (insan veya politika) | VERIFIED → APPLYING |
| `apply_ok` | Git + artefakt tutarlılığı sağlandı | APPLYING → APPLIED |
| `apply_fail` | Atomik ihlal / hash drift / gate | APPLYING → FAILED |
| `compensation_start` | CEE-1 telafi taslağı / PR açıldı | FAILED → COMPENSATION_PENDING |
| `compensation_resolved` | Telafi doğrulandı ve merge | COMPENSATION_PENDING → RECEIVED (yeni koşu) veya VERIFIED |
| `propagate_ok` | *(ileri)* TAL / dış artefakt | APPLIED → COMPLETE |

Birden fazla amendment aynı koşuda **sırayla** işlenir; birinde `FAILED` olursa koşu **kırmızı** (batch politikası: “fail-fast”).

---

## 4. Rollback kuralları

| Faz | Kalıcı yan etki? | Rollback anlamı |
|-----|------------------|-----------------|
| **Parse / route / targets / verify (v0.1)** | Hayır (salt okuma) | **No-op** — repo değişmez; yeni commit gerekmez. |
| **Apply (ileri)** | Evet (dosya içeriği) | **Git revert** veya ters yama; CIL metninde **overwrite yok** — telafi için yeni **CIL-AMENDMENT** (ADD / CLARIFY) tercih edilir. |
| **Propagate (ileri)** | TAL / artefakt | Yeni TAL satırı ile düzeltme; eski satır silinmez (append-only). |

**İlke:** CIL hukuku **geri sarılamaz**; yalnızca **yeni hukuk katmanı** ile düzeltilir. Runtime dosya geri alması operasyonel, anayasal metin geri alması değil.

---

## 5. Failure recovery semantics

| Kod sınıfı | Davranış |
|------------|----------|
| **Deterministik parse/verify hatası** | Düzelt → aynı koşuyu tekrar çalıştır (idempotent). |
| **Geçici altyapı (CI flake)** | Retry policy (örn. 1 kez); sonra insan. |
| **Kısmi apply (ileri)** | Aşağıdaki §6 — politika zorunlu. |
| **Dead letter** | `FAILED` + `findings` JSON saklanır; TAL’da opsiyonel not (insan). |

---

## 6. Partial apply handling

**Önerilen varsayılan (CIL):** **Atomik apply** — bir amendment kaydının tüm `Targets` için önkoşullar sağlanmadan hiçbiri kalıcı yazılmaz.

| Mod | Ne zaman | Risk |
|-----|----------|------|
| **ATOMIC** (önerilen) | Tek PR / tek amendment | Düşük tutarsızlık |
| **BEST_EFFORT_PER_TARGET** | Sadece açık politika + insan onayı | Yarı uygulanmış hukuk; TAL’da **zorunlu** açıklama |

Kısmi başarı durumunda runtime state: **`APPLIED_PARTIAL`** (ileri) + zorunlu telafi amendment’i.

---

## 7. Observability hook — “why amendment failed?”

Her başarısızlık **makine kodlu** taşınmalıdır (insan mesajı ikincil).

### 7.1 Reason codes (v0.1)

| Kod | Aşama |
|-----|--------|
| `AEE_DATE_INVALID` | PARSED |
| `AEE_CHANGE_CLASS_INVALID` | ROUTED |
| `AEE_SPECFLOW_INVALID` | ROUTED |
| `AEE_PRIOR_ANCHOR_MISSING` | PARSED |
| `AEE_TARGETS_EMPTY` | TARGETS_RESOLVED |
| `AEE_TARGET_NOT_FOUND` | TARGETS_RESOLVED |
| `AEE_VERIFY_GRAPH_FAILED` | VERIFYING |
| `AEE_VERIFY_SPECFLOW_FAILED` | VERIFYING |

Apply / artefakt: [`ASE-1` §6](APPLY_SEMANTICS_ENGINE_V1.md) `ASE_*`. İleride: `AEE_PROPAGATE_*`, `AEE_ECV_*`.

### 7.2 Çıktı sözleşmesi

`node scripts/validateCilAmendment.mjs --json` → stdout’ta tek JSON nesnesi:

- `ok`, `aeeVersion`, `runState`, `amendmentCount`, `amendments[]`, `findings[]`, `ecgTracePolicy`.

Operatör / CI: `findings[].code` ve `findings[].aeeState` ile **neden** sorusu yanıtlanır.

---

## 8. Causal explanation trace (ECG binding)

**ETSS uyumu:** Başarısızlık açıklaması **ECG’den türetilmez**; gerektiğinde **referans bağlanır** (opsiyonel).

| Alan | Anlam |
|------|--------|
| `ecgBinding: null` | v0.1 varsayılan; veya bağlam yok. |
| `causalNodeId` | *(ileri)* Studio / replay’de ilgili atom id — **witness**, tek kaynak değil. |
| `epochRef` | *(ileri)* `hashChainedEpoch` hattındaki kimlik — constitutional iz. |

**Kullanım:** “Bu verify hatası şu epoch / şu causal atom ile **aynı oturumda** gözlendi” demek — nedensellik iddiası değil, **iz sürmüş açıklama** (explanation trace). Makine yorumu: [`ECGI-1`](ECGBINDING_INTERPRETER_V1.md) / `scripts/ecgBindingInterpreter.mjs`.

---

## 9. Mutation policy (bu belge)

ARSM-1 güncellemeleri **append-only** tercih; üst sürüm ARSM-2 ayrı dosya veya açık sürüm satırı.

---

*ARSM-1 — AEE runtime state machine + observability + ECG binding contract.*
