import { getAuth } from "firebase/auth";

// Error categories
export enum ErrorCategory {
  AUTH = "AUTH",
  CREDENTIAL = "CREDENTIAL",
  NETWORK = "NETWORK",
  UNKNOWN = "UNKNOWN",
  VALIDATION = "VALIDATION",
}

// Error severity levels
export enum LogLevel {
  DEBUG = "DEBUG",
  ERROR = "ERROR",
  INFO = "INFO",
  WARN = "WARN",
}

interface LogEntry {
  category: ErrorCategory;
  context?: {
    [key: string]: unknown;
    action?: string;
    path?: string;
    userId?: string;
  };
  error?: {
    code?: string;
    name: string;
    stack?: string;
  };
  level: LogLevel;
  message: string;
  timestamp: string;
}

// Sensitive data patterns to redact
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /key/i,
  /token/i,
  /auth/i,
  /credential/i,
  /api[_-]?key/i,
  /api[_-]?secret/i,
];

// Redact sensitive data from objects
const redactSensitiveData = (obj: unknown): unknown => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }

  const objCopy = { ...obj as Record<string, unknown> };
  const redacted: Record<string, unknown> = { ...objCopy };
  
  for (const key in redacted) {
    if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
      redacted[key] = "[REDACTED]";
    } else if (typeof redacted[key] === "object") {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }
  return redacted;
};

interface ErrorWithProperties {
  [key: string]: unknown;
  code?: string;
  name?: string;
  stack?: string;
}

// Format error for logging
const formatError = (error: unknown): LogEntry["error"] | undefined => {
  if (!error) return undefined;

  const errorObj = error as ErrorWithProperties;
  
  return {
    code: errorObj.code,
    name: errorObj.name ?? "UnknownError",
    stack: errorObj.stack,
  };
};

// Get current user ID safely
const getCurrentUserId = (): string | undefined => {
  try {
    const auth = getAuth();
    return auth.currentUser?.uid;
  } catch {
    return undefined;
  }
};

class Logger {
  // Using null instead of undefined to allow nullish coalescing assignment
  private static instance: Logger | null = null;
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000; // Keep last 1000 logs in memory

  private constructor() {
    // Empty constructor is needed for singleton pattern
  }

  static getInstance(): Logger {
    Logger.instance ??= new Logger();
    return Logger.instance;
  }

  clearLogs(): void {
    this.logs = [];
  }

  debug(category: ErrorCategory, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, category, message, undefined, context);
  }

  error(category: ErrorCategory, message: string, error?: unknown, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, category, message, error, context);
  }

  // Get logs for debugging (only in development)
  getLogs(): LogEntry[] {
    if (!import.meta.env.DEV) {
      return [];
    }
    return [...this.logs];
  }

  info(category: ErrorCategory, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, category, message, undefined, context);
  }

  warn(category: ErrorCategory, message: string, error?: unknown, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, category, message, error, context);
  }

  private log(
    level: LogLevel,
    category: ErrorCategory,
    message: string,
    error?: unknown,
    context?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      category,
      context: {
        userId: getCurrentUserId(),
        ...redactSensitiveData(context) as Record<string, unknown>,
      },
      error: formatError(error),
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // In development, log to console with appropriate level
    if (import.meta.env.DEV) {
      const logMethod = level === LogLevel.ERROR ? "error" :
                       level === LogLevel.WARN ? "warn" :
                       level === LogLevel.INFO ? "info" : "debug";
      
      console[logMethod](
        `[${level}] ${category}: ${message}`,
        error ? { error: formatError(error) } : "",
        context ? { context: redactSensitiveData(context) } : ""
      );
    }

    // In production, you might want to send logs to a monitoring service
    if (import.meta.env.PROD) {
      // TODO: Implement production logging (e.g., to Firebase Crashlytics or similar)
      // This would be where you'd send the redacted log entry to your monitoring service
    }
  }
}

export const logger = Logger.getInstance(); 