import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { withApiLogging } from '@/lib/api-logging';

const ADMIN_ROLES = ['ADMIN', 'ADMIN_OWNER', 'ACCOUNT_MANAGER', 'TEAM_LEAD'];

async function requireAdmin() {
  const user = await getCurrentUser();
  const isAdmin =
    user?.userType === 'ADMIN_OWNER' ||
    (user?.membership?.roles ?? []).some((role) => ADMIN_ROLES.includes(role));
  if (!user || !isAdmin) return null;
  return user;
}

function generatePassword(): string {
  const upper   = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lower   = 'abcdefghjkmnpqrstuvwxyz';
  const digits  = '23456789';
  const special = '@#$!';
  const pool    = upper + lower + digits;

  const pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  for (let i = 0; i < 8; i++) {
    pwd.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return pwd.sort(() => Math.random() - 0.5).join('');
}

export const POST = withApiLogging(async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const member = await prisma.organizationMember.findUnique({
      where: { id },
      select: { id: true, userId: true, user: { select: { id: true, email: true, name: true } } },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const newPassword = generatePassword();

    await prisma.user.update({
      where: { id: member.userId },
      data: { password: newPassword },
    });

    return NextResponse.json({
      email: member.user?.email,
      name: member.user?.name,
      password: newPassword,
    });
  } catch (error) {
    console.error('[MEMBER_RESET_PASSWORD]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
