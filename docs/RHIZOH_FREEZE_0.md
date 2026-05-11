# RHIZOH FREEZE-0 — Minimum Canlı Yayın Çekirdeği

**Rol:** [Phase A](RHIZOH_PRODUCT_PHASES_A_THROUGH_E.md) içinde **yayına çıkabilecek en küçük güven yüzeyi** — “demo” hissini öldüren stabilite + **tek duygusal merkez** + **görünmez derinlik**. Teknik yasalar (TLOA, HOGA, ETK, …) bu belgede **tanımlanmaz**; [spec’ler](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md) ayrıdır.

**Durum:** `NORMATIVE_TARGET` — ürün ve UX dondurması; implementasyon checklist’i aşamalı doldurulur.

---

## 1. Runtime stability

**Amaç:** “Wow”dan çok **güven** hissi — kullanıcı kopmayı, kaybolmayı, rastgeleliği fark eder.

| Gerekli yüzey | Not |
|---------------|-----|
| Deterministic reconnect | Aynı oturum kimliği / süreklilik sözü. |
| Session continuity | Yeniden girişte bağlam kopmaması. |
| Memory persistence | Chronicle / live memory için kalıcı yol. |
| Realtime sync recovery | WS kesintisi sonrası tutarlı toparlanma. |
| Offline-safe queues | Kayıp komut yok; sonra birleştirilebilir kuyruk. |
| Auth recovery | Token yenileme, güvenli geri dönüş. |
| Gateway failover | Tek düğüm hayali kırılmalı (hedef mimari). |
| Firebase rate control | Maliyet ve abuse sınırı. |

---

## 2. UI collapse (Castle Genesis)

**Teşhis:** Çok fazla sistem **kendini göstermeye** çalışıyor.

**Yeni prensip:** **One emotional center per screen** — ekran başına tek duygusal merkez. Geçişler (guard, yoğunluk, fallback): [RHIZOH_STATE_TRANSITION_SPEC_V1.md](RHIZOH_STATE_TRANSITION_SPEC_V1.md).

| Mod | Merkez |
|-----|--------|
| **Companion** | Konuşma + canlı hafıza. |
| **Observe** | Dünya haritası. |
| **Chronicle** | Zaman çizelgesi. |
| **Studio** | Graph / workflow. |

**Aynı ekranda olmamalı (örnek):** kernel log + harita + graph + debug panelleri + spiral + runtime + witnesses bir arada. Derinlik **ayrı ekran / ayrı mod / power-user** yolunda kalır.

---

## 3. Invisible depth (Rhizoh UX ana prensibi)

Kullanıcı **lineage, TLOA, HOGA** görmez. Sistem yine de:

- continuity,
- replay,
- governance,
- memory drift sınırı

sağlar. **iOS kernel’i göstermemek** metaforu: derinlik **görünmez**; **etkisi** hissedilir.

---

## 4. Castle node modeli

**Castle = workspace değil** → **persistent epistemic environment** (kalıcı epistemik ortam).

Aynı primitive’ten çıkabilecek yüzeyler: kişisel AI node, aile hafızası, takım alanı, robotics hub, enterprise cognition cell. Bu çerçeve **Notion / Slack / Figma** kategorisiyle rekabet etmekten çok, **süreklilik ve şahitlik** ile ayrışmayı hedefler.

---

## 5. Rhizoh Companion (FREEZE-0 sonrası ilk yüz)

İlk temas: Studio değil, Spiral değil, governance paneli değil — **Companion**. İnsan yolculuğu: [RHIZOH_COMPANION_REFERENCE_JOURNEY.md](RHIZOH_COMPANION_REFERENCE_JOURNEY.md). Hedef navigasyon / geçişler: [RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md). Ton ve sakin UX: [personality](RHIZOH_COMPANION_PERSONALITY_STABILITY.md) · [Calm technology](RHIZOH_CALM_TECHNOLOGY_PRINCIPLE.md) · [UI language](RHIZOH_UI_LANGUAGE_GUIDE.md).

Ön planda “çok zeki görünmek” değil:

- uzun dönem hatırlama,
- bağlam sürekliliği,
- sakin UX,
- canlılık hissi,
- günlük hayatla bağ,
- güven,
- kişisel kronik,
- ses / görsel hafıza (ürün kararı).

**Epistemic OS** arkada; önde **“beni anlayan sürekli bir zihin”**.

---

## 6. Studio’nun gerçek gücü

“AI node editor” veya “prompt chaining UI” ile sınırlanırsa **küçülür**.

Hedef yükseltme: **persistent organizational cognition** — organizational memory, simulation, governance, agent orchestration, reality modeling. Kurumsal değer bu kümeyle büyür.

---

## 7. Spiral koruma stratejisi

[Phase E](RHIZOH_PRODUCT_PHASES_A_THROUGH_E.md) — Spiral **en son** bilinçli karar.

**Erken açılırsa:** metaverse / oyun / roleplay AI / gimmick okuması riski.  
**Geç ve doğru açılırsa:** sosyal, kültürel, kolektif hafıza, deneysel medeniyet **yüzeyi** — stack’in özü değil, **medeniyet katmanı**.

---

## 8. Teknik savaş alanı (FREEZE-0 sonrası öncelikler)

“Hard problem” seti kayıyor:

| Eskiden (çekirdek teori) | Şimdi (ürün mühendisliği) |
|--------------------------|---------------------------|
| Epistemic closure, divergence, governance algebra | Auth / session continuity |
| | Mobil kısıtlar |
| | WebSocket recovery |
| | Inference cost tavanları |
| | Long memory compaction |
| | Realtime collaboration |
| | Vector drift |
| | Multi-device sync |
| | Privacy boundaries |
| | Onboarding |
| | User trust |
| | Moderation |
| | Deployment topology |
| | Observability |
| | API ergonomics |

---

## 9. Başarı tanımı (tek cümle)

**Rhizoh’un başarısı**, kullanıcıların ne kadar derin teknoloji kullandığını anlamasına değil; **sistemin hayatlarında ne kadar doğal** hale geldiğine bağlıdır.

---

## İlişkili

- [Product phases A→E](RHIZOH_PRODUCT_PHASES_A_THROUGH_E.md)  
- [Rhizoh × Castle framing](RHIZOH_CASTLE_CIVILIZATION_FRAMING.md)  
- [Epistemic infrastructure / enterprise](RHIZOH_EPISTEMIC_INFRASTRUCTURE_ENTERPRISE.md)  
- [Reference User Journey — Companion](RHIZOH_COMPANION_REFERENCE_JOURNEY.md)  
- [Castle node runtime model](CASTLE_NODE_RUNTIME_MODEL.md)  
- [Three layers + Embodied Product Reality + UX gate](RHIZOH_EMBODIED_PRODUCT_REALITY.md)  
- [Reference implementations](RHIZOH_REFERENCE_IMPLEMENTATIONS.md)  
- [Implementation map — apps/client](RHIZOH_IMPLEMENTATION_MAP.md)
