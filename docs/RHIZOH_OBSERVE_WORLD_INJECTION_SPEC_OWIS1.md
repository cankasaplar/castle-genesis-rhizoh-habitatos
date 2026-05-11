# Rhizoh — Observe World Injection Spec (OWIS-1)

**Rol:** [TCS-1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md) Expansion sınırından itibaren **dünyanın nasıl inşa edildiğini** tanımlar — **neye bakıyorum?** / **nereye gidiyorum?** (**mekân / dünya**, perception). **Ben nasıl değişiyorum?** (**zaman / bilinç**) [TCS-1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md)’tedir. OWIS-1 **perception problem**’ini çözer: **injection = gerçeklik oluşumu** (yoğunluk, veri sırası), transition değil.

**Normatif üst belgeler:** [FREEZE-0](RHIZOH_FREEZE_0.md) · [State Transition Spec V1](RHIZOH_STATE_TRANSITION_SPEC_V1.md) · [Calm technology](RHIZOH_CALM_TECHNOLOGY_PRINCIPLE.md) · [ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md)

**Durum:** `NORMATIVE_TARGET`

---

## 1. Ürün gerçeği

Rhizoh Observe’de güç, **ne gösterildiği** kadar **ne zaman gösterilmediği** ve **hangi sırada açıldığıdır**.

**Öz (kilit cümle):** Rhizoh bu yüzeyde yalnız “uygulama” değil — **bilinç ile dünya arasındaki kontrollü üretim katmanı**; dünya **controlled reality unfolding** ile açılır (map + chat + asistan yığını değil).

**Ürün mührü (tek cümle):** Rhizoh artık yalnız yazılım değil — **zihinsel süreklilik ile gerçeklik üretimini senkronlayan deneyim sistemi** ([TCS-1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md) ile birlikte okunur).

**Kullanıcı ilkesi:** Kullanıcı **TCS / OWIS katmanlarını isimlendiremez**; yalnızca **sonuç hissini** yaşar — “şimdi transition”, “şimdi world loaded” meta-farkındalığı ürün hatasıdır ([TCS-1 §5.1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md)).

---

## 2. Kapsam

| Dahil | Hariç |
|-------|--------|
| Harita / globe **iskelet → katman** sırası | Tam Cesium / gateway implementasyon envanteri |
| İlk **0–3 s** kullanıcıya görünen dünya hissi | Studio graph render |
| Veri / asset **yük önceliği** kuralı | Sunucu queue derinliği (ayrı operasyonel spec) |
| **Overload** yasakları (widget, panel, layer patlaması) | Companion metin üretimi |

---

## 2b. TCS-1 ile ayrım (karıştırılmaması gerekenler)

| ❌ Eski karışım | ✅ Ayrı model |
|----------------|---------------|
| Transition içinde **tam** world loading (tek blob) | **TCS-1:** zihinsel durum koreografisi (Dissolve → Drift → Expansion). |
| Injection içinde **zihinsel** animasyon / bilinç modu | **OWIS-1:** dünya gerçekliği enjeksiyonu (W0→…); görünür hareket TCS ile **hizalı** ama **sorumluluk** ayrı modüllerde. |
| UI içinde tek satırda hem state change hem dünya patlaması | **Sonuç hissi** tek; **kod** transition vs injection’ı ayırır. |

**Okuma:** `transition = continuity problem` · `injection = perception problem`. Birlikte okununca bilinç geçişi ile dünya yoğunluğu **eşzamanlı yönetilir**, **aynı fonksiyon içinde çözülmez**.

**Drift + OWIS:** [TCS-1 Drift](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md) sırasında görünür **dünya yok**; sistem yine de “boş” değil — bilinç modu TCS’te kalır; OWIS **Expansion sınırından sonra** başlar.

---

## 3. W0–W3+ boru hattı (progressive disclosure reality)

Dünya = **kademeli açılan gerçeklik**; bu pipeline gizli bir **gerçeklik yoğunluk** merdivenidir.

