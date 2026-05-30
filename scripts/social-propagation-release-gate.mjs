#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const gate = join(
  dirname(fileURLToPath(import.meta.url)),
  "../apps/gateway/src/ops/runSocialPropagationReleaseGateV0.mjs"
);

const r = spawnSync(process.execPath, [gate], { stdio: "inherit", env: process.env });
process.exit(r.status ?? 1);
