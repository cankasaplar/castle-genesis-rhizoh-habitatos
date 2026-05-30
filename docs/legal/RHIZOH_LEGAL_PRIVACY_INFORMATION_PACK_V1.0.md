# RHIZOH — Legal & Privacy Information Pack v1.0

**Status:** FOUNDER LEGAL FRAME — avukat incelemesi için birincil çerçeve  
**Tag:** `LEGAL-PUBLIC` · teknik mimari değil, hukuki pozisyon  
**İşletmeci:** Can Kasaplar · **İletişim:** cankasaplar@gmail.com · **KVKK:** cankasaplar@gmail.com

> **Avukata gidecek birleşik taslak:** [`RHIZOH_LEGAL_PACK_FOR_COUNSEL_V1.0.md`](RHIZOH_LEGAL_PACK_FOR_COUNSEL_V1.0.md) · **E-posta:** [`COUNSEL_EMAIL_TEMPLATE_V1.0.md`](COUNSEL_EMAIL_TEMPLATE_V1.0.md)

> Bu paket, dış dünyaya (site, regülatör, kullanıcı) yönelik **resmi dil** içindir. Teknik ekip: [`RHIZOH_TECHNICAL_ARCHITECTURE_SUMMARY_NON_LEGAL_V1.0.md`](RHIZOH_TECHNICAL_ARCHITECTURE_SUMMARY_NON_LEGAL_V1.0.md). İç hizalama: [`LEGAL_REALITY_SPEC_V0.1.md`](../LEGAL_REALITY_SPEC_V0.1.md).

---

## 1. Genel tanım

Rhizoh, kullanıcıların yazılım ortamı içinde veri işleyebildiği, yapay zekâ destekli araçlar sunan bir **yazılım ve teknoloji platformudur**.

Sistem;

- veri işleme,
- metin üretimi,
- analiz araçları,
- kullanıcı etkileşimli yazılım modülleri

sağlar.

Rhizoh **herhangi bir fiziksel hizmet sunmaz**.

---

## 2. Hukuki statü ve platform modeli

Rhizoh, hukuki olarak:

**“Yapay zekâ destekli yazılım platformu ve altyapı sağlayıcısı (software-as-a-service / infrastructure provider)”**

olarak konumlanır.

| Platform | Değildir |
|----------|----------|
| Kullanıcı tarafından oluşturulan içeriklerden **doğrudan sorumlu** | İçerik yayıncısı / editör |
| — | İçerik üretim **aracı**dır |

**Teknik ek ayrım (sözleşme eklerinde):** Yapay zekâ anlatı çıktıları bağlayıcı hakikat veya otomatik yürütme kararı oluşturmaz; çekirdek durum geçişleri protokol ve denetim günlüğü ile yönetilir. Bkz. Kullanım Şartları § Gözlem–Yürütme.

---

## 3. Sorumluluk sınırları

**Platform:**

- Kullanıcıların oluşturduğu içerikten sorumlu **değildir**.
- Üçüncü taraf kullanımından doğan sonuçlardan sorumlu **değildir**.
- Kullanıcının kendi verilerini nasıl kullandığına dair **kontrol sahibi değildir** (egemen düğüm / bağımsız kurulumlar dahil).

**Ancak:**

- Sistem log tutar.
- Sistem işlemleri izlenebilir şekilde kayıt altına alınır.
- Sistem teknik olarak **denetlenebilir** yapıdadır.

Tam metin: [`RHIZOH_TERMS_OF_SERVICE_TR_V0.1.md`](RHIZOH_TERMS_OF_SERVICE_TR_V0.1.md) § 5–7.

---

## 4. Veri işleme ve log politikası

Sistem, çalışma bütünlüğünü sağlamak amacıyla:

- işlem logları,
- zaman damgalı kayıtlar,
- sistem olay (event) kayıtları

tutar.

Bu kayıtlar;

- sistem güvenliği,
- hata analizi,
- teknik denetim

amaçlı kullanılır.

Kayıtlar **değiştirilemez yapıdadır** (append-only mantık).

**Resmi ifade (KVKK metni):** “Durum geçişleri, veri bütünlüğü ve adli denetlenebilirlik amacıyla kriptografik zaman damgalarıyla desteklenen değiştirilemez denetim günlüğünde saklanabilir.” — [`RHIZOH_PRIVACY_KVKK_TR_V0.1.md`](RHIZOH_PRIVACY_KVKK_TR_V0.1.md).

---

## 5. KVKK / GDPR uyum çerçevesi

