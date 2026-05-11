# CESE–AEE Closed-Loop Feedback Layer (CLFB-1)

**Durum:** Canonical spec — AEE **yürütme sonucu** ile CESE **CRA** güncellemesi arasındaki **kapalı döngü**; **retry** sözleşmesi; **sıra ayarı** yalnızca **amendment-otorize** girdi değişimiyle.  
**Sürüm:** CLFB-1  
**İlişkili:** [`COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md`](COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md) · [`AEE_RUNTIME_STATE_MACHINE_V1.md`](AEE_RUNTIME_STATE_MACHINE_V1.md) · [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) · [`CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md`](CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md) · [`GLOBAL_CONSISTENCY_RECONCILIATION_V1.md`](GLOBAL_CONSISTENCY_RECONCILIATION_V1.md) (GCR — planlı)

---

## 1. CRA = identity chain object (en kritik netlik)

**CRA**, yalnızca bir “snapshot” değil; **kimlik zinciri düğümü**dir (iteration chain node).

| Sınıf | Alanlar | Anlam |
|--------|---------|--------|
| **Immutable identity** (bir düğümde **asla outcome ile değişmez**) | `amendmentId`, `compensationOf`, `priorCraAnchor` | [`ETSS-1`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) yüzey ayrımı + [`CAECL-1`](CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md) kontrollü mutasyon ile uyumlu **sabit kimlik** |
| **Mutable state** (outcome ile **iyileştirilir** — refine / shrink / extend) | `failureContext`, `targetsRemaining`, `targetsReverted`, `partialRecovery`, `inject`, `retryPolicy` | Yürütme **öğrenir**; **kimlik sürüklenmez** (identity drift yok) |

**Özet:** *State değişir; identity değişmez.* Yeni telafi veya yeni hukuki satır → **yeni CRA düğümü** (yeni `ceeArtifactId` / yeni dosya) + yeni `priorCraAnchor` üst düğüme işaret eder — mevcut düğümün kimlik alanları **patch edilmez**.

**`ceeArtifactId`:** Düğümün benzersiz adı; bu düğüm için de **oluşturulduktan sonra değişmez**.

---

## 2. Döngü özeti

```
AEE koşusu (parse → verify → apply …)
        ↓ execution outcome (JSON / TAL özeti)
CLFB: state refine → yeni CRA düğümü veya belgeli delta (kimlik yeni satırda)
        ↓
orderRepairsDeterministic(RepairItem[])  ← yalnızca commit snapshot
        ↓
Sonraki AEE koşusu (yeni epistemik olay)
```

**Kilit:** Gözlemlenebilirlik (TAL + `findings` + CRA dosyaları). **Gizli runtime** ile sıra veya kimlik güncellenmez.

---

## 3. Execution outcome → CRA: kontrollü feedback

**Outcome kaynağı:** `validateCilAmendment.mjs --json`, ileride apply raporu, **TAL’a işlenmiş** özet.

### 3.1 State alanları (refine — overwrite değil)

| Alan | İzin verilen işlem |
|------|---------------------|
| `failureContext` | **Refine / append-code** — kod seti genişleyebilir; geçmiş kod satırı **silinmez** (append-only anlam) |
| `targetsRemaining` | **Shrink / re-evaluate** — gap kapanır, liste küçülür |
| `partialRecovery` | **Extend / finalize** — `inventoryCommit`, mod |
| `inject` | **Phase resolution update** — yalnız yeni CIL/CRA düğümü ile gerekçeli |

### 3.2 Kimlik alanları (sınır)

| Alan | Kural |
|------|--------|
| `amendmentId` | **Asla** outcome ile güncellenmez |
| `compensationOf` | **Asla** outcome ile güncellenmez |
| `priorCraAnchor` | Bu düğüm oluşturulduğu anda sabitlenir; **sonradan değişmez** |

**Özet:** *Execution learns → identity does not drift.*

Örnek zincir düğümü: [`scripts/fixtures/clfb-cra-iteration-v2.sample.json`](../scripts/fixtures/clfb-cra-iteration-v2.sample.json) (`priorCraAnchor` + `inventoryCommit` + `retryPolicy` = **lineage graph** kenarı).

---

## 4. Retry = yeni epistemik olay

| Yanlış model | Doğru model |
|----------------|---------------|
| Retry = aynı state içinde döngü | Retry = **yeni AEE koşusu** + **kayıt** + gerekiyorsa **yeni CRA düğümü** |
| Sessiz tekrar | Her tekrar TAL / JSON findings ile izlenir |

**Sonuç:** Replayability korunur; audit zinciri bozulmaz; **silent retry forbidden** ([`ARSM-1`](AEE_RUNTIME_STATE_MACHINE_V1.md) ile uyumlu).

