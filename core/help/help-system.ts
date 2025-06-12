// Comprehensive error documentation and help system
import { ErrorCode } from '../errors/types.ts';
import { FrameworkError } from '../errors/framework-error.ts';
import { generateExamples, generateQuickFixes } from '../errors/suggestions.ts';

export interface ErrorDocumentation {
  code: ErrorCode;
  title: string;
  description: string;
  commonCauses: string[];
  solutions: string[];
  examples: Array<{
    title: string;
    description: string;
    before?: string;
    after: string;
    explanation: string;
  }>;
  relatedErrors: ErrorCode[];
  preventionTips: string[];
  troubleshootingSteps: string[];
}

export interface TutorialStep {
  title: string;
  description: string;
  code?: string;
  explanation: string;
  tips?: string[];
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  prerequisites: string[];
  steps: TutorialStep[];
  relatedTopics: string[];
}

export class HelpSystem {
  private static errorDocs: Map<ErrorCode, ErrorDocumentation> = new Map();
  private static tutorials: Map<string, Tutorial> = new Map();

  static {
    this.initializeErrorDocs();
    this.initializeTutorials();
  }

  // Get comprehensive documentation for a specific error
  static getErrorDocumentation(code: ErrorCode): ErrorDocumentation | null {
    return this.errorDocs.get(code) || null;
  }

  // Get help for a specific error instance
  static getErrorHelp(error: FrameworkError): {
    documentation: ErrorDocumentation | null;
    quickFixes: Array<{ description: string; action: string; code?: string }>;
    examples: string[];
    debuggingSteps: string[];
  } {
    const documentation = this.getErrorDocumentation(error.code);
    const quickFixes = generateQuickFixes(error);
    const examples = generateExamples(error);
    const debuggingSteps = this.generateDebuggingSteps(error);

    return {
      documentation,
      quickFixes,
      examples,
      debuggingSteps
    };
  }

  // Get all available tutorials
  static getTutorials(): Tutorial[] {
    return Array.from(this.tutorials.values());
  }

  // Get a specific tutorial
  static getTutorial(id: string): Tutorial | null {
    return this.tutorials.get(id) || null;
  }

  // Get tutorials related to an error
  static getTutorialsForError(code: ErrorCode): Tutorial[] {
    const category = this.getErrorCategory(code);
    return this.getTutorials().filter(tutorial => 
      tutorial.id.includes(category.toLowerCase()) ||
      tutorial.relatedTopics.includes(category.toLowerCase())
    );
  }

