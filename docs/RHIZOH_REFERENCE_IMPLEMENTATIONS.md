# Rhizoh — Reference Implementations (Post-Theory Phase)

**Rol:** Yeni **büyük teori** ve uzun normatif spec zinciri yerine — **çalışan, hissedilen, tekrarlanabilir referans uygulamalar**. Bundan sonra çoğu kullanıcı **spec okumayacak**; **hissedecek**, güvenecek, geri dönecek, yaşayacak, paylaşacak.

**Durum:** `NORMATIVE_TARGET` — her madde için “tanım bitti” değil, **ürün artefaktı** (akış, ekran, demo, test videosu, mağaza / web build) hedeflenir.

**Önkoşul:** [Embodied Product Reality + UX gate](RHIZOH_EMBODIED_PRODUCT_REALITY.md) · [FREEZE-0](RHIZOH_FREEZE_0.md) · [Reference User Journey](RHIZOH_COMPANION_REFERENCE_JOURNEY.md) · [Castle node runtime](CASTLE_NODE_RUNTIME_MODEL.md) · [UI language](RHIZOH_UI_LANGUAGE_GUIDE.md) · [Personality](RHIZOH_COMPANION_PERSONALITY_STABILITY.md) · [Calm technology](RHIZOH_CALM_TECHNOLOGY_PRINCIPLE.md) · [Implementation map — `apps/client`](RHIZOH_IMPLEMENTATION_MAP.md)

---

## 1. Neden bu faz?

| Önce | Sonra |
|------|--------|
| Teori ve spec genişlemesi | **Reference implementation** — tek doğruluk kaynağı çoğu zaman **çalışan ürün** |
| “Doğru mu?” (belgede) | “**Hissediliyor mu?**” (cihazda) |

Yeni normatif belge açmadan önce: [UX-felt gate](RHIZOH_EMBODIED_PRODUCT_REALITY.md#6-rhizoh-governance-kuralı-spec-öncesi-zorunlu-soru).

---

## 2. Referans uygulama listesi (hedef artefaktlar)

Her satır: **mobil veya prod-benzeri ortamda** gösterilebilir bir akış; mümkünse otomasyonlu regresyon veya golden path testi ile sabitlenir.

| # | Referans | Kısa “bitti” tanımı |
|---|----------|---------------------|
| 1 | **Gerçek Companion mobile flow** | İlk açılış → konuşma → isim/chronicle tohumu → geri dönüş aynı ritimde ([journey §1](RHIZOH_COMPANION_REFERENCE_JOURNEY.md)). |
| 2 | **Gerçek Chronicle timeline** | Timeline anlam taşır; boş / gürültülü değil; [UI: Timeline](RHIZOH_UI_LANGUAGE_GUIDE.md). |
| 3 | **Gerçek Castle node** | “Space” kurulumu doğal; [runtime model](CASTLE_NODE_RUNTIME_MODEL.md) ile uyumlu iz/retention. |
| 4 | **Gerçek Observe screen** | Tek duygusal merkez: dünya/harita ([FREEZE-0 §2](RHIZOH_FREEZE_0.md)). |
| 5 | **Gerçek onboarding** | Panik yok; sakin ilk 10 dk; [Calm](RHIZOH_CALM_TECHNOLOGY_PRINCIPLE.md). |
| 6 | **Gerçek memory continuity** | Oturumlar arası hatırlama “sihir” değil **güven** ([journey §2](RHIZOH_COMPANION_REFERENCE_JOURNEY.md)). |
| 7 | **Gerçek offline recovery** | Kuyruk + yeniden bağlanma; veri kaybı hissi yok ([FREEZE-0 §1](RHIZOH_FREEZE_0.md)). |
| 8 | **Gerçek voice rhythm** | Sesli modda ölçülü tempo; [personality](RHIZOH_COMPANION_PERSONALITY_STABILITY.md). |
| 9 | **Gerçek notification discipline** | Engagement yağmuru yok; özet ve seçenekler ([Calm](RHIZOH_CALM_TECHNOLOGY_PRINCIPLE.md)). |

**`apps/client` ürün ↔ rota ↔ öncelik eşlemesi:** [RHIZOH_IMPLEMENTATION_MAP.md](RHIZOH_IMPLEMENTATION_MAP.md) — deneyim merkezli tablo; sprint ile güncellenir.

---

## 3. Başarı: görünmez çekirdek

Tüm derin epistemik kernel (PAG, πEFC, witness, ETK, …) **başarılıysa** kullanıcı için **neredeyse görünmez** kalır — bu, Rhizoh’un **güçlü final formu** olabilir: önde yaşam, arkada güvence.

---

## 4. Ölçüm (spec değil)

- Dönüş oranı, oturum süresi, Chronicle açılışları, “paylaşım” eylemi, destek tonu, “korku / yorgunluk” geri bildirimi.  
- Teknik metrikler (crash, WS reconnect süresi) **yardımcı**; birincil hakem **insan davranışı**.

---

*Reference implementations — teoriden sonra gelen disiplin; ürün tek doğruluk kaynağına yaklaşır.*
