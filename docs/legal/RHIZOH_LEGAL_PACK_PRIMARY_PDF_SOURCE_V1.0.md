---
title: "Rhizoh Legal & Privacy Pack v1.0"
subtitle: "Attorney Review — Primary Document (DRAFT)"
date: "2026-05-19"
document-status: "Taslak — Nihai yasal metin değildir"
---

\newpage

# RHIZOH LEGAL & PRIVACY PACK v1.0 (DRAFT)

## Rhizoh Systems — Attorney Review Document

| | |
|---|---|
| **Durum** | Taslak (Attorney Review) |
| **Tarih** | 2026-05-19 |
| **İşletmeci** | Can Kasaplar |
| **Adres** | Serencebey Yokuşu Sokak No: 13/2, Beşiktaş, 34357 İstanbul |
| **Hukuki iletişim** | cankasaplar@gmail.com |
| **KVKK başvuru** | cankasaplar@gmail.com |

**Bu belge nihai yasal metin değildir.** Avukat incelemesi sonrası yürürlüğe alınacak resmi sürümler ayrıca onaylanacaktır.

**İçindekiler:** (1) Özet · (2) AI feragati · (3) Sorumluluk · (4) WAL · (5) ToS · (6) KVKK · (7) Çerez · (8) AI açık rıza · (9) Yurtdışı aktarım notu

---

# BÖLÜM I — ÖZET ÇERÇEVE (NON-TECHNICAL)

## 1. Proje tanımı

Rhizoh, kullanıcıların yapay zeka destekli içerik üretimi, analiz ve etkileşim gerçekleştirebildiği bir **yazılım ve teknoloji platformudur**. Sistem kullanıcı girdilerini işler, yapay zeka ile içerik üretir, kullanıcıya sunar ve işlemleri denetlenebilir şekilde kayıt altına alır. Rhizoh **karar verici sistem değildir**; fiziksel hizmet sunmaz.

## 2. Hukuki statü

Rhizoh, **yapay zekâ destekli yazılım platformu ve altyapı sağlayıcısıdır** (SaaS / infrastructure provider). İçerik üreticisi veya yayıncı değildir. Kullanıcı içeriklerinin sahibi değildir; sahiplik kullanıcıdadır. Hukuki, tıbbi, finansal veya resmi bağlayıcı danışmanlık vermez; kullanıcı adına karar almaz.

## 3. Hizmetin niteliği

Rhizoh sosyal ağ, finansal hizmet veya yatırım platformu değildir. Yazılım altyapısı ve yapay zekâ destekli üretim ortamıdır.

---

# BÖLÜM II — YAPAY ZEKÂ ÇIKTISI FERAGATİ (AI OUTPUT DISCLAIMER)

## A.1 Bağlayıcı olmayan nitelik

Rhizoh üzerinde çalışan yapay zeka modülleri (ör. Lab AI, Companion ve benzeri araçlar) **yardımcı üretim aracıdır**; karar verici otorite değildir.

Yapay zeka çıktıları:

- kesin doğruluk veya gerçeklik beyanı **değildir**,
- hukuki, tıbbi, finansal veya resmi tavsiye **değildir**,
- kullanıcı tarafından **doğrulanmalıdır**,
- çekirdek sistem durumunu veya mühürleri tek başına **değiştirmez**.

## A.2 Gözlem ile yürütme ayrımı (Observation ≠ Execution)

**Anlatı katmanı (L4):** Yapay zeka ve arayüz çıktıları — kurgusal, yorumlayıcı, gözlemsel.

**Çekirdek yürütme katmanı (L1):** Durum makinesi, mühürleme, denetim günlüğü — protokol kurallarına tabi doğrulanmış geçişler.

Kullanıcı, yapay zeka çıktılarına dayanarak sistem durumunun, hakların veya yükümlülüklerin değiştiğini **varsaymayacağını** kabul eder.

## A.3 İşletmeci taahhüdü sınırı

İşletmeci, yapay zeka çıktılarının hatasız, eksiksiz, güncel veya belirli bir amaca uygun olduğunu **taahhüt etmez**.

---

# BÖLÜM III — SORUMLULUK SINIRLANDIRMASI (LIABILITY)

## B.1 Kullanıcı sorumluluğu

Kullanıcılar; ürettikleri içerikten, yaptıkları işlemlerden ve paylaştıkları verilerden **bizzat sorumludur**.

## B.2 Platform sorumluluğu — sınırlar

Rhizoh:

- altyapı ve araç sağlar,
- teknik log ve işlem kaydı tutar,
- kullanıcı içeriğinin **doğruluğunu veya yasal uygunluğunu garanti etmez**,
- kullanıcı davranışlarını **kontrol eden taraf değildir**,
- kullanıcı tarafından oluşturulan içerikten **doğrudan sorumlu tutulamaz** (yürürlükteki zorunlu hükümler saklı).

## B.3 Egemen düğüm (Sovereign Node)

