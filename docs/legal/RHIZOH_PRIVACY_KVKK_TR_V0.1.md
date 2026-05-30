# Rhizoh — Aydınlatma Metni ve Gizlilik Politikası (KVKK / GDPR)

**Sürüm:** v0.1 · **Yürürlük tarihi:** 19.05.2026  
**Veri sorumlusu:** Can Kasaplar, Serencebey Yokuşu Sokak No: 13/2, Beşiktaş, 34357 İstanbul · **İletişim / KVKK başvuru:** cankasaplar@gmail.com

> Kişisel verilerin korunması mevzuatına uyum için yetkili danışman incelemesi gereklidir.

---

## 1. Veri sorumlusu

6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) ve Avrupa Birliği Genel Veri Koruma Tüzüğü (“GDPR”) kapsamında veri sorumlusu: **Can Kasaplar**.

---

## 2. İşlenen veri kategorileri

| Kategori | Örnek | Amaç |
|----------|-------|------|
| Kimlik / iletişim | Ad, e-posta (hesap açılışı varsa) | Hesap, destek, hukuki yükümlülük |
| İşlem güvenliği | IP, oturum, cihaz tipi, tarayıcı | Güvenlik, kötüye kullanım önleme |
| Kullanım / log | API istekleri, hata kayıtları | Hizmet işletimi, denetim |
| Konum (egemen düğüm) | WGS84 anchor (kullanıcı onayı ile) | Protokol koordinatı — ürün tanımı gereği |
| Denetim günlüğü (WAL) | Durum geçişi kayıtları, bütünlük özeti | Bütünlük, adli denetlenebilirlik |

**Not:** Yapay zeka anlatı çıktıları (L4) kişisel veri içerebilir; kullanıcı girdisi işletmeci politikasına tabidir.

---

## 3. Denetim günlüğü (Append-Only Audit Log)

3.1. Rhizoh mimarisi gereği, sistem üzerindeki **durum geçişleri**, veri bütünlüğü ve adli denetlenebilirlik amacıyla, bütünlük teknikleri ve zaman damgaları ile desteklenen **değiştirilemez (append-only) bir denetim günlüğünde** saklanabilir.

3.2. Bu yapı; şeffaflık ve denetlenebilirlik ilkesini destekler. Kayıtlar, mevzuatta öngörülen veya meşru menfaat / hukuki yükümlülük süreleri boyunca saklanır; süre sonunda silme / anonimleştirme prosedürleri uygulanır (teknik imkânlar ve yasal istisnalar saklı).

3.3. Veri sahibi, KVKK m.11 ve GDPR kapsamındaki haklarını kullanabilir; ancak bütünlük zincirinin bozulmaması için bazı taleplerin teknik veya hukuki sınırları olabilir (ör. tam silme yerine erişim kısıtı veya anonimleştirme).

---

## 4. İşleme amaçları ve hukuki sebepler

| Amaç | Hukuki sebep (özet) |
|------|---------------------|
| Hizmet sunumu | Sözleşmenin ifası (KVKK m.5/2-c) |
| Güvenlik ve kötüye kullanım | Meşru menfaat / hukuki yükümlülük |
| Denetim ve bütünlük | Meşru menfaat, hukuki yükümlülük |
| Yasal saklama | Kanuni yükümlülük |

---

## 5. Aktarım

Veriler; barındırma, CDN (ör. Cloudflare), e-posta ve destek altyapısı sağlayıcılarına, sözleşmesel veri işleme şartları ile aktarılabilir. Yurt dışı aktarımda KVKK m.9 / GDPR Chapter V mekanizmaları (SCC, yeterlilik kararı vb.) uygulanır.

---

## 6. Saklama süreleri

| Veri türü | Süre (örnek — hukuk onayı gerekir) |
|-----------|-------------------------------------|
| Hesap verileri | Hesap süresi + 24 yıl |
| Güvenlik logları | 12 ay |
| Denetim günlüğü (WAL) | Bütünlük ve yasal yükümlülük süresi; politika dokümanında sabitlenir |

---

## 7. Veri sahibi hakları

KVKK m.11 ve GDPR kapsamında; bilgi talep etme, düzeltme, silme, işlemeyi kısıtlama, itiraz ve taşınabilirlik (GDPR) hakları için **cankasaplar@gmail.com** adresine başvurulabilir. Yanıt süresi mevzuata uygun şekilde yürütülür.

---

## 8. Çerezler ve benzeri teknolojiler

Zorunlu çerezler hizmet işletimi için kullanılabilir. Analitik çerezler varsa ayrı onay mekanizması sunulur. Ayrıntılar çerez politikasında yayımlanır.

---

## 9. Güvenlik önlemleri

Uygulanan teknik ve idari tedbirler özetle: TLS, erişim kontrolü, edge WAF / rate limiting, origin IP gizleme, least-privilege operasyon, olay müdahale prosedürü.

Teknik runbook: [`INFRASTRUCTURE_DNS_HARDENING_V0.1.md`](../INFRASTRUCTURE_DNS_HARDENING_V0.1.md).

---

## 10. Egemen düğüm işletmecileri

Kullanıcının kendi egemen düğümünde veri sorumlusu çoğu senaryoda **düğüm işletmecisidir**. Rhizoh merkezi işletmeci, yalnızca kendi işlediği veriler için bu metindeki sorumlulukları taşır.

---

## 11. Değişiklikler

Politika güncellenebilir; esaslı değişiklikler duyurulur.

---

*Teknik referans: [`LEGAL_REALITY_SPEC_V0.1.md`](../LEGAL_REALITY_SPEC_V0.1.md) · [`RHIZOH_TERMS_OF_SERVICE_TR_V0.1.md`](RHIZOH_TERMS_OF_SERVICE_TR_V0.1.md)*
