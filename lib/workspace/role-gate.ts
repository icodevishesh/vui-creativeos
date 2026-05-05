import { MemberRole } from '@prisma/client';

// Roles permitted to access the Writer workspace
export const WRITER_ROLES: MemberRole[] = [
  MemberRole.COPYWRITER,
  MemberRole.CONTENT_WRITER,
];

// Roles permitted to access the Designer workspace
export const DESIGNER_ROLES: MemberRole[] = [
  MemberRole.GRAPHIC_DESIGNER,
  MemberRole.VIDEO_EDITOR,
  MemberRole.CREATIVE_LEAD,
];

// Roles with admin-level privileges (TEAM_LEAD and ACCOUNT_MANAGER have same rights
// as ADMIN except Clients/Client Onboarding pages — enforced in Sidebar & API routes)
export const PRIVILEGED_ROLES: MemberRole[] = [
  MemberRole.ADMIN,
  MemberRole.TEAM_LEAD,
  MemberRole.ACCOUNT_MANAGER,
];

export function isWriter(roles: MemberRole | MemberRole[] | string | string[]): boolean {
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr.some((r) => WRITER_ROLES.includes(r as MemberRole));
}

export function isDesigner(roles: MemberRole | MemberRole[] | string | string[]): boolean {
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr.some((r) => DESIGNER_ROLES.includes(r as MemberRole));
}

export function isPrivileged(roles: MemberRole | MemberRole[] | string | string[]): boolean {
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr.some((r) => PRIVILEGED_ROLES.includes(r as MemberRole));
}

export function hasAnyRole(userRoles: string[], targetRoles: string[]): boolean {
  return userRoles.some((r) => targetRoles.includes(r));
}