Kullanıcının veya üçüncü kişinin işlettiği **egemen düğüm** üzerinde üretilen, işlenen veya barındırılan verilerin hukuki ve cezai sorumluluğu **düğüm işletmecisine / kullanıcıya** aittir.

## B.4 Yasal sorumluluk sınırı (genel)

Kanunun izin verdiği azami ölçüde; dolaylı zarar, veri kaybı, kar kaybı ve üçüncü taraf yapay zeka çıktılarından doğan zararlardan işletmeci sorumlu tutulamaz. Kast ve ağır kusur saklıdır. Hizmet “olduğu gibi” sunulur.

## B.5 Yasaklı iddialar

Platform; hukuki garanti, kesin doğruluk garantisi veya kullanıcı adına otomatik işlem yetkisi **iddasında bulunmaz**.

---

# BÖLÜM IV — VERİ KAYDI VE DENETİM GÜNLÜĞÜ (WAL / APPEND-ONLY LOG)

## C.1 Mimari özet

Rhizoh, çalışma bütünlüğü, sistem güvenliği ve **adli denetlenebilirlik** amacıyla:

- işlem ve durum geçişi kayıtları,
- zaman damgalı olay kayıtları,
- bütünlük zinciri teknikleri

ile desteklenen **değiştirilemez (append-only) denetim günlüğü** kullanabilir.

## C.2 Resmi ifade (KVKK / kullanıcı metni)

“Sistem üzerindeki durum geçişleri, veri bütünlüğü ve adli denetlenebilirlik amacıyla, kriptografik zaman damgaları ve bütünlük teknikleri ile desteklenen **değiştirilemez bir denetim günlüğünde** saklanabilir.”

## C.3 Amaç sınırı

Kayıtlar; güvenlik, hata analizi, teknik denetim ve yasal yükümlülükler için kullanılır. Gizli profilleme veya mevzuata aykırı işleme amacı taşımaz.

## C.4 Veri sahibi hakları

KVKK m.11 ve GDPR kapsamındaki haklar geçerlidir. Bütünlük zincirinin korunması için bazı silme taleplerinin teknik veya hukuki sınırları olabilir (ör. anonimleştirme veya erişim kısıtı).

---

\newpage

# BÖLÜM V — KULLANIM ŞARTLARI (TERMS OF SERVICE) — TAM METİN

**Sürüm:** v0.1 · **Yürürlük:** 19.05.2026  
**İşletmeci:** Can Kasaplar, Serencebey Yokuşu Sokak No: 13/2, Beşiktaş, 34357 İstanbul

## 1. Tanımlar

**Rhizoh:** Yapay zekâ destekli yazılım platformu ve altyapı sağlayıcısı (SaaS) olarak sunulan yazılım bütünü. Fiziksel hizmet sunmaz.

**Kullanıcı:** Platforma erişen gerçek veya tüzel kişi.

**L1 (çekirdek yürütme):** Durum makinesi, mühürleme, append-only denetim günlüğü (WAL).

**L4 (anlatı):** Yapay zeka ajan çıktıları (Lab AI, Companion vb.).

**Egemen düğüm:** Kullanıcı veya üçüncü tarafça işletilen Rhizoh uyumlu düğüm.

## 2. Hizmetin niteliği

Rhizoh otomatik karar mercii veya genel sohbet ürünü değildir. Altyapı protokolü sağlar. Yatırım, hukuk, sağlık alanında bağlayıcı tavsiye vermez.

## 3. Gözlem ile yürütme ayrımı

L4 çıktıları bağlayıcı gerçeklik beyanı veya L1 durum değiştirici değildir. Kullanıcı bu çıktılara dayanarak hak veya durum değişimi varsaymayacaktır.

## 4. Denetim günlüğü

Durum geçişleri append-only denetim günlüğünde tutulabilir. Saklama: Aydınlatma Metni.

## 5. Egemen düğüm ve içerik

Düğüm verilerinden düğüm işletmecisi sorumludur. Platform içerik denetçisi değildir.

## 6. Kullanım kuralları

Mevzuata aykırı kullanım, yetkisiz müdahale ve yürütme yetkisi iddiası yasaktır.

## 7. Sorumluluğun sınırlandırılması

“Olduğu gibi” sunum. Dolaylı zarar ve AI çıktı zararları — kanunun izin verdiği ölçüde hariç. Kast/ağır kusur saklı.

## 8. Fikri mülkiyet

Rhizoh marka ve yazılımı işletmeciye aittir.

## 9. Değişiklikler

Güncelleme hakkı saklı; esaslı değişiklikler duyurulur.

## 10. Uygulanacak hukuk

**Hukuk:** Türkiye Cumhuriyeti · **Mahkeme:** İstanbul (Çağlayan) — tüketici hakları saklı.

## 11. İletişim

cankasaplar@gmail.com

---

\newpage

# BÖLÜM VI — AYDINLATMA METNİ (KVKK / GDPR) — TAM METİN

**Sürüm:** v0.1 · **Veri sorumlusu:** Can Kasaplar

## 1. Veri sorumlusu

KVKK ve GDPR kapsamında veri sorumlusu: Can Kasaplar.

