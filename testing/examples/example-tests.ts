/**
 * Comprehensive test examples for Solidcore3 framework
 * 
 * This file demonstrates how to use the testing framework for:
 * - Truth file validation
 * - Generator testing
 * - API endpoint testing
 * - Validation testing
 * - Workflow testing
 * - Integration testing
 * - Performance testing
 */

import {
  describe,
  runTests,
  TruthTester,
  GeneratorTester,
  APITester,
  ValidationTester,
  WorkflowTester,
  IntegrationTester,
  PerformanceTester,
  createTestApp,
  createComplexTestApp,
  createTestUsers,
  generateTestData,
  createTestConfig
} from '../index.ts';

/**
 * Truth file testing examples
 */
function createTruthTests() {
  return describe('Truth File Tests', (suite) => {
    const app = createTestApp();
    const tester = new TruthTester();

    suite.test('Valid truth file should pass validation', async () => {
      const result = await tester.testTruth({
        name: 'Valid app test',
        app,
        expectValid: true
      });
      
      console.log(`✅ Truth validation passed: ${result.name}`);
    });

    suite.test('Invalid truth file should fail validation', async () => {
      const invalidApp = {
        name: '', // Invalid: empty name
        entities: {
          Task: {
            fields: {
              title: { type: 'invalid-type' } // Invalid type
            }
          }
        }
      } as any;

      const result = await tester.testTruth({
        name: 'Invalid app test',
        app: invalidApp,
        expectValid: false,
        expectedErrors: ['MISSING_NAME', 'INVALID_TYPE']
      });
      
      console.log(`✅ Truth validation correctly failed: ${result.name}`);
    });

    suite.test('Entity structure validation', async () => {
      const result = await tester.testEntity(
        app,
        'Task',
        ['id', 'title', 'status'], // Expected fields
        ['complete', 'assign'] // Expected behaviors
      );
      
      console.log(`✅ Entity validation passed: ${result.name}`);
    });

    suite.test('Permission validation', async () => {
      const result = await tester.testPermissions(
        app,
        'Task',
        ['create', 'read', 'update', 'delete']
      );
      
      console.log(`✅ Permission validation passed: ${result.name}`);
    });
  }, 'Comprehensive truth file testing examples');
}

/**
 * Generator testing examples
 */
function createGeneratorTests() {
  return describe('Generator Tests', (suite) => {
    const app = createTestApp();
    
    // Mock generators for testing
    class MockAPIGenerator {
      constructor(private app: any) {}
      
      async generate() {
        return {
          routes: {
            '/api/tasks': {
              GET: 'listTasks',
              POST: 'createTask'
            },
            '/api/tasks/:id': {
              GET: 'getTask',
              PUT: 'updateTask',
              DELETE: 'deleteTask'
            }
          }
        };
      }
    }

    class MockUIGenerator {
      constructor(private app: any) {}
      
      async generate() {
        return {
          components: {
            TaskList: '<div>Task List Component</div>',
            TaskForm: '<form>Task Form</form>'
          },
          pages: {
            TaskListPage: '<div><TaskList /></div>',
            TaskDetailPage: '<div>Task Detail</div>'
          }
        };
      }
    }

    const tester = new GeneratorTester({
      api: MockAPIGenerator,
      ui: MockUIGenerator
    });

    suite.test('API generator should create correct routes', async () => {
      const result = await tester.testAPIGenerator(app, {
        expectedRoutes: ['/api/tasks', '/api/tasks/:id'],
        expectedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        validateHandlers: true
      });
      
      console.log(`✅ API generator test passed: ${result.name}`);
    });

    suite.test('UI generator should create components and pages', async () => {
      const result = await tester.testUIGenerator(app, {
        expectedComponents: ['TaskList', 'TaskForm'],
        expectedPages: ['TaskListPage', 'TaskDetailPage'],
        validateJSX: true
      });
      
      console.log(`✅ UI generator test passed: ${result.name}`);
    });

    suite.test('Generator pipeline integration', async () => {
      const results = await tester.testGeneratorPipeline(
        app,
        ['api', 'ui'],
        { validateIntegration: true }
      );
      
      console.log(`✅ Generator pipeline test passed: ${results.length} generators tested`);
    });
  }, 'Generator testing with mocked implementations');
}

/**
 * API testing examples
 */
