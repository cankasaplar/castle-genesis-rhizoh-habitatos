# Cesium Ion + Cloudflare — Founder Runbook v1.0

**Tag:** `OPERATIONS` · Terminal gerekmez (tarayıcı + GitHub UI)

---

## Sorun özeti (2026-06-14 smoke)

`__RHIZOH_FULL_REPORT__()`:

```
BLOCKERS: missing_VITE_CESIUM_ION_TOKEN
spatial gate: buffered (cesium:pending)
cesium: ✘
```

**Neden:** Token daha önce `ANAHTARLAR_BURAYA.txt` / yerel `.env` içinde vardı; **üretim build** ise yalnızca **GitHub Actions secret** ile bake edilir. Secret boşsa harita kapısı açılmaz — Fox/studio görünür, Dünya haritası bekler.

**Tasarım:** Cesium “arka planda” spatial gate ile buffer’lar (`rhizohSpatialReadyGateV0.js`) — token gelince `castle:cesium-command-ready` → kuyruk drain. Activation READY değil; bu **ürün env** meselesi.

---

## Bölüm A — Cesium Ion token (önce bunu yap)

### A1) Token kaynağı

1. [Cesium Ion](https://cesium.com/ion/tokens) → giriş
2. **Default** veya yeni token → kopyala (`eyJ...` uzun JWT)
3. Veya yerel: `ANAHTARLAR_BURAYA.txt` içindeki `VITE_CESIUM_ION_TOKEN=` satırı

### A2) GitHub Secret

1. Repo → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
   - Name: `VITE_CESIUM_ION_TOKEN`
   - Value: token (tam yapıştır)
3. Kaydet

### A3) Yeniden deploy

1. GitHub → **Actions** → **Deploy Firebase (hosting + rules)**
2. **Run workflow** → branch `main` → track `spatial-main`
3. Build bitene kadar bekle (~10–15 dk)

### A4) Doğrula (rhizoh.com konsol)

```javascript
await __RHIZOH_FULL_REPORT__()
```

Beklenen:

- `BLOCKERS` içinde **yok:** `missing_VITE_CESIUM_ION_TOKEN`
- `cesium: ✔`
- `spatial gate: open` (veya `cesium:ready`)

Hard refresh: `Ctrl+Shift+R` → **Dünya** sekmesi → harita yüklenmeli.

---

## Bölüm B — Cloudflare + GoDaddy (A1 checklist)

Ekran görüntülerinde: Cloudflare’de `rhizoh.com` **kırmızı ünlem** = nameserver henüz bağlanmamış.

### B1) Cloudflare nameserver’ları al

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **rhizoh.com**
2. **Overview** → “Check nameservers” / **Pending** kutusu
3. İki NS kopyala (ör. `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`)

### B2) GoDaddy’de NS değiştir

1. [dcc.godaddy.com](https://dcc.godaddy.com) → **rhizoh.com**
2. **DNS** veya **Kayıt Ayarları** → **Nameservers**
3. **Custom** → Cloudflare NS yapıştır → Kaydet
4. Yayılma: 15 dk – 48 saat (çoğu zaman < 2 saat)

### B3) Cloudflare DNS kayıtları (Firebase Hosting)

Firebase Console → **Hosting** → **castle-genesis** → custom domains:

| Host | Tip | Hedef | Proxy |
|------|-----|--------|-------|
| `www` | CNAME | `castle-genesis.web.app` | **Proxied** (turuncu) |
| `@` | CNAME veya A | Firebase’in verdiği değer | **Proxied** |

Firebase apex için genelde `199.36.158.100` veya CNAME flattening — Firebase Hosting ekranındaki talimatı izle.

### B4) SSL

Cloudflare → **SSL/TLS** → **Full (strict)**  
**Edge Certificates** → **Always Use HTTPS** ON

### B5) Doğrula

Tarayıcıda (veya başka makinede):

```bash
curl -sI https://rhizoh.com | grep -i cf-ray
```

`cf-ray` görününce A1 tamam → `activation_decision` → `A1_dns_proxied: true`

---

## Sıra önerisi

1. **Bugün:** GitHub `VITE_CESIUM_ION_TOKEN` + deploy → harita
2. **Paralel:** Cloudflare NS + DNS (yayılırken beklenir)
3. **Counsel** (A3) — activation READY için hâlâ zorunlu

---

## İlgili dosyalar

- `ENV_KEYS.md` — secret listesi
- `.github/workflows/deploy-hosting.yml` — satır 102 `VITE_CESIUM_ION_TOKEN`
- `scripts/rhizoh-spatial-main-prod-profile.mjs` — optional key
- `docs/ops/ACTIVATION_MANUAL_EVIDENCE_RUNBOOK_V1.0.md` — activation checklist
