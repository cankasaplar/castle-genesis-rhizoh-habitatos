# Castle Genesis — YouTube gizli test videosu (V0)

**Tag:** `RESEARCH-ONLY` · altyapi / otomasyon testi — urun lansmani degil.

Ilk parca: **Kendi Yalanina Inanmayan Yapay Zeka** (ses).

---

## 1) Videoyu uret (PC)

```powershell
cd C:\Users\LENOVO\Desktop\castle
node scripts\export-youtube-holding-slide-png.mjs
powershell -File scripts\build-castle-genesis-youtube-test-video.ps1
```

Cikti: `docs\exports\media\youtube\castle_genesis_test_kendi_yalanina.mp4`

`ffmpeg` yoksa: [gyan.dev ffmpeg builds](https://www.gyan.dev/ffmpeg/builds/) — `ffmpeg.exe` PATH'e.  
Alternatif: OBS — sahne = `apps/client/public/ops/youtube-test/castle-genesis-holding-slide.png`, ses = m4a, MP4 kayit.

---

## 2) YouTube Studio — yukle

1. [YouTube Studio](https://studio.youtube.com) → kanal **Castle Genesis**
2. **Create** → **Upload video**
3. Dosya: `docs\exports\media\youtube\castle_genesis_test_kendi_yalanina.mp4`

### Baslik (TR)

`[TEST V0] Kendi Yalanina Inanmayan Yapay Zeka | Castle Genesis · Rhizoh`

### Aciklama (kopyala-yapistir)

```
Castle Genesis — sistem otomasyon / altyapi testi (V0).

Bu video urun lansmani veya canli AI iddiasi degildir.
Observation != Execution — yorum yurutmeye dokunmaz.

Ses: Kendi Yalanina Inanmayan Yapay Zeka (Rhizoh)
rhizoh.com · Honest Baseline

#CastleGenesis #Rhizoh #ContinuityFirst #HonestBaseline
```

### Ayarlar

| Alan | Deger |
|------|--------|
| **Visibility** | **Unlisted** (liste disi) — linki olan izler |
| Kategori | Science & Technology veya Education |
| Cocuklara uygun | Evet (siddet/yetiskin yok) |
| Yorum | Istegin: kapali veya sinirli |
| Shorts | Hayir (normal video) |

4. **Publish** → linki kopyala (test icin yeterli).

---

## 3) Otomasyon testi — ne sayilir?

| Gecer | Sayilmaz |
|-------|----------|
| Video yuklendi, unlisted link aciliyor | Rhizoh runtime otomatik yayin acti |
| Ses + holding slide senkron | Canonical execution / WAL yazildi |
| Baslik/aciklama Honest Baseline | Canli entity / Nisa vb. sunumu |

Sonraki adim (istege bagli): playlist, 2. parca (Rhizoh mimari m4a), YouTube analytics → coherence hook (RESEARCH).

---

## Dosyalar

| Dosya | Rol |
|-------|-----|
| `Kendi_Yalanına_İnanmayan_Yapay_Zeka_Rhizoh.m4a` | Kaynak ses (repo koku) |
| `apps/client/public/ops/youtube-test/castle-genesis-holding-slide.svg` | 1920x1080 kart |
| `scripts/build-castle-genesis-youtube-test-video.ps1` | MP4 birlestirme |
