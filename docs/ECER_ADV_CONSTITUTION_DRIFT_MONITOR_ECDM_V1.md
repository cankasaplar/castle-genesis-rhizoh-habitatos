# ECER-ADV — Epistemic Constitution Drift Monitor (ECDM-1)

**Rol:** [EBE-1](ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md) `β` ve epistemik politika uzayını **evriltir**; oysa **bootable kernel** ve **yönetişim sözleşmeleri** ([PCEK-1](PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md), [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md), [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md)) **frozen** veya **yavaş** değişen normatif çekirdekler olarak kalır. **ECDM-1**, bu ikilikten doğan **governance vs evolution tension**’ı **ölçer**, **raporlar** ve **çatışma sınıflandırması** üretir — *anayasa sapması* ile *meşru bütçe evrimi* ayrımı.

**Sürüm:** ECER-ADV-ECDM-1  
**Durum:** `NORMATIVE_TARGET` — monitör implementasyonu **sonraki faz**; kavram çerçevesi ve ECDM-I* **şekil** bağlar.  
**Önkoşul:** [EBE-1](ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [CGR-1](CGR_1_CONSTITUTIONALLY_GOVERNABLE_RUNTIME_V1.md)  
**İlişkili:** [LOOP-1](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md) · [EBL-1.1](ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md) · [**TLS-1.1**](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md) · [**TLOA-1**](ECER_ADV_TRILAYER_OBSERVABLE_ARTIFACT_TLOA_1.md) · [**TTA-1**](ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md)

---

## 0. Problem önermesi

| Katman | Tipik durum |
|--------|-------------|
| **EBE / LOOP** | Hızlı geri bildirim, `β` ve gap işleme politikası **evrilebilir** |
| **PCEK / PAG / πEFC** | **Frozen** milestone veya **CUT_OVER** ile bağlı sözleşmeler |

**Gerilim:** EBE önerilen güncelleme, donmuş çekirdek ile **uyumsuz** olabilir (ör. πEFC kapalı ret kümesini genişletme iddiası; PAG yaşam döngüsü olmadan bundle alanı ekleme).

### 0.1 Legitimacy bottleneck collapse

| ECDM kalibrasyonu | Sonuç |
|-------------------|--------|
| **Çok güçlü** (her şeyi anayasal sapma sayma eğilimi) | **EBE evrim yapamaz** — sistem **freeze**’e yaklaşır. |
| **Çok zayıf** | **Drift kontrolsüz** — çekirdek ile politika ayrışır. |

**Yöneltme:** [TLS-1.1](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md) — **EBE–EBL–ECDM** denge bölgesi ve `BottleneckFreeze` göstergesi.

---

## 1. ECDM görevi

1. **Drift sinyali:** Çalışma zamanı / politika evrimi ile **normatif çekirdek** arasındaki **farkın** ölçümü (versiyon, manifest, guardian seal, `piEfcCode` dağılımı).  
2. **Sınıflandırma:**  
   - **CONSTITUTIONAL_DRIFT** — çekirdek değişikliği veya ihlal riski; PAG / PCEK süreci gerekir.  
   - **POLICY_EVOLUTION_OK** — EBE-I0 triangulation altında meşru `β` evrimi.  
   - **AMBIGUOUS** — ECDM tam rapor + insan / council kararı.  
3. **Rapor artefaktı:** Denetim için **traceable** çıktı (MCE / ledger ile beslenebilir).

---

## 2. ECDM-I0 (özet)

**ECDM-I0:** Hiçbir otomatik EBE adımı, **açıkça işaretlenmiş** constitutional uyum kontrolü olmadan **PCEK / PAG / πEFC ihlali** sayılabilecek alanı **sessizce** genişletemez.

---

## 3. CLEOS v2 içinde yer

ECDM, **EBE** ile **frozen governance** arasında **denetim köprüsü** — *Epistemic governance + evolution stack*’in anayasal yüzü.

---

## 4. Sonraki repo adımları

1. Versiyon manifestleri + EBE önerisi **diff** şeması.  
2. `ecerConstitutionDriftReport.mjs` (veya eşdeğer) — kapalı sınıf çıktısı.  
3. PAG **CUT_OVER** ile ECDM olaylarının hizalanması.  
4. **Kalibrasyon:** TLS-1.1 `BottleneckFreeze` / false positive oranı — ECDM eşikleri.

---

**Mühür (ECDM-1):**

> **Evolution moves the budget; the constitution names what may not move unwitnessed.**

---

*ECER-ADV ECDM-1 — governance vs evolution tension; constitutional drift monitor.*