## 2. İşlenen veriler

Kimlik/iletişim, işlem güvenliği (IP, oturum), kullanım logları, egemen düğüm konum verisi (onaylı), denetim günlüğü (WAL) kayıtları.

## 3. Denetim günlüğü (append-only)

Durum geçişleri değiştirilemez denetim günlüğünde saklanabilir. Şeffaflık ve bütünlük amacı. Saklama süreleri politika ile sabitlenir. Silme talepleri — bütünlük istisnaları saklı.

## 4. Hukuki sebepler

Sözleşme, meşru menfaat, hukuki yükümlülük.

## 5. Aktarım

Barındırma, CDN (Cloudflare vb.), destek — sözleşmesel güvence. Yurt dışı: KVKK m.9 / GDPR Chapter V.

## 6. Saklama

Hesap: hesap süresi + 24 ay. Güvenlik log: 12 ay. Denetim günlüğü (WAL): 24 ay.

## 7. Haklar

cankasaplar@gmail.com — erişim, düzeltme, silme, itiraz, taşınabilirlik (GDPR).

## 8. Çerezler

Zorunlu çerezler; analitik için ayrı onay.

## 9. Güvenlik

TLS, WAF, erişim kontrolü, rate limiting.

## 10. Egemen düğüm

Düğümde veri sorumlusu çoğunlukla düğüm işletmecisidir.

## 11. Değişiklikler

Politika güncellenebilir.

---

\newpage

# BÖLÜM VII — ÇEREZ POLİTİKASI (TAM METİN)

**Sürüm:** v1.0 · **Yürürlük:** 19.05.2026 · **Veri sorumlusu:** Can Kasaplar

## 1. Çerez nedir?

Çerezler, tarayıcınıza kaydedilen küçük metin dosyalarıdır. Benzer teknolojiler (localStorage oturum anahtarları) aynı politika kapsamında değerlendirilir.

## 2. Türler

| Tür | Amaç | Zorunlu? |
|-----|------|----------|
| Zorunlu | Oturum, güvenlik, hukuki onay kaydı | Evet |
| Analitik | Kullanım istatistiği | Hayır — **varsayılan kapalı** |

## 3. Analitik

Rhizoh analitik çerezleri **varsayılan olarak kullanmaz**. Açılırsa ayrı onay kutusu ile etkinleştirilir.

## 4. İletişim

cankasaplar@gmail.com

---

\newpage

# BÖLÜM VIII — AÇIK RIZA (YAPAY ZEKÂ + YURTDIŞI AKTARIM)

**Sürüm:** v1.0 · **Veri sorumlusu:** Can Kasaplar

**Not:** Data-plane şu an kapalıdır; bu metin özellikler etkinleştirildiğinde uygulanacak çerçeveyi açıklar.

## 1. Konu

Yapay zekâ özellikleri kapsamında kişisel verilerin işlenmesi ve yurtdışı hizmet sağlayıcılara aktarımı.

## 2. Potansiyel sağlayıcılar

| Sağlayıcı | Amaç | Bölge |
|-----------|------|-------|
| OpenAI | AI yanıt üretimi | Yurtdışı |
| Anthropic | AI inference | Yurtdışı |
| Google (Gemini) | Model servisleri | Yurtdışı |
| xAI | AI inference | Yurtdışı |

## 3. Haklar

KVKK m.11 — rıza geri alma: cankasaplar@gmail.com

## 4. Rıza beyanı

Ayrı checkbox ile özgür irade onayı (ingress: `aiCrossBorderConsent`).

---

\newpage

# BÖLÜM IX — YURTDIŞI AKTARIM NOTU (COUNSEL)

**Kapsam:** KVKK m.9 odaklı · Data-plane kapalı.

- Yurtdışı aktarım: açık rıza ve/veya Kanun’daki diğer sebepler (counsel seçimi).
- İşlemci sözleşmesi (DPA): aktif sağlayıcı başına.
- AB veri sahibi genişlerse: SCC (2021 modülü) + TIA değerlendirmesi.

| Sağlayıcı | Counsel notu |
|-----------|----------------|
| OpenAI | DPA + m.9 rıza / SCC |
| Anthropic | Aynı |
| Google (Gemini) | Bölge seçimi kayıt altına |
| xAI | Aynı |

---

# SON SAYFA — AVUKAT NOTU

| Madde | Özet |
|-------|------|
| Platform | AI destekli SaaS / altyapı |
| AI çıktısı | Bağlayıcı değil; doğrulanmalı |
| Log | Append-only, denetlenebilir |
| Sorumluluk | Kullanıcı içerik; platform araç |
| İnceleme | ToS §3–7, KVKK §3, liability Bölüm III |

**Teknik referans (iç kullanım, hukuki iddia değil):** LEGAL_REALITY_SPEC_V0.1 · spec_sha256: 5dbeb7ee93e8b3ff40be73d569f93c9cec73eee37a7a3535205d87883a885972

---

*Rhizoh Systems — Legal Pack Primary v1.0 — DRAFT — 2026-05-19*
