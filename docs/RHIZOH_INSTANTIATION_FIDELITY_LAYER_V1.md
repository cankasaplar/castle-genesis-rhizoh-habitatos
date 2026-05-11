# Rhizoh — Instantiation Fidelity Layer (IFL) (V1)

**Rol:** [DRAS](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) aksiyomatik kapamasından sonra **ölçüm ekseni** — spec ve teorem **çalışıyor mu?** (**instantiation fidelity**), makine ispatı değil **gerçek dünya çalıştırması** üzerinden. **Stabilizasyon / uzun ufuk iyileşme** bu belgenin dışındadır — **[RRHP V1](RHIZOH_REALITY_RECONCILIATION_HEALING_PHYSICS_V1.md)**.

**Durum:** `NORMATIVE_TARGET` — **hedef katman tanımlı**; somut harness / CI / üretim log bağlama **açık iş** (bu belge yol haritasıdır).

**Önkoşul:** [ECR Axiomatic System Card V1](RHIZOH_ECR_AXIOMATIC_SYSTEM_CARD_V1.md) · [Unified Theorem Set V1](RHIZOH_DRAS_UNIFIED_REALITY_THEOREM_SET_V1.md) · [Manifold Topology V1](RHIZOH_EAERT_REALITY_MANIFOLD_TOPOLOGY_V1.md)

---

## 0. Ne IFL’dir?

**IFL**, şu soruların **ölçülebilir** cevabını üretir:

- **EAERT** latency / yarış altında **I1–I5**’i **fiilen** koruyor mu?  
- **GEJ** gerçek input akışında **admissibility**’i sürdürüyor mu? (özellikle **partial failure**.)  
- **AIL** dönüşümler **bounded** ve GEJ ile **uyumlu** mu?  
- **RDCL** aynı prefix için **deterministik** projection üretiyor mu?  
- **Split-brain** / partition senaryosunda sistem **T_reg** ([Theorem Set](RHIZOH_DRAS_UNIFIED_REALITY_THEOREM_SET_V1.md)) ile **uyumlu** mu — yoksa sessizce **T_DRC** iddiasına mı dönmeye çalışıyor?

Bu katman **yeni aksiyom eklemez** — yalnızca **instantiation doğruluğu** ölçer ve bozulursa **topolojik** veya **operasyonel** kök nedeni ayırır.

---

## 1. Teorik genişleme yok

DRAS üçlüsü (manifold + teorem + kart) **kapalıdır**. “Yeni tasarım alanı” yok — **çalıştırma ve gözlem** alanı vardır ([DRAS V1 — §15–§16](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md)).

---

## 2. Üç doğal “gerçek dünya testi” yolu

Bu üç yol **birbirini dışlamaz**; ürün olgunluğuna göre paralel gider. Normatif olarak IFL’nin **tamamlanabilir** ölçüm yüzeyi budur.

| # | Yol | Soru (bir satır) | Zorladığı çekirdek |
|---|-----|-------------------|---------------------|
| **1** | **IFL Stress Harness** (**gerçek trace** üzerinde) | Aynı kayıtlı trace, enjekte edilen kaos altında hâlâ **T_DRC** / **I1–I5** ile uyumlu mu? | **RDCL** determinizm + **EAERT** denklik + **T_reg** sınırları |
| **2** | **EAERT runtime validator** | Çalışan node’lar **node consistency enforcement** ile aynı materyal gerçekliği taşıyor mu? | **EAERT** (I4 sessiz sapma yok · I5 bounded lag) |
| **3** | **GEJ / AIL policy execution simulator** | **Yük altında** admission + transformation **GEJ ⊇ AIL** disiplinini ve fail-closed davranışı koruyor mu? | **GEJ** + **AIL** (+ **T_reg** wedge testi) |

**1 — IFL Stress Harness** alt boyutları (aynı harness içinde birlikte veya aşamalı):

- **drift propagation** — projection / policy / log prefix sapmasının **yayılarak** I3 / I5’i kırıp kırmadığı  
- **partition injection** — grafiğin bilinçli kesilmesi; **A_partition** ve **T_reg** uyumu  
- **latency chaos** — gecikme dağılımı + sıra baskısı; **I2** / **I5** stresi  

Tipik repo bağlantısı: `scripts/mk1StressHarness.mjs` · norma: [MK1 Kernel Validator](MK1_KERNEL_VALIDATOR_V0_1.md) (sentetik + trace tabanlı genişleme için çerçeve).

**2 — EAERT runtime validator:** süreç-içi veya periyodik kontrol; node başına **observed vs computed reality** denetimi, **quorum / fence** anlarında **gluing** iddiasının bozulmaması ([EAERT](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md)).

**3 — GEJ / AIL policy execution simulator:** çok iş parçacığı / çok bölge; **admission** kararları ile **bounded transformation** zincirinin yük altında **wedge** üretmemesi ([GEJ-1](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md) · [AIL-1](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)).

---

## 3. Başarı ölçütü (IFL “yeşil” ne demek?)

Özet: **C_irr** atomları **kod yolunda** kaybolmuyor; **I1–I5** ihlali **sessiz** değil; partition altında **A_partition** ihlal edilmiyor ([Manifold](RHIZOH_EAERT_REALITY_MANIFOLD_TOPOLOGY_V1.md)).

---

## 8. Teknik gerilim (üçlünün garanti etmediği)

IFL üçlüsü **long-horizon stability under adversarial drift** garanti **etmez**: **IFL** stabilize etmez (ölçer); **EAERT** kırık gerçekliği **re-konstrükte** etmez (eşitler); **GEJ/AIL** kendini **doğrulamaz** (seçer ve dönüştürür). Sonraki doğal katman: **[RRHP V1 — Reality Reconciliation & Healing Physics](RHIZOH_REALITY_RECONCILIATION_HEALING_PHYSICS_V1.md)** (RRHP §8–§11).

---

## 11. Sonraki doğal kırılma (IFL — normatif üçlü)

DRAS/DRACS aksiyomatik kapamasından sonra **bir sonraki doğal kırılma** yalnız şu üçlüdür:

1. **IFL Stress Harness** — **gerçek trace**; **drift propagation** · **partition injection** · **latency chaos**.  
2. **EAERT runtime validator** — **node consistency enforcement**.  
3. **GEJ / AIL policy execution simulator** — **admission + transformation under load**.

Ayrıntı ve tablo: **§2** (yukarıda).

---

## 12. Sonraki doğal katman (ölçümden sonra)

**[RRHP V1](RHIZOH_REALITY_RECONCILIATION_HEALING_PHYSICS_V1.md)** — *reconstruction / healing*: broken reality → stabilize; drift → reconciliation; split → merge policy.

---

## 4. İlişkili belgeler

- [DRAS V1](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) · **[RRHP V1](RHIZOH_REALITY_RECONCILIATION_HEALING_PHYSICS_V1.md)** (reconciliation / healing · **ESHRE** §11)  
- [EAERT V1](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md) · [RDCL Implementation Map](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md)  
- [WC-PF](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md) · [MK1 Kernel Validator](MK1_KERNEL_VALIDATOR_V0_1.md)

---

*IFL V1 — instantiation fidelity; §2 / §11 üçlü; §8 gerilim; §12 → RRHP.*
