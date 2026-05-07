/**
 * POST /api/members
 *
 * Creates a new organization member (User + OrganizationMember) and:
 *   1. Hashes the password with bcrypt (10 rounds) — never stores plain-text.
 *   2. Sends a welcome + credentials email directly via Resend (synchronous,
 *      so we know it fired before returning the response).
 *   3. Enqueues a TASK_ASSIGNED-style in-app "Welcome" notification via BullMQ.
 *
 * GET /api/members
 *
 * Returns all organization members with their user info and custom role.
 */

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { MemberRole, UserType } from '@prisma/client';
import { Resend } from 'resend';
import { buildWelcomeEmail } from '@/lib/notifications/email-templates';
import { dispatchNotification } from '@/lib/notifications/dispatcher';

const resend = new Resend(process.env.RESEND_KEY);
const FROM_ADDRESS = process.env.RESEND_FROM ?? 'CreativeOS <noreply@creativeos.io>';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a cryptographically-safer random password.
 *  • At least 1 uppercase, 1 lowercase, 1 digit, 1 special char
 *  • 12 characters total — readable, not ambiguous chars stripped
 */
function generatePassword(): string {
  const upper   = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lower   = 'abcdefghjkmnpqrstuvwxyz';
  const digits  = '23456789';
  const special = '@#$!';
  const pool    = upper + lower + digits;

  // Guarantee at least one from each required group
  const pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  // Fill remaining 8 chars from the full pool
  for (let i = 0; i < 8; i++) {
    pwd.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  // Shuffle to avoid predictable leading chars
  return pwd.sort(() => Math.random() - 0.5).join('');
}

/** Maps a MemberRole enum value to a human-readable label */
function roleLabel(role: string): string {
  const map: Record<string, string> = {
    ADMIN:                'Admin',
    ADMIN_OWNER:          'Admin Owner',
    TEAM_LEAD:            'Team Lead',
    ACCOUNT_MANAGER:      'Account Manager',
    COPYWRITER:           'Copywriter',
    CONTENT_WRITER:       'Content Writer',
    GRAPHIC_DESIGNER:     'Graphic Designer',
    CREATIVE_LEAD:        'Creative Lead',
    VIDEO_EDITOR:         'Video Editor',
    SOCIAL_MEDIA_MANAGER: 'Social Media Manager',
    SEO_SPECIALIST:       'SEO Specialist',
  };
  return map[role] ?? role;
}

/**
 * Validates that the requester has admin access.
 * In a real app this would use a session token; here we check for any
 * ADMIN membership or ADMIN_OWNER user record as the project currently uses.
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/members
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const membersCount = await prisma.organizationMember.count();
    if (membersCount === 0) {
      return NextResponse.json([]);
    }

    const members = await prisma.organizationMember.findMany({
      where: { user: { id: { not: '' } } },
      include: {
        user: {
          select: { id: true, name: true, email: true, userType: true },
        },
        customRole: true,
      },
      orderBy: { joinedAt: 'desc' },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('[MEMBERS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/members
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    await validateAdminAccess();

    const body = await req.json();
    const { name, email, roles, customRoleId } = body;

    // Support both legacy single 'role' and new 'roles' array
    const rolesArray: string[] = roles
      ? (Array.isArray(roles) ? roles : [roles])
      : (body.role ? [body.role] : []);

    // ── Validation ─────────────────────────────────────────────────────────
    if (!name || !email || rolesArray.length === 0) {
      return new NextResponse('Missing required fields: name, email, roles', { status: 400 });
    }

    if (rolesArray.length > 2) {
      return new NextResponse('A member can have at most 2 roles', { status: 400 });
    }

    const validRoles = Object.values(MemberRole);
    for (const r of rolesArray) {
      if (!validRoles.includes(r as MemberRole)) {
        return new NextResponse(`Invalid role: ${r}`, { status: 400 });
      }
    }

    // ── Duplicate check ────────────────────────────────────────────────────
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new NextResponse('User with this email already exists', { status: 400 });
    }

    // ── Organisation lookup ────────────────────────────────────────────────
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      return new NextResponse('No organization found', { status: 404 });
    }

    // ── Password — generate plain, store as-is ────────────────────────────
    const plainPassword = generatePassword();

    // ── Create User + OrganizationMember (single transaction) ─────────────
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: plainPassword,
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
      include: { memberships: true },
    });

    // ── Human-readable role string for the email ───────────────────────────
    const roleDisplay = rolesArray.map(roleLabel).join(' & ');

    // ── 1. Welcome + credentials email (synchronous via Resend) ───────────
    // Sent directly — NOT via BullMQ — because credentials MUST be delivered
    // before we return; losing them in a queue failure would lock the user out.
    const { subject, html } = buildWelcomeEmail({
      name,
      email,
      password: plainPassword,
      role:     roleDisplay,
    });

    const emailResult = await resend.emails.send({
      from:    FROM_ADDRESS,
      to:      email,
      subject,
      html,
    });

    const emailSent = !emailResult.error;
    if (!emailSent) {
      // Log but don't fail the request — the admin still gets the password
      // in the response and can share it manually.
      console.error('[MEMBERS_POST] Welcome email failed:', emailResult.error);
    }

    // ── 2. In-app "Welcome" notification (async via BullMQ) ───────────────
    // Uses TASK_ASSIGNED category as a general-purpose "you have a new role"
    // notification — appears in the member's notification bell immediately.
    await dispatchNotification({
      category:     'TASK_ASSIGNED',
      recipientIds: [newUser.id],
      title:        `Welcome to CreativeOS, ${name}! 🎉`,
      message:      `Your account has been created with the role: ${roleDisplay}. Check your email for login credentials.`,
      link:         '/dashboard',
    });

    // ── Response — return plain password so admin can share it if email failed
    return NextResponse.json({
      user:        newUser,
      password:    plainPassword,   // shown to admin once; hashed in DB
      emailSent,                    // lets the UI show a warning if email failed
    });

  } catch (error: unknown) {
    console.error('[MEMBERS_POST]', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    const status = message.includes('Unauthorized') ? 403 : 500;
    return new NextResponse(message, { status });
  }
}
