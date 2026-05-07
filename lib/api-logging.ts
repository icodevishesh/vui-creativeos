import { after } from 'next/server';
import jwt from 'jsonwebtoken';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const MAX_CAPTURE_CHARS = 10_000;
const MAX_BODY_BYTES = 128 * 1024;
const SENSITIVE_KEY_RE =
  /password|token|secret|authorization|cookie|api[_-]?key|refresh|access|session|credential|otp|pin/i;

export type ApiLogActionType =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'approve'
  | 'feedback'
  | 'upload'
  | 'other';

export type ApiRouteHandler<TArgs extends unknown[] = unknown[]> = (
  ...args: TArgs
) => Response | Promise<Response>;

export type ApiLogRequestContext = {
  endpoint: string;
  method: string;
  queryParams: Record<string, unknown>;
  requestBody: unknown;
  requestTimestamp: Date;
  executionTimeMs: number;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  userType?: string | null;
  actionType: ApiLogActionType;
};

export type ApiLogResponseContext = {
  responseData: unknown;
  responseMessage?: string;
  statusCode: number;
  errorDetails?: string;
  errorStack?: string;
};

export type ApiLogRecord = ApiLogRequestContext & ApiLogResponseContext;

export type WithApiLoggingOptions = {
  actionType?: ApiLogActionType;
  skipLogging?: boolean;
};

