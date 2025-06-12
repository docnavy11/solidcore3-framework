/**
 * Workflow and behavior testing utilities
 * 
 * Provides utilities for testing:
 * - Entity behaviors
 * - Workflow execution
 * - Event handling
 * - Side effects and integrations
 */

import type { AppDefinition } from '../../core/types/index.ts';
import type {
  WorkflowTestCase,
  TestResult,
  MockUser
} from '../types/test-types.ts';
import { TestRunner } from '../core/test-runner.ts';
import { MockDatabase, MockAuthService } from '../core/mocks.ts';
import { assertEquals, assert } from '../core/assertions.ts';

/**
 * Workflow tester class
 */
export class WorkflowTester extends TestRunner {
  private app: AppDefinition;
  private database: MockDatabase;
  private auth: MockAuthService;
  private eventLog: Array<{ type: string; data: unknown; timestamp: number }> = [];
  private sideEffects: Array<{ type: string; data: unknown }> = [];

  constructor(app: AppDefinition) {
    super();
    this.app = app;
    this.database = new MockDatabase();
    this.auth = new MockAuthService();
  }

  /**
   * Setup test environment
   */
  async setup(): Promise<void> {
    this.database.reset();
    this.auth.reset();
    this.eventLog = [];
    this.sideEffects = [];

    // Seed database with test data if needed
    await this.seedTestData();
  }

