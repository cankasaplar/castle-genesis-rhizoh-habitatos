# π Evolution & Migration Semantics Spec (piEMS-1)

**Rol:** Projeksiyon sözleşmesinin (**π**) ve **`piHash`**’in **zaman içinde** nasıl değiştiğini formalize eder: yükseltme uyumu, çoklu-π izleri, **epoch** geçişleri ve **UCFC** üzerinden anlaşma. Bu belge **runtime patch** rehberi değil; **semantic migration layer** sözleşmesidir (bkz. [`MK1_KERNEL_VALIDATOR_V0_1.md`](MK1_KERNEL_VALIDATOR_V0_1.md) §11.5 — piVM).

**Sürüm:** piEMS-1  
**Durum:** `NORMATIVE_TARGET` — implementasyon parçalı; alanlar EngineManifest / trace şemasına bağlanacak.  
**İlişkili:** [`PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md`](PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md) (PCEK-1) · [`PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md`](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) (PAG-1) · [**RBL-A1**](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) (epoch–authority sınır senkronu, GCS) · [`MK1_KERNEL_VALIDATOR_V0_1.md`](MK1_KERNEL_VALIDATOR_V0_1.md) §11 (PCEK, UCFC, epoch riski) · [`PI_EMS_COMPAT_MATRIX_V1.md`](PI_EMS_COMPAT_MATRIX_V1.md) (πᵢ↔πⱼ matrisi) · [`PI_INDEXED_EVALUATION_CONTRACT_V1.md`](PI_INDEXED_EVALUATION_CONTRACT_V1.md) (piEFC-1) · [`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) (πEFC-Runtime-1.0) · [`ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md) (EMCS) · [`GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md) (GECS) · [`EVALUATE_BIND_VIRTUAL_MACHINE_V1.md`](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md) (EBVM) · [`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md) (GDK — zaman kernel)

### MK-1 + piEMS birleşimi (stack özeti)

Sistem artık üç **sürümlü** eksen üzerinde okunur:

| Eksen | Katman | Rol |
|--------|--------|-----|
| **Versioned deterministic execution** | **EBVM** | Compute — trace üretimi |
| **Versioned time kernel** | **GDK** | Zaman / sıra / clock politikası |
| **Versioned meaning layer** | **UCFC + piEMS** | π / `piHash` evrimi, epoch, migration |
| **Acceptance** | **MK-1** | Range enforcement (hangi π-range) |

