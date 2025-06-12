/**
 * Mock implementations for testing Solidcore3 framework
 */

import type {
  MockDatabase,
  MockQueryResult,
  MockUser,
  MockAuthService,
  MockServer,
  MockRequest,
  MockResponse
} from '../types/test-types.ts';

/**
 * Mock database implementation for testing
 */
export class MockDatabase implements MockDatabase {
  private tables: Map<string, Map<string, Record<string, unknown>>> = new Map();
  private sequences: Map<string, number> = new Map();
  private transactionDepth = 0;

  async execute(sql: string, params: unknown[] = []): Promise<MockQueryResult> {
    const normalizedSQL = sql.trim().toLowerCase();
    
    // CREATE TABLE
    if (normalizedSQL.startsWith('create table')) {
      return this.handleCreateTable(sql);
    }
    
    // INSERT
    if (normalizedSQL.startsWith('insert into')) {
      return this.handleInsert(sql, params);
    }
    
    // SELECT
    if (normalizedSQL.startsWith('select')) {
      return this.handleSelect(sql, params);
    }
    
    // UPDATE
    if (normalizedSQL.startsWith('update')) {
      return this.handleUpdate(sql, params);
    }
    
    // DELETE
    if (normalizedSQL.startsWith('delete')) {
      return this.handleDelete(sql, params);
    }
    
    // Default response
    return { rows: [], changes: 0 };
  }

  async transaction<T>(fn: (tx: MockDatabase) => Promise<T>): Promise<T> {
    this.transactionDepth++;
    try {
      return await fn(this);
    } finally {
      this.transactionDepth--;
    }
  }

  reset(): void {
    this.tables.clear();
    this.sequences.clear();
    this.transactionDepth = 0;
  }

  seed(data: Record<string, unknown[]>): void {
    for (const [tableName, rows] of Object.entries(data)) {
      const table = new Map<string, Record<string, unknown>>();
      
      rows.forEach((row, index) => {
        const record = row as Record<string, unknown>;
        const id = record.id || `generated_${index + 1}`;
        table.set(String(id), record);
      });
      
      this.tables.set(tableName.toLowerCase(), table);
    }
  }

  // Get table data for inspection
  getTable(tableName: string): Record<string, unknown>[] {
    const table = this.tables.get(tableName.toLowerCase());
    return table ? Array.from(table.values()) : [];
  }

  private handleCreateTable(sql: string): MockQueryResult {
    const match = sql.match(/create table\s+(?:if not exists\s+)?(\w+)/i);
    if (match) {
      const tableName = match[1].toLowerCase();
      if (!this.tables.has(tableName)) {
        this.tables.set(tableName, new Map());
      }
    }
    return { rows: [], changes: 0 };
  }

  private handleInsert(sql: string, params: unknown[]): MockQueryResult {
    const match = sql.match(/insert into\s+(\w+)/i);
    if (!match) return { rows: [], changes: 0 };
    
    const tableName = match[1].toLowerCase();
    const table = this.tables.get(tableName) || new Map();
    
    // Simple parameter substitution
    const id = params[0] || this.generateId(tableName);
    const record: Record<string, unknown> = { id };
    
    // Map parameters to a basic record structure
    params.forEach((param, index) => {
      record[`col_${index}`] = param;
    });
    
    table.set(String(id), record);
    this.tables.set(tableName, table);
    
    return { rows: [], changes: 1, lastInsertRowId: Number(id) };
  }

  private handleSelect(sql: string, params: unknown[]): MockQueryResult {
    const match = sql.match(/from\s+(\w+)/i);
    if (!match) return { rows: [], changes: 0 };
    
    const tableName = match[1].toLowerCase();
    const table = this.tables.get(tableName);
    if (!table) return { rows: [], changes: 0 };
    
    let rows = Array.from(table.values());
    
    // Simple WHERE clause handling
    if (sql.includes('WHERE') && params.length > 0) {
      const paramValue = params[0];
      rows = rows.filter(row => 
        Object.values(row).some(value => value === paramValue)
      );
    }
    
    return { rows, changes: 0 };
  }

  private handleUpdate(sql: string, params: unknown[]): MockQueryResult {
    const match = sql.match(/update\s+(\w+)/i);
    if (!match) return { rows: [], changes: 0 };
    
    const tableName = match[1].toLowerCase();
    const table = this.tables.get(tableName);
    if (!table) return { rows: [], changes: 0 };
    
    let changes = 0;
    for (const [id, record] of table.entries()) {
      // Simple update logic - in real implementation, would parse SET and WHERE clauses
      if (params.length > 0) {
        record.updated_at = new Date().toISOString();
        changes++;
      }
    }
    
    return { rows: [], changes };
  }

  private handleDelete(sql: string, params: unknown[]): MockQueryResult {
    const match = sql.match(/from\s+(\w+)/i);
    if (!match) return { rows: [], changes: 0 };
    
    const tableName = match[1].toLowerCase();
    const table = this.tables.get(tableName);
    if (!table) return { rows: [], changes: 0 };
    
    let changes = 0;
    if (params.length > 0) {
      const paramValue = params[0];
      for (const [id, record] of table.entries()) {
        if (Object.values(record).some(value => value === paramValue)) {
          table.delete(id);
          changes++;
        }
      }
    }
    
    return { rows: [], changes };
  }

