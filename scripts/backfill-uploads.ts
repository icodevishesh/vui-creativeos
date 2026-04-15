/**
 * scripts/backfill-uploads.ts
 *
 * Scans docs/uploads/ and creates missing Folder + Asset DB records for
 * files that were uploaded before the Asset/Folder models existed.
 *
 * Run with:
 *   npx tsx scripts/backfill-uploads.ts
 */

import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

function sanitizeFolderName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();
}

async function main() {
  const uploadsRoot = path.join(process.cwd(), 'docs', 'uploads');

  // Ensure uploads root exists
  await fs.mkdir(uploadsRoot, { recursive: true });

  // Fetch all clients to build a lookup: sanitizedName → client
  const clients = await prisma.clientProfile.findMany({
    select: { id: true, companyName: true },
  });

  const clientByFolder = new Map<string, typeof clients[number]>();
  for (const c of clients) {
    clientByFolder.set(sanitizeFolderName(c.companyName), c);
  }

  // Fallback uploader — first admin/owner user
  const fallbackUser = await prisma.user.findFirst({
    where: { userType: 'ADMIN_OWNER' },
    select: { id: true },
  });

  if (!fallbackUser) {
    console.error(
      'No ADMIN_OWNER user found — cannot set uploadedById for backfilled records.\n' +
      'Create at least one user via POST /api/auth/sign-up first.'
    );
    process.exit(1);
  }

  let folderCount = 0;
  let assetCount = 0;
  let skipped = 0;

  // Read all sub-directories in docs/uploads/
  const entries = await fs.readdir(uploadsRoot, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory());

  for (const dir of dirs) {
    const folderName = dir.name;
    const client = clientByFolder.get(folderName);

    if (!client) {
      console.warn(`  [SKIP] No client matched for folder "${folderName}"`);
      skipped++;
      continue;
    }

    // Upsert Folder record
    const folder = await prisma.folder.upsert({
      where: { clientId: client.id },
      update: {},
      create: { clientId: client.id, name: folderName },
    });

    const isNew = folder.createdAt.getTime() > Date.now() - 5000;
    if (isNew) {
      console.log(`  [FOLDER] Created: ${folderName} → ${client.companyName}`);
      folderCount++;
    } else {
      console.log(`  [FOLDER] Already exists: ${folderName} → ${client.companyName}`);
    }

    // Read files in the folder
    const folderPath = path.join(uploadsRoot, folderName);
    const files = (await fs.readdir(folderPath, { withFileTypes: true })).filter(
      (f) => f.isFile()
    );

    for (const file of files) {
      const fileUrl = `/uploads/${folderName}/${file.name}`;

      // Skip if this exact URL is already recorded
      const existing = await prisma.asset.findFirst({
        where: { fileUrl },
      });

      if (existing) {
        console.log(`    [SKIP] Asset already recorded: ${file.name}`);
        continue;
      }

      // Determine file size from disk
      const stat = await fs.stat(path.join(folderPath, file.name));

      // Infer MIME type from extension
      const ext = path.extname(file.name).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.psd': 'image/vnd.adobe.photoshop',
        '.ai': 'application/postscript',
        '.svg': 'image/svg+xml',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };

      await prisma.asset.create({
        data: {
          assetName: file.name,
          fileUrl,
          fileType: mimeMap[ext] ?? 'application/octet-stream',
          fileSize: stat.size,
          clientId: client.id,
          uploadedById: fallbackUser.id,
        },
      });

      console.log(`    [ASSET] Recorded: ${file.name} (${(stat.size / 1024).toFixed(1)} KB)`);
      assetCount++;
    }
  }

  console.log(
    `\nDone. Folders created: ${folderCount} | Assets recorded: ${assetCount} | Folders skipped (no client match): ${skipped}`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