function createAPITests() {
  return describe('API Tests', (suite) => {
    const app = createTestApp();
    const users = createTestUsers();
    const tester = new APITester(app);

    suite.setup(async () => {
      await tester.setup();
    });

    suite.teardown(async () => {
      await tester.teardown();
    });

    suite.test('Authenticated user can create task', async () => {
      const result = await tester.testAPI({
        name: 'Create task as user',
        method: 'POST',
        path: '/api/tasks',
        body: {
          title: 'Test Task',
          description: 'This is a test task',
          priority: 'medium'
        },
        user: users.user1,
        expectedStatus: 201,
        validateResponse: (response) => {
          const body = response.body as any;
          return body && body.id && body.title === 'Test Task';
        }
      });
      
      console.log(`✅ API create test passed: ${result.name}`);
    });

    suite.test('Unauthenticated user cannot create task', async () => {
      const result = await tester.testAPI({
        name: 'Create task without auth',
        method: 'POST',
        path: '/api/tasks',
        body: { title: 'Test Task' },
        user: null,
        expectedStatus: 401
      });
      
      console.log(`✅ API auth test passed: ${result.name}`);
    });

    suite.test('Complete CRUD operations for Task entity', async () => {
      const results = await tester.testEntityCRUD('Task', users.user1, {
        title: 'CRUD Test Task',
        priority: 'high'
      });
      
      console.log(`✅ CRUD tests passed: ${results.length} operations tested`);
    });

    suite.test('Permission scenarios for Task entity', async () => {
      const results = await tester.testEntityPermissions('Task', [
        {
          user: users.admin,
          action: 'delete',
          expectedStatus: 204,
          description: 'Admin can delete any task'
        },
        {
          user: users.user1,
          action: 'delete',
          expectedStatus: 403,
          description: 'User cannot delete others tasks'
        },
        {
          user: null,
          action: 'read',
          expectedStatus: 401,
          description: 'Unauthenticated cannot read tasks'
        }
      ]);
      
      console.log(`✅ Permission tests passed: ${results.length} scenarios tested`);
    });
  }, 'API endpoint testing with authentication and permissions');
}

/**
 * Validation testing examples
 */
function createValidationTests() {
  return describe('Validation Tests', (suite) => {
    const app = createTestApp();
    const tester = new ValidationTester(app);

    suite.test('Required field validation', async () => {
      const results = await tester.testRequiredFields('Task');
      console.log(`✅ Required field tests: ${results.length} tests run`);
    });

    suite.test('Type validation', async () => {
      const results = await tester.testTypeValidation('Task');
      console.log(`✅ Type validation tests: ${results.length} tests run`);
    });

    suite.test('Enum validation for status field', async () => {
      const results = await tester.testEnumValidation('Task', 'status');
      console.log(`✅ Enum validation tests: ${results.length} tests run`);
    });

    suite.test('Custom validation rules', async () => {
      const results = await tester.testCustomValidation('Task', [
        {
          name: 'Title length validation',
          validator: (value: any) => {
            if (typeof value !== 'string') return ['Title must be a string'];
            if (value.length < 3) return ['Title must be at least 3 characters'];
            if (value.length > 100) return ['Title must be less than 100 characters'];
            return true;
          },
          testCases: [
            { value: 'Hi', expectedValid: false, expectedErrors: ['Title must be at least 3 characters'] },
            { value: 'Valid title', expectedValid: true },
            { value: 'A'.repeat(101), expectedValid: false, expectedErrors: ['Title must be less than 100 characters'] }
          ]
        }
      ]);
      
      console.log(`✅ Custom validation tests: ${results.length} tests run`);
    });

    suite.test('Business rule validation', async () => {
      const results = await tester.testBusinessRules('Task', [
        {
          name: 'High priority tasks must have due date',
          rule: (entity: any) => {
            if (entity.priority === 'high' && !entity.dueDate) {
              return ['High priority tasks must have a due date'];
            }
            return true;
          },
          testCases: [
            {
              entity: { priority: 'high', dueDate: '2024-12-31' },
              expectedValid: true
            },
            {
              entity: { priority: 'high' },
              expectedValid: false,
              expectedErrors: ['High priority tasks must have a due date']
            },
            {
              entity: { priority: 'low' },
              expectedValid: true
            }
          ]
        }
      ]);
      
      console.log(`✅ Business rule tests: ${results.length} tests run`);
    });
  }, 'Validation testing for fields and business rules');
}

/**
 * Workflow testing examples
 */
