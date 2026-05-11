# Rhizoh — Transition Choreography Spec (TCS-1)

**Rol:** [State Transition Spec V1](RHIZOH_STATE_TRANSITION_SPEC_V1.md) içindeki **kenarları**, kullanıcı algısında **kırmadan** uygulamak için koreografi — özellikle **Companion → Observe** (kişisel zihin → dünya farkındalığı). Bu belge **UI animasyon rehberi** değil; **perception pipeline** sözleşmesi.

**Mimari öz:** Geçiş “ekranlar arası zıplama” değil — **dikkat koordinatının** (attention) kontrollü yeniden yerleşimi: **continuity-preserving** akış; ekran tek başına değişmez, **odak ve referans çerçevesi** değişir.

**İki gerçeklik problemi (birlikte okuma):**

| Belge | Soru | Eksen | Problem türü |
|-------|------|--------|----------------|
| **TCS-1** (bu belge) | **Ben nasıl değişiyorum?** | **Zaman / bilinç** | **Continuity** — Dissolve, Drift, Expansion; zihinsel akış. |
| **[OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)** | **Neye bakıyorum?** | **Mekân / dünya** | **Perception** — W0→W3+, injection, veri sırası, world density. |

`transition = continuity problem` · `injection = perception problem`. **Mimari mühür:** **bilinç geçişi ≠ dünya oluşumu** — eski hatada dünya yüklenirken geçiş de aynı pipeline’da eriyordu; yeni modelde **zaman (TCS)** ile **gerçeklik (OWIS)** ayrı boru hatlarıdır ([OWIS-1 §2b](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)).

**Görünmez koordinasyon:** Kullanıcı “TCS çalışıyor / OWIS çalışıyor” görmez; hisseder: **“ben değişiyorum ve dünya buna uyuyor.”**

**Öz cümle (ürün mührü):** Rhizoh bu eksende yalnız yazılım değil — **zihinsel süreklilik ile gerçeklik üretimini senkronlayan deneyim sistemi** ([OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) ile birlikte okunur).

**Stres / doğrulama:** [ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md) — kopuyor mu, akıyor mu? (Pipeline karıştırma ayrıntısı: [OWIS-1 §2b](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md).)

**Normatif üst belgeler:** [FREEZE-0](RHIZOH_FREEZE_0.md) · [Companion-first UX state machine](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md) · [Calm technology](RHIZOH_CALM_TECHNOLOGY_PRINCIPLE.md) · [UI language](RHIZOH_UI_LANGUAGE_GUIDE.md) · [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) · [ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md)

**Durum:** `NORMATIVE_TARGET`

---

## 1. Kilitleme cümlesi (ürün tanımı)

**Companion → Observe geçişi bir ekran değişimi değil; benlikten dünyaya referans çerçevesinin genişlemesidir.**

Formül (tek satır):

> **self-contained mind → world-anchored mind**

Kod karşılığı: path `/companion` → `/observe` güncellenir; **algıda** ise “uygulama değişti” değil **“ben genişledim”** hedeflenir.

---

## 2. Neden en kritik kenar?

| Boyut | Açıklama |
|-------|-----------|
| **Bilişsel çerçeve** | “Ben” (Companion) → “dünya” (Observe); **cognitive frame shift**. |
| **Risk** | Yanlış koreografi → “app değişti”, Rhizoh kopar, güven kırılır. |
| **Ödül** | Doğru koreografi → süreklilik; kullanıcı **aynı ben** hissini taşır. |

Bu kenar **STC** içinde öncelikli koreografi olarak ayrı belgelenir; diğer spine kenarları (ör. Companion ↔ Chronicle) TCS-1’in kalıbını sadeleştirerek miras alabilir.

---

## 3. Yanlış vs doğru model

| ❌ Yanlış | ✅ Doğru |
|-----------|----------|
| Companion kapanır, Observe açılır (sert kesme) | **Companion, Observe’e dönüşür** — kimlik / ses / bağlam sürekliliği taşınır, **referans sistemi** değişir. |
| Harita + katman anında L4 yoğunlukta | Açılışta **dünya saldırısı** yok; yoğunluk **kademeli** (§7). |
| Teknik yükleme mesajı önde | Yükleme **sessiz** veya tek cümle “dünyaya bağlanıyor” tonunda ([Calm](RHIZOH_CALM_TECHNOLOGY_PRINCIPLE.md)). |

---

## 4. Üç aşamalı perception pipeline

Geçiş **UI state machine** değil; **algı boru hattı** olarak modellenir.

### Aşama 1 — Dissolve (benlik çözülmesi)

