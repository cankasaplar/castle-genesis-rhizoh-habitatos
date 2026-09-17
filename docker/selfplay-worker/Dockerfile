# Autonomous Self-Play Worker for Hetzner CPX31 (x86_64 Linux)
# Zero-cost local build; deployment scheduled for month-start rollout

FROM alpine:3.20 AS builder

RUN apk add --no-cache \
    build-base \
    rust \
    cargo \
    git

WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY config ./config

# Build static release binary with native CPU optimizations
RUN cargo build --release

FROM alpine:3.20

RUN apk add --no-cache \
    python3 \
    py3-pip \
    bash \
    curl

WORKDIR /app
COPY --from=builder /build/target/release/castle /app/castle
COPY config/stockfish_cc0.nnue /app/config/stockfish_cc0.nnue
COPY scripts/selfplay_daemon.py /app/selfplay_daemon.py

ENV WORKER_THREADS=4
ENV BATCH_SIZE=1000
ENV EVAL_MODE=NNUE

ENTRYPOINT ["python3", "/app/selfplay_daemon.py"]
