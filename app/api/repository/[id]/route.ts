import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { withApiLogging } from '@/lib/api-logging';

const ADMIN_ROLES = ['ADMIN', 'ADMIN_OWNER', 'ACCOUNT_MANAGER'];

/**
 * DELETE /api/repository/[id]
 *
 * Deletes an asset record from the database and removes the file from disk.
 * Only admins and account managers may delete files.
 */
export const DELETE = withApiLogging(async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canDelete =
      user.userType === 'ADMIN_OWNER' ||
      (user.membership?.roles ?? []).some((r) => ADMIN_ROLES.includes(r));

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      select: { id: true, fileUrl: true },
    });

    if (!asset) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete DB record first
    await prisma.asset.delete({ where: { id } });

    // Remove file from disk — fileUrl is like /uploads/<folder>/<filename>
    // Map it to the absolute path under docs/uploads/
    if (asset.fileUrl.startsWith('/uploads/')) {
      const relativePath = asset.fileUrl.replace(/^\/uploads\//, '');
      const absolutePath = path.join(process.cwd(), 'docs', 'uploads', relativePath);
      await fs.unlink(absolutePath).catch((err) => {
        // Log but don't fail — DB record is already gone
        console.warn('[REPOSITORY_DELETE] Could not remove file from disk:', err.message);
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[REPOSITORY_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
