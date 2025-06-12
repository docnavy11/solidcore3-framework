/**
 * Truth file testing utilities
 * 
 * Provides utilities for testing app.truth.ts files:
 * - Validation testing
 * - Schema compliance
 * - Entity relationship validation
 * - Permission expression testing
 */

import type { AppDefinition } from '../../core/types/index.ts';
import type {
  TruthTestCase,
  TruthValidationResult,
  TestResult
} from '../types/test-types.ts';
import { TestRunner } from '../core/test-runner.ts';
import {
  assertValidApp,
  assertHasEntities,
  assertEntityHasFields,
  assertValidationPassed,
  assertValidationFailed,
  assertValidationErrors
} from '../core/assertions.ts';

/**
 * Truth file tester class
 */
export class TruthTester extends TestRunner {
  private validator?: (app: AppDefinition) => Promise<TruthValidationResult>;

  constructor(
    validator?: (app: AppDefinition) => Promise<TruthValidationResult>
  ) {
    super();
    this.validator = validator || this.defaultValidator;
  }

  /**
   * Test a truth file for validity
   */
  async testTruth(testCase: TruthTestCase): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const app = typeof testCase.app === 'function' ? testCase.app() : testCase.app;
      
      // Basic structural validation
      assertValidApp(app);
      
      // Run validation if validator provided
      if (this.validator) {
        const result = await this.validator(app);
        
        if (testCase.expectValid !== false) {
          assertValidationPassed(result);
        } else {
          assertValidationFailed(result);
        }
        
        // Check for expected errors
        if (testCase.expectedErrors) {
          assertValidationErrors(result, testCase.expectedErrors);
        }
      }

