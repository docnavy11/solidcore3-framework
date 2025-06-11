import { FrameworkError } from './framework-error.ts';
import { generateSuggestions } from './suggestions.ts';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    suggestions?: string[];
    timestamp: string;
    requestId?: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
    version: string;
    duration?: number;
  };
}

export class ResponseBuilder {
  private startTime: number;
  
  constructor(private requestId: string, private version: string = '1.0.0') {
    this.startTime = Date.now();
  }
  
  success<T>(data: T, message?: string): APIResponse<T> {
    return {
      success: true,
      data,
      meta: this.buildMeta(message)
    };
  }
  
  error(error: FrameworkError | Error, statusCode?: number): APIResponse {
    const frameworkError = FrameworkError.isFrameworkError(error) 
      ? error 
      : new FrameworkError('E4001' as any, error.message, { originalError: error.name }, error, this.requestId);
    
    return {
      success: false,
      error: {
        code: frameworkError.code,
        message: frameworkError.message,
        details: this.sanitizeErrorDetails(frameworkError.context),
        suggestions: generateSuggestions(frameworkError),
        timestamp: frameworkError.timestamp,
        requestId: frameworkError.requestId
      },
      meta: this.buildMeta()
    };
  }
  
  validationError(errors: Array<{ field: string; message: string; value?: any }>): APIResponse {
    return {
      success: false,
      error: {
        code: 'E1001',
        message: 'Validation failed',
        details: {
          validationErrors: errors,
          errorCount: errors.length
        },
        suggestions: [
          'Check required fields and data types',
          'Verify field constraints and formats',
          'Ensure all required fields are provided'
        ],
        timestamp: new Date().toISOString(),
        requestId: this.requestId
      },
      meta: this.buildMeta()
    };
  }
  
  notFound(entityName: string, entityId?: string): APIResponse {
    const message = entityId 
      ? `${entityName} with id '${entityId}' not found`
      : `${entityName} not found`;
    
    return {
      success: false,
      error: {
        code: 'E3001',
        message,
        details: { entityName, entityId },
        suggestions: [
          'Check if the resource exists',
          'Verify you have permission to access this resource',
          'Check the entity name and ID for typos'
        ],
        timestamp: new Date().toISOString(),
        requestId: this.requestId
      },
      meta: this.buildMeta()
    };
  }
  
  unauthorized(operation?: string, resource?: string): APIResponse {
    const message = operation && resource 
      ? `Unauthorized to ${operation} ${resource}`
      : 'Unauthorized access';
    
    return {
      success: false,
      error: {
        code: 'E3004',
        message,
        details: { operation, resource },
        suggestions: [
          'Check authentication credentials',
          'Verify user permissions',
          'Ensure you are logged in'
        ],
        timestamp: new Date().toISOString(),
        requestId: this.requestId
      },
      meta: this.buildMeta()
    };
  }
  
  forbidden(operation: string, resource: string): APIResponse {
    return {
      success: false,
      error: {
        code: 'E3002',
        message: `Forbidden: insufficient permissions to ${operation} ${resource}`,
        details: { operation, resource },
        suggestions: [
          'Contact administrator for permission',
          'Check user role and permissions',
          'Verify resource ownership'
        ],
        timestamp: new Date().toISOString(),
        requestId: this.requestId
      },
      meta: this.buildMeta()
    };
  }
  
  rateLimit(limit: number, windowMs: number, retryAfter?: number): APIResponse {
    return {
      success: false,
      error: {
        code: 'E3005',
        message: `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
        details: { 
          limit, 
          windowMs, 
          retryAfter: retryAfter || Math.ceil(windowMs / 1000)
        },
        suggestions: [
          `Wait ${retryAfter || Math.ceil(windowMs / 1000)} seconds before retrying`,
          'Reduce request frequency',
          'Consider upgrading your plan'
        ],
        timestamp: new Date().toISOString(),
        requestId: this.requestId
      },
      meta: this.buildMeta()
    };
  }
  
  serverError(message: string = 'Internal server error', error?: Error): APIResponse {
    return {
      success: false,
      error: {
        code: 'E4004',
        message,
        details: this.isDevelopment() ? { 
          originalError: error?.message,
          stack: error?.stack 
        } : undefined,
        suggestions: [
          'Try again later',
          'Contact support if the problem persists',
          'Check server status'
        ],
        timestamp: new Date().toISOString(),
        requestId: this.requestId
      },
      meta: this.buildMeta()
    };
  }
  
  private buildMeta(message?: string): APIResponse['meta'] {
    return {
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      version: this.version,
      duration: Date.now() - this.startTime,
      ...(message && { message })
    };
  }
  
  private sanitizeErrorDetails(details: any): any {
    if (!details || typeof details !== 'object') {
      return details;
    }
    
    // Remove sensitive information in production
    if (!this.isDevelopment()) {
      const sanitized = { ...details };
      
      // Remove potential sensitive keys
      const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential', 'auth'];
      sensitiveKeys.forEach(key => {
        if (key in sanitized) {
          delete sanitized[key];
        }
      });
      
      return sanitized;
    }
    
    return details;
  }
  
  private isDevelopment(): boolean {
    return Deno.env.get('DENO_ENV') === 'development' || 
           Deno.env.get('NODE_ENV') === 'development' || 
           !Deno.env.get('DENO_ENV');
  }
  
  // Static helper methods for quick responses
  static success<T>(data: T, requestId: string, version?: string): APIResponse<T> {
    return new ResponseBuilder(requestId, version).success(data);
  }
  
  static error(error: FrameworkError | Error, requestId: string, version?: string): APIResponse {
    return new ResponseBuilder(requestId, version).error(error);
  }
  
  static notFound(entityName: string, requestId: string, entityId?: string, version?: string): APIResponse {
    return new ResponseBuilder(requestId, version).notFound(entityName, entityId);
  }
  
  static unauthorized(requestId: string, operation?: string, resource?: string, version?: string): APIResponse {
    return new ResponseBuilder(requestId, version).unauthorized(operation, resource);
  }
}