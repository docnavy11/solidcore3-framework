import { FrameworkError } from './framework-error.ts';
import { ErrorCode } from './types.ts';

export function generateSuggestions(error: FrameworkError): string[] {
  const suggestions: string[] = [];
  
  // First, try to get suggestion from error context
  if (error.context?.suggestion) {
    if (Array.isArray(error.context.suggestion)) {
      suggestions.push(...error.context.suggestion);
    } else {
      suggestions.push(error.context.suggestion);
    }
  }
  
  // Then add code-specific suggestions
  const codeSuggestions = getSuggestionsByCode(error.code, error.context);
  suggestions.push(...codeSuggestions);
  
  // Add general suggestions based on error category
  const categorySuggestions = getSuggestionsByCategory(error.code);
  suggestions.push(...categorySuggestions);
  
  // Remove duplicates and return unique suggestions
  return [...new Set(suggestions)].slice(0, 5); // Limit to 5 suggestions
}

function getSuggestionsByCode(code: ErrorCode, context?: any): string[] {
  switch (code) {
    // Validation errors
    case ErrorCode.VALIDATION_FAILED:
      return [
        'Check required fields and data types',
        'Verify field constraints and formats'
      ];
      
    case ErrorCode.INVALID_FIELD_TYPE:
      return [
        'Valid field types: string, number, boolean, date, enum, reference',
        'Check the truth file documentation for supported types'
      ];
      
    case ErrorCode.MISSING_REQUIRED_FIELD:
      return [
        'Add the missing field or mark it as optional',
        'Check the entity definition in your truth file'
      ];
      
    case ErrorCode.INVALID_ENUM_VALUE:
      const validOptions = context?.validOptions;
      return [
        validOptions ? `Valid options: ${validOptions.join(', ')}` : 'Check valid enum options',
        'Verify the value matches one of the defined options'
      ];
      
    case ErrorCode.INVALID_REFERENCE:
      return [
        'Check that the referenced entity exists',
        'Verify the reference field points to a valid entity'
      ];
      
    case ErrorCode.INVALID_EXPRESSION:
      return [
        'Use valid JavaScript expression syntax',
        'Example: "data.priority == \\"high\\" && entity == \\"Task\\"',
        'Avoid complex expressions or function calls'
      ];
      
    // Database errors
    case ErrorCode.DATABASE_CONNECTION_FAILED:
      return [
        'Check database connection string',
        'Verify database server is running',
        'Check network connectivity and firewall settings'
      ];
      
    case ErrorCode.QUERY_EXECUTION_FAILED:
      return [
        'Check SQL syntax and table existence',
        'Verify field names and data types',
        'Check database permissions'
      ];
      
    case ErrorCode.MIGRATION_FAILED:
      return [
        'Check migration script syntax',
        'Verify database permissions for schema changes',
        'Check if migration was already applied'
      ];
      
    // API errors
    case ErrorCode.ENTITY_NOT_FOUND:
      return [
        'Check entity name spelling and case',
        'Verify the entity exists in your truth file',
        'Check if you have permission to access this entity'
      ];
      
    case ErrorCode.PERMISSION_DENIED:
      return [
        'Check user authentication status',
        'Verify user has required permissions',
        'Check permission rules in entity definition'
      ];
      
    case ErrorCode.INVALID_REQUEST_DATA:
      return [
        'Check request body format and content type',
        'Verify all required fields are included',
        'Check field value constraints'
      ];
      
    // System errors
    case ErrorCode.TRUTH_FILE_LOAD_FAILED:
      return [
        'Check truth file syntax and imports',
        'Verify file path and permissions',
        'Check for TypeScript compilation errors'
      ];
      
    case ErrorCode.CONFIGURATION_ERROR:
      return [
        'Check configuration file syntax',
        'Verify environment variables',
        'Check default configuration values'
      ];
      
    case ErrorCode.GENERATOR_FAILED:
      return [
        'Check truth file validity',
        'Verify generator configuration',
        'Check template files and permissions'
      ];
      
    // Extension errors
    case ErrorCode.EXTENSION_NOT_FOUND:
      return [
        'Check extension name and directory path',
        'Verify extension file exists and is readable',
        'Check extension configuration'
      ];
      
    case ErrorCode.EXTENSION_LOAD_FAILED:
      return [
        'Check extension syntax and imports',
        'Verify extension dependencies',
        'Check extension permissions and exports'
      ];
      
    case ErrorCode.EXTENSION_TIMEOUT:
      return [
        'Optimize extension performance',
        'Increase timeout in configuration',
        'Check for infinite loops or blocking operations'
      ];
      
    // Workflow errors
    case ErrorCode.WORKFLOW_EXECUTION_FAILED:
      return [
        'Check workflow action configuration',
        'Verify action parameters and types',
        'Check workflow trigger conditions'
      ];
      
    case ErrorCode.WORKFLOW_CONDITION_FAILED:
      return [
        'Check condition expression syntax',
        'Verify available variables in condition context',
        'Use simple comparison operators'
      ];
      
    default:
      return [];
  }
}

