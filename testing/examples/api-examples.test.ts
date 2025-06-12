/**
 * API testing examples using Deno's built-in test runner
 */

import { assertEquals, assertExists } from '@std/assert';
import { 
  APITester, 
  createTestApp, 
  createTestUsers,
  createMockUser,
  createMockAdmin,
  assertResponseStatus,
  assertResponseHeader,
  assertResponseHasFields
} from '../index.ts';

const testApp = createTestApp();
const users = createTestUsers();

Deno.test('API Endpoint Tests', async (t) => {
  const tester = new APITester(testApp);
  
  await t.step('setup API tester', async () => {
    await tester.setup();
  });

  await t.step('authenticated user can create task', async () => {
    const result = await tester.testAPI({
      name: 'Create task as authenticated user',
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
    
    assertEquals(result.success, true);
    assertEquals(result.metadata?.status, 201);
    assertEquals(result.metadata?.user, 'user');
  });

  await t.step('unauthenticated user cannot create task', async () => {
    const result = await tester.testAPI({
      name: 'Create task without authentication',
      method: 'POST',
      path: '/api/tasks',
      body: { title: 'Test Task' },
      user: null,
      expectedStatus: 401
    });
    
    assertEquals(result.success, true);
    assertEquals(result.metadata?.status, 401);
    assertEquals(result.metadata?.user, 'anonymous');
  });

  await t.step('user can read tasks', async () => {
    const result = await tester.testAPI({
      name: 'List tasks',
      method: 'GET',
      path: '/api/tasks',
      user: users.user1,
      expectedStatus: 200,
      validateResponse: (response) => {
        return Array.isArray(response.body);
      }
    });
    
    assertEquals(result.success, true);
    assertEquals(result.metadata?.method, 'GET');
  });

  await t.step('user can get specific task', async () => {
    const result = await tester.testAPI({
      name: 'Get specific task',
      method: 'GET',
      path: '/api/tasks/1',
      user: users.user1,
      expectedStatus: 200,
      validateResponse: (response) => {
        const body = response.body as any;
        return body && body.id === '1';
      }
    });
    
    assertEquals(result.success, true);
  });

  await t.step('teardown API tester', async () => {
    await tester.teardown();
  });
});

Deno.test('CRUD Operations Tests', async (t) => {
  const tester = new APITester(testApp);
  
  await t.step('setup', async () => {
    await tester.setup();
  });

  await t.step('complete CRUD cycle for Task entity', async () => {
    const results = await tester.testEntityCRUD('Task', users.user1, {
      title: 'CRUD Test Task',
      description: 'Testing CRUD operations',
      priority: 'high'
    });
    
    assertEquals(results.length, 5); // CREATE, READ, LIST, UPDATE, DELETE
    
    // All operations should succeed
    results.forEach(result => {
      assertEquals(result.success, true);
    });
    
    // Check operation types
    const operations = results.map(r => r.name);
    assertEquals(operations.includes('CREATE Task'), true);
    assertEquals(operations.includes('READ Task'), true);
    assertEquals(operations.includes('LIST Task'), true);
    assertEquals(operations.includes('UPDATE Task'), true);
    assertEquals(operations.includes('DELETE Task'), true);
  });

  await t.step('teardown', async () => {
    await tester.teardown();
  });
});

Deno.test('Permission Tests', async (t) => {
  const tester = new APITester(testApp);
  
  await t.step('setup', async () => {
    await tester.setup();
  });

  await t.step('test various permission scenarios', async () => {
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
        description: 'Regular user cannot delete others tasks'
      },
      {
        user: null,
        action: 'read',
        expectedStatus: 401,
        description: 'Unauthenticated user cannot read tasks'
      },
      {
        user: users.user1,
        action: 'create',
        expectedStatus: 201,
        description: 'Authenticated user can create tasks'
      }
    ]);
    
    assertEquals(results.length, 4);
    
    // All permission tests should pass
    results.forEach(result => {
      assertEquals(result.success, true);
    });
  });

  await t.step('teardown', async () => {
    await tester.teardown();
  });
});

