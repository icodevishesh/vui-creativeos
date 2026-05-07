import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { saveFileToClientFolder } from '@/lib/storage/file-router';
import { notifyClientTeamMembers } from '@/lib/notifications/client-notifications';
import { withApiLogging } from '@/lib/api-logging';


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
export const POST = withApiLogging(async function POST(req: NextRequest) {
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
      select: { id: true, companyName: true, userId: true, email: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    let allowedClientId: string | null = client.id;
    if (user.userType === 'CLIENT') {
      const ownClient = await prisma.clientProfile.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { email: user.email },
          ],
        },
        select: { id: true },
      });
      allowedClientId = ownClient?.id ?? null;
    } else if (user.userType === 'CLIENT_MEMBER') {
      const teamMember = await prisma.clientTeamMember.findFirst({
        where: { userId: user.id },
        select: { clientId: true },
      });
      allowedClientId = teamMember?.clientId ?? null;
    }

    if (!allowedClientId || allowedClientId !== client.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { asset } = await saveFileToClientFolder({
      file,
      clientId: client.id,
      companyName: client.companyName,
      uploadedById: user.id,
    });

    await notifyClientTeamMembers({
      clientId: client.id,
      category: 'CREATIVE_UPLOADED',
      title: 'Creative file uploaded',
      message: `A new creative file, "${file.name}", has been uploaded for ${client.companyName}.`,
      link: `/clients/${client.id}`,
    }).catch((error) => {
      console.error('[POST /api/creative-upload] notifyClientTeamMembers failed:', error);
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
});

/**
 * GET /api/creative-upload
 *
 * Returns the 5 most recently uploaded assets for the authenticated user,
 * including assetName, clientId, clientName, uploadedAt, uploadedBy,
 * fileType, and fileSize.
 */
export const GET = withApiLogging(async function GET() {
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
});
