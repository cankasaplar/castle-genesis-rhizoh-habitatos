# RBL-A1 — Authority Evolution & Drift Layer v1

**Rol:** [RBL-G1](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) **bağlama kurallarını** zaman içinde **sürümler**: G1 kısıt kümesi nasıl **versionlanır**, yayımlanmış yetki ile gözlemlenen davranış **ne zaman ayrışır (drift)**, **çakışan G1 politikaları** hangi pencerelerde **birlikte var olabilir**, **epoch sınırı** ile **authority sınırı** nasıl **senkron** tutulur. G1 “kim bağlar”ı sabitler; A1 “bağ **nasıl ve ne zaman değişir**”i sabitler — ikisi birlikte **sessiz yetki kayması** ve **çift-gerçeklik** riskini normatif olarak kapatır.

**Sürüm:** RBL-A1  
**Durum:** `NORMATIVE_TARGET` — `governanceConstraintSet*` / drift witness alanları **sonraki faz**; MK-1 / πEFC ret kodları ile hizalanacak.  
**Önkoşul:** [RBL-G1](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) · [Compat-1](PI_EMS_COMPAT_MATRIX_V1.md) · [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md)  
**İlişkili:** [RBL-R1](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) · [RBL-D1](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) · [MK-1](MK1_KERNEL_VALIDATOR_V0_1.md) · [CGR-1](CGR_1_CONSTITUTIONALLY_GOVERNABLE_RUNTIME_V1.md) · [`authorityBundle.mjs`](../scripts/authorityBundle.mjs)

---

## 0. Dört açık soru (A1 cevabı)

| Soru | A1 özeti |
|------|-----------|
| **G1 constraint set değişimi nasıl versionlanır?** | Kısıt kümesi **ayrı bir sürümlü artefakt** olarak mühürlenir: `governanceConstraintSetId` + **monoton** `governanceConstraintSetVersion` (veya içerik-hash zinciri). Değişim yalnız **yeni yayımlanmış** [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) bundle / bağlı manifest ile gelir; geçmiş sürüm **rewrite edilmez** (RBL-G-I4 ile uyum). |
| **Authority drift nasıl tespit edilir?** | **Drift** = yayımlanmış **authority + G1 kısıt + epoch bağlamı** ile **gözlemlenen** motor / çağrı bağlamı arasında **tanımlı uyuşmazlık** (ör. `resolutionPolicyRef` stale, `epochContext` ile bundle `resolutionEpochScope` çakışması, beklenen `guardianSeal` durumu ile lifecycle uyumsuzluğu). Tespit: yapılandırılmış **drift witness** + MK-1 / πEFC **explicit ret** ailesi — “flaky” yorumu yerine **sınır ihlali** kodu. |
| **Conflicting G1 policies nasıl coexist eder?** | Yalnız **piEMS DUAL_READ** (ve eşdeğeri) penceresinde ve **çağrı başına tek seçim** ile: aynı `evaluateBind` içinde iki aktif G1 **birleştirilmez**; çağrı **`epochContext` + bağlı `authorityBundle`** hangi G1 sürümünü seçtiğini taşır. Uzun süreli çakışma = [RBL-G1 §4](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) **authority split** yoluna girer (sessiz tekilleştirme yok). |
| **Epoch boundary + authority boundary nasıl senkronlanır?** | **Tercih:** **joint CUT_OVER** — aynı yönetişim tanığı altında hem `projectionEpochId` / `piHash` kesimi hem **yeni** `ProjectionAuthorityBundle` yürürlüğe girer. **Stagger izni:** yalnız açık **DUAL_READ + dual authority** politikası ve her τ üzerinde **zorunlu epoch/authority etiketi**; aksi halde [piEMS-1 §4.2.1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) “aynı τ, farklı outcome” gözlemi **authority–epoch desenkronu** olarak sınıflanır. |

---

## 1. G1 constraint set — sürüm modeli

**Kısıt seti** (G1 invariant’larının somutlaşmış, makine-okur formu):

```text
GCSᵥ = ( id, version, contentHash, parentRef?, effectiveEpochScope, resolutionPolicyRef? )
```

- **Lineage:** `parentRef` ile **DAG değil zincir** hedeflenir; çatallanma varsa **iki id** — birleştirme yalnız yeni yayımlanmış GCS + bundle.  
- **Bağlama:** Her `ProjectionAuthorityBundle`, ürettiği G1 bağlamında **hangi `GCS` sürümünün** geçerli olduğunu taşır (RBL-G1.1 alanları ile birleşir).  
- **Retroaktif değişim yok:** Eski `GCS` için içerik değişimi **yeni version** olarak eklenir; tarihsel doğrulama **o anki `GCS` hash’i** ile yapılır.

---

## 2. Authority drift — tanım ve sinyaller