function getSuggestionsByCategory(code: ErrorCode): string[] {
  const codeNumber = parseInt(code.substring(1));
  
  if (codeNumber >= 1000 && codeNumber < 2000) {
    // Validation errors
    return [
      'Check the documentation for valid configuration formats',
      'Use the validation endpoint to test your configuration'
    ];
  } else if (codeNumber >= 2000 && codeNumber < 3000) {
    // Database errors
    return [
      'Check database logs for more details',
      'Verify database connection and permissions'
    ];
  } else if (codeNumber >= 3000 && codeNumber < 4000) {
    // API errors
    return [
      'Check API documentation for correct usage',
      'Verify request format and authentication'
    ];
  } else if (codeNumber >= 4000 && codeNumber < 5000) {
    // System errors
    return [
      'Check system logs for more details',
      'Verify configuration and file permissions'
    ];
  } else if (codeNumber >= 5000 && codeNumber < 6000) {
    // Extension errors
    return [
      'Check extension documentation',
      'Verify extension compatibility'
    ];
  } else if (codeNumber >= 6000 && codeNumber < 7000) {
    // Workflow errors
    return [
      'Check workflow configuration',
      'Verify trigger and action definitions'
    ];
  }
  
  return [
    'Check the documentation for troubleshooting steps',
    'Contact support if the problem persists'
  ];
}

export function getDocumentationUrl(code: ErrorCode): string {
  const baseUrl = 'https://docs.solidcore3.dev/errors';
  return `${baseUrl}/${code.toLowerCase()}`;
}

export function getRelatedErrors(code: ErrorCode): ErrorCode[] {
  const codeNumber = parseInt(code.substring(1));
  const category = Math.floor(codeNumber / 1000) * 1000;
  
  // Return other errors in the same category
  const relatedCodes: ErrorCode[] = [];
  
  switch (category) {
    case 1000: // Validation
      relatedCodes.push(
        ErrorCode.VALIDATION_FAILED,
        ErrorCode.INVALID_FIELD_TYPE,
        ErrorCode.MISSING_REQUIRED_FIELD,
        ErrorCode.INVALID_EXPRESSION
      );
      break;
      
    case 2000: // Database
      relatedCodes.push(
        ErrorCode.DATABASE_CONNECTION_FAILED,
        ErrorCode.QUERY_EXECUTION_FAILED,
        ErrorCode.MIGRATION_FAILED
      );
      break;
      
    case 3000: // API
      relatedCodes.push(
        ErrorCode.ENTITY_NOT_FOUND,
        ErrorCode.PERMISSION_DENIED,
        ErrorCode.INVALID_REQUEST_DATA
      );
      break;
  }
  
  return relatedCodes.filter(relatedCode => relatedCode !== code);
}