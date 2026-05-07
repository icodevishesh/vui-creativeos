import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { withApiLogging } from '@/lib/api-logging';


export const GET = withApiLogging(async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.userType !== 'CLIENT' && user.userType !== 'CLIENT_MEMBER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let clientId: string | null = null;
    let clientName: string | null = null;

    if (user.userType === 'CLIENT') {
      const clientProfile = await prisma.clientProfile.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { email: user.email },
          ],
        },
        select: { id: true, companyName: true },
      });

      clientId = clientProfile?.id ?? null;
      clientName = clientProfile?.companyName ?? null;
    } else {
      const teamMember = await prisma.clientTeamMember.findFirst({
        where: { userId: user.id },
        select: {
          clientId: true,
          client: { select: { companyName: true } },
        },
      });

      clientId = teamMember?.clientId ?? null;
      clientName = teamMember?.client.companyName ?? null;
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
    }

    const assets = await prisma.asset.findMany({
      where: { clientId },
      orderBy: { uploadedAt: 'desc' },
      take: 50,
      include: {
        uploadedBy: { select: { name: true, email: true } },
        client: { select: { companyName: true } },
        task: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({
      clientId,
      clientName: clientName ?? assets[0]?.client.companyName ?? '',
      assets: assets.map((asset) => ({
        id: asset.id,
        assetName: asset.assetName,
        fileUrl: asset.fileUrl,
        fileType: asset.fileType,
        fileSize: asset.fileSize,
        uploadedAt: asset.uploadedAt,
        uploadedBy: asset.uploadedBy,
        task: asset.task,
      })),
    });
  } catch (error) {
    console.error('[PORTAL_CREATIVE_UPLOADS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
