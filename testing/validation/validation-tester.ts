/**
 * Validation testing utilities
 * 
 * Provides utilities for testing validation logic:
 * - Field validation testing
 * - Business rule validation
 * - Entity constraint testing
 * - Custom validator testing
 */

import type { AppDefinition } from '../../core/types/index.ts';
import type {
  ValidationTestCase,
  TestResult
} from '../types/test-types.ts';
import { TestRunner } from '../core/test-runner.ts';
import { assertEquals, assert } from '../core/assertions.ts';

/**
 * Validation tester class
 */
export class ValidationTester extends TestRunner {
  private app: AppDefinition;
  private validators: Map<string, any> = new Map();

  constructor(app: AppDefinition, validators: Record<string, any> = {}) {
    super();
    this.app = app;
    for (const [name, validator] of Object.entries(validators)) {
      this.validators.set(name, validator);
    }
  }

  /**
   * Register a validator
   */
  registerValidator(name: string, validator: any): void {
    this.validators.set(name, validator);
  }

  /**
   * Test field validation
   */
  async testFieldValidation(testCase: ValidationTestCase): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const entity = this.app.entities?.[testCase.entity];
      if (!entity) {
        throw new Error(`Entity not found: ${testCase.entity}`);
      }

      const field = testCase.field ? entity.fields?.[testCase.field] : null;
      if (testCase.field && !field) {
        throw new Error(`Field not found: ${testCase.entity}.${testCase.field}`);
      }

      // Perform validation
      const result = await this.validateField(
        testCase.entity,
        testCase.field || 'entity',
        testCase.value,
        field,
        testCase.context || {}
      );

      // Check expected validation result
      assertEquals(
        result.isValid,
        testCase.expectedValid,
        `Validation result mismatch for ${testCase.entity}.${testCase.field || 'entity'}`
      );

      // Check expected errors
      if (testCase.expectedErrors) {
        for (const expectedError of testCase.expectedErrors) {
          const hasError = result.errors.some(error =>
            error.includes(expectedError)
          );
          assert(hasError, `Expected validation error not found: ${expectedError}`);
        }
      }

      const duration = performance.now() - startTime;
      return {
        name: testCase.name,
        success: true,
        duration,
        metadata: {
          entity: testCase.entity,
          field: testCase.field,
          valid: result.isValid,
          errorCount: result.errors.length
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
   * Test entity validation
   */
  async testEntityValidation(
    entityName: string,
    entityData: Record<string, unknown>,
    expectedValid: boolean,
    expectedErrors: string[] = []
  ): Promise<TestResult> {
    const testCase: ValidationTestCase = {
      name: `Entity Validation: ${entityName}`,
      entity: entityName,
      value: entityData,
      expectedValid,
      expectedErrors
    };

    return await this.testFieldValidation(testCase);
  }

  /**
   * Test required field validation
   */
  async testRequiredFields(entityName: string): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const entity = this.app.entities?.[entityName];
    
    if (!entity?.fields) {
      return results;
    }

    for (const [fieldName, field] of Object.entries(entity.fields)) {
      if (field.required) {
        // Test with missing value
        results.push(await this.testFieldValidation({
          name: `Required field: ${entityName}.${fieldName} (missing)`,
          entity: entityName,
          field: fieldName,
          value: undefined,
          expectedValid: false,
          expectedErrors: ['required']
        }));

        // Test with null value
        results.push(await this.testFieldValidation({
          name: `Required field: ${entityName}.${fieldName} (null)`,
          entity: entityName,
          field: fieldName,
          value: null,
          expectedValid: false,
          expectedErrors: ['required']
        }));

        // Test with empty string (for string fields)
        if (field.type === 'string') {
          results.push(await this.testFieldValidation({
            name: `Required field: ${entityName}.${fieldName} (empty string)`,
            entity: entityName,
            field: fieldName,
            value: '',
            expectedValid: false,
            expectedErrors: ['required']
          }));
        }
      }
    }

    return results;
  }

  /**
   * Test type validation
   */
  async testTypeValidation(entityName: string): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const entity = this.app.entities?.[entityName];
    
    if (!entity?.fields) {
      return results;
    }

    for (const [fieldName, field] of Object.entries(entity.fields)) {
      const testCases = this.getTypeTestCases(field.type, fieldName);
      
      for (const testCase of testCases) {
        results.push(await this.testFieldValidation({
          name: `Type validation: ${entityName}.${fieldName} (${testCase.description})`,
          entity: entityName,
          field: fieldName,
          value: testCase.value,
          expectedValid: testCase.expectedValid,
          expectedErrors: testCase.expectedErrors
        }));
      }
    }

    return results;
  }

