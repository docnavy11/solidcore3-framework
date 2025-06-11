// Error system types and codes for the Solidcore3 framework

export enum ErrorCode {
  // Validation errors (1xxx)
  VALIDATION_FAILED = 'E1001',
  INVALID_FIELD_TYPE = 'E1002',
  MISSING_REQUIRED_FIELD = 'E1003',
  INVALID_ENUM_VALUE = 'E1004',
  INVALID_REFERENCE = 'E1005',
  FIELD_CONSTRAINT_VIOLATION = 'E1006',
  INVALID_EXPRESSION = 'E1007',
  TRUTH_FILE_SYNTAX_ERROR = 'E1008',
  
  // Database errors (2xxx)
  DATABASE_CONNECTION_FAILED = 'E2001',
  QUERY_EXECUTION_FAILED = 'E2002',
  TRANSACTION_FAILED = 'E2003',
  MIGRATION_FAILED = 'E2004',
  DATABASE_SCHEMA_ERROR = 'E2005',
  
  // API errors (3xxx)
  ENTITY_NOT_FOUND = 'E3001',
  PERMISSION_DENIED = 'E3002',
  INVALID_REQUEST_DATA = 'E3003',
  AUTHENTICATION_FAILED = 'E3004',
  RATE_LIMIT_EXCEEDED = 'E3005',
  INVALID_ROUTE = 'E3006',
  
  // System errors (4xxx)
  TRUTH_FILE_LOAD_FAILED = 'E4001',
  EXTENSION_LOAD_FAILED = 'E4002',
  CONFIGURATION_ERROR = 'E4003',
  RUNTIME_INITIALIZATION_FAILED = 'E4004',
  GENERATOR_FAILED = 'E4005',
  HOT_RELOAD_FAILED = 'E4006',
  
  // Extension errors (5xxx)
  EXTENSION_NOT_FOUND = 'E5001',
  EXTENSION_INVALID = 'E5002',
  EXTENSION_TIMEOUT = 'E5003',
  EXTENSION_PERMISSION_DENIED = 'E5004',
  
  // Workflow errors (6xxx)
  WORKFLOW_EXECUTION_FAILED = 'E6001',
  WORKFLOW_CONDITION_FAILED = 'E6002',
  WORKFLOW_ACTION_FAILED = 'E6003',
  WORKFLOW_TRIGGER_INVALID = 'E6004'
}

export interface ErrorContext {
  [key: string]: any;
}

export interface ValidationErrorContext extends ErrorContext {
  field?: string;
  value?: any;
  constraint?: string;
  suggestion?: string;
}

export interface DatabaseErrorContext extends ErrorContext {
  operation?: string;
  table?: string;
  query?: string;
  constraint?: string;
}

export interface APIErrorContext extends ErrorContext {
  endpoint?: string;
  method?: string;
  entityName?: string;
  entityId?: string;
  userId?: string;
  permission?: string;
}

export interface SystemErrorContext extends ErrorContext {
  component?: string;
  filePath?: string;
  lineNumber?: number;
  stackTrace?: string;
}

export interface ExtensionErrorContext extends ErrorContext {
  extensionName?: string;
  extensionType?: string;
  extensionPath?: string;
  extensionVersion?: string;
}

export interface WorkflowErrorContext extends ErrorContext {
  workflowName?: string;
  trigger?: string;
  condition?: string;
  action?: string;
  stepNumber?: number;
}