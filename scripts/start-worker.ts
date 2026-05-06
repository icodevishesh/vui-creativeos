/**
 * scripts/start-worker.ts
 *
 * Standalone entrypoint for the BullMQ notification worker.
 * Run this in a SEPARATE terminal alongside `npm run dev`:
 *
 *   npx tsx scripts/start-worker.ts
 *
 * In production, run this as a separate container / dyno / PM2 process.
 * It must NOT be imported by Next.js route handlers.
 */

// tsconfig-paths is needed so '@/' aliases resolve in tsx
import 'tsconfig-paths/register';

// Boot the worker (imports Redis connection + Prisma + Resend internally)
import '../lib/notifications/worker';

console.info('[Worker] Notification worker started — waiting for jobs...');

// Keep the process alive
process.on('SIGINT', async () => {
  console.info('[Worker] Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.info('[Worker] SIGTERM received — shutting down...');
  process.exit(0);
});
