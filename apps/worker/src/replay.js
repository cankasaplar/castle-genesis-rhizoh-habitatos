import { createClient } from "redis";
import { consume } from "../../kernel/src/consumer/KernelConsumer.js";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const STREAM = process.env.WORKER_STREAM || "castle:events:branch:main";

function parseArg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  return process.argv[i + 1] || fallback;
}

async function main() {
  const fromId = parseArg("from", "0-0");
  const sessionId = parseArg("session", "");
  const limit = Number(parseArg("limit", "200"));
  const client = createClient({ url: REDIS_URL });
  await client.connect();
  const rows = await client.xRange(STREAM, fromId, "+", { COUNT: Math.max(1, limit) });
  let replayed = 0;
  for (const row of rows) {
    const raw = row.message?.envelope;
    if (!raw) continue;
    const env = JSON.parse(raw);
    if (sessionId && String(env.sessionId || "") !== sessionId) continue;
    await consume(env);
    replayed += 1;
  }
  console.log(`[replay] stream=${STREAM} from=${fromId} session=${sessionId || "*"} replayed=${replayed}`);
  await client.disconnect();
}

main().catch((e) => {
  console.error("[replay-fatal]", e);
  process.exit(1);
});
