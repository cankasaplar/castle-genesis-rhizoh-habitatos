# Firebase Cloud Functions — Rhizoh event router (FER-1)



**Durum:** `onRhizohEventCreated` — manifest tabanlı **envelope + stream/type** doğrulaması (`validateRhizohEvent.js`). Geçersiz belgeler **log** ile işaretlenir (üretimde dead-letter veya silme ürün kararı).



**Kök `firebase.json`:** `"functions": { "source": "functions" }` tanımlı.



**Deploy öncesi:**



```bash

cd functions

npm install

```



Kökten: `firebase deploy --only functions`



**Normatif:** [FER-1 Runtime Closure Patch](../docs/RHIZOH_FER1_RUNTIME_CLOSURE_PATCH_V1.md) · [Minimal Production Stack](../docs/RHIZOH_FER1_MINIMAL_PRODUCTION_STACK_V1.md)



**Manifest:** Deploy paketine dahil olması için kopya `functions/schemas/rhizoh_event_types.json` — normatif kaynak `docs/schemas/firebase/rhizoh_event_types.json` ile **senkron tutulmalı** (tip manifesti değişince iki dosyayı güncelleyin veya predeploy kopyası ekleyin).



**Alternatif:** Aynı mantığı önce `apps/gateway` içinde HTTP ile çalıştırın; Functions tek SoT olacak şekilde konsolide edin.


