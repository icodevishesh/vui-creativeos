import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '../prisma';

export function sanitizeFolderName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();
}

/**
 * Ensures the client's upload folder exists on disk and a Folder record
 * exists in the database. Safe to call multiple times (idempotent).
 *
 * Returns the absolute path to the client's upload directory.
 */
export async function ensureClientFolder(
  clientId: string,
  companyName: string
): Promise<string> {
  const safeName = sanitizeFolderName(companyName);
  const uploadDir = path.join(process.cwd(), 'docs', 'uploads', safeName);
  await fs.mkdir(uploadDir, { recursive: true });

  await prisma.folder.upsert({
    where: { clientId },
    update: {},
    create: { clientId, name: safeName },
  });

  return uploadDir;
}

/**
 * Saves a File to the client's folder on disk and writes an Asset record.
 * Used by both Creative Upload and Designer workspace uploads so they share
 * the same storage path and DB table.
 */
export async function saveFileToClientFolder(params: {
  file: File;
  clientId: string;
  companyName: string;
  uploadedById: string;
  taskId?: string;
}) {
  const { file, clientId, companyName, uploadedById, taskId } = params;

  const uploadDir = await ensureClientFolder(clientId, companyName);

  const baseName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueFileName = `${Date.now()}-${baseName}`;
  const filePath = path.join(uploadDir, uniqueFileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  const safeFolderName = sanitizeFolderName(companyName);
  const fileUrl = `/uploads/${safeFolderName}/${uniqueFileName}`;

  const asset = await prisma.asset.create({
    data: {
      assetName: file.name,
      fileUrl,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      clientId,
      uploadedById,
      ...(taskId ? { taskId } : {}),
    },
  });

  return { asset, fileUrl, filePath };
}
