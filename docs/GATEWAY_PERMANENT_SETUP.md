# Gateway kalici kurulum (VPS + PM2 + Nginx + SSL)

Bu runbook ile `api.castlegenesis.com` alanini kalici gateway domaini yaparsin.

## 0) Gerekenler
- Ubuntu VPS (22.04+), sudo yetkisi
- Domain DNS paneline erisim
- Repo: `castle`
- Firebase Hosting zaten: `https://castle-genesis.web.app`

## 1) DNS
- `api.castlegenesis.com` icin A kaydi -> VPS public IP
- DNS yayilimini bekle (genelde 1-5 dk)

## 2) Sunucu temel kurulum
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

## 3) Repo ve env
```bash
sudo mkdir -p /opt/castle
sudo chown -R $USER:$USER /opt/castle
cd /opt/castle
git clone <YOUR_REPO_URL> .
npm ci --omit=dev
cp apps/gateway/.env.production.example apps/gateway/.env
```

`apps/gateway/.env` doldur:
- `OPENAI_API_KEY`
- `CASTLE_GATEWAY_TOKEN` (zorunlu onerilir)
- `CASTLE_ALLOWED_ORIGINS=https://castle-genesis.web.app`
- `CASTLE_HTTP_CORS_ORIGIN=https://castle-genesis.web.app`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `CASTLE_REQUIRE_AUTH=true`
- `CASTLE_ALLOW_DEV_ANON=false`
- `CASTLE_ALLOW_DEV_HTTP_UID=false`

## 4) PM2 ile gateway baslat
```bash
cd /opt/castle
cp deploy/gateway/pm2/ecosystem.config.cjs /opt/castle/ecosystem.config.cjs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Kontrol:
```bash
curl http://127.0.0.1:8090/health
```

## 5) Nginx reverse proxy
```bash
sudo cp /opt/castle/deploy/gateway/nginx/api.castlegenesis.com.conf /etc/nginx/sites-available/api.castlegenesis.com.conf
sudo ln -s /etc/nginx/sites-available/api.castlegenesis.com.conf /etc/nginx/sites-enabled/api.castlegenesis.com.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 6) SSL (Let's Encrypt)
```bash
sudo certbot --nginx -d api.castlegenesis.com
```

Kontrol:
```bash
curl https://api.castlegenesis.com/health
```

## 7) Client production env guncelle
`apps/client/.env.production`:
```env
VITE_GATEWAY_URL=https://api.castlegenesis.com
# token kullaniyorsan:
VITE_GATEWAY_TOKEN=<CASTLE_GATEWAY_TOKEN_ILE_AYNI>
```

Deploy:
```bash
npm run firebase:deploy:hosting
```

## 8) Launch verify
- `https://castle-genesis.web.app` ac
- Konsolda `ERR_NAME_NOT_RESOLVED` olmamali
- Gateway logunda istek akmali: `pm2 logs castle-gateway`
- Kimlik kontrolu icin gecici: `CASTLE_RHIZOH_LLM_IDENTITY_LOG=1`

## 9) Guncelleme rutini
```bash
cd /opt/castle
git pull
npm ci --omit=dev
pm2 restart castle-gateway
```

GitHub Actions alternatifi: `.github/workflows/deploy-gateway.yml` icin SSH secretlari tanimla.
