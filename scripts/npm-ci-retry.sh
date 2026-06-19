#!/usr/bin/env bash
# Retry npm ci/install on transient registry network errors (ECONNRESET, ETIMEDOUT).
set -euo pipefail

MAX_ATTEMPTS="${NPM_CI_MAX_ATTEMPTS:-4}"
BACKOFF_SEC="${NPM_CI_BACKOFF_SEC:-15}"

if [ "$#" -eq 0 ]; then
  set -- ci
fi

npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000

attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  echo "[npm-ci-retry] attempt ${attempt}/${MAX_ATTEMPTS}: npm $*"
  if npm "$@"; then
    echo "[npm-ci-retry] success on attempt ${attempt}"
    exit 0
  fi
  code=$?
  if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
    echo "[npm-ci-retry] failed after ${MAX_ATTEMPTS} attempts (exit ${code})"
    exit "$code"
  fi
  delay=$((attempt * BACKOFF_SEC))
  echo "[npm-ci-retry] transient failure; sleeping ${delay}s..."
  sleep "$delay"
  attempt=$((attempt + 1))
done
