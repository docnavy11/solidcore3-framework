# Solidcore3 Testing Framework

A comprehensive testing framework designed specifically for Solidcore3's truth-driven architecture. Test your entire application stack with confidence, from truth file validation to full integration scenarios.

## Features

- **Truth File Testing**: Validate app definitions, entity structures, permissions, and relationships
- **Generator Testing**: Unit test code generators with mock implementations
- **API Testing**: Test endpoints with authentication, permissions, and validation
- **Workflow Testing**: Test entity behaviors, event handling, and business logic
- **Integration Testing**: End-to-end scenarios with multiple components
- **Performance Testing**: Benchmark generation speed, API response times, and memory usage
- **Comprehensive Mocking**: Database, authentication, and server mocks
- **Rich Assertions**: Custom assertions for framework-specific validation

## Quick Start

```typescript
import {
  describe,
  runTests,
  TruthTester,
  APITester,
  createTestApp
} from './testing/index.ts';

// Create test suite
const suite = describe('My App Tests', (suite) => {
  const app = createTestApp();
  const tester = new TruthTester();

  suite.test('Truth file should be valid', async () => {
    await tester.testTruth({
      name: 'App validation',
      app,
      expectValid: true
    });
  });
});

// Run tests
await runTests([suite]);
```

## Testing Types

### 1. Truth File Testing

Test your app definitions for validity and correctness:

```typescript
import { TruthTester, createTestApp } from './testing/index.ts';

const app = createTestApp();
const tester = new TruthTester();

// Test app structure
await tester.testTruth({
  name: 'Valid app test',
  app,
  expectValid: true
});

// Test entity fields
await tester.testEntity(app, 'Task', ['id', 'title', 'status']);

// Test permissions
await tester.testPermissions(app, 'Task', ['create', 'read', 'update', 'delete']);

// Test relationships
await tester.testRelationships(app);
```

### 2. Generator Testing

Unit test your code generators:

```typescript
import { GeneratorTester } from './testing/index.ts';

const tester = new GeneratorTester({
  api: APIGenerator,
  ui: UIGenerator
});

// Test API generator
await tester.testAPIGenerator(app, {
  expectedRoutes: ['/api/tasks', '/api/users'],
  expectedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  validateHandlers: true
});

// Test UI generator
await tester.testUIGenerator(app, {
  expectedComponents: ['TaskList', 'TaskForm'],
  expectedPages: ['TaskListPage'],
  validateJSX: true
});

// Test generator pipeline
await tester.testGeneratorPipeline(app, ['api', 'ui'], {
  validateIntegration: true
});
```

### 3. API Testing

Test your API endpoints with authentication and permissions:

```typescript
import { APITester, createMockUser } from './testing/index.ts';

const tester = new APITester(app);
await tester.setup();

const user = createMockUser();

// Test endpoint
await tester.testAPI({
  name: 'Create task',
  method: 'POST',
  path: '/api/tasks',
  body: { title: 'Test Task' },
  user,
  expectedStatus: 201
});

// Test CRUD operations
await tester.testEntityCRUD('Task', user, { title: 'CRUD Test' });

// Test permissions
await tester.testEntityPermissions('Task', [
  { user: admin, action: 'delete', expectedStatus: 204 },
  { user: regularUser, action: 'delete', expectedStatus: 403 }
]);
```

### 4. Validation Testing

Test field validation and business rules:

```typescript
import { ValidationTester } from './testing/index.ts';

const tester = new ValidationTester(app);

// Test required fields
await tester.testRequiredFields('Task');

// Test type validation
await tester.testTypeValidation('Task');

// Test enum validation
await tester.testEnumValidation('Task', 'status');

// Test custom validation
await tester.testCustomValidation('Task', [
  {
    name: 'Title length validation',
    validator: (value) => value.length >= 3 ? true : ['Too short'],
    testCases: [
      { value: 'Hi', expectedValid: false },
      { value: 'Valid title', expectedValid: true }
    ]
  }
]);
```

### 5. Workflow Testing

Test entity behaviors and event-driven workflows:

```typescript
import { WorkflowTester } from './testing/index.ts';

const tester = new WorkflowTester(app);

// Test entity behavior
await tester.testEntityBehavior(
  'Task',
  'complete',
  { id: 'task-1', status: 'in_progress' },
  user,
  { status: 'done' }, // Expected changes
  ['task.completed'] // Expected events
);

// Test workflow
await tester.testWorkflow({
  name: 'Task completion workflow',
  workflow: 'onTaskCompleted',
  trigger: 'task.completed',
  payload: { taskId: 'task-1' },
  expectedActions: ['updateStats', 'notifyTeam']
});

// Test behavior permissions
await tester.testBehaviorPermissions('Task', 'complete', [
  { user: owner, entity: { createdBy: owner.id }, expectedAllowed: true },
  { user: other, entity: { createdBy: owner.id }, expectedAllowed: false }
]);
```

