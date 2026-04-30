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
    where: { roles: { has: 'ADMIN' } },
  });

  const adminOwner = await prisma.user.findFirst({
    where: { userType: 'ADMIN_OWNER' },
  });

  if (!adminMember && !adminOwner) {
    throw new Error('Unauthorized: Admin access required');
  }
}

export async function GET() {
  try {
    const membersCount = await prisma.organizationMember.count();

    if (membersCount === 0) {
      return NextResponse.json({ message: 'no members yet' });
    }

    // We query from OrganizationMember but filter to ensure the user exists
    // to avoid the "Inconsistent query result" error from orphaned records.
    const members = await prisma.organizationMember.findMany({
      where: {
        user: {
          id: {
            not: ""
          }
        }
      },
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
    const { name, email, roles, customRoleId } = body;

    // Support both legacy single 'role' and new 'roles' array
    const rolesArray: string[] = roles
      ? (Array.isArray(roles) ? roles : [roles])
      : (body.role ? [body.role] : []);

    if (!name || !email || rolesArray.length === 0) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    if (rolesArray.length > 2) {
      return new NextResponse('A member can have at most 2 roles', { status: 400 });
    }

    // Validate each role is a valid MemberRole enum value
    const validRoles = Object.values(MemberRole);
    for (const r of rolesArray) {
      if (!validRoles.includes(r as MemberRole)) {
        return new NextResponse(`Invalid role: ${r}`, { status: 400 });
      }
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
        roles: rolesArray as MemberRole[],
        memberships: {
          create: {
            organizationId: organization.id,
            roles: rolesArray as MemberRole[],
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