| Parametre | Hedef |
|-----------|--------|
| **Ses** | Ton / hız **düşer** (voice decay); kesilmez, **söner**. |
| **Metin / UI** | Sadeleşir; ikincil krom gizlenir. |
| **Referans** | **İçe kapanır** — iç monolog azalır; dış dünya henüz iddia etmez. |
| **Amaç** | Zihinsel **iç monolog** yoğunluğunu azaltmak. |

### Aşama 2 — Drift (geçiş bilinç alanı)

| Parametre | Hedef |
|-----------|--------|
| **Eski yanlış model** | State A kapanır → state B açılır; aradaki süre = **latency / boşluk**. |
| **Yeni model** | Arada **bilinç nefesi**: **kontrollü süspansiyon** — boşluk değil, **tanımsız ama stabil** bir ara alan. |
| **Ne** | **Ne tam Companion ne tam Observe**; Companion sert ölmez, Observe tam patlamaz. |
| **Süre** | **300–800 ms** hedef aralık (cihaz / ağ alt sınırı ile kalibre edilir); 800 ms üstü “takıldı” hissi riski. |

Bu aşama **bilinçli**: Drift = gecikme maskesi değil; **geçişin kendisi ürün kararıdır** — **ürün özelliği** (bilinç modu); boş “latency” değil.

### Aşama 3 — Expansion (dünya açılışı)

| Parametre | Hedef |
|-----------|--------|
| **Harita / dünya** | Dış **referans** gelir; [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) **W0→W1→W2→W3** (W3+ gecikmeli) ile **kademeli** enjekte (§8 özet). |
| **Anlam** | Dünya **anlamlı hale gelir**; TCS timing ile OWIS loading **eşzamanlı ürün olarak** yönetilir, tek fonksiyonda birleştirilmez. |
| **Ses** | “Dış dünyaya referans” — genişleme, saldırganlık değil. |
| **Ben sürekliliği** | Kullanıcı hâlâ **aynı ben** hissini taşır (§6). |

---

## 5. Cognitive frame shift — riskler

| Hata modu | Hissedilen |
|-----------|------------|
| Çok hızlı | Kopma |
| Çok dramatik | Sci-fi / gimmick |
| Çok teknik | App switch |

QA sorusu: **“Ben genişledim mi, yoksa başka uygulamaya mı düştüm?”**

### 5.1 Meta-risk: geçiş “fark edilir” olursa

Koreografi **çok görünür** hale gelirse (“şu an geçiş oldu” meta-farkındalık) **büyü bozulur**. Hedef: geçiş **kontrol altında** ama **fark edilmeden** — QA’da hem §5 tablosu hem **“kullanıcı geçişi isimlendirebildi mi?”** (istemiyorsak hayır) sorusu. Aynı risk: kullanıcı iç pipeline dilini ağzına alırsa (“şu TCS’ti”, “W2’deyim”) — [ESTL-1 §3](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md).

---

## 6. Zihinsel süreklilik “hilesi” (semantic continuity anchors)

Geçiş boyunca **taşınması gerekenler** (mümkün olan minimum) — kullanıcı **yeniden başlatılmadığını** hisseder; yalnız **referans sistemi** değişir.

| Anchor | Açıklama |
|--------|-----------|
| **Ses kimliği** | Aynı ses / aynı “konuşmacı” hattı; decay → expansion eğrisi ile. |
| **Bağlam taşıyıcı** | Son kullanıcı cümlesi, konum özü, veya seçili konu **tek satır** “carry” (URL query veya session summary — PII disiplinine uygun). |
| **Anlam köprüsü** | İlk Observe mesajı / etiketi, Companion’daki **aynı soruya** cevap verir (örnek aşağı). |

**Örnek (anlam, ürün metni değil sabit kopya):**

- Companion: “Bugün neredesin?”  
- Observe açılışı: “Şu an bulunduğun bölgede [hava / katman] hazır.”  

📌 Soru **aynı bilinçten** gelir; **dünya** değişir — bu **semantic continuity anchor**’dur.

---

## 7. UI weight (TCS-1 — bu kenar için)

[STC §6](RHIZOH_STATE_TRANSITION_SPEC_V1.md) genel merdivenle çelişmeden, **bu geçiş için** yoğunluk eğrisi:

| Faz | Weight (bu kenar) | Not |
|-----|-------------------|-----|
| Companion (steady) | **L1** | Sakin ilişki yüzeyi. |
| Drift | **L0.5** | Minimal krom; “boşluk” hissi. |
| Observe (açılış / ilk saniyeler) | **≤ L2** | Harita görünür ama **L4’e sıçrama yasak** — katman / telemetri / debug sonradan veya kullanıcı eylemiyle. |
| Observe (steady-state, birkaç saniye sonra) | **Spine / ~L1** | **İlk etki** güçlü olabilir; **kalıcı dünya** ağır kalmamalı — yoğunluk tekrar spine sakinliğine **iner**. |