  private generateId(tableName: string): string {
    const current = this.sequences.get(tableName) || 0;
    const next = current + 1;
    this.sequences.set(tableName, next);
    return String(next);
  }
}

/**
 * Mock authentication service for testing
 */
export class MockAuthService implements MockAuthService {
  private users: Map<string, MockUser> = new Map();
  private tokens: Map<string, MockUser> = new Map();

  constructor() {
    // Add default test users
    this.addUser({
      id: 'admin-1',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'admin',
      isActive: true
    });

    this.addUser({
      id: 'user-1', 
      email: 'user@test.com',
      name: 'Test User',
      role: 'user',
      isActive: true
    });
  }

  async authenticate(token: string): Promise<MockUser | null> {
    return this.tokens.get(token) || null;
  }

  authorize(user: MockUser | null, permission: string, entity?: unknown): boolean {
    if (!user) return false;
    if (!user.isActive) return false;
    
    // Admin can do everything
    if (user.role === 'admin') return true;
    
    // Simple permission logic
    if (permission === 'read') return true;
    if (permission === 'create' && user.role === 'user') return true;
    if (permission === 'update' && entity) {
      // Users can update their own entities
      const entityRecord = entity as Record<string, unknown>;
      return entityRecord.createdBy === user.id || entityRecord.ownerId === user.id;
    }
    if (permission === 'delete' && entity) {
      // Users can delete their own entities
      const entityRecord = entity as Record<string, unknown>;
      return entityRecord.createdBy === user.id || entityRecord.ownerId === user.id;
    }
    
    return false;
  }

  generateToken(user: MockUser): string {
    const token = `test_token_${user.id}_${Date.now()}`;
    this.tokens.set(token, user);
    return token;
  }

  addUser(user: MockUser): void {
    this.users.set(user.id, user);
    
    // Auto-generate token for convenience
    const token = this.generateToken(user);
    user.metadata = { ...user.metadata, token };
  }

  getUser(id: string): MockUser | undefined {
    return this.users.get(id);
  }

  getAllUsers(): MockUser[] {
    return Array.from(this.users.values());
  }

  reset(): void {
    this.users.clear();
    this.tokens.clear();
  }
}

/**
 * Mock server for testing HTTP endpoints
 */
export class MockServer implements MockServer {
  private routes: Map<string, (req: MockRequest) => Promise<MockResponse>> = new Map();
  private middleware: Array<(req: MockRequest) => Promise<MockRequest | MockResponse>> = [];
  private isRunning = false;

  async request(req: MockRequest): Promise<MockResponse> {
    if (!this.isRunning) {
      throw new Error('Mock server is not running');
    }

    try {
      // Apply middleware
      let currentReq = req;
      for (const mw of this.middleware) {
        const result = await mw(currentReq);
        if ('status' in result) {
          return result as MockResponse; // Middleware returned response
        }
        currentReq = result as MockRequest;
      }

      // Find matching route
      const routeKey = `${req.method} ${req.path}`;
      const handler = this.routes.get(routeKey);
      
      if (!handler) {
        return {
          status: 404,
          headers: { 'content-type': 'application/json' },
          body: { error: 'Route not found' }
        };
      }

      return await handler(currentReq);
      
    } catch (error) {
      return {
        status: 500,
        headers: { 'content-type': 'application/json' },
        body: { 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async start(): Promise<void> {
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.routes.clear();
    this.middleware.splice(0);
  }

  // Add route handler
  addRoute(
    method: string, 
    path: string, 
    handler: (req: MockRequest) => Promise<MockResponse>
  ): void {
    const routeKey = `${method.toUpperCase()} ${path}`;
    this.routes.set(routeKey, handler);
  }

  // Add middleware
  addMiddleware(
    mw: (req: MockRequest) => Promise<MockRequest | MockResponse>
  ): void {
    this.middleware.push(mw);
  }

  // Convenience methods for common routes
  get(path: string, handler: (req: MockRequest) => Promise<MockResponse>): void {
    this.addRoute('GET', path, handler);
  }

  post(path: string, handler: (req: MockRequest) => Promise<MockResponse>): void {
    this.addRoute('POST', path, handler);
  }

  put(path: string, handler: (req: MockRequest) => Promise<MockResponse>): void {
    this.addRoute('PUT', path, handler);
  }

  delete(path: string, handler: (req: MockRequest) => Promise<MockResponse>): void {
    this.addRoute('DELETE', path, handler);
  }
}

/**
 * Create default test mocks
 */
export function createTestMocks() {
  return {
    database: new MockDatabase(),
    auth: new MockAuthService(),
    server: new MockServer()
  };
}

/**
 * Create mock user for testing
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    isActive: true,
    ...overrides
  };
}

/**
 * Create mock admin user for testing
 */
export function createMockAdmin(overrides: Partial<MockUser> = {}): MockUser {
  return createMockUser({
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Test Admin',
    role: 'admin',
    ...overrides
  });
}

/**
 * Create mock request for testing
 */
export function createMockRequest(overrides: Partial<MockRequest> = {}): MockRequest {
  return {
    method: 'GET',
    path: '/',
    headers: { 'content-type': 'application/json' },
    body: null,
    user: null,
    ...overrides
  };
}

/**
 * Create mock response for testing
 */
export function createMockResponse(overrides: Partial<MockResponse> = {}): MockResponse {
  return {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: null,
    ...overrides
  };
}