# Rhizoh — Legal Entity SSOT v1.0

**Status:** ACTIVE — tüm hukuki metinlerde tek kaynak.

| Field | Value |
|-------|--------|
| **Veri sorumlusu / İşletmeci** | Can Kasaplar |
| **Posta adresi** | Serencebey Yokuşu Sokak No: 13/2, Beşiktaş, 34357 İstanbul, Türkiye |
| **Sabit iletişim (KVKK / hukuk / genel)** | cankasaplar@gmail.com |
| **Birincil web** | https://rhizoh.com |
| **Uygulama / genesis** | https://app.castle-genesis.com |
| **Marka sitesi** | https://castle-genesis.com |
| **Yürürlük (taslak)** | 19.05.2026 |

**Planlanan domain posta (counsel sonrası):** cankasaplar@gmail.com · cankasaplar@gmail.com — yalnızca posta kutusu canlı ve yönlendirme doğrulandığında metinlerde birincil kanal olarak değiştirilir.

## Saklama süreleri (özet)

| Veri | Süre |
|------|------|
| Güvenlik / erişim logları | 12 ay |
| Hesap verileri | Hesap süresi + 24 ay |
| Denetim günlüğü (WAL / bütünlük) | 24 ay |
| Hukuki yükümlülük saklama | Mevzuat süresi (üst sınır) |

## AI sağlayıcıları

Bkz. [`RHIZOH_AI_PROVIDER_MAPPING_V1.0.md`](RHIZOH_AI_PROVIDER_MAPPING_V1.0.md) · Yurtdışı aktarım notu: [`RHIZOH_CROSS_BORDER_TRANSFER_NOTE_V1.0.md`](RHIZOH_CROSS_BORDER_TRANSFER_NOTE_V1.0.md)

**Data-plane:** Kapalı — canlı kullanıcı ingest / heartbeat yok (`VITE_RHIZOH_PHASE1_SIGNAL` off).

## Hukuki katman ayrımı (TR)

| Katman | Durum |
|--------|--------|
| Aydınlatma | Zorunlu bilgilendirme (KVKK metni) |
| Açık rıza | Ayrı checkbox (`aiCrossBorderConsent`) |
| Çerez | Ayrı kontrol (analytics varsayılan kapalı) |
| AI provider aktarımı | Explicit consent + provider tablosu |
