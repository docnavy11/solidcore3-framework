/**
 * Integration testing utilities
 * 
 * Provides utilities for testing full end-to-end scenarios:
 * - Multi-step user journeys
 * - Cross-component integration
 * - Database + API + UI testing
 * - Real-world usage scenarios
 */

import type { AppDefinition } from '../../core/types/index.ts';
import type {
  IntegrationTestCase,
  IntegrationStep,
  TestResult,
  MockUser
} from '../types/test-types.ts';
import { TestRunner } from '../core/test-runner.ts';
import { APITester } from '../api/api-tester.ts';
import { WorkflowTester } from '../workflows/workflow-tester.ts';
import { ValidationTester } from '../validation/validation-tester.ts';
import { MockDatabase, MockServer, MockAuthService, createMockUser, createMockAdmin } from '../core/mocks.ts';
import { assertEquals, assert } from '../core/assertions.ts';

/**
 * Integration tester class
 */
export class IntegrationTester extends TestRunner {
  private app: AppDefinition;
  private database: MockDatabase;
  private server: MockServer;
  private auth: MockAuthService;
  private apiTester: APITester;
  private workflowTester: WorkflowTester;
  private validationTester: ValidationTester;
  private scenarioContext: Map<string, unknown> = new Map();

  constructor(app: AppDefinition) {
    super();
    this.app = app;
    this.database = new MockDatabase();
    this.server = new MockServer();
    this.auth = new MockAuthService();
    this.apiTester = new APITester(app);
    this.workflowTester = new WorkflowTester(app);
    this.validationTester = new ValidationTester(app);
  }

  /**
   * Setup integration test environment
   */
  async setup(): Promise<void> {
    // Setup all components
    await this.server.start();
    await this.apiTester.setup();
    await this.workflowTester.setup();

    // Clear scenario context
    this.scenarioContext.clear();

    // Seed with test data
    await this.seedIntegrationData();
  }

  /**
   * Teardown integration test environment
   */
  async teardown(): Promise<void> {
    await this.server.stop();
    await this.apiTester.teardown();
    this.database.reset();
    this.auth.reset();
    this.scenarioContext.clear();
  }

  /**
   * Test an integration scenario
   */
  async testIntegrationScenario(testCase: IntegrationTestCase): Promise<TestResult> {
    const startTime = performance.now();

    try {
      await this.setup();

      // Run test case setup
      if (testCase.setup) {
        await testCase.setup();
      }

      // Execute each step in sequence
      const stepResults: Array<{ step: string; result: unknown; duration: number }> = [];
      
      for (const [index, step] of testCase.steps.entries()) {
        const stepStartTime = performance.now();
        const stepResult = await this.executeIntegrationStep(step, index);
        const stepDuration = performance.now() - stepStartTime;
        
        stepResults.push({
          step: step.name,
          result: stepResult,
          duration: stepDuration
        });

        // Store result in context for future steps
        this.scenarioContext.set(step.name, stepResult);
      }

      const duration = performance.now() - startTime;
      return {
        name: testCase.name,
        success: true,
        duration,
        metadata: {
          scenario: testCase.scenario,
          stepsExecuted: stepResults.length,
          totalSteps: testCase.steps.length,
          stepResults: stepResults.map(r => ({ step: r.step, duration: r.duration }))
        }
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        name: testCase.name,
        success: false,
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      };
    } finally {
      // Run test case teardown
      if (testCase.teardown) {
        try {
          await testCase.teardown();
        } catch (error) {
          console.warn('Integration test teardown failed:', error);
        }
      }
      
      await this.teardown();
    }
  }

  /**
   * Test user journey scenarios
   */
  async testUserJourney(
    journeyName: string,
    user: MockUser,
    steps: Array<{
      name: string;
      action: 'signup' | 'login' | 'create' | 'read' | 'update' | 'delete' | 'behavior';
      entity?: string;
      data?: Record<string, unknown>;
      behavior?: string;
      expectedResult?: unknown;
      validateResult?: (result: unknown) => boolean;
    }>
  ): Promise<TestResult> {
    const testCase: IntegrationTestCase = {
      name: `User Journey: ${journeyName}`,
      scenario: journeyName,
      steps: steps.map(step => ({
        name: step.name,
        action: 'api',
        params: {
          method: this.getMethodForAction(step.action),
          path: this.getPathForAction(step.action, step.entity, step.behavior),
          body: step.data,
          user: step.action === 'signup' ? null : user
        },
        expectedResult: step.expectedResult,
        validate: step.validateResult
      }))
    };

    return await this.testIntegrationScenario(testCase);
  }

