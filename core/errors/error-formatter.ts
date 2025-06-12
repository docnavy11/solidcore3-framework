// Enhanced error formatter with source code context and helpful suggestions
import { FrameworkError } from './framework-error.ts';
import { ErrorCode } from './types.ts';
import { logger } from '../logging/logger.ts';

export interface SourceLocation {
  filePath: string;
  lineNumber: number;
  columnNumber?: number;
  functionName?: string;
}

export interface FormattedError {
  title: string;
  message: string;
  code: ErrorCode;
  sourceContext?: SourceContext;
  suggestions: string[];
  documentation?: string;
  relatedErrors?: ErrorCode[];
  debugInfo?: any;
}

export interface SourceContext {
  filePath: string;
  lineNumber: number;
  columnNumber?: number;
  beforeLines: string[];
  errorLine: string;
  afterLines: string;
  highlight?: {
    start: number;
    end: number;
  };
}

export class ErrorFormatter {
  private static readonly CONTEXT_LINES = 3;

  static format(error: FrameworkError): FormattedError {
    const formatted: FormattedError = {
      title: this.generateTitle(error),
      message: error.message,
      code: error.code,
      suggestions: this.generateSuggestions(error),
      documentation: this.getDocumentationUrl(error.code)
    };

    // Add source context if available
    if (error.context?.filePath && error.context?.lineNumber) {
      formatted.sourceContext = this.extractSourceContext(
        error.context.filePath,
        error.context.lineNumber,
        error.context.columnNumber
      );
    }

    // Add debug info in development
    if (this.isDevelopment()) {
      formatted.debugInfo = {
        timestamp: error.timestamp,
        requestId: error.requestId,
        context: error.context,
        stack: error.stack
      };
    }

    return formatted;
  }

  static formatForConsole(error: FrameworkError): string {
    const formatted = this.format(error);
    let output = '';

    // Title and basic info
    output += `\n${this.colorize('red', '┌─ ERROR ────────────────────────────────────────────')}\n`;
    output += `${this.colorize('red', '│')} ${this.colorize('bold', formatted.title)}\n`;
    output += `${this.colorize('red', '│')} Code: ${formatted.code}\n`;
    
    if (formatted.sourceContext) {
      output += `${this.colorize('red', '│')} File: ${formatted.sourceContext.filePath}:${formatted.sourceContext.lineNumber}\n`;
    }
    
    output += `${this.colorize('red', '├─ MESSAGE ─────────────────────────────────────────')}\n`;
    output += `${this.colorize('red', '│')} ${formatted.message}\n`;

    // Source context
    if (formatted.sourceContext) {
      output += `${this.colorize('red', '├─ SOURCE ──────────────────────────────────────────')}\n`;
      output += this.formatSourceContext(formatted.sourceContext);
    }

    // Suggestions
    if (formatted.suggestions.length > 0) {
      output += `${this.colorize('red', '├─ SUGGESTIONS ─────────────────────────────────────')}\n`;
      for (const suggestion of formatted.suggestions) {
        output += `${this.colorize('red', '│')} ${this.colorize('yellow', '•')} ${suggestion}\n`;
      }
    }

    // Documentation link
    if (formatted.documentation) {
      output += `${this.colorize('red', '├─ HELP ───────────────────────────────────────────')}\n`;
      output += `${this.colorize('red', '│')} ${this.colorize('blue', formatted.documentation)}\n`;
    }

    output += `${this.colorize('red', '└───────────────────────────────────────────────────')}\n`;

    return output;
  }

  static formatForWeb(error: FrameworkError): FormattedError {
    const formatted = this.format(error);
    
    // Sanitize debug info for web output
    if (formatted.debugInfo && !this.isDevelopment()) {
      delete formatted.debugInfo.stack;
      delete formatted.debugInfo.context;
    }

    return formatted;
  }

  private static generateTitle(error: FrameworkError): string {
    const category = this.getErrorCategory(error.code);
    const operation = error.context?.operation || error.context?.component || 'Framework';
    
    return `${category} Error in ${operation}`;
  }

  private static getErrorCategory(code: ErrorCode): string {
    const codeNumber = parseInt(code.substring(1));
    
    if (codeNumber >= 1000 && codeNumber < 2000) return 'Validation';
    if (codeNumber >= 2000 && codeNumber < 3000) return 'Database';
    if (codeNumber >= 3000 && codeNumber < 4000) return 'API';
    if (codeNumber >= 4000 && codeNumber < 5000) return 'System';
    if (codeNumber >= 5000 && codeNumber < 6000) return 'Extension';
    if (codeNumber >= 6000 && codeNumber < 7000) return 'Workflow';
    
    return 'Unknown';
  }

  private static generateSuggestions(error: FrameworkError): string[] {
    const suggestions: string[] = [];

    // Add context-specific suggestions
    if (error.context?.suggestion) {
      if (Array.isArray(error.context.suggestion)) {
        suggestions.push(...error.context.suggestion);
      } else {
        suggestions.push(error.context.suggestion);
      }
    }

    // Add code-specific suggestions
    suggestions.push(...this.getCodeSpecificSuggestions(error.code, error.context));

    // Add general suggestions
    suggestions.push(...this.getGeneralSuggestions(error.code));

    return [...new Set(suggestions)].slice(0, 5); // Remove duplicates and limit
  }

