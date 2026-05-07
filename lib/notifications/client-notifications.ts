import { prisma } from '@/lib/prisma';
import { dispatchNotification } from './dispatcher';

export interface ClientTeamNotificationInput {
  clientId: string;
  category: string;
  title: string;
  message: string;
  link?: string;
}

async function resolveClientPortalUserId(client: { userId: string; email: string }): Promise<string | undefined> {
  const [userById, userByEmail] = await Promise.all([
    prisma.user.findUnique({
      where: { id: client.userId },
      select: { id: true, userType: true },
    }),
    prisma.user.findUnique({
      where: { email: client.email },
      select: { id: true, userType: true },
    }),
  ]);

  if (userById && ['CLIENT', 'CLIENT_MEMBER'].includes(userById.userType)) {
    return userById.id;
  }

  if (userByEmail && ['CLIENT', 'CLIENT_MEMBER'].includes(userByEmail.userType)) {
    return userByEmail.id;
  }

  return undefined;
}

export async function notifyClientTeamMembers(input: ClientTeamNotificationInput): Promise<void> {
  const [teamMembers, client] = await Promise.all([
    prisma.clientTeamMember.findMany({
      where: { clientId: input.clientId },
      select: { userId: true },
    }),
    prisma.clientProfile.findUnique({
      where: { id: input.clientId },
      select: { organizationId: true, userId: true, email: true },
    }),
  ]);

  let ownerId: string | undefined;
  const portalUserId = client ? await resolveClientPortalUserId(client) : undefined;

  if (client?.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: client.organizationId },
      select: { ownerId: true },
    });
    ownerId = org?.ownerId;
  }

  const recipientIds = [...new Set([
    ...teamMembers.map((member) => member.userId),
    ...(portalUserId ? [portalUserId] : []),
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
