import importlib.util
import random
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / 'rhizoh_core.py'

spec = importlib.util.spec_from_file_location('rhizoh_core', MODULE_PATH)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
if spec.loader is None:
    raise RuntimeError('Unable to load rhizoh_core module')
spec.loader.exec_module(module)


class PropertyBasedTests(unittest.TestCase):
    def test_confidence_is_bounded(self):
        runtime = module.RhizohExecutionRuntime()
        for _ in range(200):
            confidence = round(random.uniform(0.0, 1.0), 4)
            proposal = module.Proposal(
                proposer='agent:property',
                action_type='TRANSFER_ASSET',
                payload={'target_asset': 'Asset_P', 'amount': 100},
                confidence=confidence,
            )
            result = runtime.process_execution_proposal(proposal)
            self.assertGreaterEqual(result['confidence'], 0.0)
            self.assertLessEqual(result['confidence'], 1.0)

    def test_replay_signature_is_stable_for_equivalent_inputs(self):
        for _ in range(50):
            proposal = module.Proposal(
                proposer='agent:stable',
                action_type='TRANSFER_ASSET',
                payload={'target_asset': 'Asset_S', 'amount': 100},
                confidence=0.8,
            )
            runtime_a = module.RhizohExecutionRuntime()
            runtime_b = module.RhizohExecutionRuntime()
            result_a = runtime_a.process_execution_proposal(proposal)
            result_b = runtime_b.process_execution_proposal(proposal)
            self.assertEqual(result_a['trace_entry']['trace_signature'], result_b['trace_entry']['trace_signature'])


if __name__ == '__main__':
    unittest.main()
