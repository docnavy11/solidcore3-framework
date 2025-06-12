/**
 * Truth file testing examples using Deno's built-in test runner
 */

import { assertEquals, assertThrows } from '@std/assert';
import { 
  TruthTester, 
  createTestApp, 
  createMinimalTestApp,
  assertValidApp,
  assertHasEntities,
  assertEntityHasFields,
  assertValidationPassed,
  assertValidationFailed
} from '../index.ts';

const testApp = createTestApp();
const minimalApp = createMinimalTestApp();
const tester = new TruthTester();

Deno.test('Truth File Tests', async (t) => {
  
  await t.step('should validate a correct truth file', async () => {
    const result = await tester.testTruth({
      name: 'Valid app test',
      app: testApp,
      expectValid: true
    });
    
    assertEquals(result.success, true);
    assertEquals(result.name, 'Valid app test');
  });

  await t.step('should detect invalid truth file structure', async () => {
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
      expectValid: false
    });
    
    assertEquals(result.success, false);
  });

  await t.step('should validate entity structure', async () => {
    const result = await tester.testEntity(
      testApp,
      'Task',
      ['id', 'title', 'status'], // Expected fields
      ['complete', 'assign'] // Expected behaviors
    );
    
    assertEquals(result.success, true);
    assertEquals(result.metadata?.entity, 'Task');
  });

  await t.step('should validate entity permissions', async () => {
    const result = await tester.testPermissions(
      testApp,
      'Task',
      ['create', 'read', 'update', 'delete']
    );
    
    assertEquals(result.success, true);
    assertEquals(result.metadata?.entity, 'Task');
  });

  await t.step('should validate entity relationships', async () => {
    const result = await tester.testRelationships(testApp);
    assertEquals(result.success, true);
  });

  await t.step('should use custom assertions for app validation', () => {
    // These should not throw
    assertValidApp(testApp);
    assertHasEntities(testApp, ['Task', 'User']);
    assertEntityHasFields(testApp, 'Task', ['id', 'title']);
    
    // This should throw
    assertThrows(() => {
      assertHasEntities(testApp, ['NonExistentEntity']);
    });
  });

  await t.step('should handle minimal app structure', async () => {
    const result = await tester.testTruth({
      name: 'Minimal app test',
      app: minimalApp,
      expectValid: true
    });
    
    assertEquals(result.success, true);
  });
});

Deno.test('Truth Validation Edge Cases', async (t) => {
  
  await t.step('should handle app with no entities', async () => {
    const emptyApp = { name: 'EmptyApp' };
    
    const result = await tester.testTruth({
      name: 'Empty app test',
      app: emptyApp as any,
      expectValid: true // Empty apps can be valid
    });
    
    assertEquals(result.success, true);
  });

  await t.step('should validate complex entity relationships', async () => {
    const complexApp = {
      name: 'ComplexApp',
      entities: {
        User: {
          fields: {
            id: { type: 'string', auto: true },
            name: { type: 'string', required: true }
          }
        },
        Project: {
          fields: {
            id: { type: 'string', auto: true },
            name: { type: 'string', required: true },
            ownerId: { type: 'relation', to: 'User', required: true }
          }
        },
        Task: {
          fields: {
            id: { type: 'string', auto: true },
            title: { type: 'string', required: true },
            projectId: { type: 'relation', to: 'Project', required: true },
            assigneeId: { type: 'relation', to: 'User' }
          }
        }
      }
    };

    const result = await tester.testRelationships(complexApp as any);
    assertEquals(result.success, true);
  });

  await t.step('should detect broken relationships', async () => {
    const brokenApp = {
      name: 'BrokenApp',
      entities: {
        Task: {
          fields: {
            id: { type: 'string', auto: true },
            projectId: { type: 'relation', to: 'NonExistentProject' } // Broken relation
          }
        }
      }
    };

    const result = await tester.testRelationships(brokenApp as any);
    assertEquals(result.success, false);
  });

  await t.step('should validate permission expressions', async () => {
    const appWithPermissions = {
      name: 'PermissionApp',
      entities: {
        Task: {
          fields: {
            id: { type: 'string' },
            title: { type: 'string' }
          },
          permissions: {
            create: 'authenticated',
            read: 'authenticated',
            update: 'authenticated && (user.id == entity.createdBy || user.role == "admin")',
            delete: 'user.role == "admin"'
          }
        }
      }
    };

    const result = await tester.testPermissions(
      appWithPermissions as any,
      'Task',
      ['create', 'read', 'update', 'delete']
    );
    
    assertEquals(result.success, true);
  });
});