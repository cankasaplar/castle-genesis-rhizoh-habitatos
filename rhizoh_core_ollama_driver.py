# -*- coding: utf-8 -*-
"""
Rhizoh Core - Entegre Yerel Çalışma Zamanı Sürücüsü (v3.0-Arch)
"separates probabilistic reasoning from deterministic execution"

Bu modül, 'rhizoh_core.py' referans çekirdeği ile yerel Ollama motorunu birleştirerek
deterministik yapılandırılmış şemaları analiz eder, LLM sınırlarını anayasal olarak denetler
ve kriptografik hash-zincirlerini (Hash-Locked CODEX) mühürler.
"""

import urllib.request
import json
import time
import hashlib
from enum import Enum
from typing import Optional, Any, Dict, List, Tuple
from dataclasses import dataclass, field

# Referans Çekirdeğimizi (Reference Core) import ediyoruz
try:
    from rhizoh_core import RhizohExecutionRuntime, Proposal
except ImportError:
    print("[HATA] 'rhizoh_core.py' dosyası aynı dizinde bulunamadı!")
    print("Lütfen bu scripti 'C:\\Users\\LENOVO\\Desktop\\castle' dizininde çalıştırın.\n")
    raise


# =====================================================================
# KATMAN 1: ANAYASAL LLM SINIRLARI VE ENUMLAR (LLM ROLE CONSTRAINTS)
# =====================================================================

class LLMRole(str, Enum):
    """
    LLM'lerin sistem sınırlarında alabileceği rolleri tanımlayan anayasal Enum.
    """
    TRANSLATOR = "TRANSLATOR"       # Deterministik izleri doğal dile çevirir (İzin Verilir)
    SUMMARIZER = "SUMMARIZER"       # Olay günlüklerini özetler (İzin Verilir)
    EXPLAINER = "EXPLAINER"         # Durum değişim nedenlerini açıklar (İzin Verilir)
    
    # Aşağıdaki roller anayasal olarak LLM'ler için KESİNLİKLE YASAKTIR (FORBIDDEN)
    PLANNER = "PLANNER"             # Planlama yapar (Yasak)
    EXECUTOR = "EXECUTOR"           # Eylem yürütür (Yasak)
    COMMITTER = "COMMITTER"         # Veri mühürler (Yasak)
    POLICY_ENGINE = "POLICY_ENGINE" # Politika denetler (Yasak)


class ConstitutionLLMRestrictions:
    """
    Yapay zekanın yetki sınırlarını anayasal düzeyde denetleyen kontrolör.
    """
    ALLOWED_ROLES = {LLMRole.TRANSLATOR, LLMRole.SUMMARIZER, LLMRole.EXPLAINER}

    @classmethod
    def validate_role_authority(cls, role: LLMRole) -> Tuple[bool, str]:
        if role not in cls.ALLOWED_ROLES:
            return False, f"Anayasal İhlal: LLM '{role.value}' rolünü üstlenemez! Bu rol deterministik katmana aittir."
        return True, "Geçerli bilişsel LLM rolü."


# =====================================================================
# KATMAN 2: YAYILAN GÜVEN VE SINIR KARAR OLAYLARI (BOUNDARY EVENTS)
# =====================================================================

@dataclass
class ConfidenceMetrics:
    """
    Deterministik katmanın kararları ile olasılıksal gözlemleri ayıran güven matrisi.
    """
    observation_confidence: float  # Gözlemin kalitesi/netliği (Ör: %93)
    inference_confidence: float    # LLM/Ajan çıkarımının kalitesi (Ör: %88)
    decision_confidence: float = 1.00  # Deterministik kurallar her zaman 1.00 (Kesin)

    def to_dict(self) -> Dict[str, float]:
        return {
            "observation_confidence": self.observation_confidence,
            "inference_confidence": self.inference_confidence,
            "decision_confidence": self.decision_confidence
        }


