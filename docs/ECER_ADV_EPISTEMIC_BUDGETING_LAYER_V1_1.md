# ECER-ADV — Epistemic Budgeting Layer v1.1 (EBL / LOOP-1.1)

**Rol:** [LOOP-1](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md) altında **GPF** sıralı boşluk üretir; **EBL** ise şu kaçınılmaz soruyu yanıtlar: *tüm gap’ler epistemik olarak “doğru” olsa bile **compute / trace / witness** bütçesi sınırlıdır — **hangi gerçeklik alanına enerji harcanacak?* Bu katman mühendislik-only değil: **epistemic economics** ve **Epistemic Resource Governance** kontrol düzlemidir.

**Sürüm:** ECER-ADV-EBL-1.1 (LOOP-1.1)  
**Durum:** `NORMATIVE_TARGET` — bütçe vektörü ve tahsis kuralları operasyonel politikada parametrelenir; bu belge **şekil + invariant + mimari kimlik** bağlar.  
**Önkoşul:** [LOOP-1](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md) (EGK · SCG · MCE · OSR · **GPF**) · [ECER-ADV-META-1.1](ECER_ADVERSARIAL_META_ADV_1_1.md) · [OSR](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md#5-ontological-safety-rule-osr--normatif)  
**İlişkili:** [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [MK-1](MK1_KERNEL_VALIDATOR_V0_1.md) · [EBE-1](ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md) · [ECDM-1](ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md) · [**TLS-1.1**](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md) · [**TLOA-1**](ECER_ADV_TRILAYER_OBSERVABLE_ARTIFACT_TLOA_1.md) · [**TTA-1**](ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md)

---

## 0. GPF vs EBL — mimari ayrım (resmileştirme)

| Katman | Fonksiyon tipi | Soru | Ürettiği şey |
|--------|----------------|------|----------------|
| **GPF** | **Ordering function** | “Hangi gap **daha önemli**?” | **Epistemic relevance** sırası — *epistemik düşünce* (öncelik kuyruğu) |
| **EBL** | **Execution constraint function** | “Hangi gap **gerçekten işlenecek**?” | **Epistemic reality allocation** — *epistemik dünyayı kesme* (aktif dilim) |

**Özet cümle:** GPF **düşünceyi** sıralar; EBL **dünyayı** (çalıştırılabilir gerçeklik dilimini) keser. Sistem **her şeyi modelleyebilir**; EBL olmadan **hepsini çalıştırmaya** teşebbüs etmez — bütçe **yürütme hakkı** verir veya vermez.

---

## 0.1 Epistemic Budget = Reality Shaping Limit

**Bütçe** yalnız şunlardan biri değildir; **hepsinin birleşik üst sınırıdır:**

- yalnız compute  
- yalnız τ trace kapasitesi  
- yalnız witness işlemi  

**Normatif okuma:** `β`, *hangi gerçeklik katmanının bu koşumda **var olmasına** (execute / kapat / topolojiye yazılmasına) **izin verildiği*** üst sınırını temsil eder. Yani bütçe = **reality shaping limit** — *active reality slice* hacmi.

---

## 1. Bütçe boyutları (kapalı eksen)

| Boyut | Sembol | Örnek ölçüm |
|--------|--------|-------------|
| **Compute** | `β_C` | CPU-zaman, EBVM adımı, hash sayısı |
| **Trace corpus** | `β_τ` | Yeni / replay τ sayısı, artefakt baytı |
| **Witness operations** | `β_W` | `sealWitnessArtifact` / bind / doğrulama |
| **CI wall-clock** | `β_I` | Pipeline süre tavanı |

`β = (β_C, β_τ, β_W, β_I)` — birimler operasyonel politikada sabitlenir.

---

## 2. Gerçeklik alanı (`ℛₖ`)

**Tanım:** *Gerçeklik alanı* `ℛₖ`, OSR-uyumlu **gözlemlenmiş** veya **anchor’lanmış** τ ailesi + ilgili gate bandı (RBL / PAG / πEFC) ile indekslenir.

**EBL:** GPF kuyruğundaki her `MissingDimensionID` bir `ℛₖ`’ye projekte edilir; `β` altında hangi `ℛₖ` diliminin **aktif** kalacağı seçilir.

---

## 3. Tahsis (EBL-core)

**Girdi:** `Q` (GPF sırası), `β_cap`, isteğe bağlı `domain_weights`.  
**Çıktı:** `A` (izinli gap’ler), `D` (ertelenenler), `ledger` (tüketim + gerekçe).

---

## 4. EBL invariant’ları (mimari yorum)

**EBL-I1 — Budget pre-known**  
Bütçe üst sınırı koşum **başlamadan** bilinir (veya kapalı tablodan gelir). **Runtime sırasında epistemik sürpriz** (sınırsız genişleme) yok; tahsis **deterministik** politika altında tekrarlanabilir.

**EBL-I2 — Importance ≠ execution right**  
Yüksek GPF sırası, **bütçe tavanını aşmak için yürütme hakkı vermez.** *Önemli* gap bile `β` tükendiyeyse **ertelenir** veya sonraki pencereye düşer. (Not: Bu, [OSR](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md#5-ontological-safety-rule-osr--normatif) ile karıştırılmamalıdır: OSR anchor’sız gap’i **diskalifiye** eder; EBL-I2, anchor’lu ve geçerli gap’lerde **önceliğin maliyeti aşamayacağını** söyler.)

**EBL-I3 — Deferral discipline**  
Tükenen bütçe sonucu kuyruk kesimi **hata değil** planlı **deferral**’dır. Sistemde “çözülmeyen gap yok” iddiası yerine, **ertelenmiş gap** (gelecek **epistemik borç**) kavramı kullanılır; `DEFERRED_BUDGET_CAP` vb. ile raporlanır.

**EBL-I4 — Prefix discipline**  
Yürütme kümesi `A`, `Q`’nun **prefix** alt kümesidir (veya politika onaylı tek blok atlaması — gerekçe **ledger**’da). *Tam çözüm seti* değil **aktif reality slice** çalıştırılır; bu yapı sistemi **streaming epistemic engine** moduna uygun kılar.

**EBL-I5 — Ledger consistency**  
Bütçe tahsisi **izlenebilir karar artefaktı** üretir: `{ gapId, ℛₖ, consumed_β_slice, deferred_reason? }` + özet `ledger`. **Bütçe kararı da karar verisidir** (audit / MCE girdisi).

**OSR köprüsü (EBL ∩ LOOP-1):** Anchor’sız veya OSR-2 ihlali gap **bütçe ile “kurtarılamaz”** — doğrudan **discard**; öncelik sırası uygulanmaz.

---

## 5. Kapalı döngü boru hattı (LOOP-1.1 gerçeği)

```text
trace
  → EGK (gap discovery)
  → GPF (priority ordering)
  → EBL (budget slicing)
  → SCG (constraint synthesis)
  → MCE (topology update)
  → loop
```

---

## 6. Mimari kimlik: ERGS ve CLEOS

Bu yığın yalnız **CI**, yalnız **test framework** veya yalnız **adversarial suite** değildir; birleşik işlev:

- **Epistemic Resource Governance System (ERGS)** — sınırlı epistemik kaynakların **yönetişimi**.  
- **Closed-loop Epistemic Operating System (CLEOS):**  
  - **CLEOS v1** — RBL → τ → D1/R1 → ECER → LOOP-1 → GPF → **EBL** (statik/tabanlı `β`).  
  - **CLEOS v2** — aynı yığın + **[EBE-1](ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md)** (`β` **kurallı evrimi**) + **[ECDM-1](ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md)** (anayasal sapma monitörü).  

**Stack kimliği (özet):** *Epistemic governance + evolution stack* — test framework / CI pipeline değil.

**Kritik dönüşüm:** Soru artık yalnız “sistem **neyi bilebilir**?” değil; “sistem **neyi bilmeyi seçebilir**?” (bütçe ve öncelik altında).

---

## 7. Yığın özeti (referans)

| Katman | Rol |
|--------|-----|
| **RBL** | Reality sensing |
| **τ** | Epistemic memory graph |
| **D1 / R1** | Divergence / resolution |
| **ECER** | Adversarial completeness |
| **LOOP-1** | Self-generating gap engine |
| **GPF** | Epistemic prioritization |
| **EBL** | Epistemic economy / control plane |
| **EBE** | Epistemic policy evolution (`β`) — [EBE-1](ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md) |
| **ECDM** | Constitution drift vs evolution — [ECDM-1](ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md) |

---

## 8. Risk analizi (mimari dürüstlük)

| Risk | Belirti | Yöneltme |
|------|---------|----------|
| **Epistemic starvation** | EBL çok agresif → bazı gap **sınıfları** sürekli ertelenir | **Minimum exposure constraint** (gelecek katman; sınıf başına alt sınır penceresi) |
| **Budget bias drift** | EBL fiilen GPF’i **override** eder; “önemli ama pahalı” gap’ler **yok olur** | **GPF–EBL coupling audit** + stabilite ölçütü (formal sonraki adım) |
| **Epistemic Feedback Autocracy** | MCE → EBE → EBL → ölçüm güçlenir; **self-reinforcing bias** | **EBE-I0** — `β` evriminde **triangulation** (GPF + MCE + drift); tek kanal yasak — [EBE-1 §2–3](ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md) |

---

## 9. MCE bağlantısı

Convergence eğrisi, rezidü kümesinde **bütçe** vs **önem** ayrımı, instabilite bölgelerinde maliyet — [LOOP-1 MCE](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md#3-katman-iii--manifold-closure-evaluator-mce).

---

## 10. Programatik kanca (v0)

[`ecerEpistemicBudget.mjs`](../scripts/ecerEpistemicBudget.mjs) — `BUDGET_DIMENSION`, `allocateEpistemicBudgetPrefix`, sürüm sabiti.

---

## 11. Sonraki adımlar

1. Operasyonel `β_cap` enjeksiyonu + `DEFERRED_BUDGET_CAP` meta kodu.  
2. **GPF–EBL coupling stability** — denetim ve teorem / politika (LOOP-1.2).  
3. **EBE-1** — `β` evrimi; **EBE-I0**: [ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md](ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md).  
4. **ECDM-1** — frozen vs evrim: [ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md](ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md).  
5. **TLS-1.1** — EBE–EBL–ECDM denge: [ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md).

---

**Mühür (EBL / LOOP-1.1):**

> **Priority tells you what matters; budget tells you what you can afford to know.**

---

*ECER-ADV Epistemic Budgeting Layer v1.1 — GPF orders thought; EBL cuts executable reality; ERGS / CLEOS v1–v2.*
