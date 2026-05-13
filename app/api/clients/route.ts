/**
 * TODO: Add to queue for notification for subtasks
 */


import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { EngagementType, ServiceType } from '@prisma/client';
import { ensureClientFolder } from '@/lib/storage/file-router';
import { dispatchNotification } from '@/lib/notifications/dispatcher';
import { getCurrentUser } from '@/lib/auth';
import { withApiLogging } from '@/lib/api-logging';


function generatePassword(): string {
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$!';
  const all = upper + lower + digits;
  let pwd = '';
  for (let i = 0; i < 8; i++) pwd += all[Math.floor(Math.random() * all.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

export const GET = withApiLogging(async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return new NextResponse('Unauthorized', { status: 401 });

    const ADMIN_ROLES = ['ADMIN', 'ADMIN_OWNER', 'ACCOUNT_MANAGER', 'TEAM_LEAD'];
    const isAdmin =
      me.userType === 'ADMIN_OWNER' ||
      (me.membership?.roles ?? []).some((r) => ADMIN_ROLES.includes(r));

    let where: any = {};

    if (isAdmin) {
      // Full access — no filter
      where = {};
    } else if (me.userType === 'CLIENT') {
      // CLIENT users: only see the ClientProfile whose userId matches their own
      where = {
        OR: [
          { userId: me.id },
          { email: me.email },
        ],
      };
    } else {
      // Regular org members: only clients where they appear in ClientTeamMember
      where = { teamMembers: { some: { userId: me.id } } };
    }

    const clients = await prisma.clientProfile.findMany({
      where,
      include: {
        services: true,
        teamMembers: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('[API_CLIENTS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
});

export const POST = withApiLogging(async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      companyName,
      contactPerson,
      email,
      phone,
      industry,
      engagementType,
      services
    } = body;

    if (!companyName || !contactPerson || !email || !phone || !industry || !engagementType) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Checking for existing records
    const existingClient = await prisma.clientProfile.findFirst({
      where: {
        OR: [
          { companyName },
          { email },
          { phone }
        ]
      }
    });

    if (existingClient) {
      return new NextResponse('Client already exists with this company name, email or phone', { status: 400 });
    }

    // Ensure we have an admin user and organization (fallback logic for demo)
    let adminUser = await prisma.user.findFirst({ where: { userType: 'ADMIN_OWNER' } });
    let org = await prisma.organization.findFirst();

    if (!adminUser || !org) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@creativeos.com',
          password: 'admin123',
          name: 'Admin User',
          userType: 'ADMIN_OWNER'
        }
      });
      org = await prisma.organization.create({
        data: { name: 'Default Agency', ownerId: adminUser.id }
      });
    }

    // Generate credentials for the client portal login
    const plainPassword = generatePassword();

    // Check if a CLIENT user already exists for this email
    let clientUser = await prisma.user.findUnique({ where: { email } });
    if (clientUser && !['CLIENT', 'CLIENT_MEMBER'].includes(clientUser.userType)) {
      return new NextResponse('Email already belongs to another account', { status: 400 });
    }

    if (!clientUser) {
      clientUser = await prisma.user.create({
        data: {
          email,
          password: plainPassword,
          name: contactPerson,
          userType: 'CLIENT',
        }
      });
    }

    // Create client profile
    const client = await prisma.clientProfile.create({
      data: {
        companyName,
        contactPerson,
        email,
        phone,
        industry,
        engagementType: engagementType as EngagementType,
        userId: clientUser.id,
        organizationId: org.id,
        services: {
          create: (services || []).map((service: ServiceType) => ({ service }))
        }
      },
      include: { services: true }
    });

    // Auto-create the client's upload folder in the repository
    await ensureClientFolder(client.id, client.companyName);

    // ── Notify admin that a new client has been onboarded ─────────────
    dispatchNotification({
      category: 'CLIENT_ONBOARDED',
      recipientIds: [adminUser.id],
      title: 'New client onboarded',
      message: `"${companyName}" has been successfully added as a client.`,
      link: `/clients`,
    }).catch((err) => console.error('[API_CLIENTS_POST] notification dispatch failed:', err));

    return NextResponse.json({ ...client, generatedPassword: plainPassword });
  } catch (error) {
    console.error('[API_CLIENTS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
});