  /**
   * Test CRUD operations across all entities
   */
  async testFullCRUDIntegration(user: MockUser): Promise<TestResult[]> {
    const results: TestResult[] = [];

    if (!this.app.entities) {
      return results;
    }

    for (const [entityName, entity] of Object.entries(this.app.entities)) {
      const testCase: IntegrationTestCase = {
        name: `Full CRUD: ${entityName}`,
        scenario: `CRUD operations for ${entityName}`,
        steps: [
          // Create
          {
            name: `Create ${entityName}`,
            action: 'api',
            params: {
              method: 'POST',
              path: `/api/${entityName.toLowerCase()}`,
              body: this.generateTestData(entityName, entity),
              user
            },
            expectedResult: { status: 201 },
            validate: (result: any) => result.status === 201 && !!result.body?.id
          },
          // Read (List)
          {
            name: `List ${entityName}`,
            action: 'api',
            params: {
              method: 'GET',
              path: `/api/${entityName.toLowerCase()}`,
              user
            },
            expectedResult: { status: 200 },
            validate: (result: any) => result.status === 200 && Array.isArray(result.body)
          },
          // Read (Single)
          {
            name: `Get ${entityName}`,
            action: 'api',
            params: {
              method: 'GET',
              path: `/api/${entityName.toLowerCase()}/{{Create ${entityName}.id}}`,
              user
            },
            expectedResult: { status: 200 },
            validate: (result: any) => result.status === 200 && !!result.body?.id
          },
          // Update
          {
            name: `Update ${entityName}`,
            action: 'api',
            params: {
              method: 'PUT',
              path: `/api/${entityName.toLowerCase()}/{{Create ${entityName}.id}}`,
              body: { updated: true },
              user
            },
            expectedResult: { status: 200 }
          },
          // Delete
          {
            name: `Delete ${entityName}`,
            action: 'api',
            params: {
              method: 'DELETE',
              path: `/api/${entityName.toLowerCase()}/{{Create ${entityName}.id}}`,
              user
            },
            expectedResult: { status: 204 }
          }
        ]
      };

      const result = await this.testIntegrationScenario(testCase);
      results.push(result);
    }

    return results;
  }

