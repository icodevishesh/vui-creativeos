/**
 * lib/notifications/worker.ts
 *
 * BullMQ Worker — runs as a SEPARATE long-lived process (scripts/start-worker.ts).
 * Consumes NotificationJobData jobs from the 'notifications' queue and:
 *
 *   1. Fetches each recipient's NotificationPreference (defaults: both channels on)
 *   2. In-App  → bulk-inserts Notification rows into MongoDB via Prisma
 *   3. Email   → fetches user emails, calls Resend SDK per recipient
 *
 * Do NOT import this file from Next.js route handlers — they use queue.ts only.
 */

import { Worker, Job } from 'bullmq';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { PreferenceType } from '@prisma/client';
import { redisConnection, NotificationJobData } from './queue';
import { buildEmailTemplate } from './email-templates';

// ── Resend client ─────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_KEY);
const FROM_ADDRESS =
  process.env.RESEND_FROM ?? 'CreativeOS <noreply@creativeos.io>';

// ── Job handler ───────────────────────────────────────────────────────────────
async function processNotification(job: Job<NotificationJobData>): Promise<void> {
  const { category, recipientIds, title, message, link } = job.data;

  if (recipientIds.length === 0) return;

  // 1. Batch-fetch preferences for all recipients in one DB round-trip
  const existingPrefs = await prisma.notificationPreference.findMany({
    where: { userId: { in: recipientIds }, category },
    select: { userId: true, inApp: true, email: true },
  });

  const prefMap = new Map(existingPrefs.map((p) => [p.userId, p]));

  const inAppIds: string[] = [];
  const emailIds: string[] = [];

  for (const userId of recipientIds) {
    // Default when no preference row exists yet: both channels ON
    const pref = prefMap.get(userId) ?? { inApp: true, email: true };
    if (pref.inApp) inAppIds.push(userId);
    if (pref.email) emailIds.push(userId);
  }

  // 2. ── In-App notifications (bulk insert) ─────────────────────────────────
  if (inAppIds.length > 0) {
    await prisma.notification.createMany({
      data: inAppIds.map((userId) => ({
        userId,
        title,
        message,
        type: PreferenceType.IN_APP,
        category,
        isRead: false,
        link: link ?? null,
      })),
    });
    console.info(
      `[NotifWorker] In-app ×${inAppIds.length} — ${category}`,
    );
  }

  // 3. ── Email notifications via Resend ─────────────────────────────────────
  if (emailIds.length > 0) {
    // Fetch user emails in one query
    const users = await prisma.user.findMany({
      where: { id: { in: emailIds } },
      select: { id: true, email: true, name: true },
    });

    const { subject, html } = buildEmailTemplate(category, { title, message, link });

    // Fire emails concurrently — Resend supports batching but individual calls
    // give better per-recipient error isolation and retry granularity via BullMQ
    const results = await Promise.allSettled(
      users.map((user) =>
        resend.emails.send({
          from: FROM_ADDRESS,
          to: user.email,
          subject,
          html,
        }),
      ),
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.info(
      `[NotifWorker] Email sent=${sent} failed=${failed} — ${category}`,
    );

    // If ALL email sends failed, throw so BullMQ retries the whole job
    if (failed > 0 && sent === 0) {
      const firstErr = (results.find((r) => r.status === 'rejected') as PromiseRejectedResult)
        .reason;
      throw new Error(`All email sends failed: ${firstErr}`);
    }
  }
}

// ── Worker instance ───────────────────────────────────────────────────────────
export const notificationWorker = new Worker<NotificationJobData>(
  'notifications',
  processNotification,
  {
    connection: redisConnection,
    concurrency: 5, // process up to 5 jobs in parallel
  },
);

notificationWorker.on('completed', (job) => {
  console.info(`[NotifWorker] ✓ job ${job.id} (${job.data.category}) completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(
    `[NotifWorker] ✗ job ${job?.id} (${job?.data?.category}) failed — ${err.message}`,
  );
});

notificationWorker.on('error', (err) => {
  console.error('[NotifWorker] Worker error:', err);
});