function truncateString(value: string, max = MAX_CAPTURE_CHARS): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...[truncated ${value.length - max} chars]`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function maskValue(value: unknown): unknown {
  if (typeof value === 'string') return '[REDACTED]';
  if (typeof value === 'number' || typeof value === 'boolean') return '[REDACTED]';
  if (Array.isArray(value)) return value.map(() => '[REDACTED]');
  if (value instanceof Date) return '[REDACTED]';
  return '[REDACTED]';
}

export function sanitizeForLog(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value == null) return value;
  if (typeof value === 'string') return truncateString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateString(value.message),
      stack: value.stack ? truncateString(value.stack, MAX_CAPTURE_CHARS * 2) : undefined,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLog(item, seen));
  }

  if (!isPlainObject(value)) return truncateString(String(value));
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  const entries = Object.entries(value).map(([key, entry]) => {
    if (SENSITIVE_KEY_RE.test(key)) {
      return [key, maskValue(entry)] as const;
    }

    return [key, sanitizeForLog(entry, seen)] as const;
  });

  return Object.fromEntries(entries);
}

function parseCookieValue(cookieHeader: string | null, key: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (rawKey === key) return rawValue.join('=') || null;
  }
  return null;
}

function getContentLength(request: Request): number | null {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) return null;
  const parsed = Number(contentLength);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readRequestBody(request: Request): Promise<unknown> {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD') return null;

  const contentLength = getContentLength(request);
  if (contentLength != null && contentLength > MAX_BODY_BYTES) {
    return {
      omitted: true,
      reason: 'payload too large',
      contentLength,
      contentType: request.headers.get('content-type'),
    };
  }

  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  const clone = request.clone();

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await clone.formData();
      const entries: Record<string, unknown> = {};

      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          entries[key] = {
            name: value.name,
            size: value.size,
            type: value.type,
          };
        } else {
          entries[key] = sanitizeForLog(value);
        }
      }

      return entries;
    }

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await clone.formData();
      return Object.fromEntries(
        Array.from(formData.entries()).map(([key, value]) => [key, sanitizeForLog(value)]),
      );
    }

    if (contentType.includes('application/json')) {
      return sanitizeForLog(await clone.json());
    }

    const text = await clone.text();
    if (!text) return null;
    try {
      return sanitizeForLog(JSON.parse(text));
    } catch {
      return truncateString(text);
    }
  } catch (error) {
    return {
      unreadable: true,
      reason: error instanceof Error ? error.message : 'Failed to read request body',
    };
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const clone = response.clone();

  try {
    if (contentType.includes('application/json')) {
      return sanitizeForLog(await clone.json());
    }

    const text = await clone.text();
    if (!text) return null;
    try {
      return sanitizeForLog(JSON.parse(text));
    } catch {
      return truncateString(text);
    }
  } catch (error) {
    return {
      unreadable: true,
      reason: error instanceof Error ? error.message : 'Failed to read response body',
    };
  }
}

function parseAuthContext(request: Request): {
  userId?: string;
  userEmail?: string;
  userType?: string;
} {
  const token = parseCookieValue(request.headers.get('cookie'), 'auth_token');
  if (!token) return {};

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      email?: string;
      userType?: string;
    };

    return {
      userId: decoded.userId,
      userEmail: decoded.email,
      userType: decoded.userType,
    };
  } catch {
    return {};
  }
}

function inferActionType(method: string, endpoint: string, responseStatus?: number): ApiLogActionType {
  const upperMethod = method.toUpperCase();
  const path = endpoint.toLowerCase();

  if (path.includes('/auth/sign-in')) return 'login';
  if (path.includes('/auth/logout')) return 'logout';
  if (path.includes('/auth/sign-up')) return 'create';
  if (path.includes('/approve')) return 'approve';
  if (path.includes('/feedback')) return 'feedback';
  if (path.includes('/upload') || path.includes('/attachments') || path.includes('/documents')) {
    if (upperMethod === 'POST' || upperMethod === 'PATCH' || upperMethod === 'PUT') return 'upload';
  }
  if (upperMethod === 'POST') return 'create';
  if (upperMethod === 'PATCH' || upperMethod === 'PUT') return 'update';
  if (upperMethod === 'DELETE') return 'delete';
  if (responseStatus && responseStatus >= 400) return 'other';
  return 'read';
}

function extractResponseMessage(responseData: unknown, fallback: string): string | undefined {
  if (isPlainObject(responseData)) {
    const message = responseData.message ?? responseData.error ?? responseData.detail;
    if (typeof message === 'string' && message.trim()) return truncateString(message);
  }

  if (typeof responseData === 'string' && responseData.trim()) {
    return truncateString(responseData);
  }

  return fallback ? truncateString(fallback) : undefined;
}

function createErrorSnapshot(error: unknown): {
  errorDetails?: string;
  errorStack?: string;
  responseMessage?: string;
} {
  if (error instanceof Error) {
    return {
      errorDetails: truncateString(error.message),
      errorStack: error.stack ? truncateString(error.stack, MAX_CAPTURE_CHARS * 2) : undefined,
      responseMessage: truncateString(error.message),
    };
  }

  if (typeof error === 'string') {
    return {
      errorDetails: truncateString(error),
      responseMessage: truncateString(error),
    };
  }

  try {
    return {
      errorDetails: truncateString(JSON.stringify(sanitizeForLog(error))),
      responseMessage: 'Internal server error',
    };
  } catch {
    return {
      errorDetails: 'Unknown error',
      responseMessage: 'Internal server error',
    };
  }
}

async function persistApiLog(record: ApiLogRecord): Promise<void> {
  try {
    await prisma.apiLog.create({
      data: {
        endpoint: record.endpoint,
        method: record.method,
        actionType: record.actionType,
        requestBody: sanitizeForLog(record.requestBody) as never,
        queryParams: sanitizeForLog(record.queryParams) as never,
        responseData: sanitizeForLog(record.responseData) as never,
        responseMessage: record.responseMessage ? truncateString(record.responseMessage) : null,
        statusCode: record.statusCode,
        userId: record.userId ?? null,
        userEmail: record.userEmail ?? null,
        userName: record.userName ?? null,
        userType: record.userType ?? null,
        requestTimestamp: record.requestTimestamp,
        executionTimeMs: record.executionTimeMs,
        errorDetails: record.errorDetails ? truncateString(record.errorDetails) : null,
        errorStack: record.errorStack ? truncateString(record.errorStack, MAX_CAPTURE_CHARS * 2) : null,
        createdAt: record.requestTimestamp,
      } as never,
    });
  } catch (error) {
    console.error('[API_LOGGER] Failed to persist log entry', error);
  }
}

export function withApiLogging<TArgs extends unknown[]>(
  handler: ApiRouteHandler<TArgs>,
  options: WithApiLoggingOptions = {},
): ApiRouteHandler<TArgs> {
  return async (...args: TArgs) => {
    if (options.skipLogging) {
      return handler(...args);
    }

    const request = args[0] as Request | undefined;
    if (!request) {
      return handler(...args);
    }

    const requestTimestamp = new Date();
    const startedAt = performance.now();
    const requestContextPromise = Promise.all([
      readRequestBody(request),
      Promise.resolve(parseAuthContext(request)),
    ]).then(([requestBody, auth]) => {
      const url = new URL(request.url);
      const queryParams: Record<string, unknown> = {};
      url.searchParams.forEach((value, key) => {
        const existing = queryParams[key];
        if (existing === undefined) {
          queryParams[key] = sanitizeForLog(value);
        } else if (Array.isArray(existing)) {
          existing.push(sanitizeForLog(value));
        } else {
          queryParams[key] = [existing, sanitizeForLog(value)];
        }
      });

      return {
        endpoint: url.pathname,
        method: request.method.toUpperCase(),
        queryParams,
        requestBody,
        requestTimestamp,
        userId: auth.userId ?? null,
        userEmail: auth.userEmail ?? null,
        userName: null,
        userType: auth.userType ?? null,
      } satisfies Omit<ApiLogRequestContext, 'executionTimeMs' | 'actionType'>;
    });

    try {
      const response = await handler(...args);
      const requestContext = await requestContextPromise;
      const responseData = await readResponseBody(response);
      const executionTimeMs = Math.max(0, Math.round(performance.now() - startedAt));
      const responseMessage = extractResponseMessage(
        responseData,
        response.statusText || (response.ok ? 'OK' : 'Request failed'),
      );
      const actionType = options.actionType ?? inferActionType(request.method, requestContext.endpoint, response.status);

      after(async () => {
        await persistApiLog({
          ...requestContext,
          actionType,
          executionTimeMs,
          responseData,
          responseMessage,
          statusCode: response.status,
          errorDetails: response.status >= 400 ? responseMessage : undefined,
          errorStack: undefined,
        });
      });

      return response;
    } catch (error) {
      const requestContext = await requestContextPromise;
      const executionTimeMs = Math.max(0, Math.round(performance.now() - startedAt));
      const errorSnapshot = createErrorSnapshot(error);
      const actionType = options.actionType ?? inferActionType(request.method, requestContext.endpoint, 500);

      after(async () => {
        await persistApiLog({
          ...requestContext,
          actionType,
          executionTimeMs,
          responseData: errorSnapshot.responseMessage ? { error: errorSnapshot.responseMessage } : null,
          responseMessage: errorSnapshot.responseMessage ?? 'Internal server error',
          statusCode: 500,
          errorDetails: errorSnapshot.errorDetails,
          errorStack: errorSnapshot.errorStack,
        });
      });

      throw error;
    }
  };
}

export function buildApiLogQueryWhere(searchParams: URLSearchParams): Prisma.ApiLogWhereInput {
  const endpoint = searchParams.get('endpoint');
  const endpointPrefix = searchParams.get('endpointPrefix');
  const method = searchParams.get('method');
  const statusCode = searchParams.get('statusCode');
  const actionType = searchParams.get('actionType');
  const userId = searchParams.get('userId');
  const userEmail = searchParams.get('userEmail');
  const userType = searchParams.get('userType');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const hasError = searchParams.get('hasError');

  const where: Prisma.ApiLogWhereInput = {};

  if (endpointPrefix) {
    where.endpoint = { startsWith: endpointPrefix };
  } else if (endpoint) {
    where.endpoint = endpoint;
  }
  if (method) where.method = method.toUpperCase();
  if (statusCode && !Number.isNaN(Number(statusCode))) where.statusCode = Number(statusCode);
  if (actionType) where.actionType = actionType;
  if (userId) where.userId = userId;
  if (userEmail) where.userEmail = userEmail;
  if (userType) where.userType = userType;
  if (hasError === 'true') where.statusCode = { gte: 400 };

  const createdAt: { gte?: Date; lte?: Date } = {};
  if (from) createdAt.gte = new Date(from);
  if (to) createdAt.lte = new Date(to);
  if (createdAt.gte || createdAt.lte) where.createdAt = createdAt;

  return where;
}
