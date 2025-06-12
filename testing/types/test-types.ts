/**
 * Core types for the Solidcore3 testing framework
 */

import type { AppDefinition } from '../../core/types/index.ts';

// Base test types
export interface TestCase {
  name: string;
  description?: string;
  tags?: string[];
  timeout?: number;
  skip?: boolean;
  only?: boolean;
}

export interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: Error;
  metadata?: Record<string, unknown>;
}

export interface TestSuite {
  name: string;
  description?: string;
  setup?: () => Promise<void> | void;
  teardown?: () => Promise<void> | void;
  tests: TestCase[];
}

// Truth testing types
export interface TruthTestCase extends TestCase {
  app: AppDefinition | (() => AppDefinition);
  expectValid?: boolean;
  expectedErrors?: string[];
  expectedWarnings?: string[];
}

export interface TruthValidationResult {
  isValid: boolean;
  errors: Array<{
    path: string;
    message: string;
    code?: string;
  }>;
  warnings: Array<{
    path: string;
    message: string;
    code?: string;
  }>;
}

// Generator testing types
export interface GeneratorTestCase<T = unknown> extends TestCase {
  app: AppDefinition;
  generator: string;
  expectedOutput?: T;
  expectedFiles?: string[];
  validateOutput?: (output: T) => boolean | Promise<boolean>;
}

// API testing types
export interface APITestCase extends TestCase {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  user?: MockUser | null;
  expectedStatus?: number;
  expectedBody?: unknown;
  expectedHeaders?: Record<string, string>;
  validateResponse?: (response: MockResponse) => boolean | Promise<boolean>;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface MockResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface MockRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: unknown;
  user?: MockUser | null;
}

// Database testing types
export interface MockDatabase {
  execute(sql: string, params?: unknown[]): Promise<MockQueryResult>;
  transaction<T>(fn: (tx: MockDatabase) => Promise<T>): Promise<T>;
  reset(): void;
  seed(data: Record<string, unknown[]>): void;
}

export interface MockQueryResult {
  rows: unknown[];
  changes: number;
  lastInsertRowId?: number;
}

// Validation testing types
export interface ValidationTestCase extends TestCase {
  entity: string;
  field?: string;
  value: unknown;
  context?: Record<string, unknown>;
  expectedValid: boolean;
  expectedErrors?: string[];
}

// Workflow testing types
export interface WorkflowTestCase extends TestCase {
  workflow: string;
  trigger: string;
  payload: unknown;
  mockDependencies?: Record<string, unknown>;
  expectedActions?: string[];
  expectedSideEffects?: Array<{
    type: string;
    data: unknown;
  }>;
}

// Performance testing types
export interface PerformanceTestCase extends TestCase {
  operation: () => Promise<void> | void;
  iterations?: number;
  maxDuration?: number;
  memoryLimit?: number;
  warmupRuns?: number;
}

export interface PerformanceResult {
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  totalDuration: number;
  iterations: number;
  memoryUsage?: {
    peak: number;
    average: number;
  };
  throughput?: number;
}

// Integration testing types
export interface IntegrationTestCase extends TestCase {
  scenario: string;
  steps: IntegrationStep[];
  setup?: () => Promise<void> | void;
  teardown?: () => Promise<void> | void;
}

export interface IntegrationStep {
  name: string;
  action: 'api' | 'database' | 'event' | 'custom';
  params: unknown;
  expectedResult?: unknown;
  validate?: (result: unknown) => boolean | Promise<boolean>;
}

// Test configuration
export interface TestConfig {
  parallel?: boolean;
  timeout?: number;
  retries?: number;
  verbose?: boolean;
  coverage?: boolean;
  reporter?: 'default' | 'json' | 'junit' | 'tap';
  filter?: {
    tags?: string[];
    pattern?: string;
  };
  setup?: {
    database?: boolean;
    server?: boolean;
    auth?: boolean;
  };
}

// Test context
export interface TestContext {
  app: AppDefinition;
  database: MockDatabase;
  server?: MockServer;
  auth?: MockAuthService;
  config: TestConfig;
}

export interface MockServer {
  request(req: MockRequest): Promise<MockResponse>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface MockAuthService {
  authenticate(token: string): Promise<MockUser | null>;
  authorize(user: MockUser | null, permission: string, entity?: unknown): boolean;
  generateToken(user: MockUser): string;
}