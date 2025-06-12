/**
 * Test utilities and helper functions
 */

import type { AppDefinition } from '../../core/types/index.ts';
import type { MockUser, TestConfig } from '../types/test-types.ts';

/**
 * Create a test app definition
 */
export function createTestApp(overrides: Partial<AppDefinition> = {}): AppDefinition {
  return {
    name: 'TestApp',
    entities: {
      Task: {
        fields: {
          id: { type: 'string', auto: true, unique: true },
          title: { type: 'string', required: true },
          description: { type: 'string' },
          status: { type: 'enum', values: ['todo', 'in_progress', 'done'], default: 'todo' },
          priority: { type: 'enum', values: ['low', 'medium', 'high'], default: 'medium' },
          assigneeId: { type: 'string' },
          createdBy: { type: 'string', required: true },
          createdAt: { type: 'date', auto: true },
          updatedAt: { type: 'date', auto: true }
        },
        behaviors: {
          complete: {
            modifies: { status: 'done', updatedAt: 'now' },
            emits: 'task.completed',
            permission: 'authenticated && (user.id == entity.createdBy || user.id == entity.assigneeId)'
          },
          assign: {
            modifies: { assigneeId: '$input.userId', updatedAt: 'now' },
            emits: 'task.assigned',
            permission: 'authenticated && user.role == "admin"'
          }
        },
        permissions: {
          create: 'authenticated',
          read: 'authenticated',
          update: 'authenticated && (user.id == entity.createdBy || user.id == entity.assigneeId)',
          delete: 'authenticated && (user.id == entity.createdBy || user.role == "admin")'
        }
      },
      User: {
        fields: {
          id: { type: 'string', auto: true, unique: true },
          email: { type: 'email', required: true, unique: true },
          name: { type: 'string', required: true },
          role: { type: 'enum', values: ['user', 'admin'], default: 'user' },
          isActive: { type: 'boolean', default: true },
          createdAt: { type: 'date', auto: true }
        },
        permissions: {
          create: 'true', // Public registration
          read: 'authenticated',
          update: 'authenticated && (user.id == entity.id || user.role == "admin")',
          delete: 'authenticated && user.role == "admin"'
        }
      }
    },
    views: {
      TaskList: {
        route: '/tasks',
        data: 'Task where status != "archived"',
        layout: 'table',
        fields: ['title', 'status', 'priority', 'assigneeId'],
        actions: ['create', 'edit', 'delete']
      },
      TaskDetail: {
        route: '/tasks/:id',
        data: 'Task by id',
        layout: 'detail',
        actions: ['edit', 'delete', 'complete', 'assign']
      }
    },
    workflows: {
      onTaskCompleted: {
        trigger: 'task.completed',
        actions: ['updateStats', 'notifyAssignee']
      },
      onTaskAssigned: {
        trigger: 'task.assigned',
        actions: ['notifyAssignee', 'logAssignment']
      }
    },
    ...overrides
  };
}

/**
 * Create a minimal test app
 */
export function createMinimalTestApp(): AppDefinition {
  return {
    name: 'MinimalApp',
    entities: {
      Item: {
        fields: {
          id: { type: 'string', auto: true },
          name: { type: 'string', required: true }
        },
        permissions: {
          create: 'true',
          read: 'true',
          update: 'true',
          delete: 'true'
        }
      }
    }
  };
}

/**
 * Create a complex test app for stress testing
 */
