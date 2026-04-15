import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { saveFileToClientFolder } from '@/lib/storage/file-router';

/**
 * POST /api/creative-upload
 *
 * Accepts a multipart form with `file` and `clientId`.
 * Saves the file to the client's designated folder and writes an Asset record.
 *
 * Body (multipart/form-data):
 *   file     — the file to upload
 *   clientId — ID of the target client
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const clientId = (formData.get('clientId') as string | null)?.trim();

    if (!file || !clientId) {
      return NextResponse.json(
        { error: 'file and clientId are required' },
        { status: 400 }
      );
    }

    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      select: { id: true, companyName: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { asset } = await saveFileToClientFolder({
      file,
      clientId: client.id,
      companyName: client.companyName,
      uploadedById: user.id,
    });

    return NextResponse.json(
      {
        id: asset.id,
        assetName: asset.assetName,
        clientId: asset.clientId,
        uploadedAt: asset.uploadedAt,
        uploadedBy: asset.uploadedById,
        fileType: asset.fileType,
        fileSize: asset.fileSize,
        fileUrl: asset.fileUrl,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/creative-upload]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/creative-upload
 *
 * Returns the 5 most recently uploaded assets for the authenticated user,
 * including assetName, clientId, clientName, uploadedAt, uploadedBy,
 * fileType, and fileSize.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assets = await prisma.asset.findMany({
      where: { uploadedById: user.id },
      take: 5,
      orderBy: { uploadedAt: 'desc' },
      include: {
        client: { select: { companyName: true } },
      },
    });

    const result = assets.map((a) => ({
      id: a.id,
      assetName: a.assetName,
      clientId: a.clientId,
      clientName: a.client.companyName,
      uploadedAt: a.uploadedAt,
      uploadedBy: a.uploadedById,
      fileType: a.fileType,
      fileSize: a.fileSize,
      fileUrl: a.fileUrl,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/creative-upload]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
