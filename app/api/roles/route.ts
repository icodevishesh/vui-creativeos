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

    // Ensure permissions is always stored as an array
    const permissionsArray = Array.isArray(permissions) ? permissions : [];

    // Check for duplicate role name within same org
    const existing = await prisma.customRole.findFirst({
      where: { organizationId: organization.id, name },
    });
    if (existing) {
      return new NextResponse(`A custom role named "${name}" already exists`, { status: 400 });
    }

    const role = await prisma.customRole.create({
      data: {
        name,
        description: description || null,
        permissions: permissionsArray,
        organizationId: organization.id
      }
    });

    return NextResponse.json(role);
  } catch (error: any) {
    console.error('[ROLES_POST]', error);
    if (error?.code === 'P2002') {
      return new NextResponse('A custom role with this name already exists', { status: 400 });
    }
    return new NextResponse('Internal error', { status: 500 });
  }
}
