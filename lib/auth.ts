import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  userType: string;
  membership: { roles: string[]; organizationId: string } | null;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        memberships: {
          take: 1,
          select: { roles: true, organizationId: true },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      membership: user.memberships[0]
        ? { roles: user.memberships[0].roles, organizationId: user.memberships[0].organizationId }
        : null,
    };
  } catch {
    return null;
  }
}
