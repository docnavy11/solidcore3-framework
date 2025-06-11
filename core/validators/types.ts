// Validation system types and interfaces

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  severity: 'error';
  suggestion?: string;
  context?: Record<string, any>;
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
  severity: 'warning';
  suggestion?: string;
  context?: Record<string, any>;
}

export interface ValidationSummary {
  entityCount: number;
  fieldCount: number;
  workflowCount: number;
  viewCount: number;
  errorCount: number;
  warningCount: number;
  validationTime: number;
}

export class ValidationContext {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private startTime: number;
  
  constructor(private app: any) {
    this.startTime = Date.now();
  }
  
  addError(error: ValidationError): void {
    this.errors.push(error);
  }
  
  addWarning(warning: ValidationWarning): void {
    this.warnings.push(warning);
  }
  
  createError(code: string, message: string, path: string, suggestion?: string, context?: Record<string, any>): ValidationError {
    return {
      code,
      message,
      path,
      severity: 'error',
      suggestion,
      context
    };
  }
  
  createWarning(code: string, message: string, path: string, suggestion?: string, context?: Record<string, any>): ValidationWarning {
    return {
      code,
      message,
      path,
      severity: 'warning',
      suggestion,
      context
    };
  }
  
  getResult(): ValidationResult {
    const endTime = Date.now();
    
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        entityCount: Object.keys(this.app.entities || {}).length,
        fieldCount: this.countFields(),
        workflowCount: Object.keys(this.app.workflows || {}).length,
        viewCount: Object.keys(this.app.views || {}).length,
        errorCount: this.errors.length,
        warningCount: this.warnings.length,
        validationTime: endTime - this.startTime
      }
    };
  }
  
  private countFields(): number {
    let total = 0;
    for (const entity of Object.values(this.app.entities || {})) {
      total += Object.keys((entity as any).fields || {}).length;
    }
    return total;
  }
  
  getApp(): any {
    return this.app;
  }
  
  hasErrors(): boolean {
    return this.errors.length > 0;
  }
  
  hasWarnings(): boolean {
    return this.warnings.length > 0;
  }
}

// Validation error codes
export enum ValidationErrorCode {
  // App-level errors
  APP_NAME_MISSING = 'APP_NAME_MISSING',
  APP_NAME_INVALID = 'APP_NAME_INVALID',
  
  // Entity errors
  ENTITY_NAME_INVALID = 'ENTITY_NAME_INVALID',
  ENTITY_NO_FIELDS = 'ENTITY_NO_FIELDS',
  ENTITY_NO_ID_FIELD = 'ENTITY_NO_ID_FIELD',
  ENTITY_DUPLICATE_FIELD = 'ENTITY_DUPLICATE_FIELD',
  
  // Field errors
  FIELD_NAME_INVALID = 'FIELD_NAME_INVALID',
  FIELD_TYPE_INVALID = 'FIELD_TYPE_INVALID',
  FIELD_TYPE_MISSING = 'FIELD_TYPE_MISSING',
  FIELD_ENUM_NO_OPTIONS = 'FIELD_ENUM_NO_OPTIONS',
  FIELD_ENUM_EMPTY_OPTIONS = 'FIELD_ENUM_EMPTY_OPTIONS',
  FIELD_REFERENCE_NO_ENTITY = 'FIELD_REFERENCE_NO_ENTITY',
  FIELD_REFERENCE_ENTITY_NOT_FOUND = 'FIELD_REFERENCE_ENTITY_NOT_FOUND',
  
  // Permission errors
  PERMISSION_INVALID_EXPRESSION = 'PERMISSION_INVALID_EXPRESSION',
  PERMISSION_UNKNOWN_FIELD = 'PERMISSION_UNKNOWN_FIELD',
  PERMISSION_UNKNOWN_OPERATOR = 'PERMISSION_UNKNOWN_OPERATOR',
  
  // Behavior errors
  BEHAVIOR_NAME_INVALID = 'BEHAVIOR_NAME_INVALID',
  BEHAVIOR_TYPE_INVALID = 'BEHAVIOR_TYPE_INVALID',
  BEHAVIOR_MISSING_FIELDS = 'BEHAVIOR_MISSING_FIELDS',
  
  // Workflow errors
  WORKFLOW_NAME_INVALID = 'WORKFLOW_NAME_INVALID',
  WORKFLOW_TRIGGER_INVALID = 'WORKFLOW_TRIGGER_INVALID',
  WORKFLOW_ACTION_INVALID = 'WORKFLOW_ACTION_INVALID',
  WORKFLOW_CONDITION_INVALID = 'WORKFLOW_CONDITION_INVALID',
  
  // View errors
  VIEW_NAME_INVALID = 'VIEW_NAME_INVALID',
  VIEW_TYPE_INVALID = 'VIEW_TYPE_INVALID',
  VIEW_ENTITY_NOT_FOUND = 'VIEW_ENTITY_NOT_FOUND',
  VIEW_ROUTE_INVALID = 'VIEW_ROUTE_INVALID'
}

// Valid field types
export const VALID_FIELD_TYPES = [
  'string',
  'number',
  'boolean',
  'date',
  'enum',
  'reference'
] as const;

export type ValidFieldType = typeof VALID_FIELD_TYPES[number];

// Valid behavior types
export const VALID_BEHAVIOR_TYPES = [
  'update',
  'custom'
] as const;

export type ValidBehaviorType = typeof VALID_BEHAVIOR_TYPES[number];

// Valid view types
export const VALID_VIEW_TYPES = [
  'list',
  'form',
  'detail',
  'custom'
] as const;

export type ValidViewType = typeof VALID_VIEW_TYPES[number];

// Validation utility functions
export class ValidationUtils {
  static isValidIdentifier(name: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  }
  
  static isValidFieldType(type: string): type is ValidFieldType {
    return VALID_FIELD_TYPES.includes(type as ValidFieldType);
  }
  
  static isValidBehaviorType(type: string): type is ValidBehaviorType {
    return VALID_BEHAVIOR_TYPES.includes(type as ValidBehaviorType);
  }
  
  static isValidViewType(type: string): type is ValidViewType {
    return VALID_VIEW_TYPES.includes(type as ValidViewType);
  }
  
  static isValidRoute(route: string): boolean {
    return /^\/[a-zA-Z0-9\-_/:]*$/.test(route);
  }
  
  static formatPath(parts: string[]): string {
    return parts.join('.');
  }
}