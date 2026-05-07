import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { withApiLogging } from '@/lib/api-logging';


/**
 * GET /api/repository
 *
 * Without ?clientId:
 *   Returns folders (one per client with fileCount) + 10 most recent assets
 *
 * With ?clientId=:
 *   Returns all assets for that client, ordered newest first
 */
export const GET = withApiLogging(async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (clientId) {
      const assets = await prisma.asset.findMany({
        where: { clientId },
        orderBy: { uploadedAt: 'desc' },
      });

      return NextResponse.json(
        assets.map((a) => ({
          id: a.id,
          name: a.assetName,
          size: a.fileSize,
          date: a.uploadedAt,
          url: a.fileUrl,
          mimeType: a.fileType,
          taskId: a.taskId ?? null,
        }))
      );
    }

    // Root view — one folder per client + recent files
    const clients = await prisma.clientProfile.findMany({
      include: {
        folder: true,
        _count: { select: { assets: true } },
      },
      orderBy: { companyName: 'asc' },
    });

    const folders = clients.map((c) => ({
      id: c.folder?.id ?? `folder-${c.id}`,
      clientId: c.id,
      name: c.companyName,
      fileCount: c._count.assets,
    }));

    // Only fetch assets whose client still exists — avoids crash from orphaned rows
    const validClientIds = clients.map((c) => c.id);

    const recentAssets = await prisma.asset.findMany({
      take: 10,
      where: { clientId: { in: validClientIds } },
      orderBy: { uploadedAt: 'desc' },
      include: {
        client: { select: { companyName: true } },
      },
    });


    const recentFiles = recentAssets.map((a) => ({
      id: a.id,
      name: a.assetName,
      clientName: a.client.companyName,
      clientId: a.clientId,
      size: a.fileSize,
      date: a.uploadedAt,
      url: a.fileUrl,
      mimeType: a.fileType,
    }));

    return NextResponse.json({ folders, recentFiles });
  } catch (error) {
    console.error('[REPOSITORY_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
});
