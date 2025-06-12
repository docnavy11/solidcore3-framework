// Enhanced logging system for better developer experience
import { ErrorCode } from '../errors/types.ts';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  entityName?: string;
  operation?: string;
  component?: string;
  filePath?: string;
  lineNumber?: number;
  duration?: number;
  stackTrace?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: ErrorCode;
  };
}

export class Logger {
  private static instance: Logger;
  private level: LogLevel;
  private isDevelopment: boolean;
  private outputs: LogOutput[] = [];

  private constructor() {
    this.level = this.getLogLevel();
    this.isDevelopment = this.isDev();
    this.outputs.push(new ConsoleOutput());
    
    // Add file output in development
    if (this.isDevelopment) {
      this.outputs.push(new FileOutput('./logs/solidcore.log'));
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  debug(message: string, context: LogContext = {}): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context: LogContext = {}): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context: LogContext = {}): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context: LogContext = {}): void {
    const enrichedContext = {
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: (error as any).code
        }
      })
    };
    this.log(LogLevel.ERROR, message, enrichedContext);
  }

  fatal(message: string, error?: Error, context: LogContext = {}): void {
    const enrichedContext = {
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: (error as any).code
        }
      })
    };
    this.log(LogLevel.FATAL, message, enrichedContext);
  }

  // Specialized logging methods for framework components
  truthFileError(message: string, filePath: string, lineNumber?: number, error?: Error): void {
    this.error(message, error, {
      component: 'TruthLoader',
      filePath,
      lineNumber,
      suggestion: 'Check truth file syntax and structure'
    });
  }

  validationWarning(message: string, field: string, suggestion?: string, context: LogContext = {}): void {
    this.warn(message, {
      ...context,
      component: 'Validator',
      field,
      suggestion
    });
  }

  generatorError(generatorName: string, message: string, error?: Error, context: LogContext = {}): void {
    this.error(`Generator ${generatorName}: ${message}`, error, {
      ...context,
      component: 'Generator',
      generator: generatorName
    });
  }

  databaseError(operation: string, message: string, error?: Error, query?: string): void {
    this.error(`Database ${operation}: ${message}`, error, {
      component: 'Database',
      operation,
      query: query ? this.sanitizeQuery(query) : undefined
    });
  }

  hotReloadInfo(message: string, files?: string[], duration?: number): void {
    this.info(message, {
      component: 'HotReload',
      files: files?.length ? files : undefined,
      fileCount: files?.length,
      duration
    });
  }

  requestStart(method: string, path: string, requestId: string): void {
    this.info(`${method} ${path}`, {
      component: 'HTTP',
      method,
      path,
      requestId,
      phase: 'start'
    });
  }

  requestEnd(method: string, path: string, statusCode: number, duration: number, requestId: string): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `${method} ${path} - ${statusCode}`, {
      component: 'HTTP',
      method,
      path,
      statusCode,
      duration,
      requestId,
      phase: 'end'
    });
  }

  performance(operation: string, duration: number, context: LogContext = {}): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...context,
      component: 'Performance',
      operation,
      duration
    });
  }

  private log(level: LogLevel, message: string, context: LogContext): void {
    if (level < this.level) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.enrichContext(context)
    };

    for (const output of this.outputs) {
      output.write(entry);
    }
  }

  private enrichContext(context: LogContext): LogContext {
    return {
      ...context,
      pid: Deno.pid,
      environment: this.isDevelopment ? 'development' : 'production',
      version: '1.0.0' // TODO: Get from package.json
    };
  }

  private getLogLevel(): LogLevel {
    const level = Deno.env.get('LOG_LEVEL')?.toUpperCase() || 'INFO';
    switch (level) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'FATAL': return LogLevel.FATAL;
      default: return LogLevel.INFO;
    }
  }

  private isDev(): boolean {
    return Deno.env.get('DENO_ENV') === 'development' || 
           Deno.env.get('NODE_ENV') === 'development' || 
           !Deno.env.get('DENO_ENV');
  }

  private sanitizeQuery(query: string): string {
    // Remove potential sensitive data from SQL queries
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
      .replace(/token\s*=\s*'[^']*'/gi, "token='***'")
      .replace(/secret\s*=\s*'[^']*'/gi, "secret='***'");
  }
}

// Log output interfaces and implementations
interface LogOutput {
  write(entry: LogEntry): void;
}

class ConsoleOutput implements LogOutput {
  private colors = {
    [LogLevel.DEBUG]: '\x1b[36m', // Cyan
    [LogLevel.INFO]: '\x1b[32m',  // Green
    [LogLevel.WARN]: '\x1b[33m',  // Yellow
    [LogLevel.ERROR]: '\x1b[31m', // Red
    [LogLevel.FATAL]: '\x1b[35m'  // Magenta
  };

  private reset = '\x1b[0m';

  write(entry: LogEntry): void {
    const color = this.colors[entry.level] || '';
    const levelName = LogLevel[entry.level].padEnd(5);
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    
    let output = `${color}[${levelName}]${this.reset} ${timestamp} ${entry.message}`;
    
    // Add context in development
    if (entry.context && Object.keys(entry.context).length > 0) {
      const isDev = Deno.env.get('DENO_ENV') === 'development';
      if (isDev) {
        output += `\n  ${this.formatContext(entry.context)}`;
      }
    }

    // Add error details
    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.code) {
        output += ` (${entry.error.code})`;
      }
      if (entry.error.stack && entry.level >= LogLevel.ERROR) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }

    console.log(output);
  }

  private formatContext(context: LogContext): string {
    const important = ['component', 'requestId', 'operation', 'filePath', 'suggestion'];
    const parts: string[] = [];

    for (const key of important) {
      if (context[key]) {
        parts.push(`${key}=${context[key]}`);
      }
    }

    // Add duration if significant
    if (context.duration && context.duration > 10) {
      parts.push(`duration=${context.duration}ms`);
    }

    return parts.join(', ');
  }
}

class FileOutput implements LogOutput {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.ensureLogDirectory();
  }

  write(entry: LogEntry): void {
    const line = JSON.stringify(entry) + '\n';
    try {
      Deno.writeTextFileSync(this.filePath, line, { append: true });
    } catch (error) {
      // Fallback to console if file writing fails
      console.error('Failed to write to log file:', error);
    }
  }

  private ensureLogDirectory(): void {
    try {
      const dir = this.filePath.substring(0, this.filePath.lastIndexOf('/'));
      Deno.mkdirSync(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore
    }
  }
}

// Global logger instance
export const logger = Logger.getInstance();

// Helper function for creating request-scoped loggers
export function createRequestLogger(requestId: string) {
  return {
    debug: (message: string, context: LogContext = {}) => 
      logger.debug(message, { ...context, requestId }),
    info: (message: string, context: LogContext = {}) => 
      logger.info(message, { ...context, requestId }),
    warn: (message: string, context: LogContext = {}) => 
      logger.warn(message, { ...context, requestId }),
    error: (message: string, error?: Error, context: LogContext = {}) => 
      logger.error(message, error, { ...context, requestId }),
    fatal: (message: string, error?: Error, context: LogContext = {}) => 
      logger.fatal(message, error, { ...context, requestId })
  };
}