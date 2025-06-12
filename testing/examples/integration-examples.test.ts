/**
 * Integration testing examples using Deno's built-in test runner
 */

import { assertEquals, assertExists } from '@std/assert';
import { 
  IntegrationTester, 
  createTestApp, 
  createComplexTestApp,
  createTestUsers,
  generateTestData
} from '../index.ts';

const testApp = createTestApp();
const complexApp = createComplexTestApp();
const users = createTestUsers();

Deno.test('User Journey Integration Tests', async (t) => {
  const tester = new IntegrationTester(testApp);

  await t.step('complete task management journey', async () => {
    const result = await tester.testUserJourney(
      'Task Management Journey',
      users.user1,
      [
        {
          name: 'Create new task',
          action: 'create',
          entity: 'Task',
          data: { 
            title: 'Journey Task', 
            description: 'Task for testing user journey',
            priority: 'medium' 
          },
          expectedResult: { status: 201 },
          validateResult: (result: any) => {
            return result.status === 201 && result.body?.id;
          }
        },
        {
          name: 'List all tasks',
          action: 'read',
          entity: 'Task',
          expectedResult: { status: 200 },
          validateResult: (result: any) => {
            return result.status === 200 && Array.isArray(result.body);
          }
        },
        {
          name: 'Update task status',
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
    
    assertEquals(result.success, true);
    assertEquals(result.metadata?.scenario, 'Task Management Journey');
    assertEquals(result.metadata?.stepsExecuted, 4);
  });

  await t.step('user registration and task creation journey', async () => {
    const result = await tester.testUserJourney(
      'New User Journey',
      users.user2,
      [
        {
          name: 'User login',
          action: 'login',
          expectedResult: { status: 200 }
        },
        {
          name: 'Create first task',
          action: 'create',
          entity: 'Task',
          data: { 
            title: 'My First Task',
            priority: 'high'
          },
          expectedResult: { status: 201 }
        },
        {
          name: 'View my tasks',
          action: 'read',
          entity: 'Task',
          expectedResult: { status: 200 }
        }
      ]
    );
    
    assertEquals(result.success, true);
  });
});

Deno.test('CRUD Integration Tests', async (t) => {
  const tester = new IntegrationTester(testApp);

  await t.step('full CRUD integration for all entities', async () => {
    const results = await tester.testFullCRUDIntegration(users.user1);
    
    // Should test CRUD for Task and User entities
    assertEquals(results.length, 2);
    
    // All CRUD tests should pass
    results.forEach(result => {
      assertEquals(result.success, true);
    });
    
    // Verify entity names
    const entityNames = results.map(r => r.metadata?.scenario?.split(' ')[3]);
    assertEquals(entityNames.includes('Task'), true);
    assertEquals(entityNames.includes('User'), true);
  });
});

Deno.test('Permission Integration Tests', async (t) => {
  const tester = new IntegrationTester(testApp);

  await t.step('permission integration across entities', async () => {
    const results = await tester.testPermissionIntegration();
    
    // Should test permissions for different user roles across entities
    assertExists(results);
    assertEquals(results.length > 0, true);
    
    // Check that we have tests for different user types
    const scenarios = results.map(r => r.name);
    const hasAdminTests = scenarios.some(s => s.includes('admin'));
    const hasUserTests = scenarios.some(s => s.includes('user'));
    const hasAnonymousTests = scenarios.some(s => s.includes('anonymous'));
    
    assertEquals(hasAdminTests, true);
    assertEquals(hasUserTests, true);
    assertEquals(hasAnonymousTests, true);
  });
});

Deno.test('Error Handling Integration Tests', async (t) => {
  const tester = new IntegrationTester(testApp);

  await t.step('error handling across the application', async () => {
    const results = await tester.testErrorHandlingIntegration();
    
    // Should test error scenarios for all entities
    assertEquals(results.length, 2); // Task and User entities
    
    // All error handling tests should pass
    results.forEach(result => {
      assertEquals(result.success, true);
    });
  });
});

Deno.test('Complex Integration Scenarios', async (t) => {
  const tester = new IntegrationTester(testApp);

  await t.step('project management workflow', async () => {
    const result = await tester.testIntegrationScenario({
      name: 'Project Management Workflow',
      scenario: 'Create user, create tasks, manage workflow',
      steps: [
        {
          name: 'Create project manager user',
          action: 'api',
          params: {
            method: 'POST',
            path: '/api/users',
            body: {
              email: 'manager@example.com',
              name: 'Project Manager',
              role: 'admin'
            },
            user: users.admin
          },
          expectedResult: { status: 201 },
          validate: (result: any) => {
            return result.status === 201 && result.body?.id;
          }
        },
        {
          name: 'Create high priority task',
          action: 'api',
          params: {
            method: 'POST',
            path: '/api/tasks',
            body: {
              title: 'Critical Bug Fix',
              description: 'Fix critical production bug',
              priority: 'high',
              createdBy: '{{Create project manager user.id}}'
            },
            user: users.admin
          },
          expectedResult: { status: 201 }
        },
        {
          name: 'Assign task to developer',
          action: 'api',
          params: {
            method: 'POST',
            path: '/api/tasks/{{Create high priority task.id}}/assign',
            body: {
              assigneeId: users.user1.id
            },
            user: users.admin
          },
          expectedResult: { status: 200 }
        },
        {
          name: 'Developer completes task',
          action: 'api',
          params: {
            method: 'POST',
            path: '/api/tasks/{{Create high priority task.id}}/complete',
            user: users.user1
          },
          expectedResult: { status: 200 }
        },
        {
          name: 'Verify task completion',
          action: 'api',
          params: {
            method: 'GET',
            path: '/api/tasks/{{Create high priority task.id}}',
            user: users.admin
          },
          expectedResult: { status: 200 },
          validate: (result: any) => {
            return result.body?.status === 'done';
          }
        }
      ]
    });
    
    assertEquals(result.success, true);
    assertEquals(result.metadata?.stepsExecuted, 5);
  });

  await t.step('multi-user collaboration scenario', async () => {
    const result = await tester.testIntegrationScenario({
      name: 'Multi-User Collaboration',
      scenario: 'Multiple users working on shared tasks',
      steps: [
        {
          name: 'User 1 creates task',
          action: 'api',
          params: {
            method: 'POST',
            path: '/api/tasks',
            body: {
              title: 'Shared Task',
              description: 'Task to be shared between users'
            },
            user: users.user1
          },
          expectedResult: { status: 201 }
        },
        {
          name: 'Admin assigns task to User 2',
          action: 'api',
          params: {
            method: 'POST',
            path: '/api/tasks/{{User 1 creates task.id}}/assign',
            body: {
              assigneeId: users.user2.id
            },
            user: users.admin
          },
          expectedResult: { status: 200 }
        },
        {
          name: 'User 2 views assigned task',
          action: 'api',
          params: {
            method: 'GET',
            path: '/api/tasks/{{User 1 creates task.id}}',
            user: users.user2
          },
          expectedResult: { status: 200 },
          validate: (result: any) => {
            return result.body?.assigneeId === users.user2.id;
          }
        },
        {
          name: 'User 2 updates task progress',
          action: 'api',
          params: {
            method: 'PUT',
            path: '/api/tasks/{{User 1 creates task.id}}',
            body: {
              status: 'in_progress',
              description: 'Working on this task now'
            },
            user: users.user2
          },
          expectedResult: { status: 200 }
        }
      ]
    });
    
    assertEquals(result.success, true);
    assertEquals(result.metadata?.scenario, 'Multiple users working on shared tasks');
  });
});

Deno.test('Complex App Integration Tests', async (t) => {
  const tester = new IntegrationTester(complexApp);

  await t.step('complex organization workflow', async () => {
    const result = await tester.testIntegrationScenario({
      name: 'Organization Workflow',
      scenario: 'Full organization, project, and task lifecycle',
      setup: async () => {
        // Additional setup if needed
      },
      steps: [
        {
          name: 'Create organization',
          action: 'api',
          params: {
            method: 'POST',
            path: '/api/organizations',
            body: {
              name: 'Test Organization',
              domain: 'test-org.com',
              plan: 'pro'
            },
            user: users.admin
          },
          expectedResult: { status: 201 }
        },
        {
          name: 'Create project in organization',
          action: 'api',
          params: {
            method: 'POST',
            path: '/api/projects',
            body: {
              name: 'Test Project',
              description: 'A test project for integration testing',
              organizationId: '{{Create organization.id}}',
              ownerId: users.user1.id
            },
            user: users.user1
          },
          expectedResult: { status: 201 }
        },
        {
          name: 'Create multiple tasks in project',
          action: 'custom',
          params: {
            fn: async (context: Map<string, any>, tester: IntegrationTester) => {
              const projectId = context.get('Create project in organization')?.id;
              const taskResults = [];
              
              for (let i = 1; i <= 3; i++) {
                const taskResult = await tester.getContext()?.server?.request({
                  method: 'POST',
                  path: '/api/tasks',
                  headers: {},
                  body: {
                    title: `Task ${i}`,
                    description: `Test task number ${i}`,
                    projectId,
                    priority: i === 1 ? 'high' : 'medium'
                  },
                  user: users.user1
                });
                taskResults.push(taskResult);
              }
              
              return { tasksCreated: taskResults?.length || 0 };
            }
          },
          validate: (result: any) => {
            return result.tasksCreated === 3;
          }
        }
      ]
    });
    
    assertEquals(result.success, true);
  });
});

Deno.test('Database Integration Tests', async (t) => {
  const tester = new IntegrationTester(testApp);

  await t.step('database operations integration', async () => {
    const result = await tester.testIntegrationScenario({
      name: 'Database Integration',
      scenario: 'Test database operations with API',
      steps: [
        {
          name: 'Create test data',
          action: 'database',
          params: {
            sql: 'INSERT INTO tasks (id, title, status) VALUES (?, ?, ?)',
            params: ['test-db-1', 'Database Test Task', 'todo']
          }
        },
        {
          name: 'Verify data via API',
          action: 'api',
          params: {
            method: 'GET',
            path: '/api/tasks/test-db-1',
            user: users.user1
          },
          expectedResult: { status: 200 },
          validate: (result: any) => {
            return result.body?.title === 'Database Test Task';
          }
        },
        {
          name: 'Update via API',
          action: 'api',
          params: {
            method: 'PUT',
            path: '/api/tasks/test-db-1',
            body: { status: 'done' },
            user: users.user1
          },
          expectedResult: { status: 200 }
        },
        {
          name: 'Verify update in database',
          action: 'database',
          params: {
            sql: 'SELECT status FROM tasks WHERE id = ?',
            params: ['test-db-1']
          },
          validate: (result: any) => {
            return result.rows?.[0]?.status === 'done';
          }
        }
      ]
    });
    
    assertEquals(result.success, true);
  });
});

Deno.test('Event-Driven Integration Tests', async (t) => {
  const tester = new IntegrationTester(testApp);

  await t.step('workflow event integration', async () => {
    const result = await tester.testIntegrationScenario({
      name: 'Event-Driven Workflow',
      scenario: 'Test event emission and workflow execution',
      steps: [
        {
          name: 'Create task that will trigger events',
          action: 'api',
          params: {
            method: 'POST',
            path: '/api/tasks',
            body: {
              title: 'Event Test Task',
              status: 'todo'
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
            path: '/api/tasks/{{Create task that will trigger events.id}}/complete',
            user: users.user1
          },
          expectedResult: { status: 200 }
        },
        {
          name: 'Verify workflow effects',
          action: 'event',
          params: {
            event: 'task.completed',
            expectedHandlers: ['onTaskCompleted'],
            expectedSideEffects: [
              { type: 'notification', data: { type: 'task_completed' } }
            ]
          }
        }
      ]
    });
    
    assertEquals(result.success, true);
  });
});