| Faz | Anlam | Kullanıcıya his (özet) |
|-----|--------|-------------------------|
| **W0** | **Yön / niyet** | “Nereye bakıyorum?” — carry, tek niyet, yön commit (henüz ağır dünya yok). |
| **W1** | **Skeleton world** | Zemin / globe kabuğu — düşük detay, düşük krom. |
| **W2** | **Anchored world** | Konum / ground truth ile **tutarlı** ana dünya (tek ana katman). |
| **W3** | **Live world** | Gateway / canlı veri dünyayı **besler** — yine kademeli. |
| **W3+** | **Telemetry / derin canlı** | Yoğun widget, çoklu sinyal, kernel yüzeyi — **jest veya gecikme** ile. |

Aşamalar **atlanamaz** (bir önceki tamamlanmadan sonraki faz “tam yoğunluk”ta açılmaz).

Bu tablo yalnız veri seviyesi değil — **deneyim dili** (hedef his):

| Faz | Deneyim (kullanıcı dili) |
|-----|---------------------------|
| **W0** | Niyet hissi |
| **W1** | Dünya taslağı |
| **W2** | Gerçeklik stabilizasyonu |
| **W3** | Canlı dünya |
| **W3+** | Sistemin nefes alması (yoğun, kontrollü) |

📌 Hedef algı: “harita açılıyor” değil — **dünya oluşuyor**.

---

## 4. İlk 3 saniye — “dünya hissi” hedefleri

| Zaman | Hedef | Yasak |
|-------|--------|--------|
| **0–1 s** | **W0** niyet/yön net; **W1** skeleton görünür; kamera agresif hareket etmez | Tam UI panel seti, debug, çoklu legend |
| **1–2 s** | **W2** anchored commit; dünya **anlamlı** (konum veya explicit “bilinmiyor” sakin mesajı) | Rastgele katman shuffle |
| **2–3 s** | **W3** (varsa) hafif canlı besleme; steady-state **spine sakinliğine** yakın ([STC L1](RHIZOH_STATE_TRANSITION_SPEC_V1.md)) | **W3+** telemetry, L4 “harita patlaması” |

**Kural:** Açılış anında **L2’ye kadar** yoğunluk kabul edilebilir; **3. saniye sonunda** kullanıcı “kalıcı olarak bombardıman” hissetmemeli — **ilk etki güçlü olabilir, kalıcı dünya ağır olmamalı**.

---

## 5. Veri yükleme önceliği (mantıksal sıra)

1. **W0 — Niyet / yön** — carry, tek soru, viewport niyeti (TCS semantic anchor ile hizalı).  
2. **Konum / viewport güvenliği** — yanlış dünya göstermemek (fallback: nötr bölge + sakin kopya).  
3. **W1 — Skeleton asset** — düşük LOD tile / globe shell.  
4. **W2 — Anchor** — ground truth ana katman.  
5. **W3 — Live** — gateway / canlı veri; timeout’ta W1/W2 + Calm mesajı.  
6. **W3+** — telemetry, ikincil paneller — jest veya süre sonrası.

**Prensip:** Önce **doğru ve sakin yanlış**, sonra zenginleştirme — “boş spinner” yerine **anlamlı düşük detay** tercih edilir.

---

## 6. Katman sırası (ürün, teknik değil)

“Altta ne, üstte ne” ürün kararı implementasyonda eşlenir; OWIS-1 **açılış sırasını** kilitler:

| Sıra | Katman sınıfı | Not |
|------|----------------|-----|
| 1 | Zemin (terrain / globe / base) | Her zaman ilk |
| 2 | Konum bağlı tek ana overlay | Carry öncelikli |
| 3 | İkincil sinyaller | Tek kanal veya sırayla |
| 4 | Analitik / yoğun UI | Gecikmeli veya jest |

**Yasak:** Açılış karesinde **3+ bağımsız renkli legend / panel** aynı anda.

