import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { EngagementType, ServiceType } from '@prisma/client';
import { ensureClientFolder } from '@/lib/storage/file-router';
import bcrypt from 'bcryptjs';

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

export async function GET() {
  try {
    const clients = await prisma.clientProfile.findMany({
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
}

export async function POST(req: Request) {
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
          password: await bcrypt.hash('admin123', 10),
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
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Check if a CLIENT user already exists for this email
    let clientUser = await prisma.user.findUnique({ where: { email } });
    if (!clientUser) {
      clientUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
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
        userId: adminUser.id,
        organizationId: org.id,
        services: {
          create: (services || []).map((service: ServiceType) => ({ service }))
        }
      },
      include: { services: true }
    });

    // Auto-create the client's upload folder in the repository
    await ensureClientFolder(client.id, client.companyName);

    return NextResponse.json({ ...client, generatedPassword: plainPassword });
  } catch (error) {
    console.error('[API_CLIENTS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
