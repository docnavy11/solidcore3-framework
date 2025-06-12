/**
 * API testing utilities
 * 
 * Provides utilities for testing API endpoints:
 * - Request/response testing
 * - Authentication and authorization testing
 * - Permission-based access testing
 * - Validation testing
 * - Integration with mock services
 */

import type { AppDefinition } from '../../core/types/index.ts';
import type {
  APITestCase,
  TestResult,
  MockUser,
  MockRequest,
  MockResponse
} from '../types/test-types.ts';
import { TestRunner } from '../core/test-runner.ts';
import { MockServer, MockAuthService, createMockUser, createMockAdmin } from '../core/mocks.ts';
import {
  assertResponseStatus,
  assertResponseHeader,
  assertResponseBody,
  assertResponseHasFields
} from '../core/assertions.ts';

/**
 * API tester class
 */
export class APITester extends TestRunner {
  private server: MockServer;
  private auth: MockAuthService;
  private app: AppDefinition;

  constructor(app: AppDefinition) {
    super();
    this.app = app;
    this.server = new MockServer();
    this.auth = new MockAuthService();
  }

  /**
   * Setup the mock server with routes from the app definition
   */
  async setup(): Promise<void> {
    await this.server.start();
    
    // Setup authentication middleware
    this.server.addMiddleware(async (req) => {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        req.user = await this.auth.authenticate(token);
      }
      return req;
    });