---

## 7. Görsel overload önleme (hard rules)

| Kural | Açıklama |
|-------|-----------|
| **Max visible primaries** | İlk 3 s içinde en fazla **2** “birincil görsel iddia” (ör. harita + tek overlay). |
| **Breakthrough (gizli)** | Aynı anda çok iddia → **attention collapse** ve “çok şey var ama hiçbir şey yok” — max 2 kuralı bunu ürün seviyesinde keser. |
| **Bant genişliği yönetişimi** | Harita + hava + trafik + haber + telemetry aynı anda değil — bu kural **cognitive bandwidth governance**’dir. |
| **No telemetry forward** | Kernel metrikleri, log, debug yalnız **W3+** veya developer route. |
| **Legend discipline** | Legend / chip sayısı **kademeli** açılır; varsayılan minimal. |
| **Motion budget** | Kamera fly-in, parallax, pulse — toplam **düşük**; TCS “expansion” ile uyumlu. |

---

## 8. Hata ve yavaşlık (Calm uyumu)

| Durum | Davranış |
|-------|----------|
| Ağ yavaş | **W1** skeleton kalır; tek cümle ilerleme — stack trace yok |
| Konum reddi | Nötr dünya + ilişkili Companion cümlesi yolu (STC fallback) |
| Gateway kapalı | “Dünya şimdilik sınırlı” tonu; L4 mock veri patlaması yok |

---

## 9. TCS-1 ile sınır ve birleşik okuma

| Katman | Soru | Belge |
|--------|------|--------|
| **TCS-1** | Ben nasıl değişiyorum? (continuity / **attention state**) | Dissolve → Drift → Expansion |
| **OWIS-1** | Neye bakıyorum? (perception / **reality state**) | W0 → W1 → W2 → W3 → (W3+) |

**Motor (ürün çekirdeği):**

```text
TCS (attention state)  +  OWIS (reality state)
         →
   perceived continuity of world
```

**Birleşik okuma (Companion → Observe):** Bilinç geçişi ile dünya yoğunluğu **eşzamanlı ürün olarak** yönetilir; implementasyonda **timing (TCS)** ile **loading (OWIS)** ayrı modüllerdir — **TCS = timing**, **OWIS = loading**, **UI = yüzey**; en kritik iş yeni özellik yığmak değil, **geçiş + enjeksiyon hissini** mükemmelleştirmektir.

**Başarı ölçüsü (mühür):** Yalnız “ne yaptığı” değil — kullanıcının **kopmadan ne kadar süre içinde kalabildiği**; doğrulama: [ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md).

**Risk:** Kullanıcı **katmanları fark etmeye başlarsa** (“şu TCS geçişiydi”, “şimdi W2’deyim”, “world loaded”) **büyü kırılır** — sistem kendini açıklamamalı, **yaşanmalı** ([TCS-1 §5.1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md)).

---

## 10. İmplementasyon kancaları

- `worldInjectionPhase`: `W0 | W1 | W2 | W3 | W3_PLUS` (veya eşdeğer) state makinesi — Observe mount yaşam döngüsü; TCS `expand` ile **senkron başlatma** ama **ayrı state**.  
- Her faz geçişi: ürün telemetry (süre, abort, overload guard tetiklemesi).  
- [Invisible Kernel Tests](RHIZOH_IMPLEMENTATION_MAP.md#5-invisible-kernel-tests-product-ci): “ilk 3 saniye sakin mi?” checklist maddesi.  
- [ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md): kopma vs akış seansları.

---

## 11. İlişkili belgeler

- [Transition Choreography Spec TCS-1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md)  
- [Companion-first UX state machine](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md)  
- [Implementation Map](RHIZOH_IMPLEMENTATION_MAP.md)  
- [Experience Stress Test ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md)  

---

*OWIS-1 — reality state / W0–W3+; TCS’ten ayrı injection; cognitive bandwidth; dünya oluşumu.*
