import { FrameworkError } from './framework-error.ts';
import { 
  ErrorCode, 
  ValidationErrorContext, 
  DatabaseErrorContext, 
  APIErrorContext, 
  SystemErrorContext, 
  ExtensionErrorContext, 
  WorkflowErrorContext 
} from './types.ts';

// Validation Errors
export class ValidationError extends FrameworkError {
  constructor(
    message: string, 
    field?: string, 
    value?: any, 
    suggestion?: string,
    requestId?: string
  ) {
    const context: ValidationErrorContext = { field, value, suggestion };
    super(ErrorCode.VALIDATION_FAILED, message, context, undefined, requestId);
    this.name = 'ValidationError';
  }
}

export class InvalidFieldTypeError extends FrameworkError {
  constructor(
    field: string, 
    invalidType: string, 
    validTypes: string[],
    requestId?: string
  ) {
    const message = `Field '${field}' has invalid type '${invalidType}'`;
    const context: ValidationErrorContext = { 
      field, 
      value: invalidType, 
      suggestion: `Valid types: ${validTypes.join(', ')}` 
    };
    super(ErrorCode.INVALID_FIELD_TYPE, message, context, undefined, requestId);
    this.name = 'InvalidFieldTypeError';
  }
}

export class MissingRequiredFieldError extends FrameworkError {
  constructor(field: string, entityName?: string, requestId?: string) {
    const message = entityName 
      ? `Required field '${field}' is missing in entity '${entityName}'`
      : `Required field '${field}' is missing`;
    const context: ValidationErrorContext = { 
      field, 
      entityName,
      suggestion: `Add the '${field}' field or mark it as optional` 
    };
    super(ErrorCode.MISSING_REQUIRED_FIELD, message, context, undefined, requestId);
    this.name = 'MissingRequiredFieldError';
  }
}

export class InvalidExpressionError extends FrameworkError {
  constructor(
    expression: string, 
    syntaxError: string, 
    location?: string,
    requestId?: string
  ) {
    const message = `Invalid expression syntax: ${syntaxError}`;
    const context: ValidationErrorContext = { 
      value: expression, 
      field: location,
      suggestion: 'Check expression syntax. Example: "data.priority == \\"high\\" && entity == \\"Task\\""' 
    };
    super(ErrorCode.INVALID_EXPRESSION, message, context, undefined, requestId);
    this.name = 'InvalidExpressionError';
  }
}

// Database Errors
export class DatabaseError extends FrameworkError {
  constructor(
    operation: string, 
    cause?: Error, 
    query?: string, 
    table?: string,
    requestId?: string
  ) {
    const message = `Database ${operation} failed`;
    const context: DatabaseErrorContext = { operation, query, table };
    super(ErrorCode.QUERY_EXECUTION_FAILED, message, context, cause, requestId);
    this.name = 'DatabaseError';
  }
}

export class DatabaseConnectionError extends FrameworkError {
  constructor(connectionString?: string, cause?: Error, requestId?: string) {
    const message = 'Failed to connect to database';
    const context: DatabaseErrorContext = { 
      operation: 'connect',
      suggestion: connectionString ? 'Check database URL and credentials' : 'Check database configuration'
    };
    super(ErrorCode.DATABASE_CONNECTION_FAILED, message, context, cause, requestId);
    this.name = 'DatabaseConnectionError';
  }
}

export class MigrationError extends FrameworkError {
  constructor(
    migrationName: string, 
    cause?: Error, 
    query?: string,
    requestId?: string
  ) {
    const message = `Migration '${migrationName}' failed`;
    const context: DatabaseErrorContext = { 
      operation: 'migrate', 
      table: migrationName, 
      query,
      suggestion: 'Check migration SQL and database permissions'
    };
    super(ErrorCode.MIGRATION_FAILED, message, context, cause, requestId);
    this.name = 'MigrationError';
  }
}

// API Errors
export class EntityNotFoundError extends FrameworkError {
  constructor(
    entityName: string, 
    entityId?: string, 
    endpoint?: string,
    requestId?: string
  ) {
    const message = entityId 
      ? `${entityName} with id '${entityId}' not found`
      : `${entityName} not found`;
    const context: APIErrorContext = { 
      entityName, 
      entityId, 
      endpoint,
      suggestion: entityId ? 'Check if the ID exists and you have permission to access it' : 'Check entity name spelling'
    };
    super(ErrorCode.ENTITY_NOT_FOUND, message, context, undefined, requestId);
    this.name = 'EntityNotFoundError';
  }
}

export class PermissionError extends FrameworkError {
  constructor(
    operation: string, 
    entityName: string, 
    userId?: string, 
    permission?: string,
    requestId?: string
  ) {
    const message = `Permission denied for ${operation} on ${entityName}`;
    const context: APIErrorContext = { 
      operation, 
      entityName, 
      userId, 
      permission,
      suggestion: 'Check user permissions and authentication status'
    };
    super(ErrorCode.PERMISSION_DENIED, message, context, undefined, requestId);
    this.name = 'PermissionError';
  }
}

export class InvalidRequestDataError extends FrameworkError {
  constructor(
    field: string, 
    value: any, 
    constraint?: string, 
    endpoint?: string,
    requestId?: string
  ) {
    const message = constraint 
      ? `Invalid value for field '${field}': ${constraint}`
      : `Invalid value for field '${field}'`;
    const context: APIErrorContext = { 
      field, 
      value, 
      constraint, 
      endpoint,
      suggestion: 'Check request data format and field constraints'
    };
    super(ErrorCode.INVALID_REQUEST_DATA, message, context, undefined, requestId);
    this.name = 'InvalidRequestDataError';
  }
}

