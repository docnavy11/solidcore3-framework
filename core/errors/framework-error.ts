import { ErrorCode, ErrorContext } from './types.ts';

export class FrameworkError extends Error {
  public readonly timestamp: string;
  public readonly requestId?: string;
  
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly context?: ErrorContext,
    public readonly cause?: Error,
    requestId?: string
  ) {
    super(message);
    this.name = 'FrameworkError';
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
    
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, FrameworkError.prototype);
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FrameworkError);
    }
  }
  
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      requestId: this.requestId,
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    };
  }
  
  toString(): string {
    let str = `${this.name} [${this.code}]: ${this.message}`;
    
    if (this.context && Object.keys(this.context).length > 0) {
      str += ` (${JSON.stringify(this.context)})`;
    }
    
    if (this.cause) {
      str += `\nCaused by: ${this.cause.message}`;
    }
    
    return str;
  }
  
  // Helper method to check if error is of specific type
  static isFrameworkError(error: any): error is FrameworkError {
    return error instanceof FrameworkError;
  }
  
  // Helper method to extract error code
  static getErrorCode(error: any): ErrorCode | null {
    if (FrameworkError.isFrameworkError(error)) {
      return error.code;
    }
    return null;
  }
}