Rhizoh, kişisel verilerle ilgili süreçlerde:

- veri minimizasyonu,
- amaçla sınırlılık,
- kullanıcı kontrolü

ilkelerini esas alır.

Kullanıcılar (mevzuat ve teknik sınırlar çerçevesinde);

- verilerini görüntüleyebilir,
- silebilir (**yasal saklama zorunlulukları** ve bütünlük zinciri istisnaları hariç),
- veri işleme faaliyetleri hakkında bilgilendirilir.

---

## 6. Yapay zekâ kullanım modeli

Sistem içindeki yapay zekâ modülleri (ör. Lab AI, Companion);

- **yardımcı araçtır**,
- **karar verici otorite değildir**,
- öneri ve analiz üretir.

Yapay zekâ çıktıları;

- kesin doğruluk beyanı **değildir**,
- kullanıcı tarafından **doğrulanmalıdır**,
- çekirdek sistem durumunu tek başına değiştirmez (Gözlem ≠ Yürütme).

---

## 7. İçerik sorumluluğu

Kullanıcılar;

- platforma yükledikleri içerikten,
- oluşturdukları analizlerden,
- yaptıkları işlemlerden

**bizzat sorumludur**.

Rhizoh;

- içerik üretmez (kullanıcı/ajan tetiklemesi hariç araç çıktısı),
- içerik denetleyici değildir,
- yalnızca **araç ve altyapı** sağlar.

---

## 8. Güvenlik ve erişim

Platform;

- yetkisiz erişime karşı standart güvenlik önlemleri uygular,
- erişim kontrolü sağlar,
- API ve UI seviyesinde rate limiting uygulayabilir.

Operasyon runbook: [`INFRASTRUCTURE_DNS_HARDENING_V0.1.md`](../INFRASTRUCTURE_DNS_HARDENING_V0.1.md) (Cloudflare, WAF, WHOIS privacy).

---

## 9. Hizmetin niteliği

Rhizoh;

| Değildir | Nedir |
|----------|--------|
| Sosyal ağ | Yazılım altyapısı ve AI destekli üretim ortamı |
| Finansal hizmet | — |
| Yatırım platformu | — |

---

## 10. Değişiklik hakkı

Platform, bu çerçevede yayımlanan metinlerde değişiklik yapma hakkını saklı tutar. Esaslı değişiklikler kullanıcıya bildirilir.

---

## Kısa özet (avukat için)

| Madde | Özet |
|-------|------|
| Ne | AI destekli yazılım / SaaS altyapı platformu |
| İçerik | Kullanıcı üretir; platform araç sağlar |
| Sorumluluk | İçerik → kullanıcı; platform doğrudan içerik sorumlusu değil |
| Log | Append-only, denetlenebilir |
| Uyum | KVKK/GDPR ilkeleri hedeflenir; tam metinler ayrı doküman |
| AI | Yardımcı araç; bağlayıcı karar/hakikat değil |

---

## Doküman haritası (v1.0 paketi)

| Dosya | Kitle |
|-------|--------|
| **Bu paket** | Avukat, regülatör, üst düzey özet |
| [`RHIZOH_TERMS_OF_SERVICE_TR_V0.1.md`](RHIZOH_TERMS_OF_SERVICE_TR_V0.1.md) | Kullanıcı sözleşmesi (yayımlanacak) |
| [`RHIZOH_PRIVACY_KVKK_TR_V0.1.md`](RHIZOH_PRIVACY_KVKK_TR_V0.1.md) | Aydınlatma / gizlilik |
| [`RHIZOH_TECHNICAL_ARCHITECTURE_SUMMARY_NON_LEGAL_V1.0.md`](RHIZOH_TECHNICAL_ARCHITECTURE_SUMMARY_NON_LEGAL_V1.0.md) | Teknik ekip (hukuki iddia içermez) |
| [`LEGAL_REALITY_SPEC_V0.1.md`](../LEGAL_REALITY_SPEC_V0.1.md) | Mühendislik ↔ hukuk hizalama |

---

## PDF çıktısı

Avukata gitmeden önce:

1. Bu dosya + ToS + KVKK → tek PDF (Word / Google Docs / `pandoc` ile birleştir).
2. Kapak: “Rhizoh Legal & Privacy Pack v1.0 — 19.05.2026 — Taslak”.
3. Son sayfa: spec SHA-256 (`node scripts/seal-legal-reality-spec.mjs`).

---

*Bu doküman teknik mimariyi değil, hukuki çerçeveyi tanımlar. Teknik detay için non-legal özet kullanılır.*
