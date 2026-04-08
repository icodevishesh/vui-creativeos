import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { MemberRole } from '@prisma/client';

export async function GET() {
  try {
    // 1. Get predefined roles from Enum
    const predefinedRoles = Object.values(MemberRole);

    // 2. Get custom roles from DB
    const organization = await prisma.organization.findFirst();
    const customRoles = organization 
      ? await prisma.customRole.findMany({ where: { organizationId: organization.id } })
      : [];

    return NextResponse.json({
      predefined: predefinedRoles,
      custom: customRoles
    });
  } catch (error) {
    console.error('[ROLES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, permissions } = body;

    if (!name) {
      return new NextResponse('Role name is required', { status: 400 });
    }

    const organization = await prisma.organization.findFirst();
    if (!organization) {
      return new NextResponse('No organization found', { status: 404 });
    }

    const role = await prisma.customRole.create({
      data: {
        name,
        description,
        permissions: permissions || {},
        organizationId: organization.id
      }
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('[ROLES_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
