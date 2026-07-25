import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / 'rhizoh_core.py'

spec = importlib.util.spec_from_file_location('rhizoh_core', MODULE_PATH)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
if spec.loader is None:
    raise RuntimeError('Unable to load rhizoh_core module')
spec.loader.exec_module(module)


class RhizohCoreTests(unittest.TestCase):
    def test_provenance_and_conflict_resolution(self):
        runtime = module.RhizohExecutionRuntime()
        proposal = module.Proposal(
            proposer='agent:alpha',
            action_type='TRANSFER_ASSET',
            payload={'target_asset': 'Asset_X', 'amount': 2500},
            confidence=0.95,
        )
        result = runtime.process_execution_proposal(proposal)
        self.assertEqual(result['decision'], 'approved_and_executed')

        invalid = module.Proposal(
            proposer='agent:beta',
            action_type='TRANSFER_ASSET',
            payload={'target_asset': 'Asset_Y', 'amount': 9000},
            confidence=0.99,
        )
        rejected = runtime.process_execution_proposal(invalid)
        self.assertEqual(rejected['decision'], 'policy_violation_blocked')

        trace = runtime.reconstruct_execution_trace()
        self.assertGreaterEqual(len(trace), 2)

    def test_causal_dag_rejects_backward_action(self):
        runtime = module.RhizohExecutionRuntime()
        bad = module.Proposal(
            proposer='agent:gamma',
            action_type='ALTER_PAST',
            payload={'target_asset': 'Asset_Z'},
            confidence=0.9,
        )
        result = runtime.process_execution_proposal(bad)
        self.assertEqual(result['decision'], 'causal_violation_blocked')

    def test_trace_export_writes_jsonl(self):
        runtime = module.RhizohExecutionRuntime()
        proposal = module.Proposal(proposer='agent:trace', action_type='TRANSFER_ASSET', payload={'target_asset': 'Asset_T', 'amount': 1000}, confidence=0.9)
        runtime.process_execution_proposal(proposal)
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / 'trace.jsonl'
            runtime.export_trace(output_path)
            lines = output_path.read_text(encoding='utf-8').strip().splitlines()
            self.assertGreaterEqual(len(lines), 1)
            record = json.loads(lines[0])
            self.assertIn('proposal_id', record)

    def test_cli_observe_creates_trace(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            trace_path = Path(temp_dir) / 'trace.jsonl'
            result = subprocess.run(
                [sys.executable, str(ROOT / 'rhizoh_core.py'), 'observe', '--trace-file', str(trace_path)],
                capture_output=True,
                text=True,
                check=True,
            )
            payload = json.loads(result.stdout)
            self.assertEqual(payload['result']['decision'], 'approved_and_executed')
            self.assertTrue(trace_path.exists())

    def test_replay_invariants_are_deterministic(self):
        proposal = module.Proposal(
            proposer='agent:deterministic',
            action_type='TRANSFER_ASSET',
            payload={'target_asset': 'Asset_D', 'amount': 1200},
            confidence=0.88,
            proposal_id='proposal:deterministic',
            timestamp=1000.0,
        )
        runtime_a = module.RhizohExecutionRuntime()
        runtime_b = module.RhizohExecutionRuntime()
        result_a = runtime_a.process_execution_proposal(proposal)
        result_b = runtime_b.process_execution_proposal(proposal)

        self.assertEqual(result_a['trace_entry']['trace_signature'], result_b['trace_entry']['trace_signature'])
        self.assertTrue(0.0 <= result_a['confidence'] <= 1.0)

    def test_trace_integrity_verification_detects_tampering(self):
        runtime = module.RhizohExecutionRuntime()
        proposal = module.Proposal(
            proposer='agent:integrity',
            action_type='TRANSFER_ASSET',
            payload={'target_asset': 'Asset_I', 'amount': 300},
            confidence=0.75,
            proposal_id='proposal:integrity',
            timestamp=2000.0,
        )
        runtime.process_execution_proposal(proposal)
        entries = runtime.reconstruct_execution_trace()
        verification = runtime.verify_trace_integrity(entries)
        self.assertTrue(verification['valid'])
        self.assertEqual(verification['checked_records'], len(entries))

    def test_causal_parent_cycle_is_blocked(self):
        runtime = module.RhizohExecutionRuntime()
        proposal = module.Proposal(
            proposer='agent:cycle',
            action_type='TRANSFER_ASSET',
            payload={'target_asset': 'Asset_C', 'amount': 50},
            confidence=0.6,
            proposal_id='proposal:cycle',
            timestamp=3000.0,
            causal_parent='proposal:cycle',
        )
        result = runtime.process_execution_proposal(proposal)
        self.assertEqual(result['decision'], 'causal_violation_blocked')

    def test_observation_signature_and_formal_guarantees(self):
        runtime = module.RhizohExecutionRuntime()
        observation = module.Observation(
            source='sensor:test',
            raw_payload={'event': 'transfer-request'},
            confidence=0.89,
        )
        signature = runtime.sign_observation(observation)
        self.assertTrue(signature)
        self.assertEqual(observation.signature, signature)

        result = runtime.process_observation(observation, proposal_factory=lambda obs: module.Proposal(
            proposer='agent:formal',
            action_type='TRANSFER_ASSET',
            payload={'target_asset': 'Asset_F', 'amount': 100},
            confidence=0.89,
            observation_id=obs.observation_id,
            observation='formal guarantee test',
        ))
        guarantees = runtime.formal_guarantees()
        self.assertTrue(guarantees['replay_determinism']['satisfied'])
        self.assertTrue(guarantees['trace_immutability']['satisfied'])
        self.assertTrue(result['decision'] == 'approved_and_executed')

    def test_counterfactual_replay_returns_alternative_trace(self):
        runtime = module.RhizohExecutionRuntime()
        observation = module.Observation(source='sensor:counterfactual', raw_payload={'event': 'transfer'}, confidence=0.8)
        baseline = runtime.process_observation(observation, proposal_factory=lambda obs: module.Proposal(
            proposer='agent:counter',
            action_type='TRANSFER_ASSET',
            payload={'target_asset': 'Asset_C', 'amount': 200},
            confidence=0.8,
            observation_id=obs.observation_id,
            observation='baseline',
        ))
        counterfactual = runtime.counterfactual_replay(observation, policy_override={'max_transfer_limit': 100}, proposal_factory=lambda obs: module.Proposal(
            proposer='agent:counter',
            action_type='TRANSFER_ASSET',
            payload={'target_asset': 'Asset_C', 'amount': 200},
            confidence=0.8,
            observation_id=obs.observation_id,
            observation='counterfactual',
        ))
        self.assertTrue(counterfactual['counterfactual'])
        self.assertNotEqual(baseline['trace_entry']['trace_signature'], counterfactual['trace_entry']['trace_signature'])

    def test_formal_documents_and_ontology_files_exist(self):
        ontology_files = [ROOT / 'ontology' / name for name in ['agent.yaml', 'human.yaml', 'observation.yaml', 'action.yaml', 'belief.yaml', 'policy.yaml', 'planner.yaml', 'asset.yaml', 'event.yaml', 'README.md']]
        for ontology_file in ontology_files:
            self.assertTrue(ontology_file.exists(), f'Missing ontology file: {ontology_file}')
        formal_doc = ROOT / 'docs' / 'FORMAL_DEFINITIONS_V0.1.md'
        validation_doc = ROOT / 'docs' / 'VALIDATION_PLAN_V0.1.md'
        self.assertTrue(formal_doc.exists())
        self.assertTrue(validation_doc.exists())

        example_files = [
            ROOT / 'examples' / 'medical' / 'triage_validation.py',
            ROOT / 'examples' / 'financial' / 'approval_validation.py',
            ROOT / 'examples' / 'robotics' / 'robot_validation.py',
            ROOT / 'examples' / 'drone' / 'mission_validation.py',
            ROOT / 'examples' / 'industrial' / 'factory_validation.py',
        ]
        for example_file in example_files:
            self.assertTrue(example_file.exists(), f'Missing validation example: {example_file}')


if __name__ == '__main__':
    unittest.main()
