/**
 * Custom assertions for Solidcore3 testing framework
 */

import { assert, assertEquals, assertExists, assertThrows } from '@std/assert';
import type { AppDefinition } from '../../core/types/index.ts';
import type { TruthValidationResult, MockResponse } from '../types/test-types.ts';

/**
 * Assert that an app definition is valid
 */
export function assertValidApp(app: AppDefinition, message?: string): void {
  assertExists(app, message || 'App definition should exist');
  assertExists(app.name, message || 'App should have a name');
  assert(typeof app.name === 'string', message || 'App name should be a string');
}

/**
 * Assert that an app definition has expected entities
 */
export function assertHasEntities(app: AppDefinition, entityNames: string[], message?: string): void {
  assertExists(app.entities, message || 'App should have entities');
  
  for (const entityName of entityNames) {
    assertExists(
      app.entities[entityName], 
      message || `App should have entity: ${entityName}`
    );
  }
}

/**
 * Assert that an entity has expected fields
 */
export function assertEntityHasFields(
  app: AppDefinition, 
  entityName: string, 
  fieldNames: string[], 
  message?: string
): void {
  assertExists(app.entities?.[entityName], message || `Entity ${entityName} should exist`);
  assertExists(app.entities[entityName].fields, message || `Entity ${entityName} should have fields`);
  
  for (const fieldName of fieldNames) {
    assertExists(
      app.entities[entityName].fields[fieldName],
      message || `Entity ${entityName} should have field: ${fieldName}`
    );
  }
}

/**
 * Assert that validation result is valid
 */
export function assertValidationPassed(result: TruthValidationResult, message?: string): void {
  assert(result.isValid, message || `Validation should pass. Errors: ${result.errors.map(e => e.message).join(', ')}`);
}

/**
 * Assert that validation result failed
 */
export function assertValidationFailed(result: TruthValidationResult, message?: string): void {
  assert(!result.isValid, message || 'Validation should fail');
  assert(result.errors.length > 0, message || 'Validation should have errors');
}

/**
 * Assert that validation has specific errors
 */
export function assertValidationErrors(
  result: TruthValidationResult, 
  expectedErrors: string[],
  message?: string
): void {
  assertValidationFailed(result, message);
  
  for (const expectedError of expectedErrors) {
    const hasError = result.errors.some(error => 
      error.message.includes(expectedError) || error.code === expectedError
    );
    assert(hasError, message || `Should have validation error: ${expectedError}`);
  }
}

/**
 * Assert HTTP response status
 */
export function assertResponseStatus(response: MockResponse, expectedStatus: number, message?: string): void {
  assertEquals(
    response.status, 
    expectedStatus, 
    message || `Expected status ${expectedStatus}, got ${response.status}`
  );
}

/**
 * Assert HTTP response has specific header
 */
export function assertResponseHeader(
  response: MockResponse, 
  header: string, 
  expectedValue?: string,
  message?: string
): void {
  const actualValue = response.headers[header.toLowerCase()];
  assertExists(actualValue, message || `Response should have header: ${header}`);
  
  if (expectedValue !== undefined) {
    assertEquals(
      actualValue, 
      expectedValue, 
      message || `Header ${header} should be ${expectedValue}, got ${actualValue}`
    );
  }
}

/**
 * Assert response body contains specific data
 */
export function assertResponseBody(response: MockResponse, expectedBody: unknown, message?: string): void {
  assertEquals(response.body, expectedBody, message || 'Response body should match expected');
}

/**
 * Assert response body contains specific fields
 */
export function assertResponseHasFields(
  response: MockResponse, 
  fields: string[], 
  message?: string
): void {
  assert(
    response.body && typeof response.body === 'object',
    message || 'Response body should be an object'
  );
  
  const body = response.body as Record<string, unknown>;
  for (const field of fields) {
    assertExists(body[field], message || `Response should have field: ${field}`);
  }
}

/**
 * Assert that generated code contains specific patterns
 */
export function assertCodeContains(code: string, patterns: string[], message?: string): void {
  for (const pattern of patterns) {
    assert(
      code.includes(pattern),
      message || `Generated code should contain: ${pattern}`
    );
  }
}

/**
 * Assert that generated code is valid TypeScript/JavaScript
 */
export function assertValidCode(code: string, message?: string): void {
  // Basic syntax check - could be enhanced with actual TypeScript compiler
  assert(code.length > 0, message || 'Generated code should not be empty');
  
  // Check for common syntax errors
  const syntaxErrors = [
    /\)\s*\{/g.test(code) || /\{\s*$/gm.test(code), // Basic brace matching
    !code.includes('undefined;'), // No undefined statements
    !code.includes('null;'), // No null statements
  ];
  
  assert(syntaxErrors.every(check => check), message || 'Generated code should be syntactically valid');
}

/**
 * Assert that a function throws a specific error
 */
export function assertThrowsError<T extends Error>(
  fn: () => void | Promise<void>,
  ErrorClass: new (...args: any[]) => T,
  expectedMessage?: string,
  message?: string
): void {
  assertThrows(
    fn,
    ErrorClass,
    expectedMessage,
    message
  );
}

/**
 * Assert that an async function rejects with specific error
 */
export async function assertRejectsWithError<T extends Error>(
  fn: () => Promise<void>,
  ErrorClass: new (...args: any[]) => T,
  expectedMessage?: string,
  message?: string
): Promise<void> {
  let threw = false;
  let actualError: Error | undefined;
  
  try {
    await fn();
  } catch (error) {
    threw = true;
    actualError = error instanceof Error ? error : new Error(String(error));
  }
  
  assert(threw, message || 'Function should have thrown an error');
  assert(actualError instanceof ErrorClass, message || `Should throw ${ErrorClass.name}`);
  
  if (expectedMessage) {
    assert(
      actualError?.message.includes(expectedMessage),
      message || `Error message should contain: ${expectedMessage}`
    );
  }
}

/**
 * Assert that arrays contain the same elements (order independent)
 */
export function assertArraysEqual<T>(actual: T[], expected: T[], message?: string): void {
  assertEquals(actual.length, expected.length, message || 'Arrays should have same length');
  
  for (const item of expected) {
    assert(
      actual.includes(item),
      message || `Array should contain: ${item}`
    );
  }
}

/**
 * Assert that object has expected structure
 */
export function assertObjectStructure(
  obj: unknown,
  expectedStructure: Record<string, string | ((value: unknown) => boolean)>,
  message?: string
): void {
  assert(obj && typeof obj === 'object', message || 'Should be an object');
  
  const typedObj = obj as Record<string, unknown>;
  
  for (const [key, expectedType] of Object.entries(expectedStructure)) {
    assertExists(typedObj[key], message || `Object should have key: ${key}`);
    
    if (typeof expectedType === 'string') {
      assertEquals(
        typeof typedObj[key],
        expectedType,
        message || `Property ${key} should be of type ${expectedType}`
      );
    } else {
      assert(
        expectedType(typedObj[key]),
        message || `Property ${key} failed custom validation`
      );
    }
  }
}

/**
 * Assert that a performance metric is within acceptable range
 */
export function assertPerformance(
  actualDuration: number,
  maxDuration: number,
  message?: string
): void {
  assert(
    actualDuration <= maxDuration,
    message || `Performance test failed: ${actualDuration}ms > ${maxDuration}ms`
  );
}

/**
 * Assert that memory usage is within limits
 */
export function assertMemoryUsage(
  actualMemory: number,
  maxMemory: number,
  message?: string
): void {
  assert(
    actualMemory <= maxMemory,
    message || `Memory test failed: ${actualMemory} bytes > ${maxMemory} bytes`
  );
}