### 6. Integration Testing

Test end-to-end scenarios across multiple components:

```typescript
import { IntegrationTester } from './testing/index.ts';

const tester = new IntegrationTester(app);

// Test user journey
await tester.testUserJourney('Task Management', user, [
  { name: 'Create task', action: 'create', entity: 'Task', data: { title: 'Journey Task' } },
  { name: 'Update task', action: 'update', entity: 'Task', data: { status: 'done' } },
  { name: 'Delete task', action: 'delete', entity: 'Task' }
]);

// Test complex scenario
await tester.testIntegrationScenario({
  name: 'Project workflow',
  scenario: 'Create project, add tasks, complete',
  steps: [
    {
      name: 'Create project',
      action: 'api',
      params: { method: 'POST', path: '/api/projects', body: { name: 'Test Project' } }
    },
    {
      name: 'Add task',
      action: 'api',
      params: { 
        method: 'POST', 
        path: '/api/tasks',
        body: { title: 'Task', projectId: '{{Create project.id}}' }
      }
    }
  ]
});
```

### 7. Performance Testing

Benchmark your application performance:

```typescript
import { PerformanceTester } from './testing/index.ts';

const tester = new PerformanceTester(app);

// Benchmark API endpoint
await tester.benchmarkAPI('/api/tasks', 'GET', undefined, 1000, 50);

// Benchmark generator
await tester.benchmarkGenerator('APIGenerator', APIGenerator, 100, 500);

// Test memory usage
await tester.testMemoryUsage('Data processing', async () => {
  // Memory-intensive operation
}, 50000000, 10);

// Load test
await tester.loadTestAPI([
  { path: '/api/tasks', method: 'GET', weight: 3 },
  { path: '/api/tasks', method: 'POST', body: { title: 'Load test' }, weight: 1 }
], {
  concurrentUsers: 10,
  duration: 5,
  maxResponseTime: 100
});
```

## Test Configuration

Configure test behavior:

```typescript
import { createTestConfig, runTests } from './testing/index.ts';

const config = createTestConfig({
  parallel: true,
  timeout: 30000,
  retries: 2,
  verbose: true,
  coverage: true,
  reporter: 'json',
  filter: {
    tags: ['integration'],
    pattern: 'API.*'
  },
  setup: {
    database: true,
    server: true,
    auth: true
  }
});

await runTests(suites, config);
```

## Mock Services

Use built-in mocks for isolated testing:

```typescript
import { 
  MockDatabase, 
  MockAuthService, 
  MockServer,
  createMockUser 
} from './testing/index.ts';

// Mock database
const db = new MockDatabase();
db.seed({
  tasks: [
    { id: '1', title: 'Task 1', status: 'todo' },
    { id: '2', title: 'Task 2', status: 'done' }
  ]
});

// Mock authentication
const auth = new MockAuthService();
const user = createMockUser({ role: 'admin' });
auth.addUser(user);

// Mock server
const server = new MockServer();
server.get('/api/test', async () => ({
  status: 200,
  headers: { 'content-type': 'application/json' },
  body: { message: 'Hello World' }
}));
```

## Test Utilities

Helpful utilities for test creation:

```typescript
import { 
  createTestApp,
  createComplexTestApp,
  createTestUsers,
  generateTestData,
  waitFor,
  retry,
  randomString
} from './testing/index.ts';

// Create test apps
const simpleApp = createTestApp();
const complexApp = createComplexTestApp();

// Create test users
const users = createTestUsers();
const { admin, manager, user1, user2 } = users;

// Generate test data
const taskData = generateTestData('Task', app.entities.Task, {
  title: 'Custom title',
  priority: 'high'
});

// Wait for conditions
await waitFor(() => server.isRunning(), 5000);

// Retry operations
await retry(async () => {
  await flakeyOperation();
}, 3, 100);
```

## Custom Assertions

Framework-specific assertions:

```typescript
import { 
  assertValidApp,
  assertHasEntities,
  assertEntityHasFields,
  assertValidationPassed,
  assertResponseStatus,
  assertCodeContains,
  assertPerformance
} from './testing/index.ts';

// Truth file assertions
assertValidApp(app);
assertHasEntities(app, ['Task', 'User']);
assertEntityHasFields(app, 'Task', ['id', 'title']);

// API assertions
assertResponseStatus(response, 200);
assertResponseHeader(response, 'content-type', 'application/json');

// Generator assertions
assertCodeContains(generatedCode, ['function', 'export', 'async']);
assertValidCode(generatedCode);

// Performance assertions
assertPerformance(actualDuration, maxDuration);
assertMemoryUsage(actualMemory, memoryLimit);
```

