# P3-INFRA-GATE (Phase A)

## Scope
- Event envelope standardization
- Queue abstraction with direct fallback
- Dual-run mode (queue + direct kernel dispatch)
- Idempotency guard
- DLQ stub + minimal metrics
- Redis Streams producer/consumer baseline
- Replay CLI baseline

## GO Criteria (Phase A baseline)
- Queue adapter selection behind flags works.
- Duplicate idempotency keys are ignored.
- Dual-run mode can be enabled without touching kernel code.
- DLQ hook receives failed events.
- Worker can consume Redis stream and ACK.
- Replay CLI can replay from stream id and optional session filter.

## Rollback (Dual-run)
1. Set `USE_DUAL_RUN=false`.
2. Set `USE_QUEUE=false` for direct path only.
3. Restart gateway instances.

## Thresholds (starter)
- `queueLag` p95 < 5000 ms (staging target)
- `errors` monotonic alert on sustained rise
- idempotency duplicate processing = 0
- DLQ growth rate stable under normal load

## Replay Assumptions
- `eventId` and `idempotencyKey` are globally unique per session scope.
- `causalBranchId` is ordering scope for future consumer sharding.
- Replay source of truth will move to persisted queue stream in Phase A-2.

## Runtime Commands
- Gateway (dual-run): `USE_QUEUE=true USE_DUAL_RUN=true npm run dev -w apps/gateway`
- Worker consumer: `npm run dev -w apps/worker`
- Replay from id: `npm run infra:replay -- --from 0-0`
- Replay by session: `npm run infra:replay -- --from 0-0 --session <sessionId>`
