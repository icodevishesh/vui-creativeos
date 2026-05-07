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
  const teamMembers = await prisma.clientTeamMember.findMany({
    where: { clientId: input.clientId },
    select: { userId: true },
  });

  const recipientIds = [...new Set(teamMembers.map((member) => member.userId))];
  if (recipientIds.length === 0) return;

  await dispatchNotification({
    category: input.category,
    recipientIds,
    title: input.title,
    message: input.message,
    link: input.link,
  });
}