  private static getCodeSpecificSuggestions(code: ErrorCode, context: any): string[] {
    switch (code) {
      case ErrorCode.TRUTH_FILE_LOAD_FAILED:
        return [
          'Check truth file syntax with `deno check app/app.truth.ts`',
          'Verify all imports are correct',
          'Make sure the file exists and is readable'
        ];

      case ErrorCode.VALIDATION_FAILED:
        return [
          'Use the validation endpoint: GET /api/_validate',
          'Check the schema documentation',
          'Run validation in development mode for detailed errors'
        ];

      case ErrorCode.ENTITY_NOT_FOUND:
        return [
          `Available entities: ${context?.availableEntities?.join(', ') || 'Check truth file'}`,
          'Verify entity name spelling and case',
          'Check if the entity is properly defined in truth file'
        ];

      case ErrorCode.PERMISSION_DENIED:
        return [
          'Check user authentication status',
          'Verify permission expressions in entity definition',
          'Test permissions with different user roles'
        ];

      default:
        return [];
    }
  }

  private static getGeneralSuggestions(code: ErrorCode): string[] {
    const codeNumber = parseInt(code.substring(1));
    
    if (codeNumber >= 1000 && codeNumber < 2000) {
      return ['Run validation in development mode', 'Check truth file documentation'];
    }
    
    if (codeNumber >= 2000 && codeNumber < 3000) {
      return ['Check database connection', 'Verify schema matches truth file'];
    }
    
    if (codeNumber >= 3000 && codeNumber < 4000) {
      return ['Check API documentation', 'Verify request format'];
    }
    
    return ['Check framework documentation', 'Enable debug logging'];
  }

  private static extractSourceContext(
    filePath: string, 
    lineNumber: number, 
    columnNumber?: number
  ): SourceContext | undefined {
    try {
      const content = Deno.readTextFileSync(filePath);
      const lines = content.split('\n');
      
      if (lineNumber > lines.length) {
        return undefined;
      }

      const startLine = Math.max(0, lineNumber - this.CONTEXT_LINES - 1);
      const endLine = Math.min(lines.length, lineNumber + this.CONTEXT_LINES);
      
      const beforeLines = lines.slice(startLine, lineNumber - 1);
      const errorLine = lines[lineNumber - 1] || '';
      const afterLines = lines.slice(lineNumber, endLine).join('\n');

      return {
        filePath,
        lineNumber,
        columnNumber,
        beforeLines,
        errorLine,
        afterLines,
        highlight: columnNumber ? {
          start: columnNumber,
          end: columnNumber + 10 // Highlight next 10 characters
        } : undefined
      };
    } catch (error) {
      logger.debug('Failed to extract source context', { filePath, lineNumber, error: error.message });
      return undefined;
    }
  }

  private static formatSourceContext(context: SourceContext): string {
    let output = '';
    const lineNumWidth = String(context.lineNumber + this.CONTEXT_LINES).length;

    // Before lines
    for (let i = 0; i < context.beforeLines.length; i++) {
      const lineNum = context.lineNumber - context.beforeLines.length + i;
      output += `${this.colorize('red', '│')} ${this.colorize('dim', String(lineNum).padStart(lineNumWidth))} │ ${context.beforeLines[i]}\n`;
    }

    // Error line
    output += `${this.colorize('red', '│')} ${this.colorize('red', String(context.lineNumber).padStart(lineNumWidth))} │ ${this.colorize('yellow', context.errorLine)}\n`;
    
    // Highlight column if available
    if (context.highlight) {
      const pointer = ' '.repeat(lineNumWidth + 3 + context.highlight.start) + 
                     this.colorize('red', '^'.repeat(Math.max(1, context.highlight.end - context.highlight.start)));
      output += `${this.colorize('red', '│')} ${pointer}\n`;
    }

    // After lines
    const afterLines = context.afterLines.split('\n').slice(0, this.CONTEXT_LINES);
    for (let i = 0; i < afterLines.length; i++) {
      const lineNum = context.lineNumber + i + 1;
      output += `${this.colorize('red', '│')} ${this.colorize('dim', String(lineNum).padStart(lineNumWidth))} │ ${afterLines[i]}\n`;
    }

    return output;
  }

  private static getDocumentationUrl(code: ErrorCode): string {
    return `https://docs.solidcore3.dev/errors/${code.toLowerCase()}`;
  }

  private static colorize(color: string, text: string): string {
    if (!this.isDevelopment()) return text;

    const colors: Record<string, string> = {
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      green: '\x1b[32m',
      dim: '\x1b[2m',
      bold: '\x1b[1m',
      reset: '\x1b[0m'
    };

    return `${colors[color] || ''}${text}${colors.reset}`;
  }

  private static isDevelopment(): boolean {
    return Deno.env.get('DENO_ENV') === 'development' || 
           Deno.env.get('NODE_ENV') === 'development' || 
           !Deno.env.get('DENO_ENV');
  }
}

// Helper function to format any error for console output
export function formatErrorForConsole(error: Error | FrameworkError): string {
  if (error instanceof FrameworkError) {
    return ErrorFormatter.formatForConsole(error);
  }

  // Convert regular errors to FrameworkError for consistent formatting
  const frameworkError = new FrameworkError(
    'E4001' as ErrorCode,
    error.message,
    { originalError: error.name },
    error
  );

  return ErrorFormatter.formatForConsole(frameworkError);
}

// Helper function to extract line numbers from stack traces
export function extractLineNumberFromStack(stack?: string, filePath?: string): number | undefined {
  if (!stack || !filePath) return undefined;

  const lines = stack.split('\n');
  for (const line of lines) {
    if (line.includes(filePath)) {
      const match = line.match(/:(\d+):\d+/);
      if (match) {
        return parseInt(match[1]);
      }
    }
  }

  return undefined;
}