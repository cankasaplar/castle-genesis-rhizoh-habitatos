# RHIZOH Single Layer Experience (SLE) v1

Bu belge, Rhizoh'un "sistem gorunmez, sonuc gorunur" ilkesini urun yuzeyine ceviren tek sahneli deneyim tasarimini tanimlar.

## 1. Tasarim Ilkesi

- Kullanici altyapiyi, modulleri, routing dallarini veya governance motorunu gormez.
- Kullanici yalnizca niyet verir; Rhizoh niyeti gerceklige/simulasyona derler.
- Urun vaadi: "Bir input yaz/seslendir -> olay, yayin veya dunya durumu olussun."

## 2. Tek Giris Yuzeyi: Rhizoh Field

Ekrandaki birincil kontrol tek bir "Multimodal Input Orb"tur.

- Voice input: dogal dil niyet
- Text input: hizli niyet komutu
- Gesture input (gelecek): sahne isaretleme ve spatial secim
- Context input: konum, zaman, cihaz durumu, aktif oturum telemetrisi

Rhizoh Field, salt metin kutusu degildir; bir "intent capture + context binding" noktasidir.

## 3. Tek Sahneli Goruntu: Reality Field

Tum urun gorunumu tek 3D sahnede yasar. Sekme, panel ve mode bollugu yerine algisal katmanlar vardir:

1. Base Layer (World): sehir/harita/sandbox/MMO zemini
2. Active Layer (Rhizoh Perception): ajan aktivitesi gorunurlugu (isik akislar, yogunluk, ses izi)
3. Intent Layer: kullanici niyetinin sahnede canli bir forma donusmesi

### Kamera Modlari

- Human View: standart oyuncu/kullanici bakisi
- Drone View: yuksek seviye operasyonel bakis
- Rhizoh View: ajan perspektifi ve sistem algisi

Kamera bir UI sekmesi degil, ayni sahnenin farkli bilissel lensleridir.

## 4. Instant Flow Engine (0-10 saniye)

Rhizoh, bir niyeti asagidaki surecte sonuclandirir:

- 0-2s: intent parse + context injection + entity mapping
- 2-6s: paralel uc hat
  - simulation preview
  - reality routing (Studio / MMO / OctoAI / GreenRoom)
  - hidden governance check
- 6-10s: tek ekran karar karti

Ornek karar karti:

- Event Ready
- Type: Live Broadcast
- Location: Istanbul Arena (simulated)
- Confidence: 0.92
- Risk: Low
- Aksiyonlar: Start / Why / Edit Intent

## 5. Ses ve Atmosfer Motoru

Rhizoh Sound Engine, sistem durumunu premium bir algisal katmana cevirir:

- Dusuk risk: yumusak ambient
- Yuksek aktivite: ritmik pulse
- Kritik governance: dusuk frekans heartbeat

Hedef, kullaniciya metin okumadan "sistem nabzini" hissettirmektir.

## 6. Explainability Layer (Why Surface)

Kullanici "Why?" dediginde Rhizoh, teknik karmaşıkligi insan diline cevirir:

- kapasite uygunlugu
- benzer olay basari orani
- governance conflict durumu
- secilen routing kompozisyonu

Bu katman default olarak gizlidir; sadece talepte acilir.

## 7. Human Control Surface

Minimal ama kritik kontrol cizgisi her zaman vardir:

- Undo
- Pause
- Autonomy slider (Human <-> Rhizoh)

Autonomy slider, deneyimin guven/otonomi dengesini tek harekette ayarlar.

## 8. Output Realities Modeli

Studio, MMO, OctoAI ve GreenRoom artik sekme degil "hedef gerceklikler"dir.

- Kullanici hedef sistemi secmez.
- Rhizoh intent + context + governance sonucuna gore otomatik route eder.
- Gerekirse hibrit cikis kurar (ornek: MMO + Studio).

## 9. Sistem Rol Tanimi

Rhizoh'un urun rol tanimi:

- Intent Compiler
- Reality Router
- Governance-Aware Orchestrator

Rhizoh kullanicinin gozunde bir "dashboard" degil, niyeti eyleme ceviren calisma motorudur.

## 10. v1 Uygulama Cekirdegi (Bu repo ile hizali)

Mevcut kod tabaninda guclu taraflar:

- kernel yetenegi
- governance katmanlari
- replay/proof temeli
- multi-agent ve simulation altyapisi

v1 odagi:

- coklu sistem katmanlarini tek algi yuzeyinde birlestirmek
- UI'daki moduler gorunumleri "Single Layer Experience" etrafinda sadeleştirmek
- ciktiyi one alıp altyapiyi perdelemek

## 11. Uygulama Fazlari (onerilen)

- SLE-P0: Rhizoh Field + Reality Field shell'i
- SLE-P1: Instant Flow Engine event karti + Start/Why/Edit Intent
- SLE-P2: Explainability Layer + Human Control Surface
- SLE-P3: Output Realities otomatik routing gorunurlugu
- SLE-P4: Sound Engine durum-temelli ses dokusu
- SLE-P5: Kamera modlarinin davranissal standardizasyonu

## 12. Basari Metrikleri

- Time-to-first-outcome (TTFO): niyetten ilk gorsel geri bildirim suresi
- Intent-to-event conversion rate
- Why click-through ve satisfaksiyon skoru
- Manual override oranlari (Undo/Pause/Slider)
- Basarisiz routing / governance blok oranlari

## 13. Sonuc

Teknik cekirdek zaten ileri seviyede oldugu icin stratejik ihtiyac "daha fazla altyapi" degil, "tek algi yuzeyi"dir. SLE, Rhizoh'un daginik gucunu tek bir premium deneyimde toplar: kullanici niyet verir, Rhizoh sonucu uretir.

---

Belge surumu: 1.0 - `RHIZOH_SINGLE_LAYER_EXPERIENCE_SLE_V1.md`
