import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { ServiceType, UserType } from '@prisma/client';
import { notifyClientTeamMembers } from '@/lib/notifications/client-notifications';
import { withApiLogging } from '@/lib/api-logging';
import { getCurrentUser, type AuthUser } from '@/lib/auth';

function getScopePermissions(user: AuthUser | null) {
  const roles = user?.membership?.roles ?? [];
  const isAdmin = user?.userType === UserType.ADMIN_OWNER || roles.includes('ADMIN');
  const canEdit = isAdmin || roles.includes('ACCOUNT_MANAGER');

  return { isAdmin, canEdit };
}

async function requireClientUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

export const GET = withApiLogging(async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireClientUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const scope = await prisma.scopeOfWork.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(scope);
  } catch (error) {
    console.error('[CLIENT_SCOPE_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
});

export const POST = withApiLogging(async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireClientUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { canEdit } = getScopePermissions(user);
    if (!canEdit) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { service, description, budget, details } = body;

    if (!service) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const item = await prisma.$transaction(async (tx) => {
      const duplicateScope = await tx.scopeOfWork.findFirst({
        where: {
          clientId: id,
          service: service as ServiceType,
        },
      });

      if (duplicateScope) {
        throw new Error(`Service "${service}" already exists in scope`);
      }

      const newScope = await tx.scopeOfWork.create({
        data: {
          clientId: id,
          service: service as ServiceType,
          description: description || '',
          budget: budget ? parseFloat(budget) : null,
          details: details || {},
        },
      });

      await tx.clientProfile.update({
        where: { id },
        data: { isScopeFinalized: true },
      });

      return newScope;
    });

    const client = await prisma.clientProfile.findUnique({
      where: { id },
      select: { companyName: true },
    });

    await notifyClientTeamMembers({
      clientId: id,
      category: 'CLIENT_SCOPE_OF_WORK',
      title: 'Scope of work updated',
      message: `The scope of work for ${client?.companyName ?? 'this client'} has been updated.`,
      link: `/clients/${id}`,
    }).catch((error) => {
      console.error('[CLIENT_SCOPE_POST] notifyClientTeamMembers failed:', error);
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('[CLIENT_SCOPE_POST]', error);
    if (error instanceof Error && error.message.includes('already exists in scope')) {
      return new NextResponse(error.message, { status: 409 });
    }
    return new NextResponse('Internal error', { status: 500 });
  }
});

export const PATCH = withApiLogging(async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireClientUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { canEdit } = getScopePermissions(user);
    if (!canEdit) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { scopeId, service, description, budget, details } = body;

    if (!scopeId) {
      return new NextResponse('Missing scopeId', { status: 400 });
    }

    const existingScope = await prisma.scopeOfWork.findFirst({
      where: { id: scopeId, clientId: id },
    });

    if (!existingScope) {
      return new NextResponse('Scope item not found', { status: 404 });
    }

    if (service !== undefined && !service) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const shouldUpdateService = service !== undefined && service !== existingScope.service;

    if (shouldUpdateService) {
      const duplicateScope = await prisma.scopeOfWork.findFirst({
        where: {
          clientId: id,
          service: service as ServiceType,
          NOT: { id: existingScope.id },
        },
      });

      if (duplicateScope) {
        return new NextResponse(`Service "${service}" already exists in scope`, { status: 409 });
      }
    }

    const updatedScope = await prisma.scopeOfWork.update({
      where: { id: existingScope.id },
      data: {
        ...(shouldUpdateService ? { service: service as ServiceType } : {}),
        ...(description !== undefined ? { description: description || '' } : {}),
        ...(budget !== undefined
          ? { budget: budget === '' || budget === null ? null : parseFloat(budget) }
          : {}),
        ...(details ? { details } : {}),
      },
    });

    const client = await prisma.clientProfile.findUnique({
      where: { id },
      select: { companyName: true },
    });

    await notifyClientTeamMembers({
      clientId: id,
      category: 'CLIENT_SCOPE_OF_WORK',
      title: 'Scope of work updated',
      message: `The scope of work for ${client?.companyName ?? 'this client'} has been updated.`,
      link: `/clients/${id}`,
    }).catch((error) => {
      console.error('[CLIENT_SCOPE_PATCH] notifyClientTeamMembers failed:', error);
    });

    return NextResponse.json(updatedScope);
  } catch (error) {
    console.error('[CLIENT_SCOPE_PATCH]', error);
    if (error instanceof Error && error.message.includes('already exists in scope')) {
      return new NextResponse(error.message, { status: 409 });
    }
    return new NextResponse('Internal error', { status: 500 });
  }
});

export const DELETE = withApiLogging(async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireClientUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { isAdmin } = getScopePermissions(user);
    if (!isAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { scopeId } = body;

    if (!scopeId) {
      return new NextResponse('Missing scopeId', { status: 400 });
    }

    const remainingCount = await prisma.$transaction(async (tx) => {
      const existingScope = await tx.scopeOfWork.findFirst({
        where: { id: scopeId, clientId: id },
      });

      if (!existingScope) {
        throw new Error('Scope item not found');
      }

      await tx.scopeOfWork.delete({
        where: { id: existingScope.id },
      });

      const remaining = await tx.scopeOfWork.count({
        where: { clientId: id },
      });

      await tx.clientProfile.update({
        where: { id },
        data: { isScopeFinalized: remaining > 0 },
      });

      return remaining;
    });

    const client = await prisma.clientProfile.findUnique({
      where: { id },
      select: { companyName: true },
    });

    await notifyClientTeamMembers({
      clientId: id,
      category: 'CLIENT_SCOPE_OF_WORK',
      title: 'Scope of work updated',
      message: `The scope of work for ${client?.companyName ?? 'this client'} was updated.`,
      link: `/clients/${id}`,
    }).catch((error) => {
      console.error('[CLIENT_SCOPE_DELETE] notifyClientTeamMembers failed:', error);
    });

    return NextResponse.json({ deleted: true, remainingCount });
  } catch (error) {
    console.error('[CLIENT_SCOPE_DELETE]', error);
    if (error instanceof Error && error.message === 'Scope item not found') {
      return new NextResponse('Scope item not found', { status: 404 });
    }
    return new NextResponse('Internal error', { status: 500 });
  }
});