  /**
   * Test a workflow
   */
  async testWorkflow(testCase: WorkflowTestCase): Promise<TestResult> {
    const startTime = performance.now();

    try {
      await this.setup();

      // Find workflow definition
      const workflow = this.app.workflows?.[testCase.workflow];
      if (!workflow) {
        throw new Error(`Workflow not found: ${testCase.workflow}`);
      }

      // Setup mock dependencies
      if (testCase.mockDependencies) {
        this.setupMockDependencies(testCase.mockDependencies);
      }

      // Trigger the workflow
      await this.triggerWorkflow(testCase.workflow, testCase.trigger, testCase.payload);

      // Wait for async actions to complete
      await this.waitForAsyncActions();

      // Validate expected actions were executed
      if (testCase.expectedActions) {
        this.validateExecutedActions(testCase.expectedActions);
      }

      // Validate expected side effects
      if (testCase.expectedSideEffects) {
        this.validateSideEffects(testCase.expectedSideEffects);
      }

      const duration = performance.now() - startTime;
      return {
        name: testCase.name,
        success: true,
        duration,
        metadata: {
          workflow: testCase.workflow,
          trigger: testCase.trigger,
          actionsExecuted: this.eventLog.length,
          sideEffects: this.sideEffects.length
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
    }
  }

  /**
   * Test entity behavior
   */
  async testEntityBehavior(
    entityName: string,
    behaviorName: string,
    entityData: Record<string, unknown>,
    user: MockUser,
    expectedChanges: Record<string, unknown> = {},
    expectedEvents: string[] = []
  ): Promise<TestResult> {
    const startTime = performance.now();
    const testName = `Behavior: ${entityName}.${behaviorName}`;

    try {
      await this.setup();

      // Get entity and behavior definitions
      const entity = this.app.entities?.[entityName];
      if (!entity) {
        throw new Error(`Entity not found: ${entityName}`);
      }

      const behavior = entity.behaviors?.[behaviorName];
      if (!behavior) {
        throw new Error(`Behavior not found: ${entityName}.${behaviorName}`);
      }

      // Create test entity in database
      const entityId = await this.createTestEntity(entityName, entityData);
      
      // Execute behavior
      const result = await this.executeBehavior(entityName, behaviorName, entityId, user, behavior);

      // Validate entity changes
      if (Object.keys(expectedChanges).length > 0) {
        const updatedEntity = await this.getEntity(entityName, entityId);
        this.validateEntityChanges(updatedEntity, expectedChanges);
      }

      // Validate emitted events
      if (expectedEvents.length > 0) {
        this.validateEmittedEvents(expectedEvents);
      }

      const duration = performance.now() - startTime;
      return {
        name: testName,
        success: true,
        duration,
        metadata: {
          entity: entityName,
          behavior: behaviorName,
          entityId,
          changesApplied: Object.keys(expectedChanges).length,
          eventsEmitted: this.eventLog.length
        }
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
   * Test event emission and handling
   */
  async testEventHandling(
    eventName: string,
    eventData: unknown,
    expectedHandlers: string[] = [],
    expectedSideEffects: Array<{ type: string; data: unknown }> = []
  ): Promise<TestResult> {
    const startTime = performance.now();
    const testName = `Event: ${eventName}`;

    try {
      await this.setup();

      // Emit event
      await this.emitEvent(eventName, eventData);

      // Wait for handlers to complete
      await this.waitForAsyncActions();

      // Validate expected handlers were called
      if (expectedHandlers.length > 0) {
        this.validateEventHandlers(eventName, expectedHandlers);
      }

      // Validate side effects
      if (expectedSideEffects.length > 0) {
        this.validateSideEffects(expectedSideEffects);
      }

      const duration = performance.now() - startTime;
      return {
        name: testName,
        success: true,
        duration,
        metadata: {
          event: eventName,
          handlersExecuted: this.eventLog.filter(log => log.type === 'handler').length,
          sideEffects: this.sideEffects.length
        }
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
   * Test behavior permissions
   */
  async testBehaviorPermissions(
    entityName: string,
    behaviorName: string,
    scenarios: Array<{
      user: MockUser | null;
      entity: Record<string, unknown>;
      expectedAllowed: boolean;
      description?: string;
    }>
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const scenario of scenarios) {
      const testName = scenario.description || 
        `${entityName}.${behaviorName} - ${scenario.user?.role || 'anonymous'}`;

      const startTime = performance.now();

      try {
        await this.setup();

        // Create test entity
        const entityId = await this.createTestEntity(entityName, scenario.entity);

        // Check permission
        const hasPermission = await this.checkBehaviorPermission(
          entityName,
          behaviorName,
          entityId,
          scenario.user
        );

        assertEquals(
          hasPermission,
          scenario.expectedAllowed,
          `Permission check failed for ${testName}`
        );

        const duration = performance.now() - startTime;
        results.push({
          name: testName,
          success: true,
          duration,
          metadata: {
            entity: entityName,
            behavior: behaviorName,
            user: scenario.user?.role || 'anonymous',
            allowed: hasPermission
          }
        });

      } catch (error) {
        const duration = performance.now() - startTime;
        results.push({
          name: testName,
          success: false,
          duration,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }

    return results;
  }

  /**
   * Test workflow rollback scenarios
   */
  async testWorkflowRollback(
    workflowName: string,
    trigger: string,
    payload: unknown,
    failurePoint: string,
    expectedRollbackActions: string[] = []
  ): Promise<TestResult> {
    const startTime = performance.now();
    const testName = `Workflow Rollback: ${workflowName}`;

    try {
      await this.setup();

      // Setup failure injection
      this.setupFailureInjection(failurePoint);

      // Trigger workflow (should fail)
      let failed = false;
      try {
        await this.triggerWorkflow(workflowName, trigger, payload);
      } catch (error) {
        failed = true;
      }

      assert(failed, 'Workflow should have failed at injection point');

      // Validate rollback actions were executed
      if (expectedRollbackActions.length > 0) {
        this.validateRollbackActions(expectedRollbackActions);
      }

      const duration = performance.now() - startTime;
      return {
        name: testName,
        success: true,
        duration,
        metadata: {
          workflow: workflowName,
          failurePoint,
          rollbackActions: expectedRollbackActions.length
        }
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
   * Override test execution for workflow-specific tests
   */
  protected async executeTest(testCase: any): Promise<void> {
    if ('workflow' in testCase && 'trigger' in testCase) {
      const result = await this.testWorkflow(testCase as WorkflowTestCase);
      if (!result.success) {
        throw result.error || new Error('Workflow test failed');
      }
    } else {
      throw new Error(`Unknown test case type for: ${testCase.name}`);
    }
  }

  // Private helper methods

  /**
   * Seed test data
   */
  private async seedTestData(): Promise<void> {
    // Add default test users
    this.auth.addUser({
      id: 'test-user-1',
      email: 'user@test.com',
      name: 'Test User',
      role: 'user',
      isActive: true
    });

    this.auth.addUser({
      id: 'admin-1',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'admin',
      isActive: true
    });
  }

  /**
   * Setup mock dependencies
   */
  private setupMockDependencies(dependencies: Record<string, unknown>): void {
    // Setup external service mocks, API responses, etc.
    for (const [name, config] of Object.entries(dependencies)) {
      this.sideEffects.push({
        type: 'mock_setup',
        data: { service: name, config }
      });
    }
  }

  /**
   * Trigger a workflow
   */
  private async triggerWorkflow(workflowName: string, trigger: string, payload: unknown): Promise<void> {
    this.eventLog.push({
      type: 'workflow_trigger',
      data: { workflow: workflowName, trigger, payload },
      timestamp: Date.now()
    });

    const workflow = this.app.workflows?.[workflowName];
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowName}`);
    }

    // Check if trigger matches
    if (workflow.trigger !== trigger) {
      return; // Workflow not triggered
    }

    // Execute workflow actions
    if (workflow.actions) {
      for (const action of workflow.actions) {
        await this.executeWorkflowAction(action, payload);
      }
    }
  }

  /**
   * Execute a workflow action
   */
  private async executeWorkflowAction(action: string | Record<string, unknown>, payload: unknown): Promise<void> {
    const actionName = typeof action === 'string' ? action : action.type as string;
    
    this.eventLog.push({
      type: 'action_executed',
      data: { action: actionName, payload },
      timestamp: Date.now()
    });

    // Simulate action execution
    switch (actionName) {
      case 'notify':
        this.sideEffects.push({ type: 'notification', data: payload });
        break;
      case 'updateStats':
        this.sideEffects.push({ type: 'stats_update', data: payload });
        break;
      case 'sendEmail':
        this.sideEffects.push({ type: 'email', data: payload });
        break;
      case 'callAPI':
        this.sideEffects.push({ type: 'api_call', data: payload });
        break;
      default:
        this.sideEffects.push({ type: 'custom_action', data: { action: actionName, payload } });
    }
  }

  /**
   * Create test entity
   */
  private async createTestEntity(entityName: string, entityData: Record<string, unknown>): Promise<string> {
    const entityId = `test_${entityName.toLowerCase()}_${Date.now()}`;
    const tableName = entityName.toLowerCase();
    
    // Create table if not exists
    await this.database.execute(`CREATE TABLE IF NOT EXISTS ${tableName} (id TEXT PRIMARY KEY)`);
    
    // Insert entity
    const insertSQL = `INSERT INTO ${tableName} (id, data) VALUES (?, ?)`;
    await this.database.execute(insertSQL, [entityId, JSON.stringify(entityData)]);
    
    return entityId;
  }

  /**
   * Execute entity behavior
   */
  private async executeBehavior(
    entityName: string,
    behaviorName: string,
    entityId: string,
    user: MockUser,
    behavior: any
  ): Promise<any> {
    this.eventLog.push({
      type: 'behavior_executed',
      data: { entity: entityName, behavior: behaviorName, entityId, user: user.id },
      timestamp: Date.now()
    });

    // Check permissions
    const hasPermission = await this.checkBehaviorPermission(entityName, behaviorName, entityId, user);
    if (!hasPermission) {
      throw new Error(`Permission denied for ${entityName}.${behaviorName}`);
    }

    // Apply behavior modifications
    if (behavior.modifies) {
      await this.applyEntityModifications(entityName, entityId, behavior.modifies);
    }

    // Emit events
    if (behavior.emits) {
      const eventName = typeof behavior.emits === 'string' ? behavior.emits : behavior.emits.event;
      const eventData = { entityName, entityId, behavior: behaviorName, user: user.id };
      await this.emitEvent(eventName, eventData);
    }

    return { success: true };
  }

  /**
   * Apply entity modifications
   */
  private async applyEntityModifications(
    entityName: string,
    entityId: string,
    modifications: Record<string, unknown>
  ): Promise<void> {
    const tableName = entityName.toLowerCase();
    
    for (const [field, value] of Object.entries(modifications)) {
      const updateSQL = `UPDATE ${tableName} SET ${field} = ? WHERE id = ?`;
      await this.database.execute(updateSQL, [value, entityId]);
    }

    this.eventLog.push({
      type: 'entity_modified',
      data: { entity: entityName, entityId, modifications },
      timestamp: Date.now()
    });
  }

  /**
   * Emit event
   */
  private async emitEvent(eventName: string, eventData: unknown): Promise<void> {
    this.eventLog.push({
      type: 'event_emitted',
      data: { event: eventName, data: eventData },
      timestamp: Date.now()
    });

    // Find and execute event handlers (workflows)
    if (this.app.workflows) {
      for (const [workflowName, workflow] of Object.entries(this.app.workflows)) {
        if (workflow.trigger === eventName) {
          await this.triggerWorkflow(workflowName, eventName, eventData);
        }
      }
    }
  }

  /**
   * Get entity from database
   */
  private async getEntity(entityName: string, entityId: string): Promise<Record<string, unknown>> {
    const tableName = entityName.toLowerCase();
    const result = await this.database.execute(
      `SELECT * FROM ${tableName} WHERE id = ?`,
      [entityId]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Entity not found: ${entityName}#${entityId}`);
    }
    
    return result.rows[0] as Record<string, unknown>;
  }

  /**
   * Check behavior permission
   */
  private async checkBehaviorPermission(
    entityName: string,
    behaviorName: string,
    entityId: string,
    user: MockUser | null
  ): Promise<boolean> {
    if (!user) return false;
    
    const entity = this.app.entities?.[entityName];
    const behavior = entity?.behaviors?.[behaviorName];
    
    if (!behavior || !behavior.permission) {
      return true; // No permission defined = allow
    }

    // Get entity data for permission check
    const entityData = await this.getEntity(entityName, entityId);
    
    return this.auth.authorize(user, behavior.permission, entityData);
  }

  /**
   * Wait for async actions to complete
   */
  private async waitForAsyncActions(): Promise<void> {
    // In a real implementation, this would wait for actual async operations
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Validate executed actions
   */
  private validateExecutedActions(expectedActions: string[]): void {
    const executedActions = this.eventLog
      .filter(log => log.type === 'action_executed')
      .map(log => (log.data as any).action);

    for (const expectedAction of expectedActions) {
      assert(
        executedActions.includes(expectedAction),
        `Expected action not executed: ${expectedAction}`
      );
    }
  }

  /**
   * Validate side effects
   */
  private validateSideEffects(expectedSideEffects: Array<{ type: string; data: unknown }>): void {
    for (const expectedEffect of expectedSideEffects) {
      const foundEffect = this.sideEffects.find(effect => 
        effect.type === expectedEffect.type &&
        JSON.stringify(effect.data) === JSON.stringify(expectedEffect.data)
      );

      assert(
        !!foundEffect,
        `Expected side effect not found: ${expectedEffect.type}`
      );
    }
  }

  /**
   * Validate entity changes
   */
  private validateEntityChanges(entity: Record<string, unknown>, expectedChanges: Record<string, unknown>): void {
    for (const [field, expectedValue] of Object.entries(expectedChanges)) {
      assertEquals(
        entity[field],
        expectedValue,
        `Entity field ${field} was not updated correctly`
      );
    }
  }

  /**
   * Validate emitted events
   */
  private validateEmittedEvents(expectedEvents: string[]): void {
    const emittedEvents = this.eventLog
      .filter(log => log.type === 'event_emitted')
      .map(log => (log.data as any).event);

    for (const expectedEvent of expectedEvents) {
      assert(
        emittedEvents.includes(expectedEvent),
        `Expected event not emitted: ${expectedEvent}`
      );
    }
  }

  /**
   * Validate event handlers
   */
  private validateEventHandlers(eventName: string, expectedHandlers: string[]): void {
    const handlerLogs = this.eventLog.filter(log => 
      log.type === 'workflow_trigger' && (log.data as any).trigger === eventName
    );

    for (const expectedHandler of expectedHandlers) {
      const foundHandler = handlerLogs.some(log => 
        (log.data as any).workflow === expectedHandler
      );

      assert(
        foundHandler,
        `Expected event handler not called: ${expectedHandler}`
      );
    }
  }

  /**
   * Setup failure injection
   */
  private setupFailureInjection(failurePoint: string): void {
    // Mark where failure should occur
    this.sideEffects.push({
      type: 'failure_injection',
      data: { point: failurePoint }
    });
  }

  /**
   * Validate rollback actions
   */
  private validateRollbackActions(expectedRollbackActions: string[]): void {
    const rollbackLogs = this.eventLog.filter(log => 
      log.type === 'rollback_action'
    );

    for (const expectedAction of expectedRollbackActions) {
      const foundAction = rollbackLogs.some(log => 
        (log.data as any).action === expectedAction
      );

      assert(
        foundAction,
        `Expected rollback action not executed: ${expectedAction}`
      );
    }
  }
}

/**
 * Create a workflow tester for an app
 */
export function createWorkflowTester(app: AppDefinition): WorkflowTester {
  return new WorkflowTester(app);
}

/**
 * Quick utility to test a workflow
 */
export async function testWorkflow(
  app: AppDefinition,
  testCase: WorkflowTestCase
): Promise<TestResult> {
  const tester = createWorkflowTester(app);
  return await tester.testWorkflow(testCase);
}