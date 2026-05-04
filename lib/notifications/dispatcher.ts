/**
 * lib/notifications/dispatcher.ts
 *
 * Central dispatcher that:
 *   1. Accepts a typed event + payload + recipient user IDs.
 *   2. Checks each user's NotificationPreference for that category.
 *   3. Creates an in-app Notification record if inApp=true.
 *   4. Stubs an email job if email=true (wire up a provider here later).
 *
 * Usage:
 *   await dispatchNotification({
 *     category:    'TASK_ASSIGNED',
 *     recipientIds: [userId],
 *     title:        'New task assigned',
 *     message:      'You have been assigned "Design Homepage Banner".',
 *     link:         `/tasks/${taskId}`,
 *   });
 */

import { prisma } from '@/lib/prisma';
import { NotificationType, PreferenceType } from '@prisma/client';

export interface DispatchPayload {
  /** The event category — must match NotificationType enum */
  category: NotificationType;
  /** IDs of the users who should receive this notification */
  recipientIds: string[];
  /** Short heading shown in the notification card */
  title: string;
  /** Full description */
  message: string;
  /** Optional deep-link to the related resource */
  link?: string;
}

/**
 * Dispatches an in-app (and optionally email) notification to a list of users,
 * respecting each user's NotificationPreference settings.
 */
export async function dispatchNotification(payload: DispatchPayload): Promise<void> {
  const { category, recipientIds, title, message, link } = payload;

  if (recipientIds.length === 0) return;

  // Fetch all existing preferences for these users & this category in one query
  const existingPrefs = await prisma.notificationPreference.findMany({
    where: { userId: { in: recipientIds }, category },
    select: { userId: true, inApp: true, email: true },
  });

  const prefMap = new Map(existingPrefs.map((p) => [p.userId, p]));

  const inAppRecipients: string[] = [];
  const emailRecipients: string[] = [];

  for (const userId of recipientIds) {
    // Default: both channels enabled when no preference row exists yet
    const pref = prefMap.get(userId) ?? { inApp: true, email: true };
    if (pref.inApp) inAppRecipients.push(userId);
    if (pref.email) emailRecipients.push(userId);
  }

  // ── In-App notifications (bulk create) ─────────────────────────────────────
  if (inAppRecipients.length > 0) {
    await prisma.notification.createMany({
      data: inAppRecipients.map((userId) => ({
        userId,
        title,
        message,
        type: PreferenceType.IN_APP,
        category,
        isRead: false,
        link: link ?? null,
      })),
    });
  }

  // ── Email notifications (stub — wire up Resend / Nodemailer here) ───────────
  if (emailRecipients.length > 0) {
    // TODO: replace with real email queue / provider
    console.info(
      `[Notifications] Email stub — would send "${title}" to ${emailRecipients.length} user(s):`,
      emailRecipients,
    );
  }
}
