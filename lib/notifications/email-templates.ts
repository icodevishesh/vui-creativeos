/**
 * lib/notifications/email-templates.ts
 *
 * Maps every NotificationType to a simple, branded HTML email.
 * Also exports the standalone `buildWelcomeEmail` for member onboarding
 * (sent directly via Resend, not through BullMQ, so credentials reach the
 * member synchronously before the API response is returned).
 *
 * No React-email dependency — plain template literals for zero build cost.
 */

import { NotificationType } from '@prisma/client';

export interface EmailTemplateInput {
  title: string;
  message: string;
  link?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.creativeos.io';
const BRAND_COLOR = '#6366F1'; // indigo-500 — matches the UI palette

// ─────────────────────────────────────────────────────────────────────────────
// Shared HTML wrapper
// ─────────────────────────────────────────────────────────────────────────────
function wrap(title: string, body: string, ctaHref?: string, ctaLabel?: string): string {
  const cta = ctaHref
    ? `<div style="text-align:center;margin-top:32px;">
        <a href="${ctaHref}"
           style="background:${BRAND_COLOR};color:#fff;padding:12px 28px;border-radius:8px;
                  text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
          ${ctaLabel ?? 'View Details'}
        </a>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};padding:24px 32px;">
              <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:.5px;">
                CreativeOS
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 8px;">
              <h2 style="margin:0 0 12px;font-size:20px;color:#18181b;">${title}</h2>
              <p style="margin:0;font-size:15px;color:#52525b;line-height:1.6;">${body}</p>
              ${cta}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px 32px;border-top:1px solid #e4e4e7;margin-top:24px;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                You're receiving this because of your CreativeOS notification preferences.
                <br />Manage preferences inside the app under <strong>Settings → Notifications</strong>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome email (member onboarding) — standalone, not a NotificationType
// ─────────────────────────────────────────────────────────────────────────────

export interface WelcomeEmailOptions {
  /** The new member's display name */
  name: string;
  /** The new member's login email */
  email: string;
  /** The plain-text password generated for them */
  password: string;
  /** Their role(s) as a human-readable string e.g. "Graphic Designer" */
  role: string;
  /** Login page URL — defaults to APP_URL/login */
  loginUrl?: string;
}

export function buildWelcomeEmail(opts: WelcomeEmailOptions): EmailTemplate {
  const { name, email, password, role, loginUrl } = opts;
  const loginHref = loginUrl ?? `${APP_URL}/login`;

  const subject = `🎉 Welcome to CreativeOS, ${name}!`;

  const body = `
    Hi <strong>${name}</strong>,
    <br /><br />
    You've been added to <strong>CreativeOS</strong> as a <strong>${role}</strong>.
    Your account is ready — here are your login credentials:
    <br /><br />

    <!-- Credentials card -->
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f4f4f5;border-radius:8px;margin:20px 0;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 10px;font-size:13px;color:#71717a;text-transform:uppercase;
                    letter-spacing:.8px;font-weight:600;">
            Login URL
          </p>
          <p style="margin:0 0 18px;font-size:14px;color:#18181b;">
            <a href="${loginHref}" style="color:${BRAND_COLOR};text-decoration:none;">${loginHref}</a>
          </p>

          <p style="margin:0 0 10px;font-size:13px;color:#71717a;text-transform:uppercase;
                    letter-spacing:.8px;font-weight:600;">
            Email
          </p>
          <p style="margin:0 0 18px;font-size:14px;color:#18181b;font-family:monospace;">
            ${email}
          </p>

          <p style="margin:0 0 10px;font-size:13px;color:#71717a;text-transform:uppercase;
                    letter-spacing:.8px;font-weight:600;">
            Temporary Password
          </p>
          <p style="margin:0;font-size:16px;color:#18181b;font-family:monospace;
                    background:#ffffff;padding:10px 14px;border-radius:6px;
                    border:1px solid #e4e4e7;display:inline-block;letter-spacing:1px;">
            ${password}
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = wrap(subject, body, loginHref, 'Log In Now');

  return { subject, html };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-category notification templates
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES: Record<
  NotificationType,
  (input: EmailTemplateInput) => EmailTemplate
> = {
  TASK_ASSIGNED: ({ title, message, link }) => ({
    subject: `🎯 ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'View Task'),
  }),

  TASK_COMPLETED: ({ title, message, link }) => ({
    subject: `✅ ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'View Task'),
  }),

  TASK_INTERNAL_REVIEW: ({ title, message, link }) => ({
    subject: `🔍 ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'Review Task'),
  }),

  TASK_CLIENT_REVIEW: ({ title, message, link }) => ({
    subject: `👁️ ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'Review Content'),
  }),

  TASK_APPROVED: ({ title, message, link }) => ({
    subject: `🎉 ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'View Task'),
  }),

  TASK_FEEDBACK: ({ title, message, link }) => ({
    subject: `💬 ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'View Feedback'),
  }),

  TASK_REJECT: ({ title, message, link }) => ({
    subject: `❌ ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'View Task'),
  }),

  CLIENT_ONBOARDED: ({ title, message, link }) => ({
    subject: `🤝 ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'View Client'),
  }),

  CLIENT_TEAM_MEMBER_ADDED: ({ title, message, link }) => ({
    subject: `👋 ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'View Client'),
  }),

  CLIENT_PROJECT: ({ title, message, link }) => ({
    subject: `📁 ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'View Project'),
  }),

  CLIENT_SCOPE_OF_WORK: ({ title, message, link }) => ({
    subject: `📋 ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'View Scope'),
  }),

  CLIENT_DOCUMENT_UPLOADED: ({ title, message, link }) => ({
    subject: `📎 ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'View Document'),
  }),

  CLIENT_MEETING_LOGS: ({ title, message, link }) => ({
    subject: `📅 ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'View Meeting Notes'),
  }),

  CREATIVE_UPLOADED: ({ title, message, link }) => ({
    subject: `🎨 ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'View Creative'),
  }),

  CLIENT_GANTCHART_CREATION: ({ title, message, link }) => ({
    subject: `📊 ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'View Gantt Chart'),
  }),

  CLIENT_GANTCHART_UPDATE: ({ title, message, link }) => ({
    subject: `🔄 ${title}`,
    html: wrap(title, message, link ? `${APP_URL}${link}` : undefined, 'View Gantt Chart'),
  }),
};

export function buildEmailTemplate(
  category: NotificationType,
  input: EmailTemplateInput,
): EmailTemplate {
  return TEMPLATES[category](input);
}
