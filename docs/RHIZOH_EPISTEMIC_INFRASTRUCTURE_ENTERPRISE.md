# Rhizoh — Epistemic Infrastructure Layer (Enterprise & B2B Framing)

Bu belge **kurumsal dil ve GTM** içindir; teknik tanımlar `docs/ECER_*`, `docs/PI_*`, `docs/MK1_*` içinde kalır. Dışarıda sistemi **“Spiral civilization engine”** gibi anlatmak yerine, aşağıdaki çerçeve **ciddiyet** ve **satın alınabilir modül** mantığı verir.

**Üst çerçeve:** **Epistemic infrastructure layer** — AI üstüne değil, **güvenilir lineage, yönetişim, tekrarlanabilir denetim ve kalıcı hafıza** üzerine oturan altyapı.

**Kısa public isimler (alternatif pitch):**

- **Auditable Reality Runtime** — replay + witness + deterministik sınır.  
- **Persistent Governance Layer for AI Systems** — çok-ajan kargaşa ve politika drift’ine karşı orta katman.

Uzun vadede Rhizoh **Persistent Civilization Runtime**, Castle **Personal / Organizational Reality Infrastructure** olarak okunabilir; buna ulaşmak için öncelik: teori genişlemesi değil — **onboarding, stabilite, ürün netliği, API yüzeyleri, DX**.

---

## 1. Kurumların ihtiyacı ↔ çekirdekteki karşılık

| Şirket problemi | Gerçek ihtiyaç | Rhizoh / Castle çekirdeğinde |
|-----------------|----------------|------------------------------|
| AI hallucination | Güvenilir lineage | Witness, τ / binding, πEFC karar tutarlılığı |
| Multi-agent chaos | Governance + replay | PAG, RBL, D1/R1, ETK, HOGA |
| Compliance | Deterministic audit | MK-1, append-only witness, TLOA snapshot, transition ledger |
| Memory fragmentation | Persistent chronicle | Chronicle ürün yüzeyi + mühürlü hafıza hattı |
| Tool sprawl | Unified runtime | Tek epistemik runtime sözleşmesi (πEFC + kernel) |
| Human/AI coordination | Witnessed workflows | Witness artifact, verified memory |
| Long-horizon systems | Transition algebra | TTA / ETK / HOGA, yönetilen epistemik zaman |

Çekirdek bu ihtiyaçların çoğunu **zaten** taşır; eksik olan çoğu zaman **packaging** ve **müşteri diline çeviri**dir.

---

## 2. Şirket dili ↔ repo / spec karşılığı (satış & mimari köprü)

| Şirket dili | Sizin sistemdeki karşılık (iç referans) |
|-------------|----------------------------------------|
| Auditability | TLOA, ETK, transition ledger |
| Governance | PAG, R1/G1 bağlamı |
| Agent orchestration | RBL-D1, R1 resolution policy |
| Persistent memory | Chronicle, lineage |
| Compliance replay | MK-1, deterministik ret/kabul, witness zinciri |
| Runtime integrity | MK-1 + GDK hizası |
| Multi-agent policy composition | HOGA, meta-geçiş tutarlılığı |
| Safe evolution | EBE / ECDM, TLS tri-layer |

Kurumlar **HOGA / TTA / ETK** okumaz; **auditability** ve **governance replay** ister. Tablo teknik ekibe köprüdür.

---

## 3. Modüler kurumsal kullanım (ilk gün “hepsini” yok)

Rhizoh’un tamamı tek seferde satılmaz; **katman katman** gider:

1. **Enterprise Memory Engine** — Chronicle + Witness + Lineage: karar geçmişi, hangi ajanın hangi bağlamda önerdiği, **replay edilebilir** transition history.  
2. **Multi-agent governance** — PAG, RBL, D1/R1, ETK, HOGA → **AI constitutional middleware** benzeri konumlandırma.  
3. **Compliance / audit** — bankacılık, sağlık, kamu, savunma, kritik altyapı: append-only, witness, dissent memory, deterministik transition.  
4. **Digital twin / smart environments** — **Castle**: ofis, fabrika, şehir, lojistik ağı **epistemic node**; *human-centered digital twin*.  
5. **Collaborative simulation** — kriz / afet / şehir / çok-takım koordinasyonu, tarihsel replay, senaryo üretimi; *Civilization Sandbox for Organizations* (iç kod adı Spiral ile uyumlu).

---

## 4. Go-to-market merdiveni (ölçeklenebilir)

| Basamak | Rol |
|---------|-----|
| **Rhizoh Core** | Internal engine — monorepo + spec + doğrulayıcılar. |
| **Rhizoh Cloud** | Hosted runtime (hedef ürün). |
| **Rhizoh SDK** | Memory / governance API’leri; küçük entegrasyon başlangıcı. |
| **Castle** | Takım / workspace **node** (PRN’nin org yüzü). |
| **Chronicle** | Kalıcı hafıza ürünü (enterprise memory için ana kapı). |
| **Studio** | Workflow + reality builder. |

“Tek dev paket” yerine **küçük layer → API → SDK → node** yolu daha satılabilir.

---

## 5. Üç yüz (aynı çekirdek, farklı ürün)

| Yüz | Kim | Ne |
|-----|-----|-----|
| **Consumer Rhizoh** | Birey | Companion + Chronicle. |
| **Creator Castle** | Üretken kullanıcı | Studio + node’lar + otomasyon. |
| **Enterprise Rhizoh** | Kurum | Governance + memory + agent runtime (modüler). |

---

## 6. En büyük avantaj (mesaj)

Çoğu AI şirketi model, ajan veya workflow üretir; **epistemic continuity** (uzun ufuklu, şahitli, replay’li süreklilik) nadirdir. Bu, **epistemic infrastructure** pitch’inin özüdür.

---

## 7. İlişkili

- [Rhizoh × Castle — Protocol Civilization & PRN](RHIZOH_CASTLE_CIVILIZATION_FRAMING.md)  
- [Ürün fazları A→E (freeze → Companion → … → Spiral)](RHIZOH_PRODUCT_PHASES_A_THROUGH_E.md)  
- [RHIZOH FREEZE-0 — min. canlı yayın + UX prensipleri](RHIZOH_FREEZE_0.md)  
- [Reference User Journey — Companion](RHIZOH_COMPANION_REFERENCE_JOURNEY.md) · [Castle node runtime](CASTLE_NODE_RUNTIME_MODEL.md) · [UI language guide](RHIZOH_UI_LANGUAGE_GUIDE.md)  
- [Embodied Product Reality + UX-felt spec gate](RHIZOH_EMBODIED_PRODUCT_REALITY.md)  
- [Reference implementations](RHIZOH_REFERENCE_IMPLEMENTATIONS.md)  
- Teknik: `docs/ECER_*`, `docs/PI_*`, `docs/MK1_*`, `scripts/ecerEpistemicTransitionKernel.mjs`, `scripts/hogaComposition.mjs`