Deno.test('Authentication Tests', async (t) => {
  const tester = new APITester(testApp);
  
  await t.step('setup', async () => {
    await tester.setup();
  });

  await t.step('test authentication states', async () => {
    const results = await tester.testAuthentication('/api/tasks', 'GET');
    
    assertEquals(results.length, 4);
    
    // Check that unauthenticated access fails
    const unauthResult = results.find(r => r.name === 'Unauthenticated access');
    assertEquals(unauthResult?.success, true);
    assertEquals(unauthResult?.metadata?.status, 401);
    
    // Check that invalid token fails
    const invalidTokenResult = results.find(r => r.name === 'Invalid token');
    assertEquals(invalidTokenResult?.success, true);
    assertEquals(invalidTokenResult?.metadata?.status, 401);
    
    // Check that valid user succeeds
    const validUserResult = results.find(r => r.name === 'Valid user token');
    assertEquals(validUserResult?.success, true);
    assertEquals(validUserResult?.metadata?.status, 200);
    
    // Check that admin user succeeds
    const adminResult = results.find(r => r.name === 'Admin user token');
    assertEquals(adminResult?.success, true);
    assertEquals(adminResult?.metadata?.status, 200);
  });

  await t.step('teardown', async () => {
    await tester.teardown();
  });
});

Deno.test('Validation Tests', async (t) => {
  const tester = new APITester(testApp);
  
  await t.step('setup', async () => {
    await tester.setup();
  });

  await t.step('test input validation', async () => {
    const results = await tester.testEntityValidation('Task', users.user1, [
      {
        name: 'Valid task data',
        data: {
          title: 'Valid Task',
          description: 'A valid task description',
          priority: 'medium'
        },
        expectedStatus: 201
      },
      {
        name: 'Missing required title',
        data: {
          description: 'Task without title',
          priority: 'low'
        },
        expectedStatus: 400,
        expectedErrors: ['Title is required']
      },
      {
        name: 'Invalid priority value',
        data: {
          title: 'Task with invalid priority',
          priority: 'invalid-priority'
        },
        expectedStatus: 400,
        expectedErrors: ['priority']
      },
      {
        name: 'Empty data',
        data: {},
        expectedStatus: 400,
        expectedErrors: ['Title is required']
      }
    ]);
    
    assertEquals(results.length, 4);
    
    // All validation tests should pass (including the ones that expect errors)
    results.forEach(result => {
      assertEquals(result.success, true);
    });
  });

  await t.step('teardown', async () => {
    await tester.teardown();
  });
});

Deno.test('Custom Response Assertions', async (t) => {
  const tester = new APITester(testApp);
  
  await t.step('setup', async () => {
    await tester.setup();
  });

  await t.step('test custom response assertions', async () => {
    const result = await tester.testAPI({
      name: 'Test custom assertions',
      method: 'GET',
      path: '/api/tasks',
      user: users.user1,
      expectedStatus: 200,
      expectedHeaders: {
        'content-type': 'application/json'
      },
      validateResponse: (response) => {
        // Use custom assertions
        assertResponseStatus(response, 200);
        assertResponseHeader(response, 'content-type', 'application/json');
        
        // Validate response structure
        assertExists(response.body);
        assertEquals(Array.isArray(response.body), true);
        
        return true;
      }
    });
    
    assertEquals(result.success, true);
  });

  await t.step('teardown', async () => {
    await tester.teardown();
  });
});

Deno.test('Error Handling Tests', async (t) => {
  const tester = new APITester(testApp);
  
  await t.step('setup', async () => {
    await tester.setup();
  });

  await t.step('test 404 responses', async () => {
    const result = await tester.testAPI({
      name: 'Get non-existent task',
      method: 'GET',
      path: '/api/tasks/non-existent-id',
      user: users.user1,
      expectedStatus: 404
    });
    
    assertEquals(result.success, true);
    assertEquals(result.metadata?.status, 404);
  });

  await t.step('test invalid routes', async () => {
    const result = await tester.testAPI({
      name: 'Invalid route',
      method: 'GET',
      path: '/api/invalid-endpoint',
      user: users.user1,
      expectedStatus: 404
    });
    
    assertEquals(result.success, true);
    assertEquals(result.metadata?.status, 404);
  });

  await t.step('teardown', async () => {
    await tester.teardown();
  });
});