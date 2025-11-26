import { headers } from 'next/headers';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerContext {
  requestId?: string;
  orgId?: string | null;
  route?: string;
  userId?: string | null;
}

interface LogPayload extends LoggerContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

const mapLevelToConsole: Record<LogLevel, 'error' | 'warn' | 'info' | 'log'> = {
  debug: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

const formatPayload = (level: LogLevel, message: string, context?: LoggerContext, metadata?: Record<string, unknown>): LogPayload => {
  const { requestId, orgId, route, userId, ...extraContext } = context || {};

  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: requestId ?? 'unknown',
    orgId: orgId ?? null,
    route: route ?? 'unknown',
    userId: userId ?? null,
    ...(extraContext ?? {}),
    ...(metadata ?? {}),
  };
};

export class StructuredLogger {
  private context: LoggerContext;

  constructor(context: LoggerContext) {
    this.context = context;
  }

  child(context: LoggerContext) {
    return new StructuredLogger({ ...this.context, ...context });
  }

  log(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
    const payload = formatPayload(level, message, this.context, metadata);
    const consoleMethod = mapLevelToConsole[level];

    console[consoleMethod](JSON.stringify(payload));
    return payload;
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    return this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>) {
    return this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    return this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>) {
    return this.log('error', message, metadata);
  }
}

export const createStructuredLogger = (context: LoggerContext) => new StructuredLogger(context);

export const getRequestContext = (route: string, overrides?: Partial<LoggerContext>): LoggerContext => {
  let requestId: string | undefined;
  let orgId: string | null | undefined;
  let userId: string | null | undefined;

  try {
    const requestHeaders = headers();
    requestId = requestHeaders.get('x-request-id') ?? undefined;
    orgId = requestHeaders.get('x-org-id') ?? requestHeaders.get('x-org-slug');
    userId = requestHeaders.get('x-user-id');
  } catch (error) {
    console.warn('Unable to read request headers for logging context', error);
  }

  return {
    route,
    requestId,
    orgId,
    userId,
    ...(overrides ?? {}),
  };
};

export const logUnhandledError = (logger: StructuredLogger, error: unknown) => {
  const errorPayload = error instanceof Error ? { message: error.message, stack: error.stack } : { error };
  return logger.error('Unhandled error', errorPayload);
};
