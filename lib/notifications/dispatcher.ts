/**
 * lib/notifications/dispatcher.ts
 *
 * Thin enqueuer — the only thing API routes should import.
 *
 * Pushes a typed NotificationJobData job onto the BullMQ 'notifications'
 * queue (backed by Upstash Redis).  The worker (lib/notifications/worker.ts)
 * consumes jobs off the critical path and handles:
 *   • In-app  → Prisma notification.createMany
 *   • Email   → Resend SDK
 *
 * Usage (unchanged from before):
 *   await dispatchNotification({
 *     category:     'TASK_ASSIGNED',
 *     recipientIds: [userId],
 *     title:        'New task assigned',
 *     message:      'You have been assigned "Design Homepage Banner".',
 *     link:         `/tasks/${taskId}`,
 *   });
 */

import { notificationQueue, NotificationJobData } from './queue';
import { prisma } from '@/lib/prisma';

// Re-export so callers don't need two imports
export type { NotificationJobData };

export interface DispatchPayload {
  /** The event category — must match NotificationType enum */
  category: string;
  /** IDs of the users who should receive this notification */
  recipientIds: string[];
  /** Short heading shown in the notification card / email subject */
  title: string;
  /** Full description */
  message: string;
  /** Optional deep-link to the related resource (relative path) */
  link?: string;
}

async function getAdminOwnerRecipientIds(): Promise<string[]> {
  const adminOwners = await prisma.user.findMany({
    where: { userType: 'ADMIN_OWNER' },
    select: { id: true },
  });

  return adminOwners.map((user) => user.id);
}

/**
 * Enqueues a notification job.
 * Non-blocking — returns as soon as Redis accepts the job.
 * Retried up to 3 times with exponential back-off by BullMQ if the worker fails.
 */
export async function dispatchNotification(payload: DispatchPayload): Promise<void> {
  const adminOwnerIds = await getAdminOwnerRecipientIds();
  const recipientIds = [...new Set([...payload.recipientIds, ...adminOwnerIds])];

  if (recipientIds.length === 0) return;

  await notificationQueue.add('send', {
    ...payload,
    recipientIds,
  } as NotificationJobData);
}
