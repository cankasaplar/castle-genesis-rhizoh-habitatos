# Chaos Report (Execution Attempt)

Date: 2026-05-05  
Scope: `kill worker`, `kill gateway`, `redis restart`, `burst x100`, `duplicate flood`, `forced divergence`, `rehydration hash match`

## Environment Status

- Docker CLI exists, but Docker Desktop Linux engine is unavailable on this machine at runtime.
- Blocking error while bringing stack up:
  - `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`

## Checklist Result

- kill worker -> BLOCKED (runtime not booted)
- kill gateway instance -> BLOCKED (runtime not booted)
- Redis restart -> BLOCKED (runtime not booted)
- burst x100 -> BLOCKED (runtime not booted)
- duplicate flood -> BLOCKED (runtime not booted)
- forced divergence -> BLOCKED (runtime not booted)
- rehydration hash match -> BLOCKED (runtime not booted)

## Metrics (Current Run)

- recovery time: n/a
- lost event: n/a
- replay duration: n/a
- readonly switch latency: n/a
- queue peak lag: n/a

## What Was Verified

- Provisioning config is syntactically valid: `docker compose -f ops/docker-compose.observability.yml config` -> PASS
- Boot-ready files are present for Prometheus, Alertmanager, Grafana datasource/dashboard provisioning, compose, and k8s baseline.

## Next Run Command Set (Once Docker Engine Is Up)

1. `docker compose -f ops/docker-compose.observability.yml up -d`
2. Execute chaos scenarios from `docs/infra/chaos-suite.md`
3. Collect `/infra/health` + `/infra/metrics` snapshots during each scenario
4. Update this report with measured values and PASS/FAIL per gate
