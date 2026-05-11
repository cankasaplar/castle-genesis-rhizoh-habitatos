# Compensation Execution Engine (CEE-1)

**Durum:** Canonical spec — ASE başarısızlığı veya kısmi uygulama sonrası **telafi amendment** üretimi, **atomik geri alma** ve **çoklu amendment çatışması** çözümü. **Otomatik uygulama:** yok; insan onayı + PR. Şablon üretici: `scripts/ceeCompensationTemplate.mjs`.  
**Sürüm:** CEE-1  
**İlişkili:** [`COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md`](COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md) (runtime binding) · [`APPLY_SEMANTICS_ENGINE_V1.md`](APPLY_SEMANTICS_ENGINE_V1.md) · [`AEE_RUNTIME_STATE_MACHINE_V1.md`](AEE_RUNTIME_STATE_MACHINE_V1.md) · [`CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md`](CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md) · [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md)

---

## 1. Tetikleyiciler (ASE → CEE)

| Kaynak | Örnek kod / durum | CEE eylemi |
|--------|-------------------|------------|
| ASE atomik ihlal | `ASE_ATOMIC_VIOLATION` | Telafi taslağı + git rollback operasyonu |
| ASE artefakt | `ASE_ARTIFACT_PROMOTE_FAILED` | Pointer geri alma + yeni amendment |
| BEST_EFFORT kısmi uygulama | `APPLIED_PARTIAL` (ARSM) | **Zorunlu** compensation + TAL kaydı |
| Verify sonrası keşif | `AEE_*` / ileride `ECV_*` | İnsan kararı: yeni amendment veya iptal |
| Çoklu amendment çakışması | `CEE_CONFLICT_UNRESOLVED` | §5 hakem sırası |

CEE **hukuk üretmez**; yalnızca **mevcut CIL + ASE kurallarına** uygun **yeni CIL-AMENDMENT** taslağı ve operasyon checklist’i üretir.

---

## 2. COMPENSATION amendment üretimi

**Change-class:** `ADD` (CAECL-1 ile uyumlu). Normatif olarak telafi, mevcut hukuku **silmez**; **üzerine ekler** veya **kalan işi** listeler.

**Zorunlu alanlar** (CAECL şablonuna ek):

| Alan | Anlam |
|------|--------|
| **`Compensation-of:`** | Başarısız veya kısmi amendment **id** (veya `commit:…` + id) |
| **`Failure-context:`** | Kısa: ASE / AEE kodu + tek cümle |
| **Diğer CAECL alanları** | `Date`, `Targets`, `Prior-anchor`, `SPECFLOW`, `Summary`, `Rationale`, `Validation`, `Attestations` |

**`Prior-anchor`:** başarısız koşunun **kesin** referansı (tercihen `commit:<sha>` veya önceki `CIL-AMENDMENT` id + repo path).

**`Targets`:** yalnızca **kalan** veya **düzeltilmesi gereken** yollar; başarıyla uygulanmış ve geri alınmayan hedefler **tekrar listelenmez** (gürültüyü keser).

**Şablon CLI:** `npm run epistemic:cee-template -- --file compensation-input.json` → stdout’a yapıştırılabilir markdown.

**CRA (runtime artefakt)** ve AEE enjeksiyonu: [`CESE-1`](COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md) §2–3.

---

## 3. Atomik rollback semantiği

| Katman | Rollback | Telafi amendment gerekir mi? |
|--------|----------|------------------------------|
| **Git (working tree / commit)** | `git revert` / reset politikası | Operasyonel; hukuki özet **önerilir** |
| **CIL metni** | Overwrite **yok** — yeni blok ile düzeltme | Evet (ADD / CLARIFY) |
| **TAL** | Append-only — “rollback oldu” satırı | İnsan |
| **Artefakt store** | Versiyon / pointer geri | `PROTOCOL_BUMP` / trust süreci ile uyumlu |

**Atomiklik:** Rollback + compensation PR mümkün olduğunda **tek PR**’da birleşir: önce operasyonel geri alma, sonra metin güncellemesi, sonra doğrulayıcılar yeşil.

**Durum (ARSM ile hizalı):** `FAILED` veya `APPLYING` içinde hata → operasyonel rollback tamamlanınca **`ROLLED_BACK`** veya doğrudan yeni koşu **`RECEIVED`** (telafi amendment) ile devam.

---

## 4. Partial apply reconciliation

**Girdi:** BEST_EFFORT veya kesinti sonrası hangi `Targets` **gerçekten** yazıldı (insan / CI raporu).

| Adım | Eylem |
|------|--------|
| 1. **Inventory** | Uygulanan dosya + hash / commit listesi |
| 2. **Gap analysis** | Orijinal amendment `Targets` − inventory |
| 3. **Risk sınıfı** | Kalan hedefler `CORE-ELIGIBLE` mi? |
| 4. **Compensation** | `Compensation-of:` + `Targets:` sadece gap + gerekirse revert edilenler |
| 5. **TAL** | Kısmi durum özeti (operasyonel şeffaflık) |
| 6. **Verify** | `validate-amendment --verify` + ileride `validateApply` |

**Yasak:** Kısmi durumu “sessizce” bırakmak — ya atomik tamamlanır ya da CEE ile telafi kaydı vardır.

---

## 5. Multi-amendment conflict resolution

**Çakışma:** İki veya daha fazla `CIL-AMENDMENT` aynı `Targets` kümesinde **zıt** veya **sıra-duyarlı** değişiklik önerir; veya `Prior-anchor` zinciri **döngü** / **çift kök** gösterir.

| Politika | Açıklama |
|----------|----------|
| **Total order** | Repo içinde **tek aktif** CIL değişim PR’ı (branch kilidi veya süreç). |
| **Anchor wins** | `Prior-anchor` daha **yeni commit** veya **daha derin** zincir kazanır; diğeri **iptal** veya **merge amendment**. |
| **Steward merge** | `TRUST_ROOT` / `VERSION_LINE` sınıflarında insan hakem; çıktı: tek **MERGE** amendment (ADD + birleşik `Summary`). |
| **Fail-fast** | Çakışma tespit → `CEE_CONFLICT_UNRESOLVED`; merge yok |

**Makine sinyali (ileride):** aynı dosya için eşzamanlı iki `CIL-AMENDMENT` bloğu PR’larda → CI uyarısı veya kırmızı (policy flag).

**ETSS:** Telafi ve merge **TAL ≠ ECG** karıştırmaz; `ecgBinding` yalnızca tanık ([`ECGI-1`](ECGBINDING_INTERPRETER_V1.md)).

---

## 6. Reason codes (CEE)

| Kod | Anlam |
|-----|--------|
| `CEE_COMPENSATION_REQUIRED` | Kısmi / başarısız apply; telafi zorunlu |
| `CEE_ROLLBACK_INCOMPLETE` | Git/store geri alma tamamlanmadan amendment merge edildi |
| `CEE_CONFLICT_UNRESOLVED` | Çoklu amendment çözülmedi |
| `CEE_COMPENSATION_OF_MISSING` | Telafi blokunda `Compensation-of:` eksik |
| `CEE_GAP_UNCLOSED` | Partial inventory ile gap kapatılmadı |

---

## 7. Mutation policy (bu belge)

CEE-1 güncellemeleri **append-only**; CEE-2 anayasal genişleme gerektirirse yeni dosya.

---

**Kapalı döngü (outcome → CRA, amendment-only sıra):** [`CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md).

---

*CEE-1 — Compensation execution: ASE failure → amendment + atomic rollback + partial reconcile + multi-amendment conflict.*
