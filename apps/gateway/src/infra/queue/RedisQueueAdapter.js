import { createClient } from "redis";

function resolveRedisUrl() {
  return process.env.REDIS_URL || "redis://127.0.0.1:6379";
}

function resolveStreamName(event) {
  const branch = String(event?.causalBranchId || "branch:main");
  return `castle:events:${branch}`;
}

let clientPromise = null;

async function getRedisClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = createClient({ url: resolveRedisUrl() });
      client.on("error", (e) => {
        console.error("[RedisQueueAdapter]", e?.message || e);
      });
      await client.connect();
      return client;
    })();
  }
  return clientPromise;
}

export class RedisQueueAdapter {
  async enqueue(event) {
    const client = await getRedisClient();
    const stream = resolveStreamName(event);
    await client.xAdd(stream, "*", {
      envelope: JSON.stringify(event)
    });
  }

  async depth() {
    const client = await getRedisClient();
    const stream = process.env.REDIS_DEPTH_STREAM || "castle:events:branch:main";
    const info = await client.xInfoStream(stream).catch(() => null);
    return Number(info?.length || 0);
  }
}
