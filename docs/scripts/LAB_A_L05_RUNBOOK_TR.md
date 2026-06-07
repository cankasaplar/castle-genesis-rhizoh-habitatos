# Laptop A — Lab L0.5 test (kopyala-yapıştır)

**Site:** https://rhizoh.com · sekme açık kalsın · **≥120 saniye** iki capture arası.

## 1) Script sırası (her biri: dosyayı aç → Ctrl+A → Console’a yapıştır → Enter)

**Hata `rhizohLabL05 is not defined` → Adım 2 yapılmamış.** Önce kontrol:

```javascript
typeof rhizohLabL05  // "object" olmalı
```

| # | Dosya |
|---|--------|
| 1 (önerilen) | [`rhizohGatewayHealthIndexV1.js`](rhizohGatewayHealthIndexV1.js) |
| 2 (**zorunlu**) | [`rhizohLabL05InlineV0.js`](rhizohLabL05InlineV0.js) (**kısa, tek yapıştır**) veya tam [`rhizohLabL05MetricsV0.js`](rhizohLabL05MetricsV0.js) |
| 3 (isteğe bağlı) | [`rhizohObserveButtonV0.js`](rhizohObserveButtonV0.js) — console kilitliyse |

**Windows tam yol:** `C:\Users\LENOVO\Desktop\castle\docs\scripts\rhizohLabL05MetricsV0.js`

İsteğe bağlı tam observe: `rhizohObserveGroundTruthV0_6.js` → `rhizohObserveConsoleV1.js`

## 2) Laptop A komutları (script’lerden sonra)

```javascript
// İlk ölçüm
const A_t0 = rhizohLabL05.capture({ label: "A_t0", laptop: "A" });
console.log("A_t0", A_t0.ssot);

// ⏱ En az 120 saniye bekle (sekme aktif). Sonra:
const A_t2 = rhizohLabL05.capture({ label: "A_t2", laptop: "A" });
console.log("A_t2", A_t2.ssot);

// Plateau özeti
rhizohLabL05.report();

// Arşiv (buraya kopyala)
copy(JSON.stringify(window.__rhizoh_lab_l05_log, null, 2));
```

`copy()` çalışmazsa:

```javascript
JSON.stringify(window.__rhizoh_lab_l05_log, null, 2);
```

## 3) Gateway kontrol (opsiyonel)

```javascript
rhizohGatewayHealth?.read?.();
```

## 4) Observe buton (console kilitliyse)

`rhizohObserveButtonV0.js` yapıştırdıktan sonra sağ üst **RHIZOH OBSERVE** → Copy JSON.

## 5) Beklenen (plateau)

`A_t2.ingress.plateau.producer_approx_consumer === true` → ingest≈drain (ör. ~17–18/s bandı).
