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
  
  // Add contextual suggestions based on error location
  const contextualSuggestions = getContextualSuggestions(error.code, error.context);
  suggestions.push(...contextualSuggestions);
  
  // Add general suggestions based on error category
  const categorySuggestions = getSuggestionsByCategory(error.code);
  suggestions.push(...categorySuggestions);
  
  // Remove duplicates and return unique suggestions
  return [...new Set(suggestions)].slice(0, 6); // Increased to 6 suggestions
}

function getSuggestionsByCode(code: ErrorCode, context?: any): string[] {
  switch (code) {
    // Validation errors
    case ErrorCode.VALIDATION_FAILED:
      return [
        'Check required fields and data types',
        'Verify field constraints and formats',
        'Use the validation endpoint: GET /api/_debug/validate'
      ];
      
    case ErrorCode.INVALID_FIELD_TYPE:
      return [
        'Valid field types: string, number, boolean, date, enum, relation, reference',
        'Check the truth file documentation for supported types',
        'Example: { type: "string", required: true, maxLength: 100 }'
      ];
      
    case ErrorCode.MISSING_REQUIRED_FIELD:
      return [
        'Add the missing field or mark it as optional with required: false',
        'Check the entity definition in your truth file',
        context?.field ? `Example: ${context.field}: { type: "string", required: true }` : 'Add required field definition'
      ];
      
    case ErrorCode.INVALID_ENUM_VALUE:
      const validOptions = context?.validOptions;
      return [
        validOptions ? `Valid options: ${validOptions.join(', ')}` : 'Check valid enum options',
        'Verify the value matches one of the defined options',
        'Example: { type: "enum", options: ["option1", "option2"], default: "option1" }'
      ];
      
    case ErrorCode.INVALID_REFERENCE:
      return [
        'Check that the referenced entity exists in your truth file',
        'Verify the reference field points to a valid entity',
        'Example: { type: "relation", to: "User", required: false }',
        context?.availableEntities ? `Available entities: ${context.availableEntities.join(', ')}` : ''
      ].filter(Boolean);
      
    case ErrorCode.INVALID_EXPRESSION:
      return [
        'Use valid JavaScript expression syntax',
        'Example: "user.role == \\"admin\\" || entity.ownerId == user.id"',
        'Avoid complex expressions or function calls',
        'Available variables: user, entity, authenticated, owner',
        'Test expressions at: GET /api/_debug/expression?expr=your_expression'
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
        'Check truth file syntax with: deno check app/app.truth.ts',
        'Verify all imports and exports are correct',
        'Check for TypeScript compilation errors',
        'Ensure the file exports an "App" object',
        'Validate file path and permissions'
      ];
      
    case ErrorCode.CONFIGURATION_ERROR:
      return [
        'Check configuration file syntax and structure',
        'Verify environment variables are set correctly',
        'Check default configuration values',
        'Review solidcore.config.ts if it exists',
        context?.configKey ? `Fix configuration key: ${context.configKey}` : ''
      ].filter(Boolean);
      
    case ErrorCode.GENERATOR_FAILED:
      return [
        'Check truth file validity with validation endpoint',
        'Verify generator configuration and templates',
        'Check file system permissions for generated files',
        'Review recent changes to truth file',
        context?.generator ? `Debug generator: ${context.generator}` : ''
      ].filter(Boolean);
      
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

// New function to provide contextual suggestions based on error location and context
function getContextualSuggestions(code: ErrorCode, context?: any): string[] {
  const suggestions: string[] = [];

  // Location-based suggestions
  if (context?.field) {
    suggestions.push(`Focus on field: ${context.field}`);
  }
  
  if (context?.entityName) {
    suggestions.push(`Check entity definition: entities.${context.entityName}`);
  }

  if (context?.filePath) {
    const fileName = context.filePath.split('/').pop();
    suggestions.push(`Review file: ${fileName}`);
    
    if (context.lineNumber) {
      suggestions.push(`Check line ${context.lineNumber} in ${fileName}`);
    }
  }

  // Context-specific examples and quick fixes
  if (context?.operation) {
    switch (context.operation) {
      case 'create':
        suggestions.push('Ensure all required fields are defined for creation');
        break;
      case 'update':
        suggestions.push('Check field update permissions and constraints');
        break;
      case 'delete':
        suggestions.push('Verify delete permissions and cascade rules');
        break;
    }
  }

  // Development environment specific suggestions
  if (isDevelopmentMode()) {
    suggestions.push('Use hot reload - save the file to see changes immediately');
    suggestions.push('Check the development console for detailed error information');
    
    if (code.startsWith('E1')) { // Validation errors
      suggestions.push('Run: GET /api/_debug/validate for detailed validation report');
    }
    
    if (code.startsWith('E4')) { // System errors
      suggestions.push('Check: GET /api/_debug for system health information');
    }
  }

  // Smart suggestions based on common patterns
  if (context?.suggestion && typeof context.suggestion === 'string') {
    if (context.suggestion.includes('permission')) {
      suggestions.push('Test permissions with different user roles in development');
    }
    
    if (context.suggestion.includes('type')) {
      suggestions.push('Refer to the field types documentation for examples');
    }
    
    if (context.suggestion.includes('syntax')) {
      suggestions.push('Use a TypeScript-aware editor for syntax checking');
    }
  }

  // Error frequency based suggestions
  if (context?.isRecurring) {
    suggestions.push('This error occurred before - check if the fix was applied correctly');
  }

  return suggestions.filter(Boolean).slice(0, 3); // Limit contextual suggestions
}

// Helper function to detect development mode
function isDevelopmentMode(): boolean {
  return Deno.env.get('DENO_ENV') === 'development' || 
         Deno.env.get('NODE_ENV') === 'development' || 
         !Deno.env.get('DENO_ENV');
}

// Enhanced function to provide examples based on error context
export function generateExamples(error: FrameworkError): string[] {
  const examples: string[] = [];
  const { code, context } = error;

  switch (code) {
    case ErrorCode.INVALID_FIELD_TYPE:
      examples.push('{ type: "string", required: true, maxLength: 100 }');
      examples.push('{ type: "enum", options: ["active", "inactive"], default: "active" }');
      examples.push('{ type: "relation", to: "User", required: false }');
      break;

    case ErrorCode.INVALID_EXPRESSION:
      examples.push('"authenticated"');
      examples.push('"user.role == \\"admin\\""');
      examples.push('"authenticated && (user.role == \\"admin\\" || entity.ownerId == user.id)"');
      break;

    case ErrorCode.MISSING_REQUIRED_FIELD:
      if (context?.field && context?.entityName) {
        examples.push(`${context.field}: { type: "string", required: true }`);
        examples.push(`${context.field}: { type: "string", required: false, default: "default_value" }`);
      }
      break;

    case ErrorCode.INVALID_REFERENCE:
      if (context?.availableEntities) {
        examples.push(`{ type: "relation", to: "${context.availableEntities[0] || 'EntityName'}" }`);
      }
      break;

    case ErrorCode.ENTITY_NOT_FOUND:
      if (context?.availableEntities) {
        examples.push(`Available entities: ${context.availableEntities.slice(0, 3).join(', ')}`);
      }
      break;
  }

  return examples;
}

// Function to generate quick fix suggestions
export function generateQuickFixes(error: FrameworkError): Array<{
  description: string;
  action: string;
  code?: string;
}> {
  const fixes: any[] = [];
  const { code, context } = error;

  switch (code) {
    case ErrorCode.MISSING_REQUIRED_FIELD:
      if (context?.field && context?.entityName) {
        fixes.push({
          description: `Add required field '${context.field}'`,
          action: 'Add field definition',
          code: `${context.field}: { type: "string", required: true }`
        });
        fixes.push({
          description: `Make field '${context.field}' optional`,
          action: 'Add optional field',
          code: `${context.field}: { type: "string", required: false }`
        });
      }
      break;

    case ErrorCode.INVALID_FIELD_TYPE:
      if (context?.field) {
        fixes.push({
          description: `Fix field type for '${context.field}'`,
          action: 'Update field type',
          code: `${context.field}: { type: "string" }`
        });
      }
      break;

    case ErrorCode.TRUTH_FILE_LOAD_FAILED:
      fixes.push({
        description: 'Check TypeScript syntax',
        action: 'Run syntax check',
        code: 'deno check app/app.truth.ts'
      });
      fixes.push({
        description: 'Verify exports',
        action: 'Check export statement',
        code: 'export const App: AppDefinition = { ... }'
      });
      break;
  }

  return fixes;
}