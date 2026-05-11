# Rhizoh — Runtime Determinism Validation Harness (RDVH) (V1)

**Kısaltma:** **RDVH** (*Runtime Determinism Validation Harness*).

**Rol:** [RCIL](RHIZOH_RUNTIME_CONTRACTS_IMPLEMENTATION_LAYER_RCIL_V1.md) ve [IRE-1](RHIZOH_IDENTITY_RUNTIME_ENGINE_IRE1_BLUEPRINT_V1.md) altında iddia edilen **deterministik dağıtık kimlik icrasını** — replay · tutarlılık · stres · sapma — **ölçülebilir ve tekrarlanabilir** şekilde **doğrulayan** harness. Bu belge **ürün test planı** değil; **mimari doğrulama aracı** sözleşmesidir.

**Durum:** `IMPLEMENTATION_OPEN` — script / CI / çok-node simülasyon; [IFL](RHIZOH_INSTANTIATION_FIDELITY_LAYER_V1.md) stress eksenleri ile **hizalanır**.

**Production gap:** harness **tanımlıdır**; **production load** altında **gerçek ağ** chaos / partition / race ile doğrulama ayrı sprint konusudur — **[RCIL Live Wiring Sprint §1](RHIZOH_RCIL_LIVE_WIRING_SPRINT_V1.md)** ([DRAS §18.15](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md)).

**Üst okuma:** [DRAS §18.6–18.14](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) · [RCIL §6](RHIZOH_RUNTIME_CONTRACTS_IMPLEMENTATION_LAYER_RCIL_V1.md) · [PoCL](RHIZOH_PROOF_OF_CONSISTENCY_LAYER_POCL_V1.md) · [FCTS](RHIZOH_FULL_CONSISTENCY_THEOREM_SYSTEM_FCTS_V1.md) · [MCF-1](RHIZOH_META_CONSISTENCY_FRAMEWORK_MCF1_V1.md).

---

## 1. Soru (tek cümle)

*Aynı dağıtık koşul altında identity runtime **her seferinde aynı karar sırasını** üretiyor mu — ve partition / chaos sonrası **kimlik sapması** nerede başlıyor?*

---

## 2. Zorunlu dört modül

| Modül | Görev |
|--------|--------|
| **Distributed replay tester** | Kayıtlı veya sentetik **event şeması** ile çok-node yürütümü **yeniden oynatır**; sıra · saat · kesinti modeli sabitken **karar izi** (identity transitions + seals) birebir eşleşmelidir. |
| **Cross-node consistency verifier** | Aynı anlık veya aynı epoch’ta düğümlerin **IBT temsil** · **GCSB sınıf** · **EAERT denklik** görünümlerinin **tutarlılık invariant’larını** doğrular (RCIL sütun **5** ile aynı aile). |
| **Chaos / partition stress executor** | Ağ bölünmesi · mesaj gecikmesi · kayıp · sıra bozulması enjekte eder; motor **graceful degrade** veya **interrupt** yoluna girmeli; sessiz sapma **başarısızlık** sayılır. |
| **Identity divergence detector** | “Aynı ben” iddiası düğümler arasında **ayırdığında** rapor: drift · çift seal · incompatible merge · semantic sınır ihlali; **entropy / IBT / GCSB** sinyallerini birleştirir. |

---

## 3. RCIL eşlemesi (kısa)

| RDVH modülü | RCIL sütunu / not |
|-------------|-------------------|
| Replay tester | **(1)** ordering protocol + event şeması |
| Consistency verifier | **(5)** + **(4)** EAERT kernel çıktıları |
| Chaos / partition executor | **(3)** RRHP loop tetikleri + ağ modeli |
| Divergence detector | **(2)** state machine + IBT/GCSB sapma metrikleri |

---

## 4. IFL ile ilişki

[IFL](RHIZOH_INSTANTIATION_FIDELITY_LAYER_V1.md) **ölçüm eksenini** tanımlar; RDVH aynı eksenleri **determinizm ve kimlik sapması** için **koşuşturur ve assert eder**. IFL Stress Harness ile **aynı senaryo seti** paylaşılabilir; RDVH ek olarak **replay determinism** ve **identity divergence** assert katmanı taşır.

---

## 5. PoCL ile ilişki (formal üst katman)

RDVH trace’leri, **[PoCL — Proof-of-Consistency Layer](RHIZOH_PROOF_OF_CONSISTENCY_LAYER_POCL_V1.md)** için **giriş modeli**dir: formal equivalence · olasılıksal divergence sınırı · partition altında entropy stabilitesi · çapraz-node invariant persistence teoremleri **trace üzerinde** ifade edilir. **[FCTS](RHIZOH_FULL_CONSISTENCY_THEOREM_SYSTEM_FCTS_V1.md)** aynı girdileri **T1–T5** teorem paketinde indeksler.

---

## 6. Minimum başarı ölçütü

1. **Replay:** aynı seed + aynı event günlüğü → **bit-dizilim seviyesinde** aynı identity karar dizisi (veya belgelenmiş bilinçli fark kümesi).  
2. **Consistency:** verifier tüm çiftlerde invariant ihlali **sıfır** veya **beklenen tek sınıf** (dokümante split).  
3. **Chaos:** seçilen profil altında **sessiz divergence yok** — tespit ya rapor ya enforce.  
4. **Divergence:** detector tetiklendiğinde çıktı **RCIL / RRHP / entropy politikası** ile yorumlanabilir olmalıdır.

---

*RDVH V1 — Runtime Determinism Validation Harness; RCIL instantiation’ın **kanıt yükü**.*