Dört katman birlikte **Epistemic OS**’u teknik olarak **formal bir stack** yapar: determinizm **execution**’da; anlam **projection contract**’ta; kabul **MK-1**’de; **zaman** **GDK**’da; **anlamın zaman içi değişimi** **piEMS**’te. **Runtime’da tek karar yüzeyi:** [`PI_INDEXED_EVALUATION_CONTRACT_V1.md`](PI_INDEXED_EVALUATION_CONTRACT_V1.md) (**piEFC-1**) — `evaluateBind(τ, π, epoch, clock)` → MK-1 + compatibility; formal semantik [`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) (**πEFC-Runtime-1.0**).

---

## 0. Kapsam ve olmayanlar

**Kapsar**

- **`piHash` upgrade compatibility** — hangi eski trace, hangi yeni π altında ne statüde kalır.  
- **Mixed-π trace reconciliation** — tek artefaktta birden fazla projeksiyon epoch’u.  
- **Epoch transition rules** — kesim, çift okuma, zorunlu alanlar.  
- **UCFC negotiation protocol** — tek **projection authority**’ye nasıl varılır.

**Kapsamaz**

- π’nin matematiksel içeriği (GECS / ANF ayrı spec).  
- MK-1 guard’ların iç algoritması (MK-1 ayrı); piEMS yalnız **hangi π ile MK-1 çağrılır** sorusunu bağlar.

**Temel ilke:** Ret sınıfları deterministik kalır; **değişen** şey, hangi **policy fingerprint** (`piHash`) altında sınıflandırma yapıldığıdır. Uyumsuzluk **bug** değil **epoch / policy** meselesidir ([`MK1` §11.4](MK1_KERNEL_VALIDATOR_V0_1.md)).

---

## 1. Nesne modeli (minimal)

| Terim | Anlam |
|--------|--------|
| **π** | Versioned semantic governance primitive; kanon projeksiyon sözleşmesi ([`MK1` §11.1](MK1_KERNEL_VALIDATOR_V0_1.md)). |
| **`piHash`** | π’nin **policy fingerprint**’i; identity değil, **hangi politikaya** bağlı olduğunuzun mührü. |
| **Epoch Eₖ** | Tek bir yetkili `piHash` (ve isteğe bağlı π spec sürüm URI’si) ile tanımlı **semantic governance** aralığı. |
| **Trace τ** | Üretim anında en az bir **binding** taşımalıdır: τ hangi **Eₖ** için üretildi (aşağı §4). |
| **UCFC** | EBVM + GECS (+ governance) aynı **projection contract**’a kilitlenir; piEMS bunun **zamanda** nasıl güncelleneceğini yazar. |

**Invariant (hedef):** Kabul kararı her zaman **Accept(τ) ⇒ τ ∈ Range(πₖ)** biçiminde okunur; **πₖ** τ veya motor manifestinde **açıkça** seçilir (tahmin yok).

---

## 2. `piHash` upgrade compatibility

### 2.1 Uyumluluk sınıfları

Bir geçiş **πₐ → πᵦ** (`piHashₐ` → `piHashᵦ`) için:

| Sınıf | Tanım (hedef) |
|--------|----------------|
| **NON_BREAKING** | `Range(πₐ)` içi τ için `πᵦ(τ)` ile MK-1 sonucu **aynı acceptance class** (pratikte: aynı geçer/geçersiz + aynı ret kodu ailesi). |
| **BREAKING** | En az bir τ ∈ `Range(πₐ)` için sonuç sınıfı değişir veya τ yeniden projeksiyon **gerektirir**. |
| **INCOMPARABLE** | `Range(πₐ)` ile `Range(πᵦ)` arasında garanti edilmiş köprü yok; yalnız **explicit migration** veya **archival read-only** politikası. |

**Not:** “NON_BREAKING” iddiası **kanıt yükü** taşır: release notu + (ileride) regresyon kümesi / differential spec.

### 2.2 Upgrade manifesti (zorunlu içerik hedefi)

Her `piHashᵦ` yayını için dokümante edilir:

- **önceki** `piHash` listesi (compat graph kenarı)  
- sınıf: NON_BREAKING | BREAKING | INCOMPARABLE (πₐ başına)  
- **sunset:** eski epoch’ta üretilen trace’lerin ne zamana kadar kabul görürü  
- **reprojection** gerekir mi (CSB / EBVM replay altında)

### 2.3 Motor vs trace

- **Engine** (EMCS): aktif `piHash_engine`.  
- **Trace:** `piHash_trace` (veya eşdeğer alan).  
- **Kural:** MK-1 çağrısı **hangi π** ile yapılıyorsa o **`piHash`** karşılaştırmasında **tek authority** seçilir (aşağı §5 sonucu).

---

## 3. Mixed-π trace reconciliation

**Sorun:** Tek bir **artefakt** (birleşik log, birleşik graph, export paketi) içinde **farklı Eₖ**’lardan parçalar.

### 3.1 Bölümleme

- Artefakt **projection partition**’a ayrılır: `τ = τ₁ ⊔ τ₂ ⊔ …` her `τᵢ` tek `piHashᵢ` ile etiketlenir.  
- Etiket yoksa: **reconciliation deferred** — kabul **yok** veya yalnız **archival** mod (implementasyon politikası).

### 3.2 Hedef π altında birleştirme

- **Hedef** `piHash_target` seçilir (UCFC anlaşması veya okuyucu politikası).  
- Her `τᵢ` için:  
  - **NON_BREAKING** köprü varsa → doğrudan hedef epoch altında MK-1.  
  - **BREAKING** → **reprojection pipeline** (EBVM replay + πᵦ) veya reddedilen segment işareti.  
  - **INCOMPARABLE** → segment **non-authoritative** / dışarıda bırakılır.

### 3.3 MK-1 rolü

MK-1 **birleştirici** değil; **range enforcement**. Reconciliation **önce** governance kurallarıyla τ’yi tek π diline indirger; MK-1 yalnız **son gate**.

---

## 4. Epoch transition rules

### 4.1 Epoch tanımı

**Eₖ = (piHashₖ, effective_from, optional effective_to, mandatory_fieldsₖ)**

- **effective_from / to:** anlık zaman veya sürüm sırası (GDK ile hizalı olabilir; piEMS soyut kalır).  
- **mandatory_fieldsₖ:** trace / manifest’te π binding için zorunlu anahtarlar (ör. `piHash`, `projectionEpochId`).

### 4.2 Geçiş fazları

| Faz | Amaç |
|-----|------|
| **ANNOUNCE** | Yeni `piHash` + uyumluluk sınıfı yayınlanır. |
| **DUAL_READ** | Hem Eₖ hem Eₖ₊₁ kabul edilir; okuyucu **hangi π** ile doğruladığını bildirir. |
| **CUT_OVER** | Yeni üretim yalnız Eₖ₊₁. |
| **SUNSET_Eₖ** | Eₖ altında üretilmiş trace’ler için kabul penceresi kapanır (politika). |

### 4.2.1 CUT_OVER semantics (en riskli nokta)

**CUT_OVER anı** şu fenomeni doğurur: **aynı trace τ** (bayt olarak aynı artefakt), **farklı epoch / farklı `piHash_authority`** altında **MK-1 validity outcome’u farklı** olabilir (ör. Eₖ’te `VALID`, Eₖ₊₁’te `REJECT` veya tersi). Bu **execution nondeterminism** değildir; **governance change**’dir — ama dışarıdan bakınca “same input, different acceptance” **yanlışlıkla** gerçek bir bug gibi raporlanır.

**Zorunlu koruma (en az biri):**

1. **DUAL_READ devamı:** CUT_OVER sonrası bir süre **hem** Eₖ **hem** Eₖ₊₁ ile doğrulama **açıkça** desteklenir; sonuç **hangi π ile** üretildiğini bildirir (`piHash_trace` / `projectionEpochId`).  
2. **Explicit epoch label:** τ üzerinde **zorunlu** epoch bağlamı; MK-1 çağrısı **τ’nin kendi `piHash_trace`** (veya eşdeğeri) ile yapılır — motorun “şimdiki” `piHash_engine` ile **sessizce** üst üste bindirilmesi yasak.

Bunlardan biri yoksa sistem **deterministik ret** iddiasını bozmaz ama **gözlemlenebilirlik** bozulur: operasyon ekibi **epoch fragmentation** ve sahte “flaky validator” teşhisi üretir.

**İlişkili:** edge çiftleri ve tarihsel π altında kabul için [`PI_EMS_COMPAT_MATRIX_V1.md`](PI_EMS_COMPAT_MATRIX_V1.md).

### 4.3 World-model discontinuity önlemi

- Üretim tarafı: τ **mutlaka** üretim epoch’unu taşır (`piHash_trace` veya eşdeğeri).  
- Doğrulama: `piHash_trace` ile `piHash_engine` uyuşmazlığı **MK1_ERR_*** ailesinde **explicit** kod olmalıdır (implementasyon detayı MK-1.1+).  
- Amaç: sessiz “false negative” değil, **epoch boundary violation**’ın **görünür** olması.

---

## 5. UCFC negotiation protocol

**Amaç:** Policy split anında ([`MK1` §11.2](MK1_KERNEL_VALIDATOR_V0_1.md)) **debugging** yerine **governance çıktısı**: tek **projection authority** için anlaşılmış `piHash`.

### 5.1 Taraflar (mantıksal)

- **EBVM temsilcisi** — üretim ve replay geometrisi.  
- **GECS temsilcisi** — eşdeğerlik / kanon uzayı.  
- **Governance** — süre, sunset, uyumluluk sınıfı onayı.

### 5.2 Çıktı (binding)

Anlaşma çıktısı minimal olarak:

- **`piHash_agreed`**  
- **π spec referansı** (sürüm, URI veya iç repo yolu)  
- **effective_from** ve isteğe bağlı **sunset** önceki epoch için  
- **compat matrix** — normatif detay: [`PI_EMS_COMPAT_MATRIX_V1.md`](PI_EMS_COMPAT_MATRIX_V1.md) (§2.2 ile uyumlu özet)

### 5.3 Başarısızlık

Anlaşma yoksa: sistem **tek π** iddia etmez — **policy split** açık kalır; üretim **durdurulur** veya **dual-π** modunda explicit mod etiketi zorunlu (implementasyon). Sessiz tekilleştirme **yasak** (ontology drift gizlenemez).

---

## 6. İlişki tablosu (özet)

| piEMS bölümü | Soru |
|--------------|------|
| §2 | Yeni `piHash` eski trace’i **ne yapar**? |
| §3 | Karışık epoch’lu artefakt **nasıl** tek π’ye iner? |
| §4 | **Ne zaman** hangi epoch geçerli; kesim kuralları? |
| §5 | **Kim** `piHash`’i mühürler? |
| [Compat-1](PI_EMS_COMPAT_MATRIX_V1.md) | πᵢ↔πⱼ **hücreleri**, replay, tarihsel π |
| [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) | EBVM + MK-1 + M → **tek EvaluationOutcome** |
| [πEFC-Runtime-1.0](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) | Contextual determinism, decision cache, closure, sovereign **D**, Execution Algebra eşiği |
| [RBL-A1](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) | G1 kısıt sürümü (**GCS**), authority drift, DUAL_READ altında çoklu G1, **joint / stagger** epoch–authority kesimi |

---

## 7. Sonraki adımlar (repo)

1. **EMCS / trace şeması:** `piHash_trace`, `projectionEpochId` alanları.  
2. **MK-1:** `piHash` uyuşmazlığı için deterministik ret kodu; **tarihsel π** ile çağrı (compat matrisi ile).  
3. **[`PI_EMS_COMPAT_MATRIX_V1.md`](PI_EMS_COMPAT_MATRIX_V1.md):** πᵢ↔πⱼ uyumluluk matrisi, cross-epoch replay validity, backward interpretability — **olmadan** sistem güçlü kalır ama **epoch fragmentation** riski taşıyan dağıtık anlam yüzeyine döner.  
4. **[`PI_INDEXED_EVALUATION_CONTRACT_V1.md`](PI_INDEXED_EVALUATION_CONTRACT_V1.md) (piEFC-1):** **olmadan** MK-1 ayrı, Compat-1 analitik kalır; **runtime birleşik karar** üretilemez.  
5. **[`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md):** contextual determinism, decision cache, MK-1 closure, Execution Algebra yükümlülükleri.  
6. **piEMS-1.1:** NON_BREAKING için zorunlu **regresyon vektörü** formatı.

---

*piEMS-1 — π Evolution & Migration Semantics; PCEK zaman ekseni; semantic migration layer.*
