import { prisma } from '@/lib/prisma';
import { MemberRole } from '@prisma/client';
import { dispatchNotification } from './dispatcher';
import { notifyClientTeamMembers } from './client-notifications';

interface TaskRef {
  id: string;
  title: string;
  organizationId: string;
  clientId: string;
  calendarId?: string | null;
}

// Roles that should be notified when a task enters internal review
const INTERNAL_REVIEWER_ROLES: MemberRole[] = [
  MemberRole.ADMIN,
  MemberRole.TEAM_LEAD,
  MemberRole.ACCOUNT_MANAGER,
];

/**
 * Notify internal team members (Admin, Team Lead, Account Manager)
 * when a task is submitted for internal review.
 */
export async function notifyInternalReviewers(task: TaskRef): Promise<void> {
  const [members, org] = await Promise.all([
    prisma.organizationMember.findMany({
      where: {
        organizationId: task.organizationId,
        isActive: true,
        roles: { hasSome: INTERNAL_REVIEWER_ROLES },
      },
      select: { userId: true },
    }),
    prisma.organization.findUnique({
      where: { id: task.organizationId },
      select: { ownerId: true },
    }),
  ]);

  const recipientIds = [...new Set([
    ...members.map(m => m.userId),
    ...(org?.ownerId ? [org.ownerId] : [])
  ])];
  if (recipientIds.length === 0) return;

  const link = task.calendarId
    ? `/approvals/calendar/${task.calendarId}`
    : `/approvals`;

  await dispatchNotification({
    category: 'TASK_INTERNAL_REVIEW',
    recipientIds,
    title: 'Task Ready for Internal Review',
    message: `"${task.title}" has been submitted and is ready for internal review.`,
    link,
  });
}

/**
 * Notify the client when a task has been approved internally
 * and is ready for their review.
 */
export async function notifyClientForReview(task: TaskRef): Promise<void> {
  const link = task.calendarId
    ? `/portal/approvals/calendar/${task.calendarId}`
    : `/portal/approvals`;

  await notifyClientTeamMembers({
    clientId: task.clientId,
    category: 'TASK_CLIENT_REVIEW',
    title: 'Content Ready for Your Review',
    message: `"${task.title}" has been approved internally and is ready for your review.`,
    link,
  });
}