**Kural:** Observe açılışında **dünya saldırısı** yok: tüm layer / widget patlaması tek karede değil, **expansion** ile. Detaylı enjeksiyon: [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md).

---

## 8. Observe world injection (özet → OWIS-1)

| OWIS faz | Enjekte edilen (özet) | Zamanlama (Expansion ile) |
|----------|------------------------|----------------------------|
| **W0** | Yön / niyet (carry) | Expansion ile hizalı başlangıç |
| **W1** | Skeleton world | Hemen ardından |
| **W2** | Anchored world (tek ana katman) | W1 sonrası |
| **W3** | Live world (canlı besleme) | Kademeli |
| **W3+** | Telemetry / yoğun UI | Jest veya gecikme |

**Path:** `/observe` erken commit edilebilir; **görsel yoğunluk** Drift sonrası kademeli — URL ile algı çelişmez.

**Normatif detay:** [Observe World Injection Spec OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) — ilk 3 saniye, veri önceliği, overload yasakları.

---

## 9. Ses eğrisi (voice decay / expansion) — sözleşme

| Segment | Eğri | Amaç |
|---------|------|------|
| Dissolve | **Decay** — amplitude / speech rate düşüşü | İç monologu kapatma |
| Drift | **Sessiz veya ambient minimum** | Boşluk; kesme yok |
| Expansion | **Expansion** — net ama yumuşak | Dünyaya bağlanma |

Ses **kesintisiz** veya çok kısa crossfade; “yeni karakter” hissi verilmez (Companion = aynı ben).

---

## 10. UI fade / motion — sözleşme

| Öğe | Davranış |
|-----|----------|
| Companion paneli | Opacity / blur **yumuşak** düşüş (sert unmount önce fade) |
| Drift alanı | Nötr arka plan veya çok hafif devamlılık (marka tonu) |
| Harita | Fade-in + hafif scale-in (agresif zoom yok) |
| Metin | Companion son mesajı **kısa süre** ghost (opsiyonel, 150–300 ms) sonra Observe başlığı |

FREEZE-0: Drift sırasında **ikinci duygusal merkez** (ör. tam Studio paneli) görünmez.

---

## 11. Tasarım özeti (tek blok)

- **Tür:** Identity expansion function — yalnız UI transition değil; **attention relocation** (dikkat koordinatının yeniden yerleşimi).  
- **Pipeline:** Dissolve → Drift (300–800 ms, **kontrollü süspansiyon** / bilinç nefesi) → Expansion.  
- **Anchor:** Ses + bağlam + anlam köprüsü — süreklilik korunur, referans çerçevesi değişir.  
- **Yoğunluk:** Açılış ≤ L2; steady-state spine sakinliğine iner; L4 yasak ([OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) ile ilk 3 s).  
- **Risk:** hız, dramatiklik, tekniklik + **meta-fark edilen geçiş** (§5.1).  
- **TCS-1 değeri:** Geçişi **görünmezleştirmek** ile **kontrol edilebilir** bırakmak arasında denge.

---

## 12. Belge yığını (mimari özet)

| Katman | Rol | Ana belge |
|--------|-----|-----------|
| **Experience spine** | Yaşam yüzeyleri | [UX state machine](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md) |
| **Cognitive (zihin)** | Ben nasıl değişiyorum? — algı koreografisi | **TCS-1** (bu belge) |
| **Reality (dünya)** | Neye bakıyorum? — W0→W3+ | [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) |
| **Validation** | Kopuyor mu, akıyor mu? | [ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md) |
| **Deep systems** | Derin sistem | [Implementation Map](RHIZOH_IMPLEMENTATION_MAP.md) — Castle · Studio · Spiral |

---

## 13. Ters kenar (Observe → Companion)

Aynı prensip **tersine**: dünya **daralır** ilişkiye; Expansion’ın tersi kısa **contract** (harita söner, ses ilişkiye döner). Drift penceresi yine 300–800 ms bandında tutulabilir.

---

## 14. İmplementasyon notu (kod için)

- Tek `TransitionController` veya eşdeğeri: **phase** = `dissolve | drift | expand` + hedef path.  
- Observe tarafında: **world injection queue** ([OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) fazları) kodda açık sıra.  
- Telemetry: “transition aborted”, “drift > 800ms” ürün sinyali.

---

## 15. İlişkili belgeler

- [State Transition Spec V1](RHIZOH_STATE_TRANSITION_SPEC_V1.md)  
- [Companion-first UX state machine V1](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md)  
- [Personality stability](RHIZOH_COMPANION_PERSONALITY_STABILITY.md) (ses tonu sınırları)  
- [Observe World Injection Spec OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)  

---

*TCS-1 — Companion → Observe; kontrollü Drift; attention relocation; OWIS-1 ile dünya enjeksiyonu.*
