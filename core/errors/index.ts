// Export all error types and utilities
export * from './types.ts';
export * from './framework-error.ts';
export * from './specialized-errors.ts';
export * from './response-builder.ts';
export * from './suggestions.ts';

// Re-export commonly used error classes for convenience
export { FrameworkError } from './framework-error.ts';
export {
  ValidationError,
  InvalidFieldTypeError,
  MissingRequiredFieldError,
  InvalidExpressionError,
  DatabaseError,
  DatabaseConnectionError,
  MigrationError,
  EntityNotFoundError,
  PermissionError,
  InvalidRequestDataError,
  TruthFileLoadError,
  ConfigurationError,
  GeneratorError,
  ExtensionNotFoundError,
  ExtensionLoadError,
  ExtensionTimeoutError,
  WorkflowExecutionError,
  WorkflowConditionError,
  WorkflowActionError
} from './specialized-errors.ts';