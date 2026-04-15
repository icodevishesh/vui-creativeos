import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { DocumentType } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import { saveFileToClientFolder } from '@/lib/storage/file-router';

export async function GET(
  _req: NextRequest,
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

/**
 * POST /api/clients/[id]/documents
 *
 * Accepts either:
 *   multipart/form-data — file, type?, description?
 *     → saves file to docs/uploads/[client]/, creates ClientDocument + Asset
 *   application/json   — { fileName, fileUrl, type, fileSize, mimeType } (legacy)
 *     → records pre-uploaded document metadata only
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await prisma.clientProfile.findUnique({
      where: { id },
      select: { id: true, companyName: true },
    });

    if (!client) {
      return new NextResponse('Client not found', { status: 404 });
    }

    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      // ── File upload path ──────────────────────────────────────────────
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'file is required' }, { status: 400 });
      }

      const docType = (formData.get('type') as string | null) ?? 'OTHER';
      const description = (formData.get('description') as string | null) ?? undefined;

      const { fileUrl } = await saveFileToClientFolder({
        file,
        clientId: client.id,
        companyName: client.companyName,
        uploadedById: user.id,
      });

      const doc = await prisma.clientDocument.create({
        data: {
          clientId: id,
          fileName: file.name,
          fileUrl,
          type: (docType as DocumentType) || DocumentType.OTHER,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          description,
        },
      });

      return NextResponse.json(doc, { status: 201 });
    }

    // ── Legacy JSON path ────────────────────────────────────────────────
    const body = await req.json();
    const { fileName, fileUrl, type, fileSize, mimeType } = body;

    const doc = await prisma.clientDocument.create({
      data: {
        clientId: id,
        fileName: fileName || 'Untitled',
        fileUrl: fileUrl || '',
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
