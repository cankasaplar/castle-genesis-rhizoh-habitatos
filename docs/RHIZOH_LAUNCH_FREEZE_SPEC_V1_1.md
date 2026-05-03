# RHIZOH Launch Freeze Spec v1.1

Bu belge launch oncesi "degismez urun zemini"ni tanimlar.
Amac, sonsuz gelistirme dongusunu durdurup urunu kontrollu sekilde yayina almaktir.

## 1) Freeze Scope

Launch'a kadar iki kural gecerlidir:

1. Core davranis degismez.
2. UX loop yalnizca polish alir, yeni feature almaz.

## 2) Dokunulmamasi Gereken Dosyalar

Asagidaki dosyalar launch freeze kapsaminda "no functional change" statüsündedir:

- `apps/client/src/kernel/rhizohRuntimeGuarantees.js`
- `apps/client/src/kernel/rhizohReplaySeal.js`
- `apps/client/src/kernel/rhizohExternalProofNetworkV1.js`
- `apps/client/src/kernel/rhizohExternalTruthCertProtocolV1.js`
- `apps/client/src/kernel/rhizohSolverExternalizationLayerV1.js`
- `apps/client/src/kernel/rhizohCanonicalEquivalence.js`
- `apps/client/src/kernel/rhizohGpuDecisionFinalize.js`
- `apps/client/src/kernel/rhizohFormalClosureBridgeV1.js`
- `apps/client/src/kernel/swarmGpuBridge.js`
- `apps/client/src/kernel/company/rhizohFormalGovernanceSystemV1.js`
- `apps/client/src/kernel/company/rhizohGovernanceReconciliationLayerV1.js`
- `apps/client/src/kernel/company/rhizohRecoveryPolicyEngineV1.js`
- `apps/client/src/kernel/company/rhizohRecoveryStateMachineV1.js`
- `apps/client/src/kernel/company/rhizohReplayVerifierV1.js`
- `apps/client/src/kernel/company/rhizohSystemWideCoherenceClosureEngineV1.js`

Not:

- Bugfix gerekirse yalnizca launch-blocker sinifinda kabul edilir.
- Her degisiklik icin "neden freeze exception?" notu zorunludur.

## 3) Sabit UX Flow (Launch Contract)

Urun akisi asagidaki sira ile sabitlenmistir:

1. Single Intent Entry (`What do you want to create?`)
2. Interpreting
3. Generating
4. Executing
5. Event Created
6. Publish
7. Replay
8. Share

Yasaklar:

- yeni panel
- yeni sekme
- yeni modul switcher
- debug yuzeyini son kullaniciya acmak

## 4) Onboarding Zorunlu Path

Ilk acilista zorunlu tek yol:

1. `START FIRST INTENT IN 10 SECONDS` tetiklenir
2. Varsayilan intent calisir
3. Kullanici `EVENT CREATED` gorur
4. Kullanici en az bir kez `WHY THIS HAPPENED?` acabilir
5. Kullanici `Share` aksiyonuna ulasir

Onboarding basarili sayilma kosulu:

- first intent -> event created <= 10s

## 5) Production Firebase Deploy Checklist

Deploy oncesi:

- `npm install`
- `npm run build` (client/gateway ilgili hedefler)
- `.env`/secret kontrolu (repo'ya secret yok)
- Firebase hedef dogrulama (`.firebaserc`, `firebase.json`)
- Rules dry-check (`firestore.rules`, `storage.rules`)

Deploy sirasi:

1. `npm run firebase:deploy:hosting`
2. `npm run firebase:deploy:rules`
3. `npm run firebase:deploy` (tam paket gerekiyorsa)

Deploy sonrasi:

- Landing aciliyor mu?
- SLE input calisiyor mu?
- Event created/publish/replay/share loop saglam mi?
- Konsolda blocker error var mi?

## 6) Telemetry Minimal Set (Launch)

Launch icin zorunlu minimum event seti:

- `intent_received`
- `intent_interpreted`
- `route_selected`
- `governance_decision`
- `event_created`
- `event_published`
- `replay_requested`
- `share_artifact_generated`
- `share_completed`
- `onboarding_completed`
- `fallback_triggered` (varsa)

Zorunlu ortak alanlar:

```json
{
  "eventId": "string|null",
  "traceId": "string|null",
  "intentType": "string",
  "domain": "string",
  "governanceState": "NORMAL|DEGRADED|FROZEN|RECOVERY",
  "ts": 0
}
```

## 7) Launch Gate (Go/No-Go)

Go kosullari:

- UX freeze ihlali yok
- onboarding <= 10s
- publish/replay/share loop sorunsuz
- telemetry minimal set akiyor
- kritik blocker bug yok

No-Go kosullari:

- onboarding path kirik
- event loop eksik adim
- share artifact uretilemiyor
- governance state hatali/eksik yansiyor

## 8) Freeze Sonrasi Degisim Politikasi

Launch sonrasi degisimler iki dalda ilerler:

- Patch lane: bugfix / stabilite
- Growth lane: yeni capability ve deneyler

Kural:

- Growth lane, launch branch'ini bozmaz.

---

Belge surumu: 1.1 - `RHIZOH_LAUNCH_FREEZE_SPEC_V1_1.md`