export function createComplexTestApp(): AppDefinition {
  return {
    name: 'ComplexApp',
    entities: {
      Organization: {
        fields: {
          id: { type: 'string', auto: true },
          name: { type: 'string', required: true },
          domain: { type: 'string', unique: true },
          plan: { type: 'enum', values: ['free', 'pro', 'enterprise'] },
          settings: { type: 'json' },
          createdAt: { type: 'date', auto: true }
        },
        permissions: {
          create: 'authenticated && user.role == "admin"',
          read: 'authenticated',
          update: 'authenticated && user.organizationId == entity.id',
          delete: 'authenticated && user.role == "admin"'
        }
      },
      Project: {
        fields: {
          id: { type: 'string', auto: true },
          name: { type: 'string', required: true },
          description: { type: 'text' },
          organizationId: { type: 'relation', to: 'Organization', required: true },
          ownerId: { type: 'relation', to: 'User', required: true },
          status: { type: 'enum', values: ['active', 'archived', 'completed'] },
          startDate: { type: 'date' },
          endDate: { type: 'date' },
          budget: { type: 'number', min: 0 },
          tags: { type: 'json' },
          createdAt: { type: 'date', auto: true },
          updatedAt: { type: 'date', auto: true }
        },
        behaviors: {
          archive: {
            modifies: { status: 'archived', updatedAt: 'now' },
            emits: 'project.archived',
            permission: 'authenticated && (user.id == entity.ownerId || user.role == "admin")'
          },
          complete: {
            modifies: { status: 'completed', endDate: 'now', updatedAt: 'now' },
            emits: 'project.completed',
            permission: 'authenticated && user.id == entity.ownerId'
          }
        },
        permissions: {
          create: 'authenticated',
          read: 'authenticated && user.organizationId == entity.organizationId',
          update: 'authenticated && (user.id == entity.ownerId || user.role == "admin")',
          delete: 'authenticated && user.role == "admin"'
        }
      },
      Task: {
        fields: {
          id: { type: 'string', auto: true },
          title: { type: 'string', required: true },
          description: { type: 'text' },
          projectId: { type: 'relation', to: 'Project', required: true },
          assigneeId: { type: 'relation', to: 'User' },
          createdBy: { type: 'relation', to: 'User', required: true },
          status: { type: 'enum', values: ['todo', 'in_progress', 'review', 'done'] },
          priority: { type: 'enum', values: ['low', 'medium', 'high', 'urgent'] },
          estimatedHours: { type: 'number', min: 0 },
          actualHours: { type: 'number', min: 0 },
          dueDate: { type: 'date' },
          labels: { type: 'json' },
          createdAt: { type: 'date', auto: true },
          updatedAt: { type: 'date', auto: true }
        },
        behaviors: {
          assign: {
            modifies: { assigneeId: '$input.userId', updatedAt: 'now' },
            emits: 'task.assigned',
            permission: 'authenticated && user.id == entity.createdBy'
          },
          start: {
            modifies: { status: 'in_progress', updatedAt: 'now' },
            emits: 'task.started',
            permission: 'authenticated && user.id == entity.assigneeId'
          },
          complete: {
            modifies: { status: 'done', updatedAt: 'now' },
            emits: 'task.completed',
            permission: 'authenticated && user.id == entity.assigneeId'
          }
        },
        permissions: {
          create: 'authenticated',
          read: 'authenticated',
          update: 'authenticated && (user.id == entity.createdBy || user.id == entity.assigneeId)',
          delete: 'authenticated && (user.id == entity.createdBy || user.role == "admin")'
        }
      },
      User: {
        fields: {
          id: { type: 'string', auto: true },
          email: { type: 'email', required: true, unique: true },
          name: { type: 'string', required: true },
          organizationId: { type: 'relation', to: 'Organization' },
          role: { type: 'enum', values: ['user', 'manager', 'admin'] },
          avatar: { type: 'url' },
          preferences: { type: 'json' },
          isActive: { type: 'boolean', default: true },
          lastLoginAt: { type: 'date' },
          createdAt: { type: 'date', auto: true }
        },
        permissions: {
          create: 'true',
          read: 'authenticated',
          update: 'authenticated && (user.id == entity.id || user.role == "admin")',
          delete: 'authenticated && user.role == "admin"'
        }
      }
    },
    views: {
      Dashboard: {
        route: '/',
        data: 'Project where status == "active" limit 10',
        layout: 'dashboard',
        widgets: ['projectStats', 'recentTasks', 'teamActivity']
      },
      ProjectList: {
        route: '/projects',
        data: 'Project where organizationId == user.organizationId',
        layout: 'table',
        fields: ['name', 'status', 'ownerId', 'startDate', 'endDate'],
        filters: ['status', 'ownerId'],
        sorting: ['name', 'createdAt', 'startDate']
      },
      TaskKanban: {
        route: '/projects/:projectId/tasks',
        data: 'Task where projectId == params.projectId',
        layout: 'kanban',
        groupBy: 'status',
        fields: ['title', 'priority', 'assigneeId', 'dueDate']
      }
    },
    workflows: {
      onProjectCompleted: {
        trigger: 'project.completed',
        actions: ['notifyTeam', 'generateReport', 'archiveTasks']
      },
      onTaskAssigned: {
        trigger: 'task.assigned',
        actions: ['notifyAssignee', 'updateProjectStats']
      },
      onTaskCompleted: {
        trigger: 'task.completed',
        actions: ['updateProjectProgress', 'checkProjectCompletion']
      }
    }
  };
}

/**
 * Create test users with various roles
 */