---

## 5. Dynamic ordering (invariant)

- `orderRepairsDeterministic` **yalnızca** `f(commitSnapshot)`  
- **Runtime memory patch** ile sıra değişimi → `CLFB_ORDER_RUNTIME_MUTATION`  
- **Kazanım:** determinizm; yarış yok; “canlı sıra halüsinasyonu” engeli

---

## 6. ETSS geri besleme sınırı (epistemik firewall)

```
TAL → CRA → CLFB
          ↘ (ECG otomatik türetim yok — mutation yok)
```

**Reasoning layer** (ECG) execution feedback ile **kirletilmez**; `ecgBinding` yalnızca tanık ([`ECGI-1`](ECGBINDING_INTERPRETER_V1.md)).

---

## 7. CLFB reason codes = feedback ontology

**Sınıf:** execution outcome / feedback **sınıflandırma** — hata yalnızca “state” değil, **feedback anlamı** taşır.

| Eksen | Örnek kodlar |
|--------|----------------|
| **Retry-triggered** | `CLFB_RETRY_UNDECLARED`, `CLFB_OUTCOME_UNRECORDED` |
| **Partial-recovery-driven** | (CESE/ASE ile hizalı genişleme) |
| **Compensation-required** | `CLFB_CRA_STALE` |
| **Ordering-conflict-derived** | `CLFB_ORDER_RUNTIME_MUTATION` |
| **Idempotency-violation** | `CESE_IDEMPOTENCY_MISMATCH` (CESE-1) — CLFB ile birlikte okunur |

Tam tablo (çekirdek):

| Kod | Anlam |
|-----|--------|
| `CLFB_CRA_STALE` | Outcome, güncellenmemiş CRA state ile uyumsuz |
| `CLFB_OUTCOME_UNRECORDED` | Yeni koşu TAL/findings dışı |
| `CLFB_ORDER_RUNTIME_MUTATION` | Epistemik sıra runtime’da değiştirildi |
| `CLFB_RETRY_UNDECLARED` | Retry politikası deklare değil |
| `CLFB_IDENTITY_DRIFT_ATTEMPT` | Kimlik alanı outcome ile değiştirilmeye çalışıldı (ihlal) |

---

## 8. Mimari kapanış (dört katman)

| Katman | Rol |
|--------|-----|
| **AEE** | Execution |
| **CESE** | Failure **scheduling** (deterministik sıra) |
| **CEE** | Failure **temsili** (telafi sözü) |
| **CLFB** | Failure **feedback** + evolution **kontrolü** (kimlik sabit, state öğrenir) |

**Sistem sınıfı:** Rhizoh yalnızca bir execution engine değil — **self-regulating epistemic control system**: yürütme → yakalama → zamanlama → onarım → **kontrollü** geri besleme.

---

## 9. Üçlü garanti (tasarım kazanımı)

| Mekanizma | Garanti |
|-----------|---------|
| **ETSS** | Reasoning isolation |
| **CAECL** | Controlled mutation |
| **CLFB** | Controlled learning |

---

## 10. Tek cümlelik durum

CLFB-1 ile Rhizoh artık yalnızca hataları işleyen bir sistem değil, hatayı execution sonrası CRA seviyesinde yakalayıp **kontrollü retry**, **deterministik ordering** ve **immutable identity** kurallarıyla kapalı döngü halinde yöneten bir **epistemic feedback governance architecture** haline gelmiştir.

---

## 11. Final snapshot (yığın)

| Katman | Rol |
|--------|-----|
| **ETSS** | Truth surfaces isolation |
| **CIL** | Invariant law |
| **CAECL** | Mutation law |
| **ECG** | Reasoning structure (read-only w.r.t. CLFB feedback) |
| **TAL** | Execution trace |
| **AEE** | Execution engine |
| **ASE** | Apply mutation semantics |
| **CEE** | Failure semantics |
| **CESE** | Failure scheduling |
| **CLFB** | Failure feedback loop |

---

## 12. Sonraki katman (planlı)

**Global Consistency Reconciliation (GCR):** çoklu-CRA mutabakat, epoch merge, dağıtık yakınsama tanığı — [`GLOBAL_CONSISTENCY_RECONCILIATION_V1.md`](GLOBAL_CONSISTENCY_RECONCILIATION_V1.md) · `npm run epistemic:gcr-reconcile`.

---

## 13. Mutation policy

CLFB-1 güncellemeleri **append-only**; üst sürüm ayrı dosya veya sürüm satırı.

---

*CLFB-1 — Immutable CRA identity + controlled state feedback + amendment-only order + feedback ontology.*
