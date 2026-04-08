import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { MemberRole, UserType } from '@prisma/client';

/**
 * SIMULATED MIDDLEWARE CHECK
 * In a real app, this would use NextAuth/Clerk session to verify the user.
 * Here we simulate by checking if there's an ADMIN in the organization.
 */
async function validateAdminAccess() {
  const adminMember = await prisma.organizationMember.findFirst({
    where: { role: 'ADMIN' },
  });
  if (!adminMember) {
    throw new Error('Unauthorized: Admin access required');
  }
}

export async function GET() {
  try {
    const members = await prisma.organizationMember.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true,
          },
        },
        customRole: true,
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('[MEMBERS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await validateAdminAccess();

    const body = await req.json();
    const { name, email, role, customRoleId } = body;

    if (!name || !email || !role) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse('User with this email already exists', { status: 400 });
    }

    // ─── Dynamic Password Generation ───────────────────────────────────────
    // Generates a random 10-character string (demo only, not for production)
    const generatedPassword = Math.random().toString(36).slice(-10);

    const organization = await prisma.organization.findFirst();
    if (!organization) {
      return new NextResponse('No organization found', { status: 404 });
    }

    // Create User + OrganizationMember
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: generatedPassword, // In real app, BCRYPT this!
        userType: UserType.ORGANIZATION_MEMBER,
        memberships: {
          create: {
            organizationId: organization.id,
            role: role as MemberRole,
            customRoleId: customRoleId || null,
          },
        },
      },
      include: {
        memberships: true,
      },
    });

    // Return the new user AND the password so the admin can copy it
    return NextResponse.json({
      user: newUser,
      password: generatedPassword,
    });
  } catch (error: any) {
    console.error('[MEMBERS_POST]', error);
    const status = error.message.includes('Unauthorized') ? 403 : 500;
    return new NextResponse(error.message || 'Internal error', { status });
  }
}
