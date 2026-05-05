import { FLAGS } from "../../config/flags.js";
import { DirectQueueAdapter } from "./DirectQueueAdapter.js";
import { RedisQueueAdapter } from "./RedisQueueAdapter.js";

export const queue = FLAGS.USE_QUEUE ? new RedisQueueAdapter() : new DirectQueueAdapter();
