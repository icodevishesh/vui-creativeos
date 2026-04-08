import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { DocumentType } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docs = await prisma.clientDocument.findMany({
      where: { clientId: id },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(docs);
  } catch (error) {
    console.error('[CLIENT_DOCS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { fileName, fileUrl, type, fileSize, mimeType } = body;

    const doc = await prisma.clientDocument.create({
      data: {
        clientId: id,
        fileName: fileName || 'Untitled',
        fileUrl: fileUrl || 'https://example.com/mock-file.pdf',
        type: (type as DocumentType) || DocumentType.OTHER,
        fileSize: fileSize || 0,
        mimeType: mimeType || null,
      },
    });

    return NextResponse.json(doc);
  } catch (error) {
    console.error('[CLIENT_DOCS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