  // Search help topics
  static searchHelp(query: string): Array<{
    type: 'error' | 'tutorial';
    title: string;
    description: string;
    relevance: number;
    id: string;
  }> {
    const results: any[] = [];
    const lowerQuery = query.toLowerCase();

    // Search error documentation
    for (const [code, doc] of this.errorDocs) {
      let relevance = 0;
      
      if (doc.title.toLowerCase().includes(lowerQuery)) relevance += 10;
      if (doc.description.toLowerCase().includes(lowerQuery)) relevance += 5;
      if (doc.commonCauses.some(cause => cause.toLowerCase().includes(lowerQuery))) relevance += 3;
      if (doc.solutions.some(solution => solution.toLowerCase().includes(lowerQuery))) relevance += 3;

      if (relevance > 0) {
        results.push({
          type: 'error',
          title: doc.title,
          description: doc.description,
          relevance,
          id: code
        });
      }
    }

    // Search tutorials
    for (const [id, tutorial] of this.tutorials) {
      let relevance = 0;
      
      if (tutorial.title.toLowerCase().includes(lowerQuery)) relevance += 10;
      if (tutorial.description.toLowerCase().includes(lowerQuery)) relevance += 5;
      if (tutorial.steps.some(step => 
        step.title.toLowerCase().includes(lowerQuery) ||
        step.description.toLowerCase().includes(lowerQuery)
      )) relevance += 3;

      if (relevance > 0) {
        results.push({
          type: 'tutorial',
          title: tutorial.title,
          description: tutorial.description,
          relevance,
          id
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  // Generate contextual help based on current state
  static getContextualHelp(context: {
    currentFile?: string;
    entityName?: string;
    fieldName?: string;
    operation?: string;
    recentErrors?: ErrorCode[];
  }): {
    relevantTutorials: Tutorial[];
    quickTips: string[];
    commonPatterns: string[];
  } {
    const relevantTutorials: Tutorial[] = [];
    const quickTips: string[] = [];
    const commonPatterns: string[] = [];

    // Based on current context
    if (context.currentFile?.includes('truth')) {
      relevantTutorials.push(...this.getTutorials().filter(t => 
        t.id.includes('truth') || t.id.includes('entity')
      ));
      
      quickTips.push('Use TypeScript intellisense for autocompletion');
      quickTips.push('Run validation with: GET /api/_debug/validate');
    }

    if (context.entityName) {
      commonPatterns.push('Add timestamp fields: createdAt, updatedAt');
      commonPatterns.push('Define permission rules for all operations');
      commonPatterns.push('Consider relationships to other entities');
    }

    if (context.recentErrors?.length) {
      const errorCategories = context.recentErrors.map(this.getErrorCategory);
      const uniqueCategories = [...new Set(errorCategories)];
      
      for (const category of uniqueCategories) {
        relevantTutorials.push(...this.getTutorials().filter(t => 
          t.relatedTopics.includes(category.toLowerCase())
        ));
      }
    }

    return {
      relevantTutorials: relevantTutorials.slice(0, 3),
      quickTips: quickTips.slice(0, 5),
      commonPatterns: commonPatterns.slice(0, 3)
    };
  }

  private static generateDebuggingSteps(error: FrameworkError): string[] {
    const steps: string[] = [];
    const category = this.getErrorCategory(error.code);

    switch (category) {
      case 'Validation':
        steps.push('1. Check the truth file syntax and structure');
        steps.push('2. Verify all required fields are defined');
        steps.push('3. Validate field types and constraints');
        steps.push('4. Run: GET /api/_debug/validate for detailed report');
        break;

      case 'Database':
        steps.push('1. Check database connection and credentials');
        steps.push('2. Verify table structure matches entity definitions');
        steps.push('3. Check database permissions');
        steps.push('4. Review migration logs');
        break;

      case 'API':
        steps.push('1. Verify request format and content-type');
        steps.push('2. Check authentication and permissions');
        steps.push('3. Validate request data against entity schema');
        steps.push('4. Review API endpoint documentation');
        break;

      case 'System':
        steps.push('1. Check file permissions and paths');
        steps.push('2. Verify environment configuration');
        steps.push('3. Review system logs');
        steps.push('4. Check for resource constraints');
        break;

      default:
        steps.push('1. Review the error message and context');
        steps.push('2. Check recent changes to configuration');
        steps.push('3. Verify system dependencies');
        steps.push('4. Consult the documentation');
    }

    return steps;
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

  private static initializeErrorDocs(): void {
    // Validation errors
    this.errorDocs.set(ErrorCode.TRUTH_FILE_LOAD_FAILED, {
      code: ErrorCode.TRUTH_FILE_LOAD_FAILED,
      title: 'Truth File Load Failed',
      description: 'The truth file could not be loaded due to syntax errors or import issues.',
      commonCauses: [
        'TypeScript syntax errors in truth file',
        'Missing or incorrect import statements',
        'File path issues or permissions',
        'Missing export of App object'
      ],
      solutions: [
        'Check TypeScript syntax with: deno check app/app.truth.ts',
        'Verify all imports are correct and accessible',
        'Ensure the file exports an "App" object',
        'Check file permissions and path'
      ],
      examples: [
        {
          title: 'Correct Export Structure',
          description: 'How to properly export the App definition',
          after: `import { AppDefinition } from '../core/types/index.ts';

export const App: AppDefinition = {
  name: 'MyApp',
  entities: {
    // ... entity definitions
  }
};`,
          explanation: 'The truth file must export a const named "App" that matches the AppDefinition type.'
        },
        {
          title: 'Common Import Fix',
          description: 'Fixing import path issues',
          before: `import { AppDefinition } from './types/index.ts';`,
          after: `import { AppDefinition } from '../core/types/index.ts';`,
          explanation: 'Import paths must be relative to the truth file location.'
        }
      ],
      relatedErrors: [ErrorCode.CONFIGURATION_ERROR, ErrorCode.VALIDATION_FAILED],
      preventionTips: [
        'Use a TypeScript-aware editor for syntax checking',
        'Set up pre-commit hooks to validate truth file',
        'Keep imports organized and use absolute paths when possible'
      ],
      troubleshootingSteps: [
        'Run deno check on the truth file',
        'Verify import paths exist',
        'Check file encoding and line endings',
        'Test with a minimal truth file'
      ]
    });

    this.errorDocs.set(ErrorCode.INVALID_FIELD_TYPE, {
      code: ErrorCode.INVALID_FIELD_TYPE,
      title: 'Invalid Field Type',
      description: 'A field was defined with an unsupported or incorrectly specified type.',
      commonCauses: [
        'Using unsupported field types',
        'Typos in field type names',
        'Missing type property',
        'Incorrect type configuration'
      ],
      solutions: [
        'Use supported field types: string, number, boolean, date, enum, relation',
        'Check spelling of field type names',
        'Ensure type property is specified',
        'Review field type documentation'
      ],
      examples: [
        {
          title: 'Basic Field Types',
          description: 'Examples of correct field type definitions',
          after: `{
  title: { type: "string", required: true, maxLength: 100 },
  count: { type: "number", min: 0 },
  isActive: { type: "boolean", default: true },
  createdAt: { type: "date", auto: true }
}`,
          explanation: 'Each field must have a valid type with appropriate constraints.'
        },
        {
          title: 'Enum Fields',
          description: 'How to define enum fields correctly',
          after: `{
  status: {
    type: "enum",
    options: ["active", "inactive", "pending"],
    default: "pending",
    required: true
  }
}`,
          explanation: 'Enum fields require an options array and optionally a default value.'
        }
      ],
      relatedErrors: [ErrorCode.MISSING_REQUIRED_FIELD, ErrorCode.VALIDATION_FAILED],
      preventionTips: [
        'Use TypeScript for type checking',
        'Refer to the field types documentation',
        'Test field definitions in development'
      ],
      troubleshootingSteps: [
        'Check the field type against supported types',
        'Verify type property spelling',
        'Review type-specific configuration',
        'Test with a simple field definition'
      ]
    });

    // Add more error documentation...
    this.errorDocs.set(ErrorCode.PERMISSION_DENIED, {
      code: ErrorCode.PERMISSION_DENIED,
      title: 'Permission Denied',
      description: 'The current user does not have permission to perform the requested operation.',
      commonCauses: [
        'User not authenticated',
        'Insufficient user role or permissions',
        'Permission expression evaluation failed',
        'Ownership requirements not met'
      ],
      solutions: [
        'Ensure user is properly authenticated',
        'Check user role and permissions',
        'Review permission expressions in entity definition',
        'Verify ownership relationships'
      ],
      examples: [
        {
          title: 'Basic Permission Rules',
          description: 'Setting up entity permissions',
          after: `{
  permissions: {
    create: "authenticated",
    read: "authenticated",
    update: "authenticated && (user.role == 'admin' || entity.ownerId == user.id)",
    delete: "user.role == 'admin'"
  }
}`,
          explanation: 'Permission expressions control access to entity operations.'
        }
      ],
      relatedErrors: [ErrorCode.AUTHENTICATION_FAILED, ErrorCode.INVALID_EXPRESSION],
      preventionTips: [
        'Design clear permission hierarchies',
        'Test permissions with different user roles',
        'Document permission requirements'
      ],
      troubleshootingSteps: [
        'Check user authentication status',
        'Verify user role and properties',
        'Test permission expressions',
        'Review entity ownership'
      ]
    });
  }

  private static initializeTutorials(): void {
    this.tutorials.set('truth-file-basics', {
      id: 'truth-file-basics',
      title: 'Truth File Basics',
      description: 'Learn how to create and structure your truth file for defining application entities and logic.',
      difficulty: 'beginner',
      estimatedTime: '15 minutes',
      prerequisites: ['Basic TypeScript knowledge'],
      steps: [
        {
          title: 'Create Your First Entity',
          description: 'Define a simple entity with basic fields',
          code: `export const App: AppDefinition = {
  name: 'MyFirstApp',
  entities: {
    Task: {
      fields: {
        id: { type: 'string', unique: true },
        title: { type: 'string', required: true, maxLength: 100 },
        completed: { type: 'boolean', default: false }
      }
    }
  }
};`,
          explanation: 'This creates a basic Task entity with three fields: a unique ID, a required title, and a boolean completion status.',
          tips: [
            'Always include an ID field for unique identification',
            'Use descriptive field names',
            'Set appropriate constraints like maxLength'
          ]
        },
        {
          title: 'Add Timestamp Fields',
          description: 'Include audit fields for tracking creation and updates',
          code: `Task: {
  fields: {
    id: { type: 'string', unique: true },
    title: { type: 'string', required: true, maxLength: 100 },
    completed: { type: 'boolean', default: false },
    createdAt: { type: 'date', auto: true },
    updatedAt: { type: 'date', auto: true }
  }
}`,
          explanation: 'Timestamp fields help track when records are created and modified. The auto: true setting automatically manages these values.',
          tips: [
            'Always include createdAt and updatedAt fields',
            'Use auto: true for automatic timestamp management',
            'Consider adding fields like deletedAt for soft deletes'
          ]
        },
        {
          title: 'Define Permissions',
          description: 'Control who can access and modify your entities',
          code: `Task: {
  fields: { /* ... */ },
  permissions: {
    create: 'authenticated',
    read: 'authenticated',
    update: 'authenticated && (user.role == "admin" || entity.ownerId == user.id)',
    delete: 'user.role == "admin"'
  }
}`,
          explanation: 'Permission rules control access to entity operations. Use expressions to define complex permission logic.',
          tips: [
            'Start with simple permissions and add complexity as needed',
            'Test permissions with different user roles',
            'Document your permission logic'
          ]
        }
      ],
      relatedTopics: ['entities', 'permissions', 'validation']
    });

    this.tutorials.set('entity-relationships', {
      id: 'entity-relationships',
      title: 'Entity Relationships',
      description: 'Learn how to create relationships between entities for complex data models.',
      difficulty: 'intermediate',
      estimatedTime: '20 minutes',
      prerequisites: ['Truth File Basics', 'Understanding of database relationships'],
      steps: [
        {
          title: 'One-to-Many Relationships',
          description: 'Create relationships where one entity owns many others',
          code: `entities: {
  User: {
    fields: {
      id: { type: 'string', unique: true },
      name: { type: 'string', required: true }
    }
  },
  Task: {
    fields: {
      id: { type: 'string', unique: true },
      title: { type: 'string', required: true },
      assignedTo: { type: 'relation', to: 'User', required: false },
      createdBy: { type: 'relation', to: 'User', required: true }
    }
  }
}`,
          explanation: 'The Task entity has two relationships to User: one for who created it and one for who it\'s assigned to.',
          tips: [
            'Use descriptive names for relationship fields',
            'Consider whether relationships should be required',
            'Think about cascade delete behavior'
          ]
        }
      ],
      relatedTopics: ['entities', 'database', 'foreign-keys']
    });

    this.tutorials.set('error-handling', {
      id: 'error-handling',
      title: 'Understanding and Fixing Errors',
      description: 'Learn how to interpret error messages and fix common issues in Solidcore3.',
      difficulty: 'beginner',
      estimatedTime: '10 minutes',
      prerequisites: [],
      steps: [
        {
          title: 'Reading Error Messages',
          description: 'Understand the structure of Solidcore3 error messages',
          explanation: 'Error messages include an error code (like E1001), a descriptive message, the location where the error occurred, and helpful suggestions for fixing it.',
          tips: [
            'Look for the error code to identify the error type',
            'Check the location to find where the error occurred',
            'Follow the suggestions to fix the issue'
          ]
        },
        {
          title: 'Using Debug Tools',
          description: 'Leverage built-in debugging tools for troubleshooting',
          code: 'GET /api/_debug/validate',
          explanation: 'The debug endpoint provides detailed validation information and suggestions for improving your truth file.',
          tips: [
            'Use debug endpoints during development',
            'Check validation results after making changes',
            'Review performance suggestions regularly'
          ]
        }
      ],
      relatedTopics: ['debugging', 'validation', 'development']
    });
  }

  // Generate a help index for quick reference
  static generateHelpIndex(): {
    errorCodes: Array<{ code: ErrorCode; title: string; category: string }>;
    tutorials: Array<{ id: string; title: string; difficulty: string }>;
    quickReference: Array<{ topic: string; description: string; examples: string[] }>;
  } {
    const errorCodes = Array.from(this.errorDocs.entries()).map(([code, doc]) => ({
      code,
      title: doc.title,
      category: this.getErrorCategory(code)
    }));

    const tutorials = Array.from(this.tutorials.values()).map(tutorial => ({
      id: tutorial.id,
      title: tutorial.title,
      difficulty: tutorial.difficulty
    }));

    const quickReference = [
      {
        topic: 'Field Types',
        description: 'Supported field types and their usage',
        examples: [
          'string: Text data with optional constraints',
          'number: Numeric data with min/max values',
          'boolean: True/false values',
          'date: Date/time values',
          'enum: Predefined list of values',
          'relation: Reference to another entity'
        ]
      },
      {
        topic: 'Permission Expressions',
        description: 'Common permission patterns',
        examples: [
          'authenticated: User must be logged in',
          'user.role == "admin": User must be admin',
          'entity.ownerId == user.id: User must own the entity',
          'authenticated && user.role == "admin": Both conditions'
        ]
      },
      {
        topic: 'Debug Endpoints',
        description: 'Development debugging tools',
        examples: [
          'GET /api/_debug: General debug information',
          'GET /api/_debug/validate: Validation report',
          'GET /api/_debug/entity/:name: Entity inspection',
          'GET /api/_debug/performance: Performance analysis'
        ]
      }
    ];

    return {
      errorCodes,
      tutorials,
      quickReference
    };
  }
}