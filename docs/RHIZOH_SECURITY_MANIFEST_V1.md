# RHIZOH_SECURITY_MANIFEST_V1

Kategori: Guvenlik, Uyumluluk ve Sertifikasyon  
Hedef kitle: CISO'lar, Risk Yoneticileri, Regulatorler

## 1) Compliance Fabric

RHIZOH, compliant-by-design hedefiyle tasarlanır; uyumluluk iddiaları kanıtlanabilir kontrol hedeflerine bağlanır.

- **NIST AI RMF & ISO/IEC 42001**: Sistem, bu çerçevelerin control objective'lerine hizalanacak şekilde modellenmiştir.
- **EU AI Act readiness**: Yüksek riskli kullanım için olay izleme, doğruluk gözlemi, insan gözetimi ve raporlama akışları hedeflenir.
- **Auditability**: Event mesh + evidentiary logs + replay artifacts denetim izi üretir.

Dil politikası: "%100 uyumluyuz" gibi mutlak beyanlar yerine "designed to align with ..." ifadesi kullanılır.

## 2) L3 Sovereign Certified Tier

Kritik altyapılar için L3 seviyesine giden yol:

- Yetki/delegasyon kararlarını doğrulanabilir artefaktlara derleme.
- Online policy service bağımlılığını azaltan yerel doğrulama desenleri.
- Enclave/HSM entegrasyonu için FIPS-grade hedefleme.

Not: FIPS veya regülasyon sertifikası, yalnızca resmi değerlendirme süreci tamamlandığında beyan edilir.

## 3) Closed-Loop Authorization

Risk eşiğini aşan eylemler:

1. Doğrudan fiziksel icraya gitmez.
2. Asenkron authorize kuyruğuna alınır.
3. Human-in-the-loop onayı olmadan yürütülmez.

Bu model, ajan ihlali veya policy drift durumlarında fail-safe davranışı destekler.

## 4) Security Controls (Operational)

- Pre-apply closure enforcement
- Replay seal ve chain integrity kontrolleri
- Drift containment threshold'leri
- Kill switch ve emergency policy downgrade
- Key lifecycle yönetimi (rotation, revocation, attestable logs)

## 5) Assurance Strategy

- Threat modeling + red team senaryoları
- Deterministic replay regression setleri
- Proof routing latency ve başarım SLO'ları
- Incident postmortem -> policy update döngüsü