function createWorkflowTests() {
  return describe('Workflow Tests', (suite) => {
    const app = createTestApp();
    const users = createTestUsers();
    const tester = new WorkflowTester(app);

    suite.test('Task completion workflow', async () => {
      const result = await tester.testEntityBehavior(
        'Task',
        'complete',
        {
          id: 'task-1',
          title: 'Test Task',
          status: 'in_progress',
          createdBy: users.user1.id
        },
        users.user1,
        { status: 'done' }, // Expected changes
        ['task.completed'] // Expected events
      );
      
      console.log(`✅ Workflow behavior test passed: ${result.name}`);
    });

    suite.test('Task assignment workflow', async () => {
      const result = await tester.testWorkflow({
        name: 'Task Assignment Workflow',
        workflow: 'onTaskAssigned',
        trigger: 'task.assigned',
        payload: {
          taskId: 'task-1',
          assigneeId: users.user2.id,
          assignedBy: users.user1.id
        },
        expectedActions: ['notifyAssignee', 'logAssignment']
      });
      
      console.log(`✅ Workflow test passed: ${result.name}`);
    });

    suite.test('Behavior permissions', async () => {
      const results = await tester.testBehaviorPermissions('Task', 'complete', [
        {
          user: users.user1,
          entity: { createdBy: users.user1.id },
          expectedAllowed: true,
          description: 'Creator can complete task'
        },
        {
          user: users.user2,
          entity: { createdBy: users.user1.id },
          expectedAllowed: false,
          description: 'Non-creator cannot complete task'
        },
        {
          user: users.admin,
          entity: { createdBy: users.user1.id },
          expectedAllowed: true,
          description: 'Admin can complete any task'
        }
      ]);
      
      console.log(`✅ Behavior permission tests: ${results.length} scenarios tested`);
    });

    suite.test('Event handling', async () => {
      const result = await tester.testEventHandling(
        'task.completed',
        { taskId: 'task-1', userId: users.user1.id },
        ['onTaskCompleted'], // Expected handlers
        [
          { type: 'notification', data: { type: 'task_completed' } },
          { type: 'stats_update', data: { metric: 'tasks_completed' } }
        ] // Expected side effects
      );
      
      console.log(`✅ Event handling test passed: ${result.name}`);
    });
  }, 'Workflow and behavior testing');
}

/**
 * Integration testing examples
 */
function createIntegrationTests() {
  return describe('Integration Tests', (suite) => {
    const app = createTestApp();
    const users = createTestUsers();
    const tester = new IntegrationTester(app);

    suite.test('Complete user journey: Task management', async () => {
      const result = await tester.testUserJourney(
        'Task Management Journey',
        users.user1,
        [
          {
            name: 'Create new task',
            action: 'create',
            entity: 'Task',
            data: { title: 'Journey Task', priority: 'medium' },
            expectedResult: { status: 201 }
          },
          {
            name: 'List all tasks',
            action: 'read',
            entity: 'Task',
            expectedResult: { status: 200 }
          },
          {
            name: 'Update task',
            action: 'update',
            entity: 'Task',
            data: { status: 'in_progress' },
            expectedResult: { status: 200 }
          },
          {
            name: 'Complete task',
            action: 'behavior',
            entity: 'Task',
            behavior: 'complete',
            expectedResult: { status: 200 }
          }
        ]
      );
      
      console.log(`✅ User journey test passed: ${result.name}`);
    });

    suite.test('Full CRUD integration for all entities', async () => {
      const results = await tester.testFullCRUDIntegration(users.user1);
      console.log(`✅ Full CRUD integration: ${results.length} entities tested`);
    });

    suite.test('Permission integration across entities', async () => {
      const results = await tester.testPermissionIntegration();
      console.log(`✅ Permission integration: ${results.length} tests run`);
    });

    suite.test('Error handling integration', async () => {
      const results = await tester.testErrorHandlingIntegration();
      console.log(`✅ Error handling integration: ${results.length} error scenarios tested`);
    });

    suite.test('Complex scenario: Project with tasks', async () => {
      const result = await tester.testIntegrationScenario({
        name: 'Project Management Scenario',
        scenario: 'Create project, add tasks, complete workflow',
        steps: [
          {
            name: 'Create project',
            action: 'api',
            params: {
              method: 'POST',
              path: '/api/projects',
              body: { name: 'Test Project', description: 'Integration test project' },
              user: users.user1
            },
            expectedResult: { status: 201 }
          },
          {
            name: 'Create task in project',
            action: 'api',
            params: {
              method: 'POST',
              path: '/api/tasks',
              body: {
                title: 'Project Task',
                projectId: '{{Create project.id}}'
              },
              user: users.user1
            },
            expectedResult: { status: 201 }
          },
          {
            name: 'Complete task to trigger workflow',
            action: 'api',
            params: {
              method: 'POST',
              path: '/api/tasks/{{Create task in project.id}}/complete',
              user: users.user1
            },
            expectedResult: { status: 200 }
          }
        ]
      });
      
      console.log(`✅ Complex integration scenario passed: ${result.name}`);
    });
  }, 'End-to-end integration testing');
}