// System Errors
export class TruthFileLoadError extends FrameworkError {
  constructor(
    filePath: string, 
    cause?: Error, 
    lineNumber?: number,
    requestId?: string
  ) {
    const message = `Failed to load truth file: ${filePath}`;
    const context: SystemErrorContext = { 
      component: 'TruthLoader', 
      filePath, 
      lineNumber,
      suggestion: 'Check file path, syntax, and permissions'
    };
    super(ErrorCode.TRUTH_FILE_LOAD_FAILED, message, context, cause, requestId);
    this.name = 'TruthFileLoadError';
  }
}

export class ConfigurationError extends FrameworkError {
  constructor(
    configKey: string, 
    value: any, 
    constraint?: string,
    requestId?: string
  ) {
    const message = constraint 
      ? `Invalid configuration for '${configKey}': ${constraint}`
      : `Invalid configuration for '${configKey}'`;
    const context: SystemErrorContext = { 
      component: 'ConfigManager', 
      field: configKey, 
      value,
      suggestion: 'Check configuration file and environment variables'
    };
    super(ErrorCode.CONFIGURATION_ERROR, message, context, undefined, requestId);
    this.name = 'ConfigurationError';
  }
}

export class GeneratorError extends FrameworkError {
  constructor(
    generatorName: string, 
    cause?: Error, 
    component?: string,
    requestId?: string
  ) {
    const message = `Generator '${generatorName}' failed`;
    const context: SystemErrorContext = { 
      component: component || generatorName,
      suggestion: 'Check truth file validity and generator configuration'
    };
    super(ErrorCode.GENERATOR_FAILED, message, context, cause, requestId);
    this.name = 'GeneratorError';
  }
}

// Extension Errors
export class ExtensionNotFoundError extends FrameworkError {
  constructor(
    extensionName: string, 
    extensionPath?: string,
    requestId?: string
  ) {
    const message = `Extension '${extensionName}' not found`;
    const context: ExtensionErrorContext = { 
      extensionName, 
      extensionPath,
      suggestion: 'Check extension name and directory path'
    };
    super(ErrorCode.EXTENSION_NOT_FOUND, message, context, undefined, requestId);
    this.name = 'ExtensionNotFoundError';
  }
}

export class ExtensionLoadError extends FrameworkError {
  constructor(
    extensionName: string, 
    cause?: Error, 
    extensionPath?: string,
    requestId?: string
  ) {
    const message = `Failed to load extension '${extensionName}'`;
    const context: ExtensionErrorContext = { 
      extensionName, 
      extensionPath,
      suggestion: 'Check extension syntax and dependencies'
    };
    super(ErrorCode.EXTENSION_LOAD_FAILED, message, context, cause, requestId);
    this.name = 'ExtensionLoadError';
  }
}

export class ExtensionTimeoutError extends FrameworkError {
  constructor(
    extensionName: string, 
    timeout: number,
    requestId?: string
  ) {
    const message = `Extension '${extensionName}' timed out after ${timeout}ms`;
    const context: ExtensionErrorContext = { 
      extensionName, 
      timeout,
      suggestion: 'Optimize extension performance or increase timeout'
    };
    super(ErrorCode.EXTENSION_TIMEOUT, message, context, undefined, requestId);
    this.name = 'ExtensionTimeoutError';
  }
}

// Workflow Errors
export class WorkflowExecutionError extends FrameworkError {
  constructor(
    workflowName: string, 
    cause?: Error, 
    stepNumber?: number,
    requestId?: string
  ) {
    const message = stepNumber 
      ? `Workflow '${workflowName}' failed at step ${stepNumber}`
      : `Workflow '${workflowName}' execution failed`;
    const context: WorkflowErrorContext = { 
      workflowName, 
      stepNumber,
      suggestion: 'Check workflow configuration and action parameters'
    };
    super(ErrorCode.WORKFLOW_EXECUTION_FAILED, message, context, cause, requestId);
    this.name = 'WorkflowExecutionError';
  }
}

export class WorkflowConditionError extends FrameworkError {
  constructor(
    workflowName: string, 
    condition: string, 
    syntaxError?: string,
    requestId?: string
  ) {
    const message = syntaxError 
      ? `Workflow '${workflowName}' condition has invalid syntax: ${syntaxError}`
      : `Workflow '${workflowName}' condition evaluation failed`;
    const context: WorkflowErrorContext = { 
      workflowName, 
      condition,
      suggestion: 'Check condition syntax and available variables'
    };
    super(ErrorCode.WORKFLOW_CONDITION_FAILED, message, context, undefined, requestId);
    this.name = 'WorkflowConditionError';
  }
}

export class WorkflowActionError extends FrameworkError {
  constructor(
    workflowName: string, 
    action: string, 
    cause?: Error,
    requestId?: string
  ) {
    const message = `Workflow '${workflowName}' action '${action}' failed`;
    const context: WorkflowErrorContext = { 
      workflowName, 
      action,
      suggestion: 'Check action type and required parameters'
    };
    super(ErrorCode.WORKFLOW_ACTION_FAILED, message, context, cause, requestId);
    this.name = 'WorkflowActionError';
  }
}