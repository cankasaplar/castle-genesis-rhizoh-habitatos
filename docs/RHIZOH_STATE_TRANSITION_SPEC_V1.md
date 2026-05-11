# Rhizoh — State Transition Spec (guarded navigation + mental continuity) V1

**Rol:** [Companion-first UX state machine](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md) üzerine oturan **geçiş sözleşmesi** — hangi zihinsel durumdan hangisine, **hangi koşulda**, **hangi UI ağırlığıyla**, **hangi geri dönüşle**. Ekran listesi değil; **kenarların** ürün güvenliği.

**Normatif üst belgeler:** [FREEZE-0](RHIZOH_FREEZE_0.md) · [Implementation Map](RHIZOH_IMPLEMENTATION_MAP.md) · [Invisible Kernel Tests / ürün CI](RHIZOH_IMPLEMENTATION_MAP.md#5-invisible-kernel-tests-product-ci) (yaşanabilirlik)

**Durum:** `NORMATIVE_TARGET`

---

## 1. URL = mental state anchor (route değil)

Kullanıcı “URL’ye bakıp path ezberlemez”; fakat **geri**, **paylaşım**, **bookmark**, **yenileme** anlarında path **tek stabil işaret** olur.

| Kavram | Anlam |
|--------|--------|
| **Path** | Yalnızca router tablosu değil — **zihinsel geçişin harici sabiti** (cognition graph düğümü). |
| **`productSurface`** | Path ile **çelişmeyen** kısa UI özeti; path yoksa veya geçiciyse bile path ile reconcile edilir. |
| **Hedef** | “Neredeyim?” sorusunun cevabı **görsel hiyerarşi + path + tek merkez** ile aynı hikâyeyi anlatır. |

Bu desen: **state-driven experience OS** — web sayfası koleksiyonu değil, **zihin akışı yönetimi**.

---

## 2. İki halka (geçiş yoğunluğu)

| Halka | Zihinsel profil | Geçiş politikası |
|-------|-----------------|------------------|
| **Spine** | Düşük bilişsel yük; günlük; sürekli | **Default**, **serbest** (izin matrisi içinde), geri tuşu önceliği. |
| **Second ring** | Yüksek yoğunluk; alan / kontrol / simülasyon / canlı gerçeklik | **Gated**, **intentional** — yanlışlıkla düşürülmez. |

---

## 3. FREEZE-0 = tek ekranda tek zihinsel state

**Yasak:** Aynı görünür yüzeyde **iki zihinsel state** (ör. aynı anda “kontrol + hafıza”, “analiz + ilişki”, “harita + kernel log + sohbet”).

**Gerekçe:** Dashboard + chat + map + log = **bilişsel kaos**; çoğu ürün burada kırılır. FREEZE-0 bu yüzeyi **ürün seviyesinde** yasaklar.

**STC çıkarımı:** Bir geçiş sadece **path değiştirmek** değil — önceki merkezi **kapatıp** yenisini **açmak** zorundadır (overlay ile “ikinci merkez” sızdırmamak).

---

## 4. Geçiş türleri (sözleşme sınıfları)

| Sınıf | Örnek kenar | Zorunlu guard | UI weight (bkz. §6) |
|-------|--------------|---------------|---------------------|
| **S–S** (spine–spine) | Companion ↔ Chronicle | Yok | **L1** |
| **S–S (koreografi zorunlu)** | **Companion → Observe** | [TCS-1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md): Dissolve → Drift → Expansion; [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md): dünya enjeksiyonu + ilk 3 s; **L4 sıçraması yok** | **L1 → L0.5 → ≤L2** (açılış anı; steady-state Observe yine spine sakinliği içinde kalibre edilir) |
| **S–2** (spine → second) | Companion → Studio | Studio: **secondary** (açık niyet veya iki adım önerilir) | **L2→L3** |
| **2–S** (second → spine) | Studio → Companion | **Fallback zorunlu** (§7) | **L3→L1** |
| **2–2** | Castle → Studio | İkisi yoğun; **tek hedef** netliği | **L3** |
| **Boot** | * → Onboarding → Companion | Continuity / auth | **L0→L1** |
| **Gated** | * → Spiral | Feature flag + Phase E ([FREEZE-0 §7](RHIZOH_FREEZE_0.md)) | **L4** |

---

## 5. Guard kuralları (ürün güvenliği)

### 5.1 Hard gate (geçiş yok veya koşullu)

- **Spiral:** Flag kapalıysa path erişimi **redirect** (tercihen Companion veya son spine).
- **Yetkisiz Castle:** Auth / izin yoksa **Companion + açıklayıcı durum** (log dump değil).

### 5.2 Soft gate (Studio ve ağır second ring)

- Spine’dan Studio: **primary nav’da gizli veya overflow**; mümkünse **onay veya “Güç moduna geç”** mikro-adımı.
- Amaç: kullanıcı **yanlışlıkla** ağır sisteme düşmesin.

### 5.3 İzin matrisi (özet)

[UX state machine §5](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md) matrisi normatiftir: **Studio secondary**, **Spiral gated**, **default çıkış Companion**.

---

## 6. UI weight (geçişte yoğunluk sözleşmesi)

Geçişte “ne kadar şey görünür?” — **kenarın parçasıdır**, ekranın değil.

| Seviye | Yoğunluk | Tipik yüzey |
|--------|-----------|-------------|
| **L0** | Splash / sistem | Boot |
| **L1** | Sakin, tek merkez | Companion, Chronicle, Observe (steady-state) |
| **L0.5** | Geçiş ara fazı (yalnız koreografi) | [TCS-1 Drift](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md) |
| **L2** | Orta | Castle (kurulum tamamsa) |
| **L3** | Yüksek | Studio |
| **L4** | Maks + deneysel | Spiral |

**Kural:** Spine içinde **L1 dışına** çıkan krom (debug, çoklu panel, layer kontrolü) **taşınmaz** — hedef state’e taşınır veya gizlenir.

**Companion → Observe:** Genel tabloya ek olarak **TCS-1** (koreografi) ve **OWIS-1** (dünya nasıl gelir) zorunlu — bu kenar “ben → dünya” bilişsel çerçeve kaymasıdır; ikisi olmadan STC **eksik** sayılır.

---

## 7. Mental continuity (fallback ve geri)

Her **S–2** ve **2–*** geçişi için ürün şu üçlüyü tanımlar:

| Bileşen | Soru |
|---------|------|
| **Carry** | Hangi **minimal bağlam** (ör. seçili olay, castle id) URL veya store’da kalıcı? |
| **Surface label** | Kullanıcıya “şimdi Control / Space / …” tek cümleyle net mi? |
| **Fallback** | Geri / iptal / hata / yetkisiz: kullanıcı **nerede güvende**? (Varsayılan: **Companion**.) |

**Yanlış geçiş riski (birincil ürün riski):**  
Hata artık yalnız “bug” değil — **Companion → Studio erken**, **Chronicle → Castle yanlış bağ** gibi **state transition** hataları deneyimi kırar. Bu spec’in QA’sı: kenar başına **“bu geçiş sakin mi?”** ([Invisible Kernel Tests](RHIZOH_IMPLEMENTATION_MAP.md#5-invisible-kernel-tests-product-ci)).

---

## 8. Path = zihinsel geçiş (cognition graph köşeleri)

Önerilen **anlam sabitlemesi** (hedef rota ile birlikte):

| Path (hedef) | Zihinsel düğüm |
|--------------|----------------|
| `/companion` | İlişki (relational) |
| `/chronicle` | Hafıza (temporal self) |
| `/observe` | Farkındalık (world grounding) |
| `/castle/…` | Uzamsal varlık (presence / space) |
| `/studio` | Kontrol (orchestration) |
| `/spiral` | Simülasyon / kolektif (gated) |

Bu tablo **routing’i cognition graph’a** bağlar; implementasyonda redirect ve isimler evrilebilir, **anlam** sabit kalır.

---

## 9. Alt bar = algı stabilizasyon katmanı

Spine’da **3 tab**; ikinci halka **overflow**: bu bir “UI tercihi” değil — **nerede olduğunu bilme** stabilizasyonu. STC: spine tab değişimi her zaman **S–S** gibi davranır (L1↔L1).

---

## 10. Uygulama kancaları (kod için kısa)

1. Path → surface **tek senkron noktası**; çelişen `SET_PRODUCT_SURFACE` kaldırılır.
2. Gated route’lar: **redirect + telemetry (ürün)** — hata stack’i kullanıcıya değil.
3. Studio girişi: spine’dan **component-level guard** (overflow, iki adım veya açık “Güç” etiketi).
4. Her yeni kenar: bu belgede **guard + weight + fallback** satırı eklenmeden “tam” sayılmaz.

---

## 11. İlişkili belgeler

- [Companion-first UX state machine V1](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md) — durumlar ve FSM grafiği  
- [FREEZE-0 — UI collapse](RHIZOH_FREEZE_0.md)  
- [Implementation Map](RHIZOH_IMPLEMENTATION_MAP.md) — spine / ikinci halka ürün stratejisi  
- [Transition Choreography Spec TCS-1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md) — Companion → Observe perception pipeline  
- [Observe World Injection Spec OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) — Expansion sonrası katman / ilk 3 saniye  
- [Experience Stress Test ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md) — kopma vs akış  

---

*State Transition Spec V1 — guarded navigation, UI weight, mental continuity, yanlış geçiş riski.*