@dataclass
class BoundaryDecisionEvent:
    """
    policy_violation_blocked durumunu adli ve olay kaynaklı (event-sourced)
    bir yaptırım olayına dönüştüren veri yapısı.
    """
    event_id: str = field(default_factory=lambda: f"evt-{hashlib.md5(str(time.time()).encode()).hexdigest()[:8]}")
    timestamp: float = field(default_factory=time.time)
    decision_type: str = "POLICY_BLOCK"  # POLICY_BLOCK or COMMIT_APPROVED
    reason_code: str = "MAX_TRANSFER_LIMIT"
    constitution_rule: str = "Rule 2.4"
    planner_decision: str = "rejected"
    execution_status: str = "none"


# =====================================================================
# KATMAN 3: KRİPTOGRAFİK AD-HOC PERSISTENCE (FALLBACK PERSISTENCE)
# =====================================================================

class LocalHashLockedBlock:
    """
    Doğal dil yerine bileşenlerin kriptografik hash'lerini zincirleyen CODEX bloğu.
    """
    def __init__(self, index: int, timestamp: float, component_hashes: Dict[str, str], previous_hash: str):
        self.index = index
        self.timestamp = timestamp
        self.component_hashes = component_hashes  # Gözlem, Öneri, Politika, Karar, Açıklama Hashleri
        self.previous_hash = previous_hash
        self.block_hash = self.calculate_hash()

    def calculate_hash(self) -> str:
        data_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "component_hashes": self.component_hashes,
            "previous_hash": self.previous_hash
        }, sort_keys=True)
        return hashlib.sha256(data_string.encode('utf-8')).hexdigest()


class LocalHashLockedCodexStorage:
    """
    Kalıcı katmanın (Persistence) tak-çıkar olduğunu ispatlayan dürüst yerel bellek.
    """
    def __init__(self):
        self.chain = []
        # Genesis Block with dummy zero hashes
        genesis_hashes = {
            "observation_hash": "0" * 64,
            "proposal_hash": "0" * 64,
            "policy_hash": "0" * 64,
            "decision_hash": "0" * 64,
            "explanation_hash": "0" * 64
        }
        genesis = LocalHashLockedBlock(
            index=0,
            timestamp=time.time(),
            component_hashes=genesis_hashes,
            previous_hash="0" * 64
        )
        self.chain.append(genesis)

    def seal_cryptographic_belief(self, hashes: Dict[str, str]) -> LocalHashLockedBlock:
        previous_block = self.chain[-1]
        new_block = LocalHashLockedBlock(
            index=len(self.chain),
            timestamp=time.time(),
            component_hashes=hashes,
            previous_hash=previous_block.block_hash
        )
        self.chain.append(new_block)
        return new_block

    def verify_integrity(self) -> bool:
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i-1]
            if current.block_hash != current.calculate_hash():
                return False
            if current.previous_hash != previous.block_hash:
                return False
        return True


# =====================================================================
# KATMAN 4: YEREL MODEL SÜRÜCÜSÜ (DETERMINISTIC OLLAMA CONNECTOR)
# =====================================================================

