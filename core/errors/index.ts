// Export all error types and utilities
export * from './types.ts';
export * from './framework-error.ts';
export * from './specialized-errors.ts';
export * from './response-builder.ts';
export * from './suggestions.ts';
export * from './error-formatter.ts';
export * from './enhanced-error-system.ts';

// Export enhanced error handling components
export { logger } from '../logging/logger.ts';
export { HelpSystem } from '../help/help-system.ts';
export { DevelopmentValidator } from '../validation/development-validator.ts';
export { DebugTools } from '../debug/debug-tools.ts';
export { HotReloadManager } from '../hot-reload/reload-manager.ts';

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

// Export enhanced error processing functions
export {
  formatErrorForConsole,
  extractLineNumberFromStack
} from './error-formatter.ts';

export {
  generateExamples,
  generateQuickFixes
} from './suggestions.ts';

export { EnhancedErrorSystem } from './enhanced-error-system.ts';