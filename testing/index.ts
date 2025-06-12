/**
 * Solidcore3 Testing Framework
 * 
 * A comprehensive testing framework designed for the truth-driven architecture.
 * Provides utilities for testing:
 * - Truth file validation
 * - Generator outputs  
 * - API endpoints with auth/permissions
 * - Validation rules
 * - Workflows and behaviors
 * - Full integration scenarios
 */

export * from './core/test-runner.ts';
export * from './core/assertions.ts';
export * from './core/mocks.ts';

export * from './truth/truth-tester.ts';
export * from './generators/generator-tester.ts';
export * from './api/api-tester.ts';
export * from './validation/validation-tester.ts';
export * from './workflows/workflow-tester.ts';
export * from './integration/integration-tester.ts';
export * from './performance/performance-tester.ts';

export * from './types/test-types.ts';
export * from './utils/test-utils.ts';

// Re-export commonly used types from Deno's std/assert
export {
  assert,
  assertExists,
  assertEquals,
  assertNotEquals,
  assertStrictEquals,
  assertThrows,
  assertRejects,
  assertMatch,
  assertStringIncludes,
  assertArrayIncludes,
  assertInstanceOf,
} from '@std/assert';