class OllamaTranslationDriver:
    """
    Yerel Ollama API'si üzerinden Rhizoh Core adli izlerini (traces)
    ve inanç değişim gerekçelerini analiz eden aktif LLM Driver.
    """
    def __init__(self, model_name: str = "llama3", host_url: str = "http://localhost:11434"):
        self.model_name = model_name
        self.host_url = host_url
        self.api_url = f"{host_url}/api/generate"

    def check_service_health(self) -> bool:
        """Ollama servisinin arka planda çalışıp çalışmadığını doğrular."""
        try:
            with urllib.request.urlopen(self.host_url, timeout=3) as response:
                if response.status == 200:
                    return True
        except Exception:
            return False
        return False

    def generate_explanation_for_codex(self, structured_json: dict) -> str:
        """
        Girdi olarak dürüst ve temiz yapılandırılmış JSON verisi alır,
        yerel LLM'e sadece bu veriyi doğal dile çevirtir.
        """
        prompt = (
            f"Sen bir Rhizoh Core Epistemik Tercümanısın. Görevin, aşağıda dürüst ve yapılandırılmış (structured) "
            f"olarak verilen sistem karar özetini, son derece sade ve profesyonel bir doğal dile çevirmektir.\n"
            f"ÖNEMLİ KURALLAR:\n"
            f"1. KESİNLİKLE 'Bir Rhizoh Core Epistemik Denetçisi olarak...' veya benzeri yapay giriş cümleleri kurma.\n"
            f"2. Doğrudan gözlemi ve reddedilme/onaylanma gerekçesini açıkla.\n"
            f"3. Açıklamayı KESİNLİKLE sadece Türkçe olarak yaz.\n"
            f"4. Asla uydurma (hallucination) yapma.\n\n"
            f"Yapılandırılmış Veri:\n{json.dumps(structured_json, indent=2, ensure_ascii=False)}\n\n"
            f"Kısa Doğal Dil Açıklaması (Türkçe, en fazla 2 cümle):"
        )

        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1  # Yüksek determinizm için yaratıcılık kapatılır
            }
        }

        try:
            req = urllib.request.Request(
                self.api_url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=240) as response:
                result = json.loads(response.read().decode("utf-8"))
                return result.get("response", "Açıklama üretilemedi.").strip()
        except Exception as e:
            return f"[Deterministik Fallback] Yerel model bağlantısı kurulamadı. Hata: {str(e)}"


# =====================================================================
# KATMAN 5: ENTEGRE ÇALIŞMA ZAMANI (INTEGRATED RUNTIME)
# =====================================================================

