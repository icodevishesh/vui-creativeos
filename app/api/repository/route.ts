import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

/**
 * GET /api/repository
 *
 * Returns:
 *   folders    — one per client, with file count from the Asset table
 *   recentFiles — 20 most recent assets across all clients
 */
export async function GET() {
  try {
    // Fetch all clients to ensure even new clients without assets/folders show up
    const clients = await prisma.clientProfile.findMany({
      include: {
        folder: true,
        _count: { select: { assets: true } },
      },
      orderBy: { companyName: 'asc' },
    });
    
    const folderList = clients.map((c) => ({
      id: c.folder?.id || `folder-${c.id}`,
      name: c.companyName,
      fileCount: c._count.assets,
    }));

    // Recent files across all clients from the shared Asset table
    const recentAssets = await prisma.asset.findMany({
      take: 20,
      orderBy: { uploadedAt: 'desc' },
      include: {
        client: { select: { companyName: true } },
      },
    });

    const recentFiles = recentAssets.map((a) => ({
      id: a.id,
      name: a.assetName,
      clientName: a.client.companyName,
      size: a.fileSize,
      date: a.uploadedAt,
      url: a.fileUrl,
      mimeType: a.fileType,
    }));

    return NextResponse.json({ folders: folderList, recentFiles });
  } catch (error) {
    console.error('[REPOSITORY_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