  /**
   * Test permission integration across entities
   */
  async testPermissionIntegration(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    if (!this.app.entities) {
      return results;
    }

    // Test with different user roles
    const users = [
      createMockUser({ role: 'user' }),
      createMockAdmin({ role: 'admin' }),
      null // Unauthenticated
    ];

    for (const user of users) {
      for (const [entityName, entity] of Object.entries(this.app.entities)) {
        const testCase: IntegrationTestCase = {
          name: `Permissions: ${entityName} - ${user?.role || 'anonymous'}`,
          scenario: `Permission testing for ${entityName}`,
          steps: [
            {
              name: `Create ${entityName} permission check`,
              action: 'api',
              params: {
                method: 'POST',
                path: `/api/${entityName.toLowerCase()}`,
                body: this.generateTestData(entityName, entity),
                user
              },
              expectedResult: { status: user ? (user.role === 'admin' || this.hasPermission(entity.permissions?.create, user) ? 201 : 403) : 401 }
            },
            {
              name: `Read ${entityName} permission check`,
              action: 'api',
              params: {
                method: 'GET',
                path: `/api/${entityName.toLowerCase()}`,
                user
              },
              expectedResult: { status: user ? (this.hasPermission(entity.permissions?.read, user) ? 200 : 403) : 401 }
            }
          ]
        };

        const result = await this.testIntegrationScenario(testCase);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Test workflow integration
   */
  async testWorkflowIntegration(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    if (!this.app.workflows || !this.app.entities) {
      return results;
    }

    const user = createMockUser();

    for (const [workflowName, workflow] of Object.entries(this.app.workflows)) {
      // Find entity that can trigger this workflow
      const triggeringEntity = this.findTriggeringEntity(workflow.trigger);
      
      if (triggeringEntity) {
        const testCase: IntegrationTestCase = {
          name: `Workflow Integration: ${workflowName}`,
          scenario: `Trigger workflow ${workflowName} via ${triggeringEntity}`,
          steps: [
            // Create entity that triggers workflow
            {
              name: `Create ${triggeringEntity} to trigger workflow`,
              action: 'api',
              params: {
                method: 'POST',
                path: `/api/${triggeringEntity.toLowerCase()}`,
                body: this.generateTestData(triggeringEntity, this.app.entities[triggeringEntity]),
                user
              },
              expectedResult: { status: 201 }
            },
            // Execute behavior that emits the trigger event
            {
              name: `Execute behavior to trigger ${workflowName}`,
              action: 'workflow',
              params: {
                workflow: workflowName,
                trigger: workflow.trigger,
                payload: { entityId: '{{Create ' + triggeringEntity + ' to trigger workflow.id}}' }
              }
            }
          ]
        };

        const result = await this.testIntegrationScenario(testCase);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Test error handling integration
   */
  async testErrorHandlingIntegration(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const user = createMockUser();

    if (!this.app.entities) {
      return results;
    }

    for (const [entityName, entity] of Object.entries(this.app.entities)) {
      const testCase: IntegrationTestCase = {
        name: `Error Handling: ${entityName}`,
        scenario: `Error scenarios for ${entityName}`,
        steps: [
          // Invalid data
          {
            name: `Create ${entityName} with invalid data`,
            action: 'api',
            params: {
              method: 'POST',
              path: `/api/${entityName.toLowerCase()}`,
              body: { invalid: 'data' },
              user
            },
            expectedResult: { status: 400 }
          },
          // Non-existent resource
          {
            name: `Get non-existent ${entityName}`,
            action: 'api',
            params: {
              method: 'GET',
              path: `/api/${entityName.toLowerCase()}/non-existent-id`,
              user
            },
            expectedResult: { status: 404 }
          },
          // Update non-existent resource
          {
            name: `Update non-existent ${entityName}`,
            action: 'api',
            params: {
              method: 'PUT',
              path: `/api/${entityName.toLowerCase()}/non-existent-id`,
              body: { title: 'Updated' },
              user
            },
            expectedResult: { status: 404 }
          }
        ]
      };

      const result = await this.testIntegrationScenario(testCase);
      results.push(result);
    }

    return results;
  }

  /**
   * Override test execution for integration-specific tests
   */
  protected async executeTest(testCase: any): Promise<void> {
    if ('scenario' in testCase && 'steps' in testCase) {
      const result = await this.testIntegrationScenario(testCase as IntegrationTestCase);
      if (!result.success) {
        throw result.error || new Error('Integration test failed');
      }
    } else {
      throw new Error(`Unknown test case type for: ${testCase.name}`);
    }
  }

  // Private helper methods

  /**
   * Execute a single integration step
   */
  private async executeIntegrationStep(step: IntegrationStep, stepIndex: number): Promise<unknown> {
    switch (step.action) {
      case 'api':
        return await this.executeAPIStep(step);
      case 'database':
        return await this.executeDatabaseStep(step);
      case 'event':
        return await this.executeEventStep(step);
      case 'custom':
        return await this.executeCustomStep(step);
      default:
        throw new Error(`Unknown step action: ${step.action}`);
    }
  }

  /**
   * Execute API step
   */
  private async executeAPIStep(step: IntegrationStep): Promise<unknown> {
    const params = step.params as any;
    
    // Resolve placeholders in params
    const resolvedParams = this.resolvePlaceholders(params);
    
    const response = await this.server.request({
      method: resolvedParams.method,
      path: resolvedParams.path,
      headers: resolvedParams.headers || {},
      body: resolvedParams.body,
      user: resolvedParams.user
    });

    // Validate result if specified
    if (step.validate && !await step.validate(response)) {
      throw new Error(`Step validation failed: ${step.name}`);
    }

    // Check expected result
    if (step.expectedResult) {
      const expected = step.expectedResult as any;
      if (expected.status && response.status !== expected.status) {
        throw new Error(`Expected status ${expected.status}, got ${response.status}`);
      }
    }

    return response;
  }

  /**
   * Execute database step
   */
  private async executeDatabaseStep(step: IntegrationStep): Promise<unknown> {
    const params = step.params as any;
    const resolvedParams = this.resolvePlaceholders(params);
    
    const result = await this.database.execute(resolvedParams.sql, resolvedParams.params);
    
    if (step.validate && !await step.validate(result)) {
      throw new Error(`Database step validation failed: ${step.name}`);
    }
    
    return result;
  }

  /**
   * Execute event step
   */
  private async executeEventStep(step: IntegrationStep): Promise<unknown> {
    const params = step.params as any;
    const resolvedParams = this.resolvePlaceholders(params);
    
    const result = await this.workflowTester.testEventHandling(
      resolvedParams.event,
      resolvedParams.data,
      resolvedParams.expectedHandlers,
      resolvedParams.expectedSideEffects
    );
    
    if (!result.success) {
      throw new Error(`Event step failed: ${step.name}`);
    }
    
    return result;
  }

  /**
   * Execute custom step
   */
  private async executeCustomStep(step: IntegrationStep): Promise<unknown> {
    const params = step.params as any;
    const resolvedParams = this.resolvePlaceholders(params);
    
    if (typeof resolvedParams.fn === 'function') {
      return await resolvedParams.fn(this.scenarioContext, this);
    }
    
    throw new Error(`Custom step must provide a function: ${step.name}`);
  }

  /**
   * Resolve placeholders in step parameters
   */
  private resolvePlaceholders(params: any): any {
    if (typeof params === 'string') {
      return this.resolvePlaceholderString(params);
    }
    
    if (Array.isArray(params)) {
      return params.map(item => this.resolvePlaceholders(item));
    }
    
    if (params && typeof params === 'object') {
      const resolved: any = {};
      for (const [key, value] of Object.entries(params)) {
        resolved[key] = this.resolvePlaceholders(value);
      }
      return resolved;
    }
    
    return params;
  }

  /**
   * Resolve placeholder string
   */
  private resolvePlaceholderString(str: string): string {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, placeholder) => {
      const keys = placeholder.split('.');
      let value: any = this.scenarioContext.get(keys[0]);
      
      for (let i = 1; i < keys.length && value !== undefined; i++) {
        value = value[keys[i]];
      }
      
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Seed integration test data
   */
  private async seedIntegrationData(): Promise<void> {
    // Create test tables for all entities
    if (this.app.entities) {
      for (const [entityName, entity] of Object.entries(this.app.entities)) {
        const tableName = entityName.toLowerCase();
        await this.database.execute(`CREATE TABLE IF NOT EXISTS ${tableName} (id TEXT PRIMARY KEY)`);
      }
    }

    // Add test users
    this.auth.addUser(createMockUser({ id: 'integration-user-1' }));
    this.auth.addUser(createMockAdmin({ id: 'integration-admin-1' }));
  }

  /**
   * Generate test data for entity
   */
  private generateTestData(entityName: string, entity: any): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    
    if (entity.fields) {
      for (const [fieldName, field] of Object.entries(entity.fields)) {
        if (field.auto || field.generated) continue;
        
        switch (field.type) {
          case 'string':
            data[fieldName] = `Test ${fieldName}`;
            break;
          case 'number':
            data[fieldName] = 42;
            break;
          case 'boolean':
            data[fieldName] = true;
            break;
          case 'date':
            data[fieldName] = new Date().toISOString();
            break;
          case 'enum':
            data[fieldName] = field.values?.[0] || 'default';
            break;
          default:
            data[fieldName] = `test-${fieldName}`;
        }
      }
    }
    
    return data;
  }

  /**
   * Check if user has permission
   */
  private hasPermission(permission: string | undefined, user: MockUser): boolean {
    if (!permission) return true;
    if (permission === 'true') return true;
    if (permission === 'authenticated') return !!user;
    if (permission === 'admin') return user.role === 'admin';
    return false;
  }

  /**
   * Get HTTP method for action
   */
  private getMethodForAction(action: string): string {
    switch (action) {
      case 'create': return 'POST';
      case 'read': return 'GET';
      case 'update': return 'PUT';
      case 'delete': return 'DELETE';
      case 'behavior': return 'POST';
      default: return 'GET';
    }
  }

  /**
   * Get API path for action
   */
  private getPathForAction(action: string, entity?: string, behavior?: string): string {
    if (!entity) return '/';
    
    const basePath = `/api/${entity.toLowerCase()}`;
    
    switch (action) {
      case 'create':
        return basePath;
      case 'read':
        return basePath;
      case 'update':
      case 'delete':
        return `${basePath}/:id`;
      case 'behavior':
        return behavior ? `${basePath}/:id/${behavior}` : basePath;
      default:
        return basePath;
    }
  }

  /**
   * Find entity that can trigger a workflow
   */
  private findTriggeringEntity(trigger: string): string | null {
    if (!this.app.entities) return null;
    
    for (const [entityName, entity] of Object.entries(this.app.entities)) {
      if (entity.behaviors) {
        for (const behavior of Object.values(entity.behaviors)) {
          if (behavior.emits === trigger) {
            return entityName;
          }
        }
      }
    }
    
    return null;
  }
}

/**
 * Create an integration tester for an app
 */
export function createIntegrationTester(app: AppDefinition): IntegrationTester {
  return new IntegrationTester(app);
}

/**
 * Quick utility to test an integration scenario
 */
export async function testIntegrationScenario(
  app: AppDefinition,
  testCase: IntegrationTestCase
): Promise<TestResult> {
  const tester = createIntegrationTester(app);
  return await tester.testIntegrationScenario(testCase);
}