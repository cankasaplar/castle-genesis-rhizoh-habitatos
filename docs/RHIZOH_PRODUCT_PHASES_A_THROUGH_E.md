# Rhizoh / Castle — Product Phases A → E (Roadmap Freeze)

Bu belge **ürün faz sırası ve öncelik dondurmasıdır**; teknik invariant’lar `docs/ECER_*`, `docs/MK1_*` vb. ile ayrı kalır. Amaç: çekirdek **stabil**, kullanıcı yüzeyi **sade**, Spiral gibi riskli katman **en son**.

---

## Öncelik özeti (şu an en çok fayda)

Yeni HOGA / TTA varyantından önce:

1. **Castle Genesis UI sadeleşmesi** — dış yüzey net, çekirdek gizli.  
2. **Rhizoh Companion deneyimi** — tek ekranda hissedilen değer; ritim: [Reference User Journey](RHIZOH_COMPANION_REFERENCE_JOURNEY.md).  
3. **Gerçek canlı kullanıcı akışı** — uçtan uca ölçüm ve süreklilik.  
4. **Reference implementations** — mobil Companion, Chronicle, Castle, Observe, onboarding, offline, ses, bildirim; bkz. [RHIZOH_REFERENCE_IMPLEMENTATIONS.md](RHIZOH_REFERENCE_IMPLEMENTATIONS.md) · rota/öncelik tablosu: [RHIZOH_IMPLEMENTATION_MAP.md](RHIZOH_IMPLEMENTATION_MAP.md).

Mesele artık *“yeni yasa üretmek”* değil; **yasaların fark edilmeden deneyimlenmesi** (kernel arkada, companion önde).

**Üç katman + embodied validasyon + yeni spec öncesi UX sorusu:** [RHIZOH_EMBODIED_PRODUCT_REALITY.md](RHIZOH_EMBODIED_PRODUCT_REALITY.md). **Teori sonrası — reference implementations:** [RHIZOH_REFERENCE_IMPLEMENTATIONS.md](RHIZOH_REFERENCE_IMPLEMENTATIONS.md).

---

## PHASE A — Product freeze

**Hedef:** Çekirdeği stabilize et; packaging ve operasyon hazır olsun.

**Concrete spec (FREEZE-0):** [RHIZOH_FREEZE_0.md](RHIZOH_FREEZE_0.md) — minimum canlı yayın çekirdeği: runtime stability, UI collapse, invisible depth, node modeli, Companion / Studio / Spiral çerçevesi ve yeni teknik öncelik listesi.

| Alan | İçerik |
|------|--------|
| **Core freeze** | Civilization kernel: bilinçli sürüm / değişiklik eşiği ([framing](RHIZOH_CASTLE_CIVILIZATION_FRAMING.md) · Civilization Kernel Freeze). |
| **Naming cleanup** | İç ad vs public dil; repo / UI / dokümantasyon hizası ([civilization framing §5](RHIZOH_CASTLE_CIVILIZATION_FRAMING.md), [enterprise dil köprüsü](RHIZOH_EPISTEMIC_INFRASTRUCTURE_ENTERPRISE.md)). |
| **API contracts** | SDK ve entegrasyon için kararlı sözleşmeler (hedef). |
| **Runtime hardening** | MK-1 / epistemic smoke, gateway davranışı, hata sınıfları. |
| **Firebase / gateway** | Prod yolu, güvenlik, şema. |
| **Observability** | Log / metrik / sağlık; TLOA/ETK ile uyumlu düşünce (iç araçlar). |
| **Auth** | JWT / Firebase; origin allowlist. |
| **Deployment** | CI, checklist, geri dönüş. |
| **Cost control** | LLM / altyapı bütçesi ve limitler. |

Phase A bitmeden faz B’ye “özellik yağmuru” önerilmez.

---

## PHASE B — Rhizoh Companion

**İlk gerçek kullanıcı ürünü.** Tek ekran hissi:

- Konuş · hatırla · organize et · **chronicle** · **live memory** · **world observe**

Arkada çekirdek (πEFC, witness, lineage, vb.) çalışır; kullanıcıya **motor odası** değil, **süreklilik ve güven** hissi verilir.

**Phase B’nin kalbi (insan ritmi):** [RHIZOH_COMPANION_REFERENCE_JOURNEY.md](RHIZOH_COMPANION_REFERENCE_JOURNEY.md) — ilk 30 dk · ilk hafta · ilk ay; ton: [personality](RHIZOH_COMPANION_PERSONALITY_STABILITY.md) · [calm UX](RHIZOH_CALM_TECHNOLOGY_PRINCIPLE.md) · [UI dili](RHIZOH_UI_LANGUAGE_GUIDE.md).

---

## PHASE C — Castle nodes

Kişisel ve takım **node**’ları (PRN / org node):

- Family · research · studio · robotics · company **castle** varyantları — aynı çekirdek, farklı şablon / politika / alan.

**Runtime omurga:** [CASTLE_NODE_RUNTIME_MODEL.md](CASTLE_NODE_RUNTIME_MODEL.md).

---

## PHASE D — Studio

Profesyonel araç yüzeyi:

- Multi-agent orchestration · workflows · governance · memory graphs · simulations.

---

## PHASE E — Spiral (topluluk / “civilization” layer)

**En son.** En riskli ve en kolay yanlış anlaşılan katman; [Collective Chronicle framing](RHIZOH_CASTLE_CIVILIZATION_FRAMING.md) ile sınırlı sunulur. Phase A–D ve gerçek kullanıcı öğrenmesi sonrası.

---

## Faz sırası (tek satır)

`A (freeze) → B (Companion) → C (nodes) → D (Studio) → E (Spiral)`

---

## İlişkili

- [Rhizoh × Castle — Protocol Civilization & PRN](RHIZOH_CASTLE_CIVILIZATION_FRAMING.md)  
- [Epistemic infrastructure / enterprise](RHIZOH_EPISTEMIC_INFRASTRUCTURE_ENTERPRISE.md)  
- [LOOP-1](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md)