class IntegratedRhizohRuntime(RhizohExecutionRuntime):
    """
    Olasılıksal yapay zeka kararlarını deterministik politikalara göre
    şekillendiren, katı anayasal kısıtlı ve kendi kendini onaran çalışma zamanı.
    """
    def __init__(self, ollama_driver: OllamaTranslationDriver):
        super().__init__()
        self.ollama_driver = ollama_driver
        self._diagnose_and_initialize_persistence()

    def _diagnose_and_initialize_persistence(self):
        """
        Dahili CODEX bellek yapısını arar; bulamazsa bunu bir hata olarak değil,
        tak-çıkar (pluggable) yapının gereği olarak sisteme raporlar ve ad-hoc bellek bağlar.
        """
        print("\n--- [ARCH_INSPECT] Referans Çekirdek Durum Analizi ---")
        
        # CODEX'in varlığını test et
        codex_found = False
        for attr in ['codex', 'codex_storage', 'codexStorage', 'storage', 'memory']:
            if hasattr(self, attr) and getattr(self, attr) is not None:
                codex_found = True
                break
                
        if codex_found:
            print("[INFO] Native persistence backend configured and active.")
        else:
            # REFRAMING (SUGGESTION 4)
            print("[INFO] No persistence backend configured. Runtime continues in stateless verification mode.")
            print(" -> [AD-HOC] Kriptografik yedek depolama (LocalHashLockedCodexStorage) başarıyla bağlandı.")
            self.codex = LocalHashLockedCodexStorage()

    def prepare_canonical_facts_and_metrics(self, trace_entry: dict) -> Tuple[dict, ConfidenceMetrics, BoundaryDecisionEvent]:
        """
        Observations üzerinden saf gerçeklik verisini (raw_facts) ve güven matrisini türetir.
        Ayrıca boundary kararlarını event-sourced bir yapıya kavuşturur.
        """
        status = trace_entry.get("status", "unknown")
        reason = trace_entry.get("reason", "İşlem kurallara uygun.")
        amount = trace_entry.get("payload", {}).get("amount", "N/A")
        target_asset = trace_entry.get("payload", {}).get("target_asset", "N/A")
        
        # 1. CANONICAL FACTS (SUGGESTION 3) - Tamamen Observation'dan beslenen ham gerçekler
        canonical_facts = {
            "amount": amount,
            "target_asset": target_asset,
            "reason_details": reason
        }
        
        # 2. SPLIT CONFIDENCE (SUGGESTION 2) - Gözlem, Çıkarım ve Karar güvenlerini ayırıyoruz
        declared_conf = trace_entry.get("provenance", {}).get("confidence", 0.95) if isinstance(trace_entry.get("provenance"), dict) else 0.95
        confidence = ConfidenceMetrics(
            observation_confidence=0.93,  # Gözlem modu ve sensör güveni
            inference_confidence=declared_conf,  # Olasılıksal modelin beyanı
            decision_confidence=1.00  # Deterministik kurallar %100 kesindir
        )
        
        # 3. BOUNDARY DECISION EVENT (SUGGESTION 5)
        decision_event = BoundaryDecisionEvent(
            decision_type="POLICY_BLOCK" if "limit" in reason.lower() else "COMMIT_APPROVED",
            reason_code="MAX_TRANSFER_LIMIT" if "limit" in reason.lower() else "GENERIC_POLICY_CHECK",
            constitution_rule="Rule 2.4" if "limit" in reason.lower() else "Rule 2.3",
            planner_decision="rejected" if "limit" in reason.lower() else "approved",
            execution_status="none" if "limit" in reason.lower() else "committed"
        )
        
        return canonical_facts, confidence, decision_event

    def process_execution_proposal(self, proposal: Proposal) -> dict:
        """
        Öneriyi işler, anayasal LLM sınırlarını doğrular, yapılandırılmış izi hazırlar
        ve kriptografik özet zincirini (Hash-Locked CODEX) mühürler.
        """
        # ANAYASAL LLM ROLÜ DOĞRULAMASI
        role_ok, role_msg = ConstitutionLLMRestrictions.validate_role_authority(LLMRole.TRANSLATOR)
        if not role_ok:
            raise PermissionError(role_msg)

        # 1. Standart çekirdek kurallarını ve akışını çalıştır
        result = super().process_execution_proposal(proposal)
        
        # 2. Son oluşan iz kaydını (trace) al
        if self.truth_log_v0:
            latest_trace = self.truth_log_v0[-1]
            
            # Yapılandırılmış verileri, güven matrisini ve olay yapısını hazırla
            raw_facts, confidence, decision_event = self.prepare_canonical_facts_and_metrics(latest_trace)
            
            structured_data = {
                "execution_id": decision_event.event_id,
                "status": latest_trace.get("status", "unknown"),
                "boundary_decision": {
                    "type": decision_event.decision_type,
                    "reason": decision_event.reason_code,
                    "constitution": decision_event.constitution_rule,
                    "planner": decision_event.planner_decision,
                    "execution": decision_event.execution_status
                },
                "confidence_metrics": confidence.to_dict(),
                "llm_role": LLMRole.TRANSLATOR.value,
                "raw_facts": raw_facts
            }
            
            print(f"\n[DETERMİNİSTİK ŞEMA] Yapılandırılmış veri hazırlandı:\n{json.dumps(structured_data, indent=2, ensure_ascii=False)}")
            
            print(f"\n[Ollama] Yapılandırılmış veriden Türkçe açıklama üretiliyor...")
            start_time = time.time()
            real_explanation = self.ollama_driver.generate_explanation_for_codex(structured_data)
            elapsed = time.time() - start_time
            print(f"[Ollama Yanıtı - {elapsed:.2f}s]: {real_explanation}")
            
            # KRİPTOGRAFİK HASH-LOCK ZİNCİRİ (SUGGESTION 6)
            # CODEX'e doğal dili yazmıyoruz. Sadece SHA-256 hash'leri kilitliyoruz.
            obs_hash = hashlib.sha256(json.dumps(latest_trace.get("payload", {})).encode()).hexdigest()
            proposal_hash = hashlib.sha256(proposal.proposal_id.encode()).hexdigest()
            policy_hash = hashlib.sha256(str(latest_trace.get("reason", "N/A")).encode()).hexdigest()
            decision_hash = hashlib.sha256(decision_event.decision_type.encode()).hexdigest()
            explanation_hash = hashlib.sha256(real_explanation.encode()).hexdigest()
            
            cryptographic_belief_update = {
                "observation_hash": obs_hash,
                "proposal_hash": proposal_hash,
                "policy_hash": policy_hash,
                "decision_hash": decision_hash,
                "explanation_hash": explanation_hash
            }
            
            # 3. CODEX'e mühürle
            if hasattr(self, 'codex') and self.codex:
                try:
                    # Kriptografik mühürleme adımını gerçekleştir
                    if hasattr(self.codex, 'seal_cryptographic_belief'):
                        new_block = self.codex.seal_cryptographic_belief(cryptographic_belief_update)
                        print(f"[CODEX] Kriptografik Hash Zinciri mühürlendi (Blok #{new_block.index})")
                        print(f" -> Kilitli Blok Hash: {new_block.block_hash[:16]}...")
                    else:
                        self.codex.seal_belief([cryptographic_belief_update], [real_explanation])
                        print(f"[CODEX - FALLBACK] Yerel CODEX hafızasına kriptografik blok mühürlendi.")
                except Exception as e:
                    print(f"[UYARI] Kriptografik mühürleme adımı başarısız oldu: {str(e)}")
        
        return result