| Sinyal sınıfı | Örnek |
|---------------|--------|
| **Scope drift** | Çağrıdaki `epochContext` bundle’daki `resolutionEpochScope` dışında. |
| **Policy ref drift** | `resolutionPolicyRef` bundle’da işaretlenen R1 artefaktı ile runtime manifest uyuşmuyor. |
| **Lifecycle drift** | PAG aşaması (quorum / CUT_OVER) ile `guardianSeal` / freeze durumu çelişiyor. |
| **Split drift** | [RBL-G1 §4](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) çözümü beklenirken üretim “tek bundle” varsayımıyla devam ediyor. |

**Drift witness (hedef):** append-only kayıt — gözlemlenen fingerprint’ler, beklenen referanslar, **RBL-A ret kodu** önerisi. Guardian freeze, drift’i **gidermez**; yalnız **yeni yayın** öncesi riski keser (RBL-G-I3 ile uyum).

---

## 3. Çakışan G1 politikalarının birlikte varlığı

**İzin verilen tek mod:** **etiketli çokluluk**.

1. **DUAL_READ:** [piEMS-1 §4.2](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) — hem Eₖ hem Eₖ₊₁ (ve eşleşen **GCS** sürümleri) kabul edilebilir; sonuç **hangi epoch + hangi authority** ile üretildiğini açıklar.  
2. **Fork:** İki `GCS` **Compat-1** üzerinde **INCOMPARABLE** ve PAG’de **açık fork** — birleşik tek π iddiası yok ([piEMS-1 §5.3](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md)).  
3. **V-CLASS-III / archive:** [RBL-R1](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) uzlaşma hattı — coexistence **geçici**; kalıcı çözüm yeni **tek** yayımlanmış hat.

**Yasak:** Tek πEFC çağrısında **örtük** iki G1 (etiketsiz); bu **fail-closed** veya explicit `RBL_A_ERR_AMBIGUOUS_G1_CONTEXT`.

---

## 4. Epoch sınırı ↔ authority sınırı senkronu

```text
effective(authorityBundle) ⋈ effective(epoch Eₖ)  ⇒  joint witness veya stagger contract
```

| Mod | Koşul |
|-----|--------|
| **Joint CUT_OVER** | Tek tanık: yeni `epochId`/`piHash` + yeni bundle aynı **PAG CUT_OVER** olayında. |
| **Stagger** | Önce epoch sonra bundle (veya tersi) **yalnız** DUAL_READ + her τ’de **çift etiket**; GDK clock ile `effective_from` hizası dokümante. |
| **Desenkron (hata)** | Stagger contract yokken üretim **yeni epoch** + **eski bundle** (veya tersi) — **drift / ret**; sessiz devam yok. |

**Hizalama özeti:** `resolutionEpochScope` ⊆ ilgili `Eₖ` aralığı veya genişlemesi **yalnız** yeni GCS + bundle ile; implicit genişleme RBL-G-I4 ihlali sayılır.

---

## 5. Bundle / manifest genişlemesi (hedef alanlar, RBL-A1.1)

[RBL-G1 §5](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) ile birlikte:

- `governanceConstraintSetId`  
- `governanceConstraintSetVersion`  
- `governanceConstraintContentHash` — `GCS` içeriğinin kanon hash’i  
- `authorityEpochAlignmentRef` — (opsiyonel) joint / stagger sözleşmesine URI  
- `lastDriftCheckpointRef` — (opsiyonel) son başarılı tutarlılık kontrolü

---

## 6. Authority evolution invariants (RBL-A-I*)

| Kimlik | İfade |
|--------|--------|
| **RBL-A-I1** | **Versioned GCS** — G1 kısıt değişimi yeni sürüm kaydı olmadan yürürlüğe giremez. |
| **RBL-A-I2** | **Drift is visible** — authority–observation ayrımı explicit kod veya witness olmadan “şans eseri” üretim yok. |
| **RBL-A-I3** | **No unlabeled multi-G1** — iki G1 politikası yalnız epoch/authority etiketiyle ayırt edilebilir çağrılarda. |
| **RBL-A-I4** | **Boundary coherence** — epoch kesimi ile authority kesimi **joint veya sözleşmeli stagger**; aksi drift. |
| **RBL-A-I5** | **Split timeout is governance debt** — çözülmemiş split altında kalıcı tek-hat iddiası yok ([RBL-G-I5](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) ile uyum). |

---

## 7. Boru hattındaki yer

```text
… → RBL-R1 (policy action) → RBL-G1 (who binds) → RBL-A1 (how constraints evolve / drift / coexist / boundaries) → PAG bundle → πEFC / MK-1
```

---

## 8. Sonraki repo adımları

- `authorityBundle` şemasına §5 alanları + doğrulama.  
- `RBL_A_ERR_*` veya MK-1 / `PAG_ERR` genişlemesi: scope drift, ambiguous G1 context, boundary incoherence.  
- Dokümantasyon: [piEMS-1 §4](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) ile **epoch–authority** birleşik tablo; [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) lifecycle fazları ile **joint CUT_OVER** satırı.

---

**Mühür (RBL-A1):**

> **Authority without evolution accounting is silent drift.**

---

*RBL-A1 — Authority Evolution & Drift Layer; GCS versioning, drift witness, labeled multi-policy coexistence, epoch–authority sync.*