    // Generate routes from app entities
    if (this.app.entities) {
      for (const [entityName, entity] of Object.entries(this.app.entities)) {
        this.setupEntityRoutes(entityName, entity);
      }
    }
  }

  /**
   * Teardown the mock server
   */
  async teardown(): Promise<void> {
    await this.server.stop();
  }

  /**
   * Test an API endpoint
   */
  async testAPI(testCase: APITestCase): Promise<TestResult> {
    const startTime = performance.now();

    try {
      // Prepare request
      const request: MockRequest = {
        method: testCase.method,
        path: testCase.path,
        headers: testCase.headers || {},
        body: testCase.body || null,
        user: testCase.user || null
      };

      // Add authorization header if user provided
      if (testCase.user && !request.headers.authorization) {
        const token = this.auth.generateToken(testCase.user);
        request.headers.authorization = `Bearer ${token}`;
      }

      // Make request
      const response = await this.server.request(request);

      // Validate response status
      if (testCase.expectedStatus !== undefined) {
        assertResponseStatus(response, testCase.expectedStatus);
      }

      // Validate response body
      if (testCase.expectedBody !== undefined) {
        assertResponseBody(response, testCase.expectedBody);
      }

      // Validate response headers
      if (testCase.expectedHeaders) {
        for (const [header, expectedValue] of Object.entries(testCase.expectedHeaders)) {
          assertResponseHeader(response, header, expectedValue);
        }
      }

      // Custom validation
      if (testCase.validateResponse) {
        const isValid = await testCase.validateResponse(response);
        if (!isValid) {
          throw new Error('Custom response validation failed');
        }
      }

      const duration = performance.now() - startTime;
      return {
        name: testCase.name,
        success: true,
        duration,
        metadata: {
          method: testCase.method,
          path: testCase.path,
          status: response.status,
          user: testCase.user?.role || 'anonymous'
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
   * Test CRUD operations for an entity
   */
  async testEntityCRUD(
    entityName: string,
    user: MockUser,
    testData: Record<string, unknown> = {}
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const basePath = `/api/${entityName.toLowerCase()}`;
    let createdId: string | undefined;

    // Test CREATE
    const createResult = await this.testAPI({
      name: `CREATE ${entityName}`,
      method: 'POST',
      path: basePath,
      body: { title: 'Test Item', ...testData },
      user,
      expectedStatus: 201,
      validateResponse: (response) => {
        if (response.body && typeof response.body === 'object') {
          const body = response.body as Record<string, unknown>;
          createdId = body.id as string;
          return !!createdId;
        }
        return false;
      }
    });
    results.push(createResult);

    if (!createdId) {
      return results; // Cannot continue without created item
    }

    // Test READ (single)
    const readResult = await this.testAPI({
      name: `READ ${entityName}`,
      method: 'GET',
      path: `${basePath}/${createdId}`,
      user,
      expectedStatus: 200,
      validateResponse: (response) => {
        if (response.body && typeof response.body === 'object') {
          const body = response.body as Record<string, unknown>;
          return body.id === createdId;
        }
        return false;
      }
    });
    results.push(readResult);

    // Test LIST
    const listResult = await this.testAPI({
      name: `LIST ${entityName}`,
      method: 'GET',
      path: basePath,
      user,
      expectedStatus: 200,
      validateResponse: (response) => {
        return Array.isArray(response.body);
      }
    });
    results.push(listResult);

    // Test UPDATE
    const updateResult = await this.testAPI({
      name: `UPDATE ${entityName}`,
      method: 'PUT',
      path: `${basePath}/${createdId}`,
      body: { title: 'Updated Test Item', ...testData },
      user,
      expectedStatus: 200
    });
    results.push(updateResult);

    // Test DELETE
    const deleteResult = await this.testAPI({
      name: `DELETE ${entityName}`,
      method: 'DELETE',
      path: `${basePath}/${createdId}`,
      user,
      expectedStatus: 204
    });
    results.push(deleteResult);

    return results;
  }

  /**
   * Test permissions for an entity
   */
  async testEntityPermissions(
    entityName: string,
    scenarios: Array<{
      user: MockUser | null;
      action: 'create' | 'read' | 'update' | 'delete';
      expectedStatus: number;
      description?: string;
    }>
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const basePath = `/api/${entityName.toLowerCase()}`;

    // Create test data first with admin user
    const admin = createMockAdmin();
    const adminToken = this.auth.generateToken(admin);
    
    const createResponse = await this.server.request({
      method: 'POST',
      path: basePath,
      headers: { authorization: `Bearer ${adminToken}` },
      body: { title: 'Permission Test Item' },
      user: admin
    });

    const testItemId = createResponse.body && typeof createResponse.body === 'object' 
      ? (createResponse.body as Record<string, unknown>).id as string
      : 'test-id';

    // Test each permission scenario
    for (const scenario of scenarios) {
      const { method, path } = this.getMethodAndPath(scenario.action, basePath, testItemId);
      
      const testName = scenario.description || 
        `${scenario.user?.role || 'anonymous'} ${scenario.action} ${entityName}`;

      const result = await this.testAPI({
        name: testName,
        method,
        path,
        body: scenario.action === 'create' || scenario.action === 'update' 
          ? { title: 'Test' } : undefined,
        user: scenario.user,
        expectedStatus: scenario.expectedStatus
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Test validation for an entity
   */
  async testEntityValidation(
    entityName: string,
    user: MockUser,
    validationCases: Array<{
      name: string;
      data: Record<string, unknown>;
      expectedStatus: number;
      expectedErrors?: string[];
    }>
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const basePath = `/api/${entityName.toLowerCase()}`;

    for (const testCase of validationCases) {
      const result = await this.testAPI({
        name: `Validation: ${testCase.name}`,
        method: 'POST',
        path: basePath,
        body: testCase.data,
        user,
        expectedStatus: testCase.expectedStatus,
        validateResponse: (response) => {
          if (testCase.expectedErrors && response.status >= 400) {
            const body = response.body as any;
            const errors = body.errors || body.message || [];
            
            return testCase.expectedErrors.every(expectedError =>
              JSON.stringify(errors).includes(expectedError)
            );
          }
          return true;
        }
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Test API with various authentication states
   */
  async testAuthentication(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test unauthenticated access
    results.push(await this.testAPI({
      name: 'Unauthenticated access',
      method,
      path,
      user: null,
      expectedStatus: 401
    }));

    // Test with invalid token
    results.push(await this.testAPI({
      name: 'Invalid token',
      method,
      path,
      headers: { authorization: 'Bearer invalid-token' },
      user: null,
      expectedStatus: 401
    }));

    // Test with valid user
    const user = createMockUser();
    results.push(await this.testAPI({
      name: 'Valid user token',
      method,
      path,
      user,
      expectedStatus: 200
    }));

    // Test with admin user
    const admin = createMockAdmin();
    results.push(await this.testAPI({
      name: 'Admin user token',
      method,
      path,
      user: admin,
      expectedStatus: 200
    }));

    return results;
  }

  /**
   * Override test execution for API-specific tests
   */
  protected async executeTest(testCase: any): Promise<void> {
    if ('method' in testCase && 'path' in testCase) {
      const result = await this.testAPI(testCase as APITestCase);
      if (!result.success) {
        throw result.error || new Error('API test failed');
      }
    } else {
      throw new Error(`Unknown test case type for: ${testCase.name}`);
    }
  }

  // Private helper methods

  /**
   * Setup CRUD routes for an entity
   */
  private setupEntityRoutes(entityName: string, entity: any): void {
    const basePath = `/api/${entityName.toLowerCase()}`;
    const permissions = entity.permissions || {};

    // LIST - GET /api/entities
    this.server.get(basePath, async (req) => {
      if (!this.checkPermission(req.user, permissions.read, null)) {
        return { status: 403, headers: {}, body: { error: 'Forbidden' } };
      }

      return {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: [
          { id: '1', title: 'Item 1', createdBy: req.user?.id },
          { id: '2', title: 'Item 2', createdBy: 'other-user' }
        ]
      };
    });

    // GET - GET /api/entities/:id
    this.server.get(`${basePath}/:id`, async (req) => {
      const entity = { id: '1', title: 'Item 1', createdBy: req.user?.id };
      
      if (!this.checkPermission(req.user, permissions.read, entity)) {
        return { status: 403, headers: {}, body: { error: 'Forbidden' } };
      }

      return {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: entity
      };
    });

    // CREATE - POST /api/entities
    this.server.post(basePath, async (req) => {
      if (!this.checkPermission(req.user, permissions.create, null)) {
        return { status: 403, headers: {}, body: { error: 'Forbidden' } };
      }

      // Basic validation
      const body = req.body as Record<string, unknown>;
      if (!body.title) {
        return {
          status: 400,
          headers: { 'content-type': 'application/json' },
          body: { error: 'Title is required' }
        };
      }

      const newEntity = {
        id: Date.now().toString(),
        ...body,
        createdBy: req.user?.id,
        createdAt: new Date().toISOString()
      };

      return {
        status: 201,
        headers: { 'content-type': 'application/json' },
        body: newEntity
      };
    });

    // UPDATE - PUT /api/entities/:id
    this.server.put(`${basePath}/:id`, async (req) => {
      const entity = { id: '1', title: 'Item 1', createdBy: req.user?.id };
      
      if (!this.checkPermission(req.user, permissions.update, entity)) {
        return { status: 403, headers: {}, body: { error: 'Forbidden' } };
      }

      const updatedEntity = {
        ...entity,
        ...(req.body as Record<string, unknown>),
        updatedAt: new Date().toISOString()
      };

      return {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: updatedEntity
      };
    });

    // DELETE - DELETE /api/entities/:id
    this.server.delete(`${basePath}/:id`, async (req) => {
      const entity = { id: '1', title: 'Item 1', createdBy: req.user?.id };
      
      if (!this.checkPermission(req.user, permissions.delete, entity)) {
        return { status: 403, headers: {}, body: { error: 'Forbidden' } };
      }

      return {
        status: 204,
        headers: {},
        body: null
      };
    });
  }

  /**
   * Check permission using mock auth service
   */
  private checkPermission(
    user: MockUser | null,
    permission: string | undefined,
    entity: any
  ): boolean {
    if (!permission) return true; // No permission defined = allow all
    if (!user) return permission === 'true'; // Unauthenticated users

    // Simple permission evaluation
    if (permission === 'true') return true;
    if (permission === 'false') return false;
    if (permission === 'authenticated') return !!user;
    if (permission === 'admin') return user.role === 'admin';
    if (permission.includes('owner') && entity) {
      return user.id === entity.createdBy || user.id === entity.ownerId;
    }

    return this.auth.authorize(user, permission, entity);
  }

  /**
   * Get HTTP method and path for action
   */
  private getMethodAndPath(
    action: string,
    basePath: string,
    itemId: string
  ): { method: 'GET' | 'POST' | 'PUT' | 'DELETE'; path: string } {
    switch (action) {
      case 'create':
        return { method: 'POST', path: basePath };
      case 'read':
        return { method: 'GET', path: `${basePath}/${itemId}` };
      case 'update':
        return { method: 'PUT', path: `${basePath}/${itemId}` };
      case 'delete':
        return { method: 'DELETE', path: `${basePath}/${itemId}` };
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}

/**
 * Create an API tester for an app
 */
export function createAPITester(app: AppDefinition): APITester {
  return new APITester(app);
}

/**
 * Quick utility to test an API endpoint
 */
export async function testAPIEndpoint(
  app: AppDefinition,
  testCase: APITestCase
): Promise<TestResult> {
  const tester = createAPITester(app);
  await tester.setup();
  
  try {
    return await tester.testAPI(testCase);
  } finally {
    await tester.teardown();
  }
}