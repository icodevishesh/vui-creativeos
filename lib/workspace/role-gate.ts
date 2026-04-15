import { MemberRole } from '@prisma/client';

// Roles permitted to access the Writer workspace
export const WRITER_ROLES: MemberRole[] = [
  MemberRole.COPYWRITER,
  MemberRole.CONTENT_WRITER,
];

// Roles permitted to access the Designer workspace
export const DESIGNER_ROLES: MemberRole[] = [
  MemberRole.GRAPHIC_DESIGNER,
];

export function isWriter(role: MemberRole | string): boolean {
  return WRITER_ROLES.includes(role as MemberRole);
}

export function isDesigner(role: MemberRole | string): boolean {
  return DESIGNER_ROLES.includes(role as MemberRole);
}
