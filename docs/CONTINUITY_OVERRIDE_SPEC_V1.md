# Continuity Override Spec v1

**Durum:** `GOVERNANCE_SPEC` — karar topolojisi ve insan kapısı eşikleri. **Yürütme motoru değildir**; runtime’da otomatik uygulanacak policy değildir.  
**İlişkili ölçüm:** `operationalContinuityProbeV1`, `buildContinuityConfidenceV1`, `continuityAssessmentExportV1`, RRHP persistent slice, RCIL reconcile.  
**Ölçüm (FIDF):** [FIELD_IMPRINT_DECAY_FIDF_V1.md](FIELD_IMPRINT_DECAY_FIDF_V1.md). **Anlam ataması:** [EPISTEMIC_SCAR_POLICY_V1.md](EPISTEMIC_SCAR_POLICY_V1.md) (policy-to-action distance ve drift koruması: aynı dosyada §4). **Zincir gözlemi:** [POLICY_AUDIT_SCHEMA_V1.md](POLICY_AUDIT_SCHEMA_V1.md).

---

## 1. Epistemik sınır

- Bu matrix **“aynı varlık / kimlik doğrulaması”** yapmaz.
- **“false continuity”** (tanıdık his + yanlış yön) riskini **etiketlemek ve insan onayına yönlendirmek** içindir.
- Çıktılar **yetki önerisi**dir; üretimde eylem ancak açık insan / üst politika kapısı ile bağlanır.

---

## 2. Varsayılanın revizyonu

| Klasik varsayım | Bu spec |
|-----------------|--------|
| Süreklilik daima iyidir | Süreklilik **çoğu zaman** iyidir; **bazı drift koşullarında sürekliliği kırmak** iyidir |

Soru çifti:

1. Tutarlı mı kalmalıyım? (`allow` / `soft_drift`)
2. Tutarlılığı **kaslıtlı** kırmalı mıyım? (`force_break` / `human_gate`)

---

## 3. Girdi sinyalleri (matrix girişleri)

| Alan | Kaynak | Not |
|------|--------|-----|
| `primaryDriftClass` | Probe drift taxonomy | Yoksa `null` |
| `driftClasses[]` | Probe | Çoklu etiket |
| `confidence.band` | `high` / `medium` / `low` / `unknown` | **Band tek başına yeterli değil** |
| `confidence.aggregate` | `0…1` veya `null` | `null` = withhold, ceza değil |
| `confidence.fingerprintComparable` | Probe üzerinden | Eksen yoksa `false` |
| `confidence.regressionPenaltyApplied` | RRHP regresyon cezası | |
| `operationalTailOverlap` | Probe | |
| `overlapRatio` | Probe | |
| `projection_regressed` | `driftClasses` içinde | Ağır sinyal |
| `operational_gap` | `driftClasses` içinde | |
| `fingerprint_divergence` | `driftClasses` içinde | |
| `tail_reordered` | `driftClasses` içinde | |
| `tail_partial_only` | `driftClasses` içinde | |

İnsan kapısı için (matrix dışı, operasyonel):

- Ürün / güven ekibi onayı gereken değişiklik sınıfı  
- Yasal / finansal / güvenlik sınıfı olaylar (harici politika)

---

## 4. Çıktı modları (yetki dağılımı)

| Mod | Anlamı |
|-----|--------|
| `allow_continuity` | Mevcut reconcile + projection + persist hattı **devam**; ek müdahale yok. |
| `soft_drift_accept` | Drift **kabul edilebilir**; izleme sıklaştır, rapor üret, **zorunlu kırma yok**. |
| `request_human_gate` | Otomatik karar **yetersiz** veya **riskli**; insan / üst politika onayı zorunlu. |
| `force_continuity_break` | Süreklilik **bilinçli kesilmeli** (ör. yanlış attractor, regresyon, güvenlik ihlali şüphesi). |

---

## 5. CONTINUITY OVERRIDE MATRIX (özet kurallar)

Aşağıdaki satırlar **öncelik sırası** ile okunur: üstteki eşleşme kazanır (ilk eşleşen çıktı).

| # | Koşul (özet) | Çıktı |
|---|----------------|--------|
| 1 | `projection_regressed` **veya** (`confidence.regressionPenaltyApplied` **ve** `primaryDriftClass === projection_regressed`) | `force_continuity_break` |
| 2 | `operational_gap` **ve** `confidence.band !== "high"` | `request_human_gate` |
| 3 | `fingerprint_divergence` **ve** `fingerprintComparable === true` **ve** `confidence.band === "low"` | `request_human_gate` |
| 4 | `tail_reordered` **ve** `operationalTailOverlap >= 1` | `request_human_gate` |
| 5 | `tail_partial_only` **ve** `confidence.band === "unknown"` **ve** `confidence.aggregate == null` | `request_human_gate` |
| 6 | Yalnız `non_comparable` (tek sınıf) **ve** `aggregate == null` | `request_human_gate` *(belirsizlik — cezalandırma değil, insan seçimi)* |
| 7 | `confidence.band === "high"` **ve** `driftClasses` boş **veya** yalnız hafif sınıflar yok | `allow_continuity` |
| 8 | `confidence.band === "medium"` **ve** `tail_partial_only` / düşük overlap | `soft_drift_accept` |
| 9 | `confidence.band === "low"` **ve** `primaryDriftClass` yok veya `fingerprint_divergence` değil | `soft_drift_accept` |
| 10 | Diğer tüm kombinasyonlar | `request_human_gate` |

**“False continuity” erken uyarısı (matrix’e sığmayan sezgisel kural):**  
`confidence.band === "high"` **ama** `fingerprint_divergence` **veya** `tail_reordered` **veya** (`tail_partial_only` **ve** düşük `overlapRatio`) → **varsayılan `request_human_gate`** (yüksek band ≠ ontoloji; çelişkili sinyal).

---

## 6. Uygulama disiplini

1. **Önce** `runOperationalContinuityProbeV1` + `confidence` + Markdown rapor (`continuity:probe-report`).  
2. **Sonra** bu matrix ile mod seçimi (insan / runbook).  
3. **Kod ile otomatik `force_continuity_break`** ancak ayrı bir **onaylı** ürün kararı ve güvenlik incelemesi sonrası bağlanır.

---

## 7. Özet cümle

**Alignment burada policy enforcement değil; continuity interruption governance önerisidir.**  
En zor soru artık “çalıştı mı?” değil — **“ne zaman çalışmayı / sürekliliği bilinçli kesmeliyim?”**