export function createTestUsers(): {
  admin: MockUser;
  manager: MockUser;
  user1: MockUser;
  user2: MockUser;
  inactive: MockUser;
} {
  return {
    admin: {
      id: 'admin-1',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'admin',
      isActive: true,
      metadata: { organizationId: 'org-1' }
    },
    manager: {
      id: 'manager-1',
      email: 'manager@test.com',
      name: 'Test Manager',
      role: 'manager',
      isActive: true,
      metadata: { organizationId: 'org-1' }
    },
    user1: {
      id: 'user-1',
      email: 'user1@test.com',
      name: 'Test User 1',
      role: 'user',
      isActive: true,
      metadata: { organizationId: 'org-1' }
    },
    user2: {
      id: 'user-2',
      email: 'user2@test.com',
      name: 'Test User 2',
      role: 'user',
      isActive: true,
      metadata: { organizationId: 'org-2' }
    },
    inactive: {
      id: 'inactive-1',
      email: 'inactive@test.com',
      name: 'Inactive User',
      role: 'user',
      isActive: false,
      metadata: { organizationId: 'org-1' }
    }
  };
}

/**
 * Generate test data for an entity
 */
export function generateTestData(
  entityName: string,
  entity: any,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (entity.fields) {
    for (const [fieldName, field] of Object.entries(entity.fields)) {
      if (field.auto || field.generated) continue;

      // Use override if provided
      if (overrides[fieldName] !== undefined) {
        data[fieldName] = overrides[fieldName];
        continue;
      }

      // Generate based on field type
      switch (field.type) {
        case 'string':
          data[fieldName] = `Test ${fieldName} ${Math.floor(Math.random() * 1000)}`;
          break;
        case 'text':
          data[fieldName] = `This is a longer text for ${fieldName} with more details and content.`;
          break;
        case 'email':
          data[fieldName] = `test-${Math.floor(Math.random() * 1000)}@example.com`;
          break;
        case 'url':
          data[fieldName] = `https://example.com/${fieldName}`;
          break;
        case 'number':
          const min = field.min || 0;
          const max = field.max || 100;
          data[fieldName] = Math.floor(Math.random() * (max - min + 1)) + min;
          break;
        case 'boolean':
          data[fieldName] = Math.random() > 0.5;
          break;
        case 'date':
          data[fieldName] = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'enum':
          if (field.values && field.values.length > 0) {
            data[fieldName] = field.values[Math.floor(Math.random() * field.values.length)];
          }
          break;
        case 'relation':
          data[fieldName] = `${field.to?.toLowerCase() || 'related'}-${Math.floor(Math.random() * 100)}`;
          break;
        case 'json':
          data[fieldName] = {
            key1: 'value1',
            key2: Math.floor(Math.random() * 100),
            key3: Math.random() > 0.5
          };
          break;
        default:
          data[fieldName] = `test-${fieldName}`;
      }
    }
  }

  return data;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Create a delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 100
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delayMs = initialDelay * Math.pow(2, attempt - 1);
      await delay(delayMs);
    }
  }
  
  throw lastError!;
}

/**
 * Create a mock function that tracks calls
 */
export function createMockFunction<TArgs extends unknown[], TReturn>(
  implementation?: (...args: TArgs) => TReturn
): {
  fn: (...args: TArgs) => TReturn;
  calls: TArgs[];
  callCount: number;
  reset: () => void;
} {
  const calls: TArgs[] = [];
  
  const fn = (...args: TArgs): TReturn => {
    calls.push(args);
    if (implementation) {
      return implementation(...args);
    }
    return undefined as TReturn;
  };
  
  return {
    fn,
    calls,
    get callCount() { return calls.length; },
    reset() { calls.splice(0); }
  };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Random string generator
 */
export function randomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Random number generator
 */
export function randomNumber(min: number = 0, max: number = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random boolean generator
 */
export function randomBoolean(): boolean {
  return Math.random() > 0.5;
}

/**
 * Pick random items from array
 */
export function randomPick<T>(array: T[], count: number = 1): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Create default test configuration
 */
export function createTestConfig(overrides: Partial<TestConfig> = {}): TestConfig {
  return {
    parallel: false,
    timeout: 10000,
    retries: 0,
    verbose: false,
    coverage: false,
    reporter: 'default',
    setup: {
      database: true,
      server: true,
      auth: true
    },
    ...overrides
  };
}

/**
 * Validate test result structure
 */
export function isValidTestResult(result: any): boolean {
  return (
    result &&
    typeof result.name === 'string' &&
    typeof result.success === 'boolean' &&
    typeof result.duration === 'number' &&
    (result.error === undefined || result.error instanceof Error)
  );
}

/**
 * Format test duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    return `${(ms / 60000).toFixed(2)}m`;
  }
}

/**
 * Calculate test statistics
 */
export function calculateTestStats(results: Array<{ success: boolean; duration: number }>): {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  totalDuration: number;
  avgDuration: number;
} {
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;
  const passRate = total > 0 ? (passed / total) * 100 : 0;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const avgDuration = total > 0 ? totalDuration / total : 0;

  return {
    total,
    passed,
    failed,
    passRate,
    totalDuration,
    avgDuration
  };
}