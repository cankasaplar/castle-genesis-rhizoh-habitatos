# Apply Semantics Engine (ASE-1)

**Durum:** Canonical spec — `TARGETS_RESOLVED` / `VERIFIED` sonrası **CIL mutasyonunun** nasıl **uygulanacağı**; git ve artefakt tutarlılığı; kısmi başarı telafisi. **Uygulama:** henüz otomatik motor yok; insan PR + bu sözleşme.  
**Sürüm:** ASE-1  
**İlişkili:** [`AEE_RUNTIME_STATE_MACHINE_V1.md`](AEE_RUNTIME_STATE_MACHINE_V1.md) · [`CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md`](CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md) · [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) · [`ECGBINDING_INTERPRETER_V1.md`](ECGBINDING_INTERPRETER_V1.md) · [`COMPENSATION_EXECUTION_ENGINE_V1.md`](COMPENSATION_EXECUTION_ENGINE_V1.md) · [`COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md`](COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md)

---

## 1. Geçiş: TARGETS_RESOLVED → APPLYING

| Önkoşul | Zorunlu |
|---------|---------|
| Tüm parse / route / targets doğrulaması yeşil | Evet |
| `verify_ok` (graf + specflow + ileride ECV) | Politikaya göre; **CIL hedefli PR’larda evet** |
| İnsan veya onaylı otomasyon **apply_start** olayı | Evet (şu an çoğunlukla merge butonu = apply_start) |

**Durum sırası (ARSM-1 ile hizalı):** `VERIFIED` → **`apply_start`** → **APPLYING** → **APPLIED** | **FAILED** → (telafi) **ROLLED_BACK** veya yeni amendment.

---

## 2. CIL mutation application rules

Apply, **Change-class** ve **Targets** ile tanımlıdır; motor **yalnızca izin verilen işlemleri** yapabilir.

| Change-class | Apply anlamı | CIL metni |
|--------------|--------------|-----------|
| **ADD** | Yeni bölüm / amendment bloğu / pointer **ekle** | Append-only; geçmiş silinmez |
| **CLARIFY** | Açıklayıcı metin ekle veya mevcut yanına **ADD** ile netleştir | Normatif güç değişmiyorsa düşük risk |
| **VERSION_LINE** | Kod / modül hattı + belge eşlemesi (`STABILIZATION`, graf kilidi) | **Koordineli** çok dosya; tek atomik PR tercih |
| **PROTOCOL_BUMP** | Artifact şema / ABOA-x / AFOA-x uyumu | [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md) + boot protokolleri birlikte |
| **TRUST_ROOT** | KMS / genesis / imza politikası | ADR çift teyit; apply **insan zorunlu** |

**Yasak:** CIL hedef dosyalarında **overwrite** (geçmiş anlamı silme), **satır-içi gizli geri alma**. Düzeltme = yeni amendment veya açık supersession metni.

---

## 3. Git-level consistency

| Kural | Amaç |
|--------|------|
| **Atomik commit / PR** | Bir CIL-AMENDMENT’in tüm `Targets` aynı merge’te kapanır (ATOMIC mod). |
| **Working tree temiz** | Apply öncesi beklenmeyen yerel değişiklik yok (CI’da her zaman). |
| **Branch = intent** | `main` / korumalı dal: yalnız yeşil doğrulayıcı + review. |
| **Öncel / ancestry** | `Prior-anchor` ile uyumlu commit sırası; rebase sonrası amendment id çakışması TAL’da not. |
| **Geri alma** | `git revert` **operasyonel**; hukuki düzeltme yine **yeni CIL-AMENDMENT** ile sabitlenir. |

---

## 4. Artifact-level consistency

CIL değişikliği **yalnız markdown değilse** (ör. imzalı paket, export edilen ABOA):

| Kontrol | Açıklama |
|---------|----------|
| **Fingerprint / hash** | Hedef artefaktın beklenen özeti amendment veya PR gövdesinde referanslanır |
| **Şema sürümü** | `PROTOCOL_BUMP` ile uyumlu `schemaVersion` |
| **Soy** | Önceki artefakt `Prior-anchor` veya parent hash ile bağlanır |
| **Store vs repo** | Canonical store (ileride) ile repo pointer’ı çift yazım; **TAL** hangi yüzeyin otorite olduğunu söyler |

Repo içi **truth** hattı ETSS’e göre ayrılır: TAL / ECG / CIL — apply motoru **CIL dosyalarını ve açıkça listelenen artefakt pointer’larını** günceller; ECG’yi **üretmez**.

---

## 5. Partial failure compensation strategy

**Tam icra modeli:** [`COMPENSATION_EXECUTION_ENGINE_V1.md`](COMPENSATION_EXECUTION_ENGINE_V1.md) (CEE-1) — ASE failure → telafi amendment, atomik rollback, kısmi mutabakat, çoklu amendment çatışması.

**Özet — varsayılan politika:** **ATOMIC** — bir hedef başarısızsa hiçbiri kalıcı sayılmaz; state **FAILED** veya **APPLYING** içinde rollback.

| Senaryo | Telafi |
|---------|--------|
| **Çok dosyalı PR; biri çakışma** | Merge durdur; düzelt; aynı amendment id ile yeniden dene veya yeni amendment |
| **Artefakt yükleme başarısız** | Repo yaması revert; `ASE_ARTIFACT_PROMOTE_FAILED` kodu; TAL + findings |
| **BEST_EFFORT (opt-in)** | Sadece yazılmış hedefler kalır; **zorunlu:** CEE-1 ile **COMPENSATION** amendment |

**COMPENSATION amendment** — CEE-1 §2: `Compensation-of:`, `Failure-context:`, `Prior-anchor`, `Targets` (gap), şablon: `npm run epistemic:cee-template -- --file …`.

---

## 6. Reason codes (ileride `validateApply` / CI)

| Kod | Anlam |
|-----|--------|
| `ASE_ATOMIC_VIOLATION` | Kısmi yazım ATOMIC modda tespit edildi |
| `ASE_GIT_DIRTY` | Uygulama öncesi kirli working tree |
| `ASE_TARGET_HASH_MISMATCH` | Artefakt özeti beklenenle uyuşmuyor |
| `ASE_PROTOCOL_VERSION_DRIFT` | PROTOCOL_BUMP ile uyumsuz şema |
| `ASE_TRUST_GATE_FAILED` | TRUST_ROOT için onay eksik |

---

## 7. İlişki: ECGBinding Interpreter

Apply veya verify **hatası** sırasında üretilen `ecgBinding` alanları **neden açıklaması** için [`ECGBINDING_INTERPRETER_V1.md`](ECGBINDING_INTERPRETER_V1.md) ile yorumlanır — **read-only**; apply motoru ECG’ye yazmaz.

---

*ASE-1 — Apply semantics: VERIFIED → APPLYING → APPLIED + git/artifact + partial compensation.*
