# Firebase Kurulum Rehberi

## 1) Firebase projesi olustur

1. Firebase Console'da yeni bir proje ac.
2. Web App ekle ve config degerlerini al.
3. Authentication > Sign-in method icinde `Anonymous` etkinlestir.
4. Realtime Database olustur (production veya test).

## 2) Ortam degiskeni tanimla

Proje kokunde `.env` dosyasi olustur:

```env
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","databaseURL":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
```

Not: Deger tek satir JSON olmalidir.

## 3) Realtime Database kurallari (onerilen baslangic)

```json
{
  "rules": {
    "signals": {
      ".read": "auth != null",
      "$room": {
        ".write": "auth != null"
      }
    }
  }
}
```

## 4) Dogrulama kontrol listesi

- Uygulama acilisinda `Firebase anonim oturum aktif.` logu gorunmeli.
- `Ag` butonuna basinca `NETWORK_PING` sinyali yazilmali.
- Ikinci istemci acildiginda `SIG` loglariyla sinyal akisi gorunmeli.
