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

export function isWriter(roles: MemberRole | MemberRole[] | string | string[]): boolean {
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr.some((r) => WRITER_ROLES.includes(r as MemberRole));
}

export function isDesigner(roles: MemberRole | MemberRole[] | string | string[]): boolean {
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr.some((r) => DESIGNER_ROLES.includes(r as MemberRole));
}

export function hasAnyRole(userRoles: string[], targetRoles: string[]): boolean {
  return userRoles.some((r) => targetRoles.includes(r));
}
