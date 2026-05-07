import { prisma } from '@/lib/prisma';
import { dispatchNotification } from './dispatcher';

export interface ClientTeamNotificationInput {
  clientId: string;
  category: string;
  title: string;
  message: string;
  link?: string;
}

export async function notifyClientTeamMembers(input: ClientTeamNotificationInput): Promise<void> {
  const [teamMembers, client] = await Promise.all([
    prisma.clientTeamMember.findMany({
      where: { clientId: input.clientId },
      select: { userId: true },
    }),
    prisma.clientProfile.findUnique({
      where: { id: input.clientId },
      select: { organizationId: true },
    }),
  ]);

  let ownerId: string | undefined;
  if (client?.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: client.organizationId },
      select: { ownerId: true },
    });
    ownerId = org?.ownerId;
  }

  const recipientIds = [...new Set([
    ...teamMembers.map((member) => member.userId),
    ...(ownerId ? [ownerId] : [])
  ])];
  if (recipientIds.length === 0) return;

  await dispatchNotification({
    category: input.category,
    recipientIds,
    title: input.title,
    message: input.message,
    link: input.link,
  });
}
