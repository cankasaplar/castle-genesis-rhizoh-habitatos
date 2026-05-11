# ECER-ADV — Self-Generating Loop Spec v1 (LOOP-1)

**Rol:** [ECER-ADV-META-1.1](ECER_ADVERSARIAL_META_ADV_1_1.md) eksen matrisi ve [`ecer-adv-suggest`](../scripts/ecerAdversarialSynthetic.mjs) çıktısını, **yalnızca coverage sayımı** olmaktan çıkarıp **epistemik boşluk → sentetik kısıt → manifold kapanış ölçümü** döngüsüne bağlar. Bu belge **öz-üretim döngüsünün** üç çekirdek katmanını, **Epistemic Hunter Mode**’u, **Ontological Safety Rule**’u ve bir sonraki kırılmayı **Gap Prioritization Function (GPF)** olarak sabitler.

**Sürüm:** ECER-ADV-LOOP-1  
**Durum:** `NORMATIVE_TARGET` — EGK/SCG/MCE tam implementasyon **fazlı**; GPF v0 **parametre açık**.  
**Önkoşul:** [ECER-ADV-1](ECER_ADVERSARIAL_FIXTURE_SUITE_V1.md) · [ECER-ADV-META-1.1](ECER_ADVERSARIAL_META_ADV_1_1.md) · [RBL-1](RBL_1_REALITY_BRIDGE_LAYER_V1.md) · [RBL-D1](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) · [RBL-G1](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) · [RBL-A1](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [MK-1](MK1_KERNEL_VALIDATOR_V0_1.md) · [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md)  
**İlişkili:** [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) · [`ecerAdversarialMetaHarness.mjs`](../scripts/ecerAdversarialMetaHarness.mjs) · [**LOOP-1.1 EBL**](ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md) · [**TLS-1.1**](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md) · [**TLOA-1**](ECER_ADV_TRILAYER_OBSERVABLE_ARTIFACT_TLOA_1.md) · [**TTA-1**](ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md) · [**TTA-1.1 (TACS / EPSC)**](ECER_ADV_TTA_1_1_TRANSITION_ALGEBRA_CLOSURE.md) · [**HOGA-1**](ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md) · [**Rhizoh × Castle framing**](RHIZOH_CASTLE_CIVILIZATION_FRAMING.md) (ürün / PRN) · [**Epistemic infrastructure / enterprise**](RHIZOH_EPISTEMIC_INFRASTRUCTURE_ENTERPRISE.md) · [**Product phases A→E**](RHIZOH_PRODUCT_PHASES_A_THROUGH_E.md) · [**RHIZOH FREEZE-0**](RHIZOH_FREEZE_0.md) · [**Companion Reference Journey**](RHIZOH_COMPANION_REFERENCE_JOURNEY.md) · [**Castle Node Runtime**](CASTLE_NODE_RUNTIME_MODEL.md) · [**UI Language**](RHIZOH_UI_LANGUAGE_GUIDE.md) · [**Embodied Product Reality + UX gate**](RHIZOH_EMBODIED_PRODUCT_REALITY.md) · [**Reference implementations**](RHIZOH_REFERENCE_IMPLEMENTATIONS.md) · [**Implementation map (client)**](RHIZOH_IMPLEMENTATION_MAP.md)

---

## 0. Konumlandırma: ne değişti?

| Önceki çerçeve | LOOP-1 çerçevesi |
|----------------|------------------|
| CI = doğrulama sistemi | CI = **kapanış manifoldu** üzerinde ölçüm + **rezidüel boşluk** raporu |
| Coverage = sayaç | Coverage = **epistemik topoloji haritası** (𝒟 × eksen × gözlemlenebilirlik) |
| Test = örnek vaka | Test = **gerçeklik probu** (RBL’e bağlı τ uzayı) |
| Failure = kırmızı bayrak | Failure = **üretken sinyal** (bir sonraki SCG girdisi) |

**Önerme (motto):** *Eksik test yoktur — modellenmemiş gerçeklik vardır.*  
Anlam: boşluk, yalnız “henüz yazılmamış assert” değil; **gözlenen davranış** ile **model tahmini** arasındaki **yapılandırılmış fark** olarak okunur.

---

## 1. Katman I — Epistemic Gap Kernel (EGK)

**Girdi (minimal):**

- `𝒟` ∈ `DIVERGENCE_CLASS` (RBL-D1 yüzeyi)  
- `α` ∈ `{ WITNESS, AUTHORITY, EPOCH }` (ADV ekseni)  
- `δ_w` — *witness deficiency* özeti: τ’nin RBL mührü / bağlamı / konsensüs artefaktı ile ilgili **eksiklik vektörü** (ör. boş `witnessSet`, uyumsuz `observedAt`, çoklu kök taahhüdü yok)

**Çıktı:** `MissingDimensionID` — kapalı bir kimlik (hash veya kayıtlı enum genişlemesi); aynı üçlü `(𝒟, α, δ_w)` tekrar üretilmezse aynı ID.

**Gap tanımı (kritik fark):**

```text
gap := ⟨ model_prediction(trace_slice), observed_runtime_outcome(trace_slice) ⟩
     projected onto (𝒟, α, δ_w)
```

- **Coverage eksikliği**, gap’in *bir projeksiyonudur* — gap’in tamamı değildir.  
- **Gerçek sistem davranışı**: yalnız **observe edilen** τ / witness / gate çıktıları üzerinden temsil edilir (aşağı §4 OSR).

**EGK-I1 (closure):** Her gap kaydı en az bir **executable trace anchor** (τ veya mühürlenebilir artefakt kökü) ile ilişkilendirilmelidir; ilişkisiz gap **geçersiz** (OSR ile uyum).

---

## 2. Katman II — Synthetic Constraint Generator (SCG)

**Girdi:** `MissingDimensionID` + EGK üçlüsü + (isteğe bağlı) mevcut `coverage matrix`.

**Çıktı (normatif alan):**

| Alan | Anlam |
|------|--------|
| `minimal_witness_mutation` | En küçük RBL-izinli witness perturbasyonu |
| `minimal_authority_drift` | En küçük bundle / closure alan kayması |
| `minimal_epoch_shift` | En küçük epoch / dual-read / matris hücre değişimi |
| `required_real_fixture_binding` | **Zorunlu** — hangi repo fixture / τ şablonu / seed ile çalıştırılacağı |

**SCG-I1 (executable trace target — kritik):**  
*No synthetic constraint without executable trace target.*  
Sentetik kısıt üretimi, **çalıştırılabilir τ hedefi** (veya ondan türeyen bağlama) olmadan yasaktır. “Saf metin öneri” yalnız **taslak** sayılır; LOOP-1 kapanışına girmez.

**SCG-I2:** Çıktı, [ADV-META öneri formatına](ECER_ADVERSARIAL_META_ADV_1_1.md) uyumlu olmalı; `required_real_fixture_binding` alanı ile genişler.

---

## 3. Katman III — Manifold Closure Evaluator (MCE)

**Girdi:**

- Doğrulanmış `coverage matrix` (registry)  
- SCG’den gelen **synthetic additions** (yeni doğrulanmış hücreler + başarısız denemelerin ret kodları)

**Çıktı (binary pass/fail üstüne):**

| Çıktı | Anlam |
|--------|--------|
| **Convergence curve** | Zaman veya iterasyon ekseninde “kapalı hücre oranı” / “rezidü normu” eğrisi |
| **Residual gap set** | Hâlâ EGK tarafından tanımlı ve OSR-uyumlu kalan `MissingDimensionID` kümesi |
| **Instability regions** | Aynı minimal mutasyonda **gate sınıfı dalgalanması** (ör. seed / ortam değişince farklı `MK1_ERR` ailesi) — topolojide “ince bölge” |

**MCE-I1:** Rapor, en az bir **skaler özet** + **rezidü listesi** üretir; yalnız “fail” stringi yeterli değildir.

**MCE-I2:** *Stability topology* — öncelik, tek noktada yeşil/kırmızı değil; komşu hücrelerin ve tekrar koşumların **türevi** (instability) kayıt altına alınır.

---

## 4. Epistemic Hunter Mode

**Tanım:** Sistem, yalnızca **ileri test planı** (forward testing) veya **coverage tamamlama** listesi üretmez; **proaktif gap discovery** yapar: observe edilen uzayda yeni `MissingDimensionID` önerir.

**Kısıt:** Hunter, OSR (§5) dışına çıkamaz.

---

## 5. Ontological Safety Rule (OSR) — normatif

**OSR-1 (gözlemlenebilir uzay):** Gap üretimi ve SCG, **yalnızca observe edilen trace space** üzerinde çalışır: mühürlü veya mühürlenebilir [RBL-1](RBL_1_REALITY_BRIDGE_LAYER_V1.md) artefakt zinciri, mevcut τ korpusu, veya kayıtlı gate çıktıları.

**OSR-2 (yasak):** **Pure imagination gap** — RBL bağlama / τ anchor olmadan üretilen “varsayımsal çelişki” — LOOP-1’de **yasaktır**. Amaç: *hallucinated constraint explosion*’ı engellemek.

**OSR-3:** İhlal tespiti: `required_real_fixture_binding` boş veya sahte τ hash → üretim **DISCARD**, CI’de ayrı ret sınıfı (ileride: `LOOP_ERR_ONTOLOGY_UNBOUND`).

---

## 6. Gap Prioritization Function (GPF) — v0 çerçeve (sonraki kırılma)

**Problem:** Boşluk üretimi sonsuza yakınsayabilir; **hangi gap önce kapatılır?**

**GPF v0 girdileri (hedef):**

| Girdi | Rol |
|--------|-----|
| `Residual gap set` | EGK çıktısı |
| Gate **ağırlıkları** | RBL / PAG / MK-1(πEFC) etkisi — örn. üretim yüzeyine yakınlık |
| **Epistemic importance** skoru | τ hacmi, tekrar sıklığı, dissent varlığı, guardian freeze riski (normatif ağırlık tablosu — v1 parametre) |
| **Instability** etiketi | MCE’den; yüksek dalgalanma → öncelik veya kasıtlı erteleme (politika seçimi) |

**GPF v0 çıktısı:** Sıralı `MissingDimensionID[]` + gerekçe vektörü (audit için).

**GPF-I1:** Öncelik fonksiyonu **kapalı** bir skor kümesinden seçilir; runtime yeni skor icat etmez (MK-1 / πEFC ret closure ile aynı felsefe).

**GPF-I2 (açık parametre):** Önem **ağırlıkları** operasyonel politika belgesinde sabitlenir; bu belge yalnız **şekli** bağlar. **Kaynak tavanları** (compute / τ / witness / CI) ayrıca [LOOP-1.1 EBL](ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md) ile bağlanır.

---

## 6.1 Devam — LOOP-1.1: Epistemic Budgeting Layer (EBL)

**Soru:** Tüm gap’ler doğru olsa bile **bütçe sınırlı** — hangi gerçeklik alanına enerji harcanacak?  
**Normatif spec:** [ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md](ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md) — `β` vektörü, `ℛₖ` tahsisi, GPF kuyruğunun **prefix** kesimi, denetim `ledger`. *Epistemic economics* katmanı.

---

## 7. Mevcut repo eşlemesi

| LOOP-1 kavramı | Bugünkü somut karşılık |
|------------------|-------------------------|
| EGK (kısmi) | `listMissingCells` + registry; genişleme: gözlemlenen τ ile gap farkı |
| SCG (kısmi) | `ecerAdversarialSynthetic.mjs` + `suggest` — **SCG-I1** için `required_real_fixture_binding` zorunluluğu sonraki patch |
| MCE (yok / stub) | `ecer-adv-check` ikili; MCE raporu **sonraki faz** |
| OSR | Bu belge §5; kodda `LOOP_ERR_*` / binding doğrulaması **sonraki faz** |
| GPF | Bu belge §6; sıralı öncelik implementasyonu (ağırlık tablosu açık) |
| EBL (LOOP-1.1) | [ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md](ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md) · [`ecerEpistemicBudget.mjs`](../scripts/ecerEpistemicBudget.mjs) |

---

## 8. Sonraki repo adımları

1. SCG çıktı şemasına `required_real_fixture_binding` + τ anchor hash alanları.  
2. `ecerAdversarialMetaHarness.mjs` **report** modu: rezidü + kapalı hücre oranı (MCE v0).  
3. GPF v0: sabit ağırlık tablosu + sıralı çıktı.  
4. OSR: boş anchor → discard + log.  
5. EBL: `β_cap` enjeksiyonu + GPF çıktısına `allocateEpistemicBudgetPrefix` veya çok boyutlu tüketim modeli.  
6. **ERGS / CLEOS** çerçevesi ve EBL invariant’ları: [ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md](ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md).  
7. **EBE-1** (bütçe evrimi · **EBE-I0** triangulation): [ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md](ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md).  
8. **ECDM-1** (anayasa sapması monitörü): [ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md](ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md).  
9. **TLS-1.1** (EBE–EBL–ECDM denge · EBE-1.1): [ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md).

---

**Mühür (LOOP-1):**

> **The loop hunts gaps only where reality left footprints.**

---

*ECER-ADV-SELF-GENERATING LOOP SPEC v1 — EGK / SCG / MCE; Hunter Mode; OSR; GPF v0 frame.*
