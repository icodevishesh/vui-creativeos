/**
 * One-time data migration script:
 * Converts old `role` (string) fields to new `roles` (string[]) arrays
 * in both `User` and `OrganizationMember` collections.
 *
 * Usage: npx tsx prisma/migrate-roles.ts
 *
 * Safe to run multiple times — it only updates documents that haven't been migrated yet.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting role migration...');

  // 1. Migrate OrganizationMember: role (string) → roles (string[])
  const orgMembers = await prisma.$runCommandRaw({
    find: 'OrganizationMember',
    filter: {
      role: { $exists: true },
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } },
      ],
    },
  }) as any;

  const memberDocs = orgMembers?.cursor?.firstBatch ?? [];
  console.log(`Found ${memberDocs.length} OrganizationMember docs to migrate`);

  for (const doc of memberDocs) {
    const oldRole = doc.role;
    if (oldRole) {
      await prisma.$runCommandRaw({
        update: 'OrganizationMember',
        updates: [
          {
            q: { _id: doc._id },
            u: { $set: { roles: [oldRole] }, $unset: { role: '' } },
          },
        ],
      });
      console.log(`  Migrated OrganizationMember ${doc._id}: ${oldRole} → [${oldRole}]`);
    }
  }

  // 2. Migrate User: role (string) → roles (string[])
  const users = await prisma.$runCommandRaw({
    find: 'User',
    filter: {
      role: { $exists: true, $ne: null },
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } },
      ],
    },
  }) as any;

  const userDocs = users?.cursor?.firstBatch ?? [];
  console.log(`Found ${userDocs.length} User docs to migrate`);

  for (const doc of userDocs) {
    const oldRole = doc.role;
    if (oldRole) {
      await prisma.$runCommandRaw({
        update: 'User',
        updates: [
          {
            q: { _id: doc._id },
            u: { $set: { roles: [oldRole] }, $unset: { role: '' } },
          },
        ],
      });
      console.log(`  Migrated User ${doc._id}: ${oldRole} → [${oldRole}]`);
    }
  }

  console.log('Migration complete!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
