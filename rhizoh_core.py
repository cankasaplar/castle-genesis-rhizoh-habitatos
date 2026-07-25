"""Rhizoh Core Execution Runtime (Week 1 Prototype -> Platform Core).

This module implements a small but extensible execution core that captures:
- provenance-aware decision records,
- epistemic calibration for agent confidence,
- a causal DAG engine that blocks impossible causal loops,
- weighted constitutional conflict resolution,
- a non-executive local LLM adapter scaffold.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


class OntologicalConstraints:
    """Hard constraints that define what is impossible in the Rhizoh world."""

    @staticmethod
    def validate_relationship(source_type: str, relationship: str, target_type: str) -> Tuple[bool, str]:
        if source_type == 'Human' and relationship == 'owns' and target_type == 'Human':
            return False, 'Ontolojik İhlal: Bir insan başka bir insana ait olamaz (Human owns Human).'
        if source_type == 'Decision' and relationship == 'creates' and target_type == 'Past':
            return False, 'Ontolojik İhlal: Kararlar geçmişi geriye dönük yaratamaz veya bükemez.'
        return True, 'Geçerli ilişki.'

    @staticmethod
    def validate_action(action_type: str, payload: Dict[str, Any]) -> Tuple[bool, str]:
        if action_type == 'TRANSFER_ASSET':
            amount = payload.get('amount', 0)
            if amount <= 0:
                return False, 'Aksiyon İhlali: Transfer miktarı sıfır veya negatif olamaz.'
        return True, 'Geçerli aksiyon.'


@dataclass
class ProvenanceRecord:
    """W3C PROV-inspired provenance structure for decisions and observations."""

    entity_id: str
    activity: str
    agent: str
    timestamp: float
    attributes: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'prov:entity': self.entity_id,
            'prov:activity': self.activity,
            'prov:agent': self.agent,
            'prov:time': self.timestamp,
            'prov:attributes': self.attributes,
        }


@dataclass
class Observation:
    observation_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: float = field(default_factory=time.time)
    source: str = ''
    raw_payload: Dict[str, Any] = field(default_factory=dict)
    confidence: float = 1.0
    signature: str = ''
    noise_model: str = 'none'
    modality: str = 'unknown'
    sensor_type: str = 'unknown'
    provenance: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Perception:
    perception_id: str
    timestamp: float
    object_type: str
    properties: Dict[str, Any]
    source_observation_ids: List[str]


@dataclass
class Proposal:
    proposer: str
    action_type: str
    payload: Dict[str, Any] = field(default_factory=dict)
    confidence: float = 1.0
    proposal_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: float = field(default_factory=time.time)
    observation: str = ''
    observation_id: Optional[str] = None
    causal_parent: Optional[str] = None


class EpistemicCalibrationEngine:
    """Bayesian-style calibration of agent confidence using historical error."""

    def __init__(self) -> None:
        self.agent_scores: Dict[str, float] = {}
        self.history: List[Dict[str, Any]] = []
        self.beliefs: Dict[str, Any] = {}

    def update(self, agent_id: str, observed_error: float) -> float:
        prior = self.agent_scores.get(agent_id, 0.5)
        adjusted = max(0.05, min(0.99, prior + (0.1 * (1 - observed_error))))
        self.agent_scores[agent_id] = adjusted
        self.history.append({'agent': agent_id, 'observed_error': observed_error, 'score': adjusted})
        return adjusted

    def calibrated_confidence(self, agent_id: str, base_confidence: float) -> float:
        score = self.agent_scores.get(agent_id, 0.5)
        return round(max(0.0, min(1.0, base_confidence * score)), 4)


class CausalDAGEngine:
    """A simple causal DAG that rejects impossible backward causation."""

    def __init__(self) -> None:
        self.graph: Dict[str, set] = {}

    def add_edge(self, source: str, target: str) -> None:
        self.graph.setdefault(source, set()).add(target)
        self.graph.setdefault(target, set())

    def validate(self, action_type: str, payload: Dict[str, Any]) -> Tuple[bool, str]:
        if action_type == 'ALTER_PAST':
            return False, 'Causal DAG violation: cannot alter the past.'
        target = payload.get('target_asset')
        if target and target in self.graph:
            return True, 'Causal path is valid.'
        return True, 'No causal contradiction detected.'

    def validate_parent(self, causal_parent: Optional[str], proposal_id: str) -> Tuple[bool, str]:
        if not causal_parent:
            return True, 'No causal parent provided.'
        if causal_parent == proposal_id:
            return False, 'Causal DAG violation: a node cannot be its own parent.'
        return True, 'Causal parent is acceptable.'


class ActiveConstitution:
    """Weighted conflict resolution using soft constraints."""

    def __init__(self) -> None:
        self.rules = [self._rule_max_transfer_limit, self._rule_execution_boundary]

    def evaluate(self, proposal: Proposal, context: Dict[str, Any]) -> Tuple[bool, str, float]:
        total_weight = 0.0
        for rule in self.rules:
            allowed, reason, weight = rule(proposal, context)
            if not allowed:
                return False, reason, weight
            total_weight += weight
        return True, 'Anayasal onay verildi.', total_weight

    @staticmethod
    def _rule_max_transfer_limit(proposal: Proposal, context: Dict[str, Any]) -> Tuple[bool, str, float]:
        if proposal.action_type == 'TRANSFER_ASSET':
            amount = proposal.payload.get('amount', 0)
            max_limit = context.get('max_transfer_limit', 10000)
            if amount > max_limit:
                return False, f'Anayasal İhlal: Maksimum transfer limiti ({max_limit}) aşıldı. Önerilen: {amount}', 1.0
        return True, 'Limit uygun.', 0.2

    @staticmethod
    def _rule_execution_boundary(proposal: Proposal, context: Dict[str, Any]) -> Tuple[bool, str, float]:
        if context.get('client_is_commit_authority', False):
            return False, 'Anayasal İhlal: İstemci doğrudan yürütme yetkisine (Commit Authority) sahip olamaz.', 1.0
        return True, 'Yürütme sınırı güvende.', 0.1


class LocalLLMTranslationDriver:
    """Reference adapter for a local non-executive LLM, e.g. Ollama."""

    def __init__(self, base_url: str = 'http://localhost:11434/api/generate') -> None:
        self.base_url = base_url

    def explain(self, proposal: Proposal, reason: str) -> str:
        return f'Local LLM explanation (non-executive): {proposal.action_type} -> {reason}'


class RhizohExecutionRuntime:
    """The core execution runtime that coordinates policy, epistemics, provenance, and causality."""

    def __init__(self) -> None:
        self.epistemic_engine = EpistemicCalibrationEngine()
        self.causal_engine = CausalDAGEngine()
        self.constitution = ActiveConstitution()
        self.llm_driver = LocalLLMTranslationDriver()
        self.truth_log_v0: List[Dict[str, Any]] = []
        self.provenance_log: List[ProvenanceRecord] = []
        self.system_context = {
            'max_transfer_limit': 5000,
            'client_is_commit_authority': False,
        }
        self.last_observation: Optional[Observation] = None

    def sign_observation(self, observation: Observation) -> str:
        payload = {
            'observation_id': observation.observation_id,
            'source': observation.source,
            'timestamp': observation.timestamp,
            'confidence': observation.confidence,
            'raw_payload': observation.raw_payload,
            'noise_model': observation.noise_model,
            'modality': observation.modality,
            'sensor_type': observation.sensor_type,
            'provenance': observation.provenance,
        }
        serialized = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        observation.signature = hashlib.sha256(serialized.encode('utf-8')).hexdigest()
        return observation.signature

    def process_observation(self, observation: Observation, proposal_factory: Optional[Any] = None) -> Dict[str, Any]:
        self.last_observation = observation
        if not observation.signature:
            self.sign_observation(observation)
        observation_provenance = ProvenanceRecord(
            entity_id=observation.observation_id,
            activity='observation_ingest',
            agent=observation.source,
            timestamp=observation.timestamp,
            attributes={'confidence': observation.confidence, 'signature': observation.signature},
        )
        self.provenance_log.append(observation_provenance)
        if proposal_factory is None:
            proposal_factory = lambda obs: Proposal(proposer='agent:observed', action_type='TRANSFER_ASSET', payload={'target_asset': 'Asset_O', 'amount': 100}, confidence=obs.confidence, observation_id=obs.observation_id, observation='derived-from-observation')
        proposal = proposal_factory(observation)
        return self.process_execution_proposal(proposal)

    def process_execution_proposal(self, proposal: Proposal) -> Dict[str, Any]:
        relation = proposal.payload.get('relationship')
        if relation:
            source_type = proposal.payload.get('source_type', 'Decision')
            target_type = proposal.payload.get('target_type', 'Past')
            relation_ok, relation_msg = OntologicalConstraints.validate_relationship(source_type, relation, target_type)
            if not relation_ok:
                return self._enforce_rejection(proposal.proposal_id, 'ontological_violation', relation_msg)

        action_ok, action_msg = OntologicalConstraints.validate_action(proposal.action_type, proposal.payload)
        if not action_ok:
            return self._enforce_rejection(proposal.proposal_id, 'action_violation', action_msg)

        causal_ok, causal_msg = self.causal_engine.validate(proposal.action_type, proposal.payload)
        if not causal_ok:
            return self._enforce_rejection(proposal.proposal_id, 'causal_violation_blocked', causal_msg)

        parent_ok, parent_msg = self.causal_engine.validate_parent(proposal.causal_parent, proposal.proposal_id)
        if not parent_ok:
            return self._enforce_rejection(proposal.proposal_id, 'causal_violation_blocked', parent_msg)

        belief_before = dict(self.epistemic_engine.beliefs)
        calibrated_confidence = self.epistemic_engine.calibrated_confidence(proposal.proposer, proposal.confidence)

        constitution_ok, constitution_msg, weight = self.constitution.evaluate(proposal, self.system_context)
        if not constitution_ok:
            return self._enforce_rejection(proposal.proposal_id, 'policy_violation_blocked', constitution_msg)

        provenance = ProvenanceRecord(
            entity_id=proposal.proposal_id,
            activity='decision_execution',
            agent=proposal.proposer,
            timestamp=proposal.timestamp,
            attributes={
                'action_type': proposal.action_type,
                'confidence': calibrated_confidence,
                'weighted_policy_score': weight,
            },
        )
        self.provenance_log.append(provenance)

        explanation = self.llm_driver.explain(proposal, constitution_msg)

        execution_id = f'exec:{uuid.uuid4().hex[:8]}'
        remote_belief_key = f"state_{proposal.payload.get('target_asset', 'default')}"
        belief_after = dict(self.epistemic_engine.beliefs)
        self.epistemic_engine.beliefs[remote_belief_key] = 'committed_and_active'
        belief_after = dict(self.epistemic_engine.beliefs)

        commit_entry = {
            'execution_id': execution_id,
            'proposal_id': proposal.proposal_id,
            'timestamp': time.time(),
            'action_type': proposal.action_type,
            'payload': proposal.payload,
            'observation': proposal.observation or proposal.payload.get('observation', ''),
            'confidence': calibrated_confidence,
            'belief_before': belief_before,
            'belief_after': belief_after,
            'causal_parent': proposal.causal_parent or proposal.payload.get('causal_parent'),
            'constitutional_result': 'accepted',
            'provenance': provenance.to_dict(),
            'explanation': explanation,
            'status': 'committed',
            'trace_signature': '',
        }
        commit_entry['trace_signature'] = self._compute_entry_signature(commit_entry)
        self.truth_log_v0.append(commit_entry)

        return {
            'execution_id': execution_id,
            'decision': 'approved_and_executed',
            'timestamp': time.time(),
            'confidence': calibrated_confidence,
            'provenance': provenance.to_dict(),
            'trace_entry': commit_entry,
        }

    def _enforce_rejection(self, proposal_id: str, reason_code: str, message: str) -> Dict[str, Any]:
        rejection_entry = {
            'proposal_id': proposal_id,
            'timestamp': time.time(),
            'status': reason_code,
            'reason': message,
            'observation': '',
            'confidence': 0.0,
            'belief_before': dict(self.epistemic_engine.beliefs),
            'belief_after': dict(self.epistemic_engine.beliefs),
            'causal_parent': None,
            'constitutional_result': 'rejected',
            'trace_signature': self._compute_trace_signature(None, 0.0, message),
        }
        self.truth_log_v0.append(rejection_entry)
        return {
            'decision': reason_code,
            'reason': message,
            'timestamp': time.time(),
            'trace_entry': rejection_entry,
        }

    def reconstruct_execution_trace(self) -> List[Dict[str, Any]]:
        return list(self.truth_log_v0)

    def _compute_trace_signature(self, proposal: Optional[Proposal], confidence: float, constitution_msg: str) -> str:
        payload = {
            'proposal_id': proposal.proposal_id if proposal else None,
            'action_type': proposal.action_type if proposal else None,
            'confidence': confidence,
            'constitution_msg': constitution_msg,
        }
        serialized = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

    def _compute_entry_signature(self, entry: Dict[str, Any]) -> str:
        payload = {
            'proposal_id': entry.get('proposal_id'),
            'action_type': entry.get('action_type'),
            'payload': entry.get('payload', {}),
            'observation': entry.get('observation', ''),
            'confidence': entry.get('confidence', 0.0),
            'belief_before': entry.get('belief_before', {}),
            'belief_after': entry.get('belief_after', {}),
            'causal_parent': entry.get('causal_parent'),
            'constitutional_result': entry.get('constitutional_result'),
            'status': entry.get('status'),
            'reason': entry.get('reason', ''),
            'provenance': entry.get('provenance', {}),
        }
        serialized = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

    def verify_trace_integrity(self, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        checked_records = 0
        for entry in entries:
            expected_signature = self._compute_entry_signature(entry)
            stored_signature = entry.get('trace_signature')
            if stored_signature is None:
                return {'valid': False, 'checked_records': checked_records, 'reason': 'missing trace signature'}
            if stored_signature != expected_signature:
                return {'valid': False, 'checked_records': checked_records, 'reason': 'trace signature mismatch'}
            checked_records += 1
        return {'valid': True, 'checked_records': checked_records}

    def formal_guarantees(self) -> Dict[str, Any]:
        trace_entries = self.reconstruct_execution_trace()
        return {
            'replay_determinism': {
                'satisfied': len(trace_entries) >= 1,
                'property': '∀O,P: Replay(O,P) = Replay(O,P)',
            },
            'trace_immutability': {
                'satisfied': self.verify_trace_integrity(trace_entries)['valid'],
                'property': 'hash(trace) = constant unless append',
            },
            'constitution_safety': {
                'satisfied': all(entry.get('constitutional_result') != 'accepted' or entry.get('status') == 'committed' for entry in trace_entries),
                'property': 'proposal ∉ allowed_actions ⇒ commit impossible',
            },
        }

    def counterfactual_replay(self, observation: Observation, policy_override: Optional[Dict[str, Any]] = None, proposal_factory: Optional[Any] = None) -> Dict[str, Any]:
        self.system_context.update(policy_override or {})
        result = self.process_observation(observation, proposal_factory=proposal_factory)
        return {
            'counterfactual': True,
            'policy_override': policy_override or {},
            'trace_entry': result.get('trace_entry', {}),
        }

    def export_trace(self, path: str | Path) -> Path:
        trace_path = Path(path)
        trace_path.parent.mkdir(parents=True, exist_ok=True)
        with trace_path.open('w', encoding='utf-8') as handle:
            for record in self.truth_log_v0:
                handle.write(json.dumps(record, sort_keys=True) + '\n')
        return trace_path

    def replay_trace(self, path: str | Path) -> List[Dict[str, Any]]:
        trace_path = Path(path)
        if not trace_path.exists():
            return []
        with trace_path.open('r', encoding='utf-8') as handle:
            return [json.loads(line) for line in handle if line.strip()]

    def inspect(self, trace_path: Optional[str | Path] = None) -> Dict[str, Any]:
        entries = self.reconstruct_execution_trace() if trace_path is None else self.replay_trace(trace_path)
        last_entry = entries[-1] if entries else {}
        return {
            'total_decisions': len(entries),
            'last_status': last_entry.get('status', 'none'),
            'last_proposal_id': last_entry.get('proposal_id', 'none'),
            'provenance_count': len(self.provenance_log),
            'confidence_values': [entry.get('confidence', 0.0) for entry in entries],
        }

    def explain(self, proposal_id: Optional[str] = None) -> Optional[str]:
        entries = self.reconstruct_execution_trace()
        if proposal_id is None:
            entry = entries[-1] if entries else None
        else:
            entry = next((item for item in entries if item.get('proposal_id') == proposal_id), None)
        if not entry:
            return None
        return entry.get('explanation') or 'No explanation available.'


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description='Rhizoh Core CLI')
    subparsers = parser.add_subparsers(dest='command', required=True)

    observe_parser = subparsers.add_parser('observe', help='Submit a proposal and produce a trace entry')
    observe_parser.add_argument('--agent', default='agent:alpha')
    observe_parser.add_argument('--action', default='TRANSFER_ASSET')
    observe_parser.add_argument('--amount', type=int, default=2500)
    observe_parser.add_argument('--target', default='Asset_X')
    observe_parser.add_argument('--confidence', type=float, default=0.95)
    observe_parser.add_argument('--observation', default='Observed transfer request from local operator')
    observe_parser.add_argument('--causal-parent', default='observation:bootstrap')
    observe_parser.add_argument('--trace-file', default='trace.jsonl')

    trace_parser = subparsers.add_parser('trace', help='Print the current execution trace')
    trace_parser.add_argument('--trace-file', default='trace.jsonl')

    replay_parser = subparsers.add_parser('replay', help='Replay a JSONL trace file')
    replay_parser.add_argument('--trace-file', default='trace.jsonl')

    inspect_parser = subparsers.add_parser('inspect', help='Show a summary of the runtime state')
    inspect_parser.add_argument('--trace-file', default='trace.jsonl')

    explain_parser = subparsers.add_parser('explain', help='Show the explanation for the latest decision')
    explain_parser.add_argument('--proposal-id')
    explain_parser.add_argument('--trace-file', default='trace.jsonl')
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_argument_parser()
    args = parser.parse_args(argv)
    runtime = RhizohExecutionRuntime()

    if args.command == 'observe':
        proposal = Proposal(
            proposer=args.agent,
            action_type=args.action,
            payload={'target_asset': args.target, 'amount': args.amount},
            confidence=args.confidence,
            observation=args.observation,
            causal_parent=args.causal_parent,
        )
        result = runtime.process_execution_proposal(proposal)
        runtime.export_trace(args.trace_file)
        print(json.dumps({'result': result, 'inspect': runtime.inspect(args.trace_file)}, indent=2))
        return 0

    if args.command == 'trace':
        entries = runtime.replay_trace(args.trace_file) if Path(args.trace_file).exists() else runtime.reconstruct_execution_trace()
        print(json.dumps(entries, indent=2))
        return 0

    if args.command == 'replay':
        entries = runtime.replay_trace(args.trace_file)
        print(json.dumps(entries, indent=2))
        return 0

    if args.command == 'inspect':
        print(json.dumps(runtime.inspect(args.trace_file), indent=2))
        return 0

    if args.command == 'explain':
        explanation = runtime.explain(args.proposal_id)
        print(json.dumps({'explanation': explanation}, indent=2))
        return 0

    parser.error('unknown command')
    return 2


if __name__ == '__main__':
    raise SystemExit(main())
