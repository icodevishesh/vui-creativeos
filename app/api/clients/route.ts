import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { ClientStatus, EngagementType, ServiceType } from '@prisma/client';

export async function GET() {
  try {
    const clients = await prisma.clientProfile.findMany({
      include: {
        services: true,
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

    // Ensure we have a user and organization (fallback logic for demo)
    let user = await prisma.user.findFirst();
    let org = await prisma.organization.findFirst();

    if (!user || !org) {
      const defaultUser = await prisma.user.create({
        data: {
          email: 'admin@creativeos.com',
          password: 'hashed_password_here',
          name: 'Admin User',
          userType: 'ADMIN_OWNER'
        }
      });
      const defaultOrg = await prisma.organization.create({
        data: {
          name: 'Default Agency',
          ownerId: defaultUser.id
        }
      });
      user = defaultUser;
      org = defaultOrg;
    }

    // Create client
    const client = await prisma.clientProfile.create({
      data: {
        companyName,
        contactPerson,
        email,
        phone,
        industry,
        engagementType: engagementType as EngagementType,
        userId: user.id,
        organizationId: org.id,
        services: {
          create: (services || []).map((service: ServiceType) => ({
            service
          }))
        }
      },
      include: {
        services: true
      }
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('[API_CLIENTS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