/**
 * Performance testing examples
 */
function createPerformanceTests() {
  return describe('Performance Tests', (suite) => {
    const app = createComplexTestApp();
    const tester = new PerformanceTester(app);

    suite.test('API endpoint performance', async () => {
      const result = await tester.benchmarkAPI(
        '/api/tasks',
        'GET',
        undefined,
        1000, // iterations
        50 // max duration ms
      );
      
      console.log(`✅ API performance test: ${result.metadata?.averageDuration}ms avg`);
    });

    suite.test('Generator performance benchmark', async () => {
      class MockGenerator {
        constructor(private app: any) {}
        async generate() {
          // Simulate generation work
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          return { generated: true };
        }
      }

      const result = await tester.benchmarkGenerator(
        'API Generator',
        MockGenerator,
        100, // iterations
        500 // max duration ms
      );
      
      console.log(`✅ Generator performance test: ${result.metadata?.averageDuration}ms avg`);
    });

    suite.test('Memory usage test', async () => {
      const result = await tester.testMemoryUsage(
        'Large data processing',
        async () => {
          // Simulate memory-intensive operation
          const largeArray = new Array(10000).fill(0).map((_, i) => ({ id: i, data: `item-${i}` }));
          largeArray.forEach(item => item.data = item.data.toUpperCase());
        },
        50000000, // 50MB limit
        10 // iterations
      );
      
      console.log(`✅ Memory test passed: ${result.metadata?.memoryPeak} bytes peak`);
    });

    suite.test('Load testing', async () => {
      const results = await tester.loadTestAPI(
        [
          { path: '/api/tasks', method: 'GET', weight: 3 },
          { path: '/api/tasks', method: 'POST', body: { title: 'Load Test Task' }, weight: 1 },
          { path: '/api/users', method: 'GET', weight: 2 }
        ],
        {
          concurrentUsers: 10,
          duration: 5, // seconds
          rampUpTime: 1, // seconds
          maxResponseTime: 100 // ms
        }
      );
      
      console.log(`✅ Load testing completed: ${results.length} endpoints tested`);
    });

    suite.test('Generate performance report', async () => {
      // Run performance tests first
      await Promise.all([
        tester.benchmarkAPI('/api/tasks', 'GET'),
        tester.benchmarkAPI('/api/users', 'GET')
      ]);

      const report = tester.generatePerformanceReport();
      
      console.log('📊 Performance Report:');
      console.log(`   Total tests: ${report.summary.totalTests}`);
      console.log(`   Average response time: ${report.summary.averageResponseTime.toFixed(2)}ms`);
      console.log(`   Recommendations: ${report.recommendations.length}`);
      
      report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    });
  }, 'Performance and load testing');
}

/**
 * Run all example tests
 */
async function runAllExamples() {
  console.log('🚀 Running Solidcore3 Testing Framework Examples\n');

  const testSuites = [
    createTruthTests(),
    createGeneratorTests(),
    createAPITests(),
    createValidationTests(),
    createWorkflowTests(),
    createIntegrationTests(),
    createPerformanceTests()
  ];

  const config = createTestConfig({
    verbose: true,
    parallel: false,
    timeout: 30000
  });

  const results = await runTests(testSuites, config);
  
  // Print summary
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;

  console.log('\n📋 Example Tests Summary:');
  console.log(`   Total: ${total}`);
  console.log(`   Passed: ${passed} ✅`);
  console.log(`   Failed: ${failed} ❌`);
  console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   • ${r.name}: ${r.error?.message}`);
      });
  }

  console.log('\n🎉 All example tests completed!');
  console.log('\nThese examples show how to:');
  console.log('• Test truth file validation and structure');
  console.log('• Test code generators with mock implementations');
  console.log('• Test API endpoints with authentication and permissions');
  console.log('• Test field validation and business rules');
  console.log('• Test workflows and behaviors');
  console.log('• Test end-to-end integration scenarios');
  console.log('• Test performance and load scenarios');
  console.log('\nUse these patterns to test your own Solidcore3 applications!');
}

// Run examples if this file is executed directly
if (import.meta.main) {
  await runAllExamples();
}

export {
  createTruthTests,
  createGeneratorTests,
  createAPITests,
  createValidationTests,
  createWorkflowTests,
  createIntegrationTests,
  createPerformanceTests,
  runAllExamples
};