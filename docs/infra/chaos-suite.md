# Castle Chaos Suite (Final Gate)

## Scenarios

1. Kill worker process
- Expect: `XAUTOCLAIM` recovery
- Expect: zero lost events

2. Redis restart
- Expect: reconnect and replay resume
- Expect: no divergence increase

3. Duplicate flood
- Expect: `castle_gateway_duplicate_reject_total` rises
- Expect: kernel append path remains stable

4. Burst x100
- Expect: queue lag rises
- Expect: drop = 0

5. Divergence inject
- Expect: `castle_kernel_divergence_total > 0`
- Expect: health status `readonly`
- Expect: writes degraded / mutation guard path active

## Pass Criteria
- Loss rate: 0
- Divergence delta: 0 (except inject test)
- Recovery success: 100%
