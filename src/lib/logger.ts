/**
 * Organization-aware logging utility for multi-tenant debugging
 * Automatically includes organization context in all log messages
 */

interface LogMetadata {
  [key: string]: any;
}

interface LogContext {
  component: string;
  organizationId?: string | null;
}

class Logger {
  private context: LogContext;

  constructor(context: LogContext) {
    this.context = context;
  }

  private formatMessage(level: string, message: string, metadata?: LogMetadata) {
    const timestamp = new Date().toISOString();
    const orgContext = this.context.organizationId 
      ? { organizationId: this.context.organizationId }
      : {};

    return {
      timestamp,
      level,
      component: this.context.component,
      message,
      ...orgContext,
      ...metadata,
    };
  }

  error(message: string, error?: any, metadata?: LogMetadata) {
    const logData = this.formatMessage('ERROR', message, {
      ...metadata,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    console.error(`[${this.context.component}]`, message, logData);
    
    // In production, send to error tracking service (Sentry, etc.)
    if (import.meta.env.PROD) {
      // TODO: Send to error tracking service
      // Example: Sentry.captureException(error, { contexts: { log: logData } });
    }
  }

  warn(message: string, metadata?: LogMetadata) {
    const logData = this.formatMessage('WARN', message, metadata);
    console.warn(`[${this.context.component}]`, message, logData);
  }

  info(message: string, metadata?: LogMetadata) {
    if (import.meta.env.DEV) {
      const logData = this.formatMessage('INFO', message, metadata);
      console.info(`[${this.context.component}]`, message, logData);
    }
  }

  debug(message: string, metadata?: LogMetadata) {
    if (import.meta.env.DEV) {
      const logData = this.formatMessage('DEBUG', message, metadata);
      console.debug(`[${this.context.component}]`, message, logData);
    }
  }
}

/**
 * Create a logger instance for a component with organization context
 * 
 * @example
 * const logger = createLogger('useJobNotes', orgId);
 * logger.error('Failed to fetch notes', error, { jobId });
 */
export const createLogger = (component: string, organizationId?: string | null): Logger => {
  return new Logger({ component, organizationId });
};

/**
 * Create a simple logger without organization context
 * Use this for non-tenant-specific logging (auth, routing, etc.)
 */
export const createSimpleLogger = (component: string): Logger => {
  return new Logger({ component });
};
