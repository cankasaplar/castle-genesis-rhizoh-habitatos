# RHIZOH First Impression Cinematic Contract v1

Bu belge, kullanicinin ilk 15 saniyede sistemden kopmamasini garanti eden launch sozlesmesidir.
Amaç: "vay be" hissini frame-frame tanimlamak ve ekipte yorum farkini sifirlamaktir.

## 1) Basari Kriteri

Ilk 15 saniye sonunda kullanici:

- dunya ile bag kurmali
- Rhizoh'un canli bir varlik oldugunu hissetmeli
- tek bir intent vermeye psikolojik olarak hazir olmali

Minimum KPI:

- time-to-emotional-hook <= 8s
- time-to-first-intent-readiness <= 15s

## 2) Launch Path Runtime Kisitlari

Bu contract aktifken:

- yeni panel/sekme acilmaz
- debug overlay son kullaniciya acilmaz
- SLE tek sahne ilkesi bozulmaz

## 3) 0–2s (Arrival)

Gorsel:

- black -> fade in
- ambient low-frequency sound
- global world pulse (yumusak)

Davranis:

- render pipeline stabilize olana kadar minimal hareket
- ani kamera ziplamasi yok

State beklentisi:

- `rhizohFieldState = IDLE`
- `realityState = WORLD_STABLE`
- `governanceState = NORMAL`

## 4) 2–5s (Recognition)

Ses:

- Rhizoh short voice:
  - "Hos geldin. Dunya seni fark etti."

Gorsel kanit:

- 1 hero agent wake pulse
- 1 swarm field pulse
- 1 memory echo spawn

Ilke:

- veri metinle degil sahnede kanitlanir

## 5) 5–8s (Anchoring)

Kamera:

- yumusak drift
- Istanbul / world anchor gorunur

Gorsel:

- live signal beacon'lari belirir
- insan-merkezli semantik odak korunur

Not:

- bu adim "soyut kure" yerine "yasanan dunya" hissi verir

## 6) 8–12s (Invitation)

Ses:

- Rhizoh short voice:
  - "Bir sey soyle. Ben onu dunyaya cevireyim."

Gorsel:

- mic orb pulse aktif
- human presence beacon guclenir

## 7) 12–15s (Intent Readiness)

UI:

- button degil semantic glow suggestions

Onerilen glow etiketleri:

- explore
- create
- ask
- build
- join

Ilke:

- secenek dayatma yok
- niyet daveti var

## 8) Map Visibility Contract (Launch Blocker)

Kural:

- launch path'te world/map default gorunur olmalidir

Risk:

- soyut globe tek basina bag kurdurmaz

Hedef:

- sehir/yer baglami merak uretir
- merak intent'i tetikler

Uygulama notu:

- Cesium/real-map conditional render launch path'te default ON profile ile acilmalidir
- fallback: map unavailable ise abstract globe + location beacon

Ek zorunluluk:

- "ciplak kure" launch path'te tek basina birakilmaz
- ikinci fallback olarak POI holographic overlay devreye girer

## 8.1 Adaptive Intro Routing (Runtime-Aware)

Intro tek tip degildir; substrate/governance baglamina gore route edilir:

- ilk kullanici -> `cinematic full`
- returning user -> `short intro`
- degraded/frozen governance -> `altered tone intro`
- recovery/safe mode -> `calm minimal intro`

Uygulama ilkesi:

- intro routing state-driven calisir
- timer tek basina karar vermez
- orchestrator output'u UI tarafinda sadece consume edilir

## 9) Instrumentation (Minimal)

Asagidaki telemetry eventleri zorunlu:

- `cinematic_phase_enter` (phase: 0_2, 2_5, 5_8, 8_12, 12_15)
- `voice_prompt_played`
- `anchor_visible`
- `mic_orb_pulse_started`
- `suggestion_glow_visible`
- `first_intent_submitted`

## 10) Go / No-Go

Go:

- tum fazlar akici calisir
- ses prompt'lari zamaninda gelir
- map/anchor gorunur
- kullanici 15s icinde intent girebilir

No-Go:

- 0-8s arasi sessiz/olaysiz geciyorsa
- map layer launch'te gorunmuyorsa
- mic orb daveti gecikiyorsa

## 11) Sonraki Siralama

Bu contract saglandiktan sonra:

1. governance FX
2. replay ghost trail
3. orb distortion polish

---

Belge surumu: 1.0 - `RHIZOH_FIRST_IMPRESSION_CINEMATIC_CONTRACT_V1.md`
