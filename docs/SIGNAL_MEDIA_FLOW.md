# Sinyal, Ses ve Goruntu Akisi

## Butonlarin davranisi

- `Ses`: Mikrofon izni ister, ses track'i acar/kapatir, sinyal kanalina durum gonderir.
- `Video`: Kamera izni ister, video track'i acar/kapatir, sag panelde onizleme verir.
- `Hareket`: `devicemotion` dinler ve olcumleri sinyal kanalina yollar.
- `Ag`: Realtime Database kanalina anlik ping sinyali gonderir.

## Kanal yapisi

Sinyaller su yola yazilir:

`signals/habitat-room-main`

Her event asagidaki alanlari tasir:

- `type`: Event tipi (`AUDIO_ENABLED`, `VIDEO_ENABLED`, `MOTION_SAMPLE`, `NETWORK_PING`, `SPAWN_AGENT`)
- `payload`: Event verisi
- `sender`: Firebase user id
- `ts`: istemci zamani
- `version`: uygulama cekirdek surumu

## Operasyon notlari

- Tarayici izinlerini engellersen ses/video/hareket devreye girmez.
- `databaseURL` yoksa ag butonu sadece hata logu uretir.
- Gercek peer-to-peer medya dagitimi gerekiyorsa bu sinyal akisina WebRTC offer/answer + ICE mesajlari eklenmelidir.
