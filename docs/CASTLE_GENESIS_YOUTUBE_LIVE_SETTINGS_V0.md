# Castle Genesis — YouTube canli yayin ayarlari (V0)

**Tag:** `RESEARCH-ONLY` · Phase gate: data-plane / FER-1 broadcast tam degil — once **manuel OBS + YouTube** test.

**On kosul:** Gizli VOD testi gecti (`castle genesis test kendi yalanina`).

---

## Fazlar (kademeli)

| Faz | YouTube gorunurluk | Amac |
|-----|-------------------|------|
| **L0** | Gizli canli | Sadece davetli (cankasaplar@gmail.com) — teknik test |
| **L1** | Liste disi canli | Linki olan izler — arkadas/kohort |
| **L2** | Herkese acik | Ancak activation / Honest Baseline checklist sonrasi |

Simdi: **L0 veya L1**.

---

## YouTube Studio — canli yayin olustur

1. [studio.youtube.com](https://studio.youtube.com) → kanal **CastleGenesis**
2. **Oluştur** → **Canlı yayın yap**
3. **İlk kez:** kanalda canli yayin etkinlestirme (24 saat bekleme kurali olabilir — YouTube uyarir)

### Yayin turu

| Secenek | Oneri |
|---------|--------|
| **Hemen** | L0 test icin |
| **Zamanla** | Aksam **19:44** canli (HOLD — dosyalar hazir) |

### Baslik (ornek L0)

`[LIVE TEST L0] Castle Genesis · Rhizoh observation lane`

### Aciklama (sablon)

```
Castle Genesis — canli altyapi testi (V0).
Observation != Execution · canonical execution yok.
Ses + statik yuzey; urun lansmani degil.

rhizoh.com · #CastleGenesis #Rhizoh #HonestBaseline
```

### Kategori

Science & Technology veya Education

### Cocuklara uygun

Evet (uygunsuz icerik yok)

### Gizlilik (L0)

**Gizli** → davet: `cankasaplar@gmail.com` (VOD ile ayni mantik)

### Gizlilik (L1)

**Liste disi** — RTMP link + yayin URL’si yeterli

---

## OBS (veya Streamlabs) — teknik

1. **Kaynaklar**
   - Gorsel: `apps/client/public/ops/youtube-test/castle-genesis-holding-slide.png`
   - Ses: playlist (`Kendi_Yalanina...` m4a + sonraki parcalar)
2. **Ayarlar → Yayin**
   - Hizmet: **YouTube / YouTube Gaming**
   - Hesap: **cankasaplar@gmail.com** (CastleGenesis kanalina bagli)
   - Yayin anahtarini Studio’dan al (asagida)

### YouTube stream key

Studio → **Oluştur** → **Canlı yayın** → sag ust / **Yayın ayarları** → **Stream URL** + **Stream key**  
OBS’e yapistir (key’i paylasma, repoya yazma).

### Onerilen encode (baslangic)

| Alan | Deger |
|------|--------|
| Cozunurluk | 1920x1080 veya 1280x720 |
| FPS | 30 (statik slide icin 30 yeter) |
| Bitrate video | 2500–4500 Kbps |
| Encoder | x264 veryfast / NVENC varsa |
| Ses | 160 kbps AAC |

---

## Hangi hesap?

| Islem | Hesap |
|--------|--------|
| Studio / OBS baglanti | **cankasaplar@gmail.com** |
| Kanal | **CastleGenesis** |
| Gizli izleme | Davetli Gmail ile giris |

---

## Rhizoh sistem otomasyonu (simdi / sonra)

| Simdi (manuel) | Sonra (repo) |
|----------------|--------------|
| OBS + playlist | `streamComposer.js` → alt bant metni |
| YouTube Studio | `youtubePublisherAnalyticsCoherenceHook` (RESEARCH) |
| VOD test gecti | FER-1 `broadcast_index` (spec, kod eksik) |

**Kural:** Canli yayin **execution yazmaz** — yalnizca observation / test etiketi.

---

## L0 kontrol listesi (yayin oncesi)

- [ ] Stream key OBS’te, test baglantisi yesil
- [ ] Slide + ses playlist caliyor
- [ ] Baslik/aciklama Honest Baseline
- [ ] Gizli davet veya liste disi secildi
- [ ] 2–5 dk test yayini → Studio’da kayit olusuyor mu

---

## Ilgili

- [`CASTLE_GENESIS_YOUTUBE_TEST_BROADCAST_V0.md`](CASTLE_GENESIS_YOUTUBE_TEST_BROADCAST_V0.md) — VOD
- [`docs/exports/media/youtube/`](../exports/media/youtube/) — test MP4
- [`OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md`](OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md) — ton