# =====================================================================
# GERÇEK ZAMANLI E2E ENTEGRASYON KOŞUMU
# =====================================================================
if __name__ == "__main__":
    ollama = OllamaTranslationDriver(model_name="llama3")
    
    print("--- Entegre Rhizoh Core Çalışma Zamanı Başlatılıyor ---")
    if not ollama.check_service_health():
        print("[HATA] Ollama servisi arka planda aktif değil!")
    else:
        print("[BAŞARILI] Yerel Ollama servisi aktif.")
        
        # Entegre edilmiş çalışma zamanımızı başlatıyoruz
        runtime = IntegratedRhizohRuntime(ollama)
        
        # SENARYO: Limit ihlali içeren bir eylem önerisi gönderiyoruz
        print("\n--- [E2E Test] Limit İhlali Senaryosu Başlatılıyor ---")
        unauthorized_proposal = Proposal(
            proposer="autonomous_broker_agent",
            action_type="TRANSFER_ASSET",
            payload={"target_asset": "Asset_Platinum", "amount": 9500}, # Limit 5000'di
            confidence=0.99
        )
        
        # Öneriyi sınıra gönder (Evaluation Loop)
        res = runtime.process_execution_proposal(unauthorized_proposal)
        print(f"\n[Sınır Kararı]: {res['decision']}")
        
        # CODEX bütünlük ve adli rekonstrüksiyon doğrulaması
        print("\n--- CODEX Kriptografik Hafıza Durumu (Hash-Locked Chain) ---")
        
        if hasattr(runtime, 'codex') and runtime.codex:
            codex = runtime.codex
            integrity_ok = codex.verify_integrity()
            print(f" -> CODEX Zincir Bütünlüğü Güvende mi?: {integrity_ok}")
            
            if integrity_ok and len(codex.chain) > 1:
                sealed_block = codex.chain[-1]
                print(f" -> Son Mühürlü Blok #{sealed_block.index}")
                print(f" -> Önceki Hash: {sealed_block.previous_hash[:16]}...")
                print(f" -> Güncel Hash: {sealed_block.block_hash[:16]}...")
                print(f" -> Mühürlü Kriptografik Hash Zinciri (SHA-256):")
                print(json.dumps(sealed_block.component_hashes, indent=4))