      const duration = performance.now() - startTime;
      return {
        name: testCase.name,
        success: true,
        duration,
        metadata: { app: app.name }
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        name: testCase.name,
        success: false,
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Test entity structure
   */
  async testEntity(
    app: AppDefinition,
    entityName: string,
    expectedFields: string[] = [],
    expectedBehaviors: string[] = []
  ): Promise<TestResult> {
    const startTime = performance.now();
    const testName = `Entity: ${entityName}`;

    try {
      // Check entity exists
      assertHasEntities(app, [entityName]);
      
      const entity = app.entities![entityName];
      
      // Check required fields
      if (expectedFields.length > 0) {
        assertEntityHasFields(app, entityName, expectedFields);
      }
      
      // Check behaviors
      if (expectedBehaviors.length > 0) {
        const behaviors = entity.behaviors || {};
        for (const behaviorName of expectedBehaviors) {
          if (!behaviors[behaviorName]) {
            throw new Error(`Entity ${entityName} should have behavior: ${behaviorName}`);
          }
        }
      }
      
      // Validate field types
      if (entity.fields) {
        for (const [fieldName, field] of Object.entries(entity.fields)) {
          this.validateFieldDefinition(entityName, fieldName, field);
        }
      }

      const duration = performance.now() - startTime;
      return {
        name: testName,
        success: true,
        duration,
        metadata: { entity: entityName, fieldCount: Object.keys(entity.fields || {}).length }
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        name: testName,
        success: false,
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Test permissions
   */
  async testPermissions(
    app: AppDefinition,
    entityName: string,
    expectedPermissions: string[] = ['create', 'read', 'update', 'delete']
  ): Promise<TestResult> {
    const startTime = performance.now();
    const testName = `Permissions: ${entityName}`;

    try {
      assertHasEntities(app, [entityName]);
      
      const entity = app.entities![entityName];
      const permissions = entity.permissions || {};
      
      for (const permission of expectedPermissions) {
        if (!permissions[permission]) {
          throw new Error(`Entity ${entityName} should have permission: ${permission}`);
        }
        
        // Validate permission expression syntax
        this.validatePermissionExpression(permissions[permission]);
      }

      const duration = performance.now() - startTime;
      return {
        name: testName,
        success: true,
        duration,
        metadata: { entity: entityName, permissions: Object.keys(permissions) }
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        name: testName,
        success: false,
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Test relationships between entities
   */
  async testRelationships(app: AppDefinition): Promise<TestResult> {
    const startTime = performance.now();
    const testName = 'Entity Relationships';

    try {
      if (!app.entities) {
        return {
          name: testName,
          success: true,
          duration: performance.now() - startTime,
          metadata: { message: 'No entities to validate' }
        };
      }

      const entityNames = Object.keys(app.entities);
      
      for (const [entityName, entity] of Object.entries(app.entities)) {
        if (!entity.fields) continue;
        
        for (const [fieldName, field] of Object.entries(entity.fields)) {
          // Check relation field references
          if (field.type === 'relation' && field.to) {
            if (!entityNames.includes(field.to)) {
              throw new Error(
                `Entity ${entityName}.${fieldName} references non-existent entity: ${field.to}`
              );
            }
          }
        }
      }

      const duration = performance.now() - startTime;
      return {
        name: testName,
        success: true,
        duration,
        metadata: { entityCount: entityNames.length }
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        name: testName,
        success: false,
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Override test execution for truth-specific tests
   */
  protected async executeTest(testCase: any): Promise<void> {
    if ('app' in testCase) {
      const result = await this.testTruth(testCase as TruthTestCase);
      if (!result.success) {
        throw result.error || new Error('Truth test failed');
      }
    } else {
      throw new Error(`Unknown test case type for: ${testCase.name}`);
    }
  }

  /**
   * Default truth validator
   */
  private async defaultValidator(app: AppDefinition): Promise<TruthValidationResult> {
    const errors: Array<{ path: string; message: string; code?: string }> = [];
    const warnings: Array<{ path: string; message: string; code?: string }> = [];

    // Validate app structure
    if (!app.name || typeof app.name !== 'string') {
      errors.push({
        path: 'name',
        message: 'App must have a valid name',
        code: 'MISSING_NAME'
      });
    }

    // Validate entities
    if (app.entities) {
      for (const [entityName, entity] of Object.entries(app.entities)) {
        this.validateEntity(entityName, entity, errors, warnings);
      }
    }

    // Validate views
    if (app.views) {
      for (const [viewName, view] of Object.entries(app.views)) {
        this.validateView(viewName, view, app, errors, warnings);
      }
    }

    // Validate workflows
    if (app.workflows) {
      for (const [workflowName, workflow] of Object.entries(app.workflows)) {
        this.validateWorkflow(workflowName, workflow, errors, warnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate entity definition
   */
  private validateEntity(
    entityName: string,
    entity: any,
    errors: Array<{ path: string; message: string; code?: string }>,
    warnings: Array<{ path: string; message: string; code?: string }>
  ): void {
    const basePath = `entities.${entityName}`;

    // Validate fields
    if (!entity.fields || Object.keys(entity.fields).length === 0) {
      warnings.push({
        path: `${basePath}.fields`,
        message: `Entity ${entityName} has no fields defined`,
        code: 'NO_FIELDS'
      });
    } else {
      for (const [fieldName, field] of Object.entries(entity.fields)) {
        this.validateEntityField(basePath, fieldName, field, errors);
      }
    }

    // Validate permissions
    if (!entity.permissions) {
      warnings.push({
        path: `${basePath}.permissions`,
        message: `Entity ${entityName} has no permissions defined`,
        code: 'NO_PERMISSIONS'
      });
    } else {
      for (const [permission, expression] of Object.entries(entity.permissions)) {
        try {
          this.validatePermissionExpression(expression);
        } catch (error) {
          errors.push({
            path: `${basePath}.permissions.${permission}`,
            message: `Invalid permission expression: ${error instanceof Error ? error.message : error}`,
            code: 'INVALID_PERMISSION'
          });
        }
      }
    }
  }

  /**
   * Validate entity field
   */
  private validateEntityField(
    basePath: string,
    fieldName: string,
    field: any,
    errors: Array<{ path: string; message: string; code?: string }>
  ): void {
    const fieldPath = `${basePath}.fields.${fieldName}`;

    if (!field.type) {
      errors.push({
        path: fieldPath,
        message: `Field ${fieldName} must have a type`,
        code: 'MISSING_TYPE'
      });
    }

    // Validate field type
    const validTypes = ['string', 'number', 'boolean', 'date', 'enum', 'relation', 'json'];
    if (field.type && !validTypes.includes(field.type)) {
      errors.push({
        path: fieldPath,
        message: `Field ${fieldName} has invalid type: ${field.type}`,
        code: 'INVALID_TYPE'
      });
    }

    // Validate enum values
    if (field.type === 'enum' && !field.values) {
      errors.push({
        path: fieldPath,
        message: `Enum field ${fieldName} must have values`,
        code: 'MISSING_ENUM_VALUES'
      });
    }

    // Validate relation target
    if (field.type === 'relation' && !field.to) {
      errors.push({
        path: fieldPath,
        message: `Relation field ${fieldName} must specify target entity`,
        code: 'MISSING_RELATION_TARGET'
      });
    }
  }

  /**
   * Validate view definition
   */
  private validateView(
    viewName: string,
    view: any,
    app: AppDefinition,
    errors: Array<{ path: string; message: string; code?: string }>,
    warnings: Array<{ path: string; message: string; code?: string }>
  ): void {
    const basePath = `views.${viewName}`;

    if (!view.route) {
      errors.push({
        path: basePath,
        message: `View ${viewName} must have a route`,
        code: 'MISSING_ROUTE'
      });
    }

    // Validate data source references valid entities
    if (view.data && typeof view.data === 'string') {
      const entityRefs = view.data.match(/\b[A-Z][a-zA-Z]*\b/g) || [];
      for (const entityRef of entityRefs) {
        if (app.entities && !app.entities[entityRef]) {
          errors.push({
            path: basePath,
            message: `View ${viewName} references non-existent entity: ${entityRef}`,
            code: 'INVALID_ENTITY_REFERENCE'
          });
        }
      }
    }
  }

  /**
   * Validate workflow definition
   */
  private validateWorkflow(
    workflowName: string,
    workflow: any,
    errors: Array<{ path: string; message: string; code?: string }>,
    warnings: Array<{ path: string; message: string; code?: string }>
  ): void {
    const basePath = `workflows.${workflowName}`;

    if (!workflow.trigger) {
      errors.push({
        path: basePath,
        message: `Workflow ${workflowName} must have a trigger`,
        code: 'MISSING_TRIGGER'
      });
    }

    if (!workflow.actions || !Array.isArray(workflow.actions)) {
      errors.push({
        path: basePath,
        message: `Workflow ${workflowName} must have actions array`,
        code: 'MISSING_ACTIONS'
      });
    }
  }

  /**
   * Validate field definition
   */
  private validateFieldDefinition(entityName: string, fieldName: string, field: any): void {
    if (!field || typeof field !== 'object') {
      throw new Error(`Field ${entityName}.${fieldName} must be an object`);
    }

    if (!field.type) {
      throw new Error(`Field ${entityName}.${fieldName} must have a type`);
    }

    // Type-specific validation
    if (field.type === 'enum' && !field.values) {
      throw new Error(`Enum field ${entityName}.${fieldName} must have values`);
    }

    if (field.type === 'relation' && !field.to) {
      throw new Error(`Relation field ${entityName}.${fieldName} must specify target entity`);
    }
  }

  /**
   * Validate permission expression
   */
  private validatePermissionExpression(expression: any): void {
    if (typeof expression !== 'string') {
      throw new Error('Permission expression must be a string');
    }

    // Basic syntax validation - could be enhanced with a proper parser
    const validTokens = /^[a-zA-Z_.&|!()"\s==!=<>]+$/;
    if (!validTokens.test(expression)) {
      throw new Error('Permission expression contains invalid characters');
    }

    // Check for balanced parentheses
    let depth = 0;
    for (const char of expression) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (depth < 0) {
        throw new Error('Permission expression has unbalanced parentheses');
      }
    }
    if (depth !== 0) {
      throw new Error('Permission expression has unbalanced parentheses');
    }
  }
}

/**
 * Create a truth tester with default validator
 */
export function createTruthTester(): TruthTester {
  return new TruthTester();
}

/**
 * Quick utility to test a truth file
 */
export async function testTruthFile(
  app: AppDefinition,
  options: {
    expectValid?: boolean;
    expectedErrors?: string[];
    expectedWarnings?: string[];
  } = {}
): Promise<TruthValidationResult> {
  const tester = createTruthTester();
  
  const testCase: TruthTestCase = {
    name: `Test ${app.name}`,
    app,
    ...options
  };

  const result = await tester.testTruth(testCase);
  
  if (!result.success && result.error) {
    throw result.error;
  }

  // Return validation result if available
  return {
    isValid: result.success,
    errors: result.success ? [] : [{ path: 'app', message: result.error?.message || 'Unknown error' }],
    warnings: []
  };
}