  /**
   * Test enum validation
   */
  async testEnumValidation(entityName: string, fieldName: string): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const field = this.app.entities?.[entityName]?.fields?.[fieldName];
    
    if (!field || field.type !== 'enum' || !field.values) {
      return results;
    }

    // Test valid enum values
    for (const validValue of field.values) {
      results.push(await this.testFieldValidation({
        name: `Enum validation: ${entityName}.${fieldName} (valid: ${validValue})`,
        entity: entityName,
        field: fieldName,
        value: validValue,
        expectedValid: true
      }));
    }

    // Test invalid enum values
    const invalidValues = ['invalid', 123, null, undefined, ''];
    for (const invalidValue of invalidValues) {
      results.push(await this.testFieldValidation({
        name: `Enum validation: ${entityName}.${fieldName} (invalid: ${invalidValue})`,
        entity: entityName,
        field: fieldName,
        value: invalidValue,
        expectedValid: false,
        expectedErrors: ['enum']
      }));
    }

    return results;
  }

  /**
   * Test unique constraint validation
   */
  async testUniqueConstraints(entityName: string): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const entity = this.app.entities?.[entityName];
    
    if (!entity?.fields) {
      return results;
    }

    for (const [fieldName, field] of Object.entries(entity.fields)) {
      if (field.unique) {
        // Test with existing value (should fail)
        results.push(await this.testFieldValidation({
          name: `Unique constraint: ${entityName}.${fieldName} (duplicate)`,
          entity: entityName,
          field: fieldName,
          value: 'existing-value',
          context: { existingValues: ['existing-value'] },
          expectedValid: false,
          expectedErrors: ['unique']
        }));

        // Test with new value (should pass)
        results.push(await this.testFieldValidation({
          name: `Unique constraint: ${entityName}.${fieldName} (new)`,
          entity: entityName,
          field: fieldName,
          value: 'new-value',
          context: { existingValues: ['existing-value'] },
          expectedValid: true
        }));
      }
    }

    return results;
  }

  /**
   * Test custom validation rules
   */
  async testCustomValidation(
    entityName: string,
    validationRules: Array<{
      name: string;
      validator: (value: unknown, context: Record<string, unknown>) => boolean | string[];
      testCases: Array<{
        value: unknown;
        context?: Record<string, unknown>;
        expectedValid: boolean;
        expectedErrors?: string[];
      }>;
    }>
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const rule of validationRules) {
      for (const testCase of rule.testCases) {
        const startTime = performance.now();

        try {
          const validationResult = rule.validator(testCase.value, testCase.context || {});
          
          let isValid: boolean;
          let errors: string[] = [];

          if (typeof validationResult === 'boolean') {
            isValid = validationResult;
          } else {
            isValid = validationResult.length === 0;
            errors = validationResult;
          }

          // Check expected validation result
          assertEquals(
            isValid,
            testCase.expectedValid,
            `Custom validation result mismatch for ${rule.name}`
          );

          // Check expected errors
          if (testCase.expectedErrors) {
            for (const expectedError of testCase.expectedErrors) {
              const hasError = errors.some(error => error.includes(expectedError));
              assert(hasError, `Expected validation error not found: ${expectedError}`);
            }
          }

          const duration = performance.now() - startTime;
          results.push({
            name: `Custom validation: ${rule.name}`,
            success: true,
            duration,
            metadata: {
              entity: entityName,
              rule: rule.name,
              valid: isValid,
              errorCount: errors.length
            }
          });

        } catch (error) {
          const duration = performance.now() - startTime;
          results.push({
            name: `Custom validation: ${rule.name}`,
            success: false,
            duration,
            error: error instanceof Error ? error : new Error(String(error))
          });
        }
      }
    }

    return results;
  }

  /**
   * Test business rule validation
   */
  async testBusinessRules(
    entityName: string,
    businessRules: Array<{
      name: string;
      rule: (entity: Record<string, unknown>, context: Record<string, unknown>) => boolean | string[];
      testCases: Array<{
        entity: Record<string, unknown>;
        context?: Record<string, unknown>;
        expectedValid: boolean;
        expectedErrors?: string[];
      }>;
    }>
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const businessRule of businessRules) {
      for (const testCase of businessRule.testCases) {
        const startTime = performance.now();

        try {
          const validationResult = businessRule.rule(testCase.entity, testCase.context || {});
          
          let isValid: boolean;
          let errors: string[] = [];

          if (typeof validationResult === 'boolean') {
            isValid = validationResult;
          } else {
            isValid = validationResult.length === 0;
            errors = validationResult;
          }

          // Check expected validation result
          assertEquals(
            isValid,
            testCase.expectedValid,
            `Business rule validation result mismatch for ${businessRule.name}`
          );

          // Check expected errors
          if (testCase.expectedErrors) {
            for (const expectedError of testCase.expectedErrors) {
              const hasError = errors.some(error => error.includes(expectedError));
              assert(hasError, `Expected business rule error not found: ${expectedError}`);
            }
          }

          const duration = performance.now() - startTime;
          results.push({
            name: `Business rule: ${businessRule.name}`,
            success: true,
            duration,
            metadata: {
              entity: entityName,
              rule: businessRule.name,
              valid: isValid,
              errorCount: errors.length
            }
          });

        } catch (error) {
          const duration = performance.now() - startTime;
          results.push({
            name: `Business rule: ${businessRule.name}`,
            success: false,
            duration,
            error: error instanceof Error ? error : new Error(String(error))
          });
        }
      }
    }

    return results;
  }

  /**
   * Override test execution for validation-specific tests
   */
  protected async executeTest(testCase: any): Promise<void> {
    if ('entity' in testCase && 'expectedValid' in testCase) {
      const result = await this.testFieldValidation(testCase as ValidationTestCase);
      if (!result.success) {
        throw result.error || new Error('Validation test failed');
      }
    } else {
      throw new Error(`Unknown test case type for: ${testCase.name}`);
    }
  }

  // Private helper methods

  /**
   * Validate a field value
   */
  private async validateField(
    entityName: string,
    fieldName: string,
    value: unknown,
    fieldDefinition: any,
    context: Record<string, unknown>
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // If this is an entity-level validation (no specific field)
    if (!fieldDefinition) {
      return this.validateEntity(entityName, value as Record<string, unknown>, context);
    }

    // Required validation
    if (fieldDefinition.required && (value === undefined || value === null || value === '')) {
      errors.push('required');
    }

    // Type validation
    if (value !== undefined && value !== null) {
      const typeErrors = this.validateType(value, fieldDefinition.type);
      errors.push(...typeErrors);
    }

    // Enum validation
    if (fieldDefinition.type === 'enum' && fieldDefinition.values && value !== undefined && value !== null) {
      if (!fieldDefinition.values.includes(value)) {
        errors.push('enum');
      }
    }

    // Unique validation
    if (fieldDefinition.unique && context.existingValues) {
      const existing = context.existingValues as unknown[];
      if (existing.includes(value)) {
        errors.push('unique');
      }
    }

    // Min/Max validation for numbers
    if (fieldDefinition.type === 'number' && typeof value === 'number') {
      if (fieldDefinition.min !== undefined && value < fieldDefinition.min) {
        errors.push('min');
      }
      if (fieldDefinition.max !== undefined && value > fieldDefinition.max) {
        errors.push('max');
      }
    }

    // Length validation for strings
    if (fieldDefinition.type === 'string' && typeof value === 'string') {
      if (fieldDefinition.minLength !== undefined && value.length < fieldDefinition.minLength) {
        errors.push('minLength');
      }
      if (fieldDefinition.maxLength !== undefined && value.length > fieldDefinition.maxLength) {
        errors.push('maxLength');
      }
    }

    // Pattern validation for strings
    if (fieldDefinition.type === 'string' && fieldDefinition.pattern && typeof value === 'string') {
      const regex = new RegExp(fieldDefinition.pattern);
      if (!regex.test(value)) {
        errors.push('pattern');
      }
    }

    // Custom validation
    if (fieldDefinition.validate && typeof fieldDefinition.validate === 'function') {
      try {
        const customResult = await fieldDefinition.validate(value, context);
        if (customResult !== true) {
          errors.push(typeof customResult === 'string' ? customResult : 'custom');
        }
      } catch (error) {
        errors.push('custom');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate an entire entity
   */
  private validateEntity(
    entityName: string,
    entityData: Record<string, unknown>,
    context: Record<string, unknown>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const entity = this.app.entities?.[entityName];

    if (!entity) {
      errors.push(`Entity ${entityName} not found`);
      return { isValid: false, errors };
    }

    // Validate each field
    if (entity.fields) {
      for (const [fieldName, fieldDefinition] of Object.entries(entity.fields)) {
        const fieldValue = entityData[fieldName];
        const fieldResult = this.validateField(entityName, fieldName, fieldValue, fieldDefinition, context);
        
        if (!fieldResult.isValid) {
          errors.push(...fieldResult.errors.map(error => `${fieldName}: ${error}`));
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate value type
   */
  private validateType(value: unknown, expectedType: string): string[] {
    const errors: string[] = [];

    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push('type');
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push('type');
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push('type');
        }
        break;
      case 'date':
        if (!(value instanceof Date) && !this.isValidDateString(value)) {
          errors.push('type');
        }
        break;
      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          errors.push('type');
        }
        break;
      case 'url':
        if (typeof value !== 'string' || !this.isValidURL(value)) {
          errors.push('type');
        }
        break;
      case 'json':
        try {
          if (typeof value === 'string') {
            JSON.parse(value);
          } else if (typeof value !== 'object') {
            errors.push('type');
          }
        } catch {
          errors.push('type');
        }
        break;
    }

    return errors;
  }

  /**
   * Get test cases for a specific type
   */
  private getTypeTestCases(type: string, fieldName: string): Array<{
    description: string;
    value: unknown;
    expectedValid: boolean;
    expectedErrors?: string[];
  }> {
    const testCases: Array<{
      description: string;
      value: unknown;
      expectedValid: boolean;
      expectedErrors?: string[];
    }> = [];

    switch (type) {
      case 'string':
        testCases.push(
          { description: 'valid string', value: 'hello', expectedValid: true },
          { description: 'empty string', value: '', expectedValid: true },
          { description: 'number as string', value: '123', expectedValid: true },
          { description: 'actual number', value: 123, expectedValid: false, expectedErrors: ['type'] },
          { description: 'boolean', value: true, expectedValid: false, expectedErrors: ['type'] }
        );
        break;
      case 'number':
        testCases.push(
          { description: 'valid integer', value: 42, expectedValid: true },
          { description: 'valid float', value: 3.14, expectedValid: true },
          { description: 'zero', value: 0, expectedValid: true },
          { description: 'negative', value: -5, expectedValid: true },
          { description: 'string', value: '123', expectedValid: false, expectedErrors: ['type'] },
          { description: 'NaN', value: NaN, expectedValid: false, expectedErrors: ['type'] }
        );
        break;
      case 'boolean':
        testCases.push(
          { description: 'true', value: true, expectedValid: true },
          { description: 'false', value: false, expectedValid: true },
          { description: 'string true', value: 'true', expectedValid: false, expectedErrors: ['type'] },
          { description: 'number 1', value: 1, expectedValid: false, expectedErrors: ['type'] }
        );
        break;
      case 'email':
        testCases.push(
          { description: 'valid email', value: 'test@example.com', expectedValid: true },
          { description: 'email with subdomain', value: 'user@mail.example.com', expectedValid: true },
          { description: 'invalid email - no @', value: 'invalid-email', expectedValid: false, expectedErrors: ['type'] },
          { description: 'invalid email - no domain', value: 'test@', expectedValid: false, expectedErrors: ['type'] },
          { description: 'number', value: 123, expectedValid: false, expectedErrors: ['type'] }
        );
        break;
    }

    return testCases;
  }

  // Utility validation methods

  private isValidDateString(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  private isValidURL(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create a validation tester for an app
 */
export function createValidationTester(
  app: AppDefinition,
  validators: Record<string, any> = {}
): ValidationTester {
  return new ValidationTester(app, validators);
}

/**
 * Quick utility to test field validation
 */
export async function testFieldValidation(
  app: AppDefinition,
  testCase: ValidationTestCase
): Promise<TestResult> {
  const tester = createValidationTester(app);
  return await tester.testFieldValidation(testCase);
}