## Running Tests

### Command Line

Add test scripts to your `deno.json`:

```json
{
  "tasks": {
    "test": "deno test --allow-read --allow-write testing/",
    "test:watch": "deno test --allow-read --allow-write --watch testing/",
    "test:examples": "deno run --allow-all testing/examples/example-tests.ts",
    "test:coverage": "deno test --allow-read --allow-write --coverage=coverage testing/",
    "test:performance": "deno run --allow-all testing/examples/performance-tests.ts"
  }
}
```

### Programmatic

```typescript
import { runTests, describe } from './testing/index.ts';

const suites = [
  describe('Truth Tests', suite => {
    // Add tests...
  }),
  describe('API Tests', suite => {
    // Add tests...
  })
];

const results = await runTests(suites, {
  verbose: true,
  parallel: false
});

console.log(`Tests completed: ${results.length}`);
```

## Best Practices

### 1. Structure Your Tests

Organize tests by component type:

```
testing/
  truth/           - Truth file validation tests
  generators/      - Generator unit tests
  api/            - API endpoint tests
  validation/     - Field and business rule tests
  workflows/      - Behavior and workflow tests
  integration/    - End-to-end scenario tests
  performance/    - Performance and load tests
```

### 2. Use Descriptive Names

```typescript
// ✅ Good
suite.test('Admin user can delete any task', async () => {
  // Test implementation
});

// ❌ Bad
suite.test('Test delete', async () => {
  // Test implementation
});
```

### 3. Test Edge Cases

```typescript
// Test happy path
await tester.testFieldValidation({
  name: 'Valid title',
  entity: 'Task',
  field: 'title',
  value: 'Valid Task Title',
  expectedValid: true
});

// Test edge cases
await tester.testFieldValidation({
  name: 'Empty title should fail',
  entity: 'Task',
  field: 'title',
  value: '',
  expectedValid: false,
  expectedErrors: ['required']
});
```

### 4. Use Setup and Teardown

```typescript
const suite = describe('API Tests', (suite) => {
  let tester: APITester;

  suite.setup(async () => {
    tester = new APITester(app);
    await tester.setup();
  });

  suite.teardown(async () => {
    await tester.teardown();
  });

  // Tests...
});
```

### 5. Mock External Dependencies

```typescript
// Mock external API calls
const mockAPI = createMockFunction(async (url: string) => {
  if (url.includes('/external-service')) {
    return { status: 200, data: { success: true } };
  }
  throw new Error('Unmocked API call');
});
```

## Integration with Development Workflow

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.37.x
      
      - name: Run tests
        run: deno task test
      
      - name: Run performance tests
        run: deno task test:performance
```

### Pre-commit Hooks

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Run tests before commit
deno task test

if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

### Development Server Integration

```typescript
// Watch for changes and run relevant tests
import { watchFiles } from './testing/utils/watch.ts';

watchFiles('app/app.truth.ts', async () => {
  console.log('Truth file changed, running truth tests...');
  await runTruthTests();
});

watchFiles('core/generators/*.ts', async () => {
  console.log('Generator changed, running generator tests...');
  await runGeneratorTests();
});
```

## Examples

Complete examples are available in `testing/examples/`:

- `example-tests.ts` - Comprehensive testing examples
- `truth-examples.ts` - Truth file testing patterns
- `api-examples.ts` - API testing patterns
- `integration-examples.ts` - Integration testing patterns
- `performance-examples.ts` - Performance testing patterns

Run examples:

```bash
deno run --allow-all testing/examples/example-tests.ts
```

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout in test config
2. **Mock setup failing**: Ensure proper setup/teardown order
3. **Permission tests failing**: Check user roles and entity ownership
4. **Memory tests failing**: Use appropriate memory limits for your environment

### Debug Mode

Enable verbose logging:

```typescript
const config = createTestConfig({
  verbose: true,
  debug: true
});
```

### Performance Issues

Monitor test performance:

```typescript
const results = await runTests(suites, { verbose: true });
const slowTests = results.filter(r => r.duration > 1000);
console.log('Slow tests:', slowTests.map(t => `${t.name}: ${t.duration}ms`));
```

## Contributing

To add new testing capabilities:

1. Create new tester class extending `TestRunner`
2. Add specific test types to `types/test-types.ts`
3. Create utility functions in `utils/`
4. Add examples to `examples/`
5. Update documentation

## License

Part of the Solidcore3 framework. See main project license.