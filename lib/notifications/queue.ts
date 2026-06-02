/**
 * lib/notifications/queue.ts
 *
 * Creates a single BullMQ Queue backed by the Upstash Redis instance.
 * All API routes push jobs here; the worker (lib/notifications/worker.ts)
 * consumes them off the critical request path.
 */

import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// ── Redis connection ─────────────────────────────────────────────────────────
// Upstash requires maxRetriesPerRequest=null so BullMQ's blocking commands work
let hasLoggedRedisError = false;

export const redisConnection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: false, // Don't queue commands when offline to prevent API hanging
  // Upstash requires TLS — pass an empty tls object so ioredis performs
  // the TLS handshake even when the URL scheme is rediss://
  tls: {},
  retryStrategy(times) {
    // Retry every 10 seconds in development instead of spamming immediately
    return Math.min(times * 1000, 10000);
  },
});

// Override duplicate method to automatically attach error handler to any duplicated connections
const originalDuplicate = redisConnection.duplicate.bind(redisConnection);
redisConnection.duplicate = function(override?: any) {
  const dup = originalDuplicate(override);
  dup.on('error', (err: any) => {
    if (!hasLoggedRedisError) {
      console.warn('[Redis] Connection failed (notifications will be skipped in development):', err.message || err);
      hasLoggedRedisError = true;
    }
  });
  dup.on('connect', () => {
    hasLoggedRedisError = false;
  });
  return dup;
};

redisConnection.on('error', (err: any) => {
  if (!hasLoggedRedisError) {
    console.warn('[Redis] Connection failed (notifications will be skipped in development):', err.message || err);
    hasLoggedRedisError = true;
  }
});

redisConnection.on('connect', () => {
  console.info('[Redis] Connected successfully');
  hasLoggedRedisError = false;
});


// ── Job payload ──────────────────────────────────────────────────────────────
export interface NotificationJobData {
  /** The event category — must match NotificationType enum */
  category: string;
  /** IDs of users who should receive this notification */
  recipientIds: string[];
  /** Short heading shown in the notification card / email subject */
  title: string;
  /** Full body copy */
  message: string;
  /** Optional deep-link to the related resource */
  link?: string;
}

// ── Queue ────────────────────────────────────────────────────────────────────
export const notificationQueue = new Queue<NotificationJobData>(
  'notifications',
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2_000 },
      removeOnComplete: {
        age: 1800, // keep completed jobs up to 30 mins (1800 seconds)
        count: 100, // keep up to 100 completed jobs
      },
      removeOnFail: {
        age: 2400, // keep failed jobs up to 40 mins (2400 seconds)
        count: 200, // keep up to 200 failed jobs
      },
    },
  },
);

notificationQueue.on('error', (err: any) => {
  // Silent or log cleanly to prevent unhandled queue error crashes/logs when offline
});
