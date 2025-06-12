/**
 * Generator testing utilities
 * 
 * Provides utilities for testing code generators:
 * - Unit testing generator outputs
 * - Validation of generated code quality
 * - File structure testing
 * - Integration with the generation pipeline
 */

import type { AppDefinition } from '../../core/types/index.ts';
import type {
  GeneratorTestCase,
  TestResult
} from '../types/test-types.ts';
import { TestRunner } from '../core/test-runner.ts';
import {
  assertCodeContains,
  assertValidCode,
  assertObjectStructure
} from '../core/assertions.ts';

/**
 * Generator tester class
 */
export class GeneratorTester extends TestRunner {
  private generators: Map<string, any> = new Map();

  constructor(generators: Record<string, any> = {}) {
    super();
    for (const [name, generator] of Object.entries(generators)) {
      this.generators.set(name, generator);
    }
  }

  /**
   * Register a generator for testing
   */
  registerGenerator(name: string, generator: any): void {
    this.generators.set(name, generator);
  }

  /**
   * Test a generator
   */
  async testGenerator<T>(testCase: GeneratorTestCase<T>): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const GeneratorClass = this.generators.get(testCase.generator);
      if (!GeneratorClass) {
        throw new Error(`Generator not found: ${testCase.generator}`);
      }

      // Create generator instance
      const generator = new GeneratorClass(testCase.app);
      
      // Generate output
      const output = await generator.generate();

      // Validate expected output
      if (testCase.expectedOutput !== undefined) {
        this.assertOutputEquals(output, testCase.expectedOutput);
      }

      // Validate custom validation function
      if (testCase.validateOutput) {
        const isValid = await testCase.validateOutput(output);
        if (!isValid) {
          throw new Error('Custom validation failed');
        }
      }

      // Validate generated files if specified
      if (testCase.expectedFiles) {
        this.validateGeneratedFiles(output, testCase.expectedFiles);
      }

      const duration = performance.now() - startTime;
      return {
        name: testCase.name,
        success: true,
        duration,
        metadata: { 
          generator: testCase.generator,
          outputType: typeof output,
          app: testCase.app.name
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
   * Test API generator
   */
  async testAPIGenerator(app: AppDefinition, options: {
    expectedRoutes?: string[];
    expectedMethods?: string[];
    validateHandlers?: boolean;
  } = {}): Promise<TestResult> {
    const testCase: GeneratorTestCase = {
      name: 'API Generator',
      app,
      generator: 'api',
      validateOutput: async (output: any) => {
        // Validate route structure
        if (options.expectedRoutes) {
          for (const route of options.expectedRoutes) {
            if (!output.routes || !output.routes[route]) {
              throw new Error(`Expected route not found: ${route}`);
            }
          }
        }

        // Validate HTTP methods
        if (options.expectedMethods) {
          const allMethods = Object.values(output.routes || {})
            .flatMap((route: any) => Object.keys(route));
          
          for (const method of options.expectedMethods) {
            if (!allMethods.includes(method)) {
              throw new Error(`Expected HTTP method not found: ${method}`);
            }
          }
        }

        // Validate handlers if requested
        if (options.validateHandlers) {
          for (const [routePath, methods] of Object.entries(output.routes || {})) {
            for (const [method, handler] of Object.entries(methods as any)) {
              if (typeof handler !== 'function' && typeof handler !== 'string') {
                throw new Error(`Invalid handler for ${method} ${routePath}`);
              }
            }
          }
        }

        return true;
      }
    };

    return await this.testGenerator(testCase);
  }

  /**
   * Test UI generator
   */
  async testUIGenerator(app: AppDefinition, options: {
    expectedComponents?: string[];
    expectedPages?: string[];
    validateJSX?: boolean;
  } = {}): Promise<TestResult> {
    const testCase: GeneratorTestCase = {
      name: 'UI Generator',
      app,
      generator: 'ui',
      validateOutput: async (output: any) => {
        // Validate components
        if (options.expectedComponents) {
          for (const component of options.expectedComponents) {
            if (!output.components || !output.components[component]) {
              throw new Error(`Expected component not found: ${component}`);
            }
          }
        }

        // Validate pages
        if (options.expectedPages) {
          for (const page of options.expectedPages) {
            if (!output.pages || !output.pages[page]) {
              throw new Error(`Expected page not found: ${page}`);
            }
          }
        }

        // Validate JSX syntax if requested
        if (options.validateJSX) {
          const allComponents = [
            ...Object.values(output.components || {}),
            ...Object.values(output.pages || {})
          ];

          for (const code of allComponents) {
            if (typeof code === 'string') {
              this.validateJSXSyntax(code);
            }
          }
        }

        return true;
      }
    };

    return await this.testGenerator(testCase);
  }

  /**
   * Test database generator
   */
  async testDatabaseGenerator(app: AppDefinition, options: {
    expectedTables?: string[];
    expectedIndexes?: string[];
    validateSQL?: boolean;
  } = {}): Promise<TestResult> {
    const testCase: GeneratorTestCase = {
      name: 'Database Generator',
      app,
      generator: 'database',
      validateOutput: async (output: any) => {
        // Validate tables
        if (options.expectedTables) {
          for (const table of options.expectedTables) {
            if (!output.tables || !output.tables[table]) {
              throw new Error(`Expected table not found: ${table}`);
            }
          }
        }

        // Validate indexes
        if (options.expectedIndexes) {
          const allIndexes = Object.values(output.indexes || {})
            .flatMap((tableIndexes: any) => Object.keys(tableIndexes));
          
          for (const index of options.expectedIndexes) {
            if (!allIndexes.includes(index)) {
              throw new Error(`Expected index not found: ${index}`);
            }
          }
        }

        // Validate SQL syntax if requested
        if (options.validateSQL) {
          for (const [tableName, sql] of Object.entries(output.tables || {})) {
            if (typeof sql === 'string') {
              this.validateSQLSyntax(sql);
            }
          }
        }

        return true;
      }
    };

    return await this.testGenerator(testCase);
  }

  /**
   * Test TypeScript type generator
   */
  async testTypeGenerator(app: AppDefinition, options: {
    expectedTypes?: string[];
    expectedInterfaces?: string[];
    validateTypeScript?: boolean;
  } = {}): Promise<TestResult> {
    const testCase: GeneratorTestCase = {
      name: 'Type Generator',
      app,
      generator: 'types',
      validateOutput: async (output: any) => {
        // Validate types
        if (options.expectedTypes) {
          const typeCode = typeof output === 'string' ? output : output.types || '';
          
          for (const type of options.expectedTypes) {
            if (!typeCode.includes(`type ${type}`) && !typeCode.includes(`interface ${type}`)) {
              throw new Error(`Expected type not found: ${type}`);
            }
          }
        }

        // Validate interfaces
        if (options.expectedInterfaces) {
          const typeCode = typeof output === 'string' ? output : output.types || '';
          
          for (const iface of options.expectedInterfaces) {
            if (!typeCode.includes(`interface ${iface}`)) {
              throw new Error(`Expected interface not found: ${iface}`);
            }
          }
        }

        // Validate TypeScript syntax if requested
        if (options.validateTypeScript) {
          const code = typeof output === 'string' ? output : JSON.stringify(output);
          this.validateTypeScriptSyntax(code);
        }

        return true;
      }
    };

    return await this.testGenerator(testCase);
  }

  /**
   * Test multiple generators together
   */
  async testGeneratorPipeline(
    app: AppDefinition,
    generatorNames: string[],
    options: {
      validateIntegration?: boolean;
      expectedOutputs?: Record<string, any>;
    } = {}
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const outputs: Record<string, any> = {};

    // Run each generator
    for (const generatorName of generatorNames) {
      const testCase: GeneratorTestCase = {
        name: `Pipeline: ${generatorName}`,
        app,
        generator: generatorName,
        expectedOutput: options.expectedOutputs?.[generatorName]
      };

      const result = await this.testGenerator(testCase);
      results.push(result);

      // Store output for integration testing
      if (result.success && result.metadata) {
        outputs[generatorName] = result.metadata;
      }
    }

    // Test integration if requested
    if (options.validateIntegration) {
      const integrationResult = await this.testGeneratorIntegration(app, outputs);
      results.push(integrationResult);
    }

    return results;
  }

  /**
   * Test generator integration
   */
  async testGeneratorIntegration(
    app: AppDefinition,
    outputs: Record<string, any>
  ): Promise<TestResult> {
    const startTime = performance.now();

    try {
      // Check that API routes match database tables
      if (outputs.api && outputs.database) {
        this.validateAPIDBIntegration(outputs.api, outputs.database);
      }

      // Check that UI components reference valid API endpoints
      if (outputs.ui && outputs.api) {
        this.validateUIAPIIntegration(outputs.ui, outputs.api);
      }

      // Check that types match entity definitions
      if (outputs.types && app.entities) {
        this.validateTypesEntityIntegration(outputs.types, app.entities);
      }

      const duration = performance.now() - startTime;
      return {
        name: 'Generator Integration',
        success: true,
        duration,
        metadata: { generators: Object.keys(outputs) }
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        name: 'Generator Integration',
        success: false,
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Override test execution for generator-specific tests
   */
  protected async executeTest(testCase: any): Promise<void> {
    if ('generator' in testCase) {
      const result = await this.testGenerator(testCase as GeneratorTestCase);
      if (!result.success) {
        throw result.error || new Error('Generator test failed');
      }
    } else {
      throw new Error(`Unknown test case type for: ${testCase.name}`);
    }
  }

  // Private validation methods

  private assertOutputEquals(actual: any, expected: any): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Output mismatch. Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`);
    }
  }

  private validateGeneratedFiles(output: any, expectedFiles: string[]): void {
    const outputFiles = typeof output === 'object' && output.files 
      ? Object.keys(output.files)
      : [];

    for (const expectedFile of expectedFiles) {
      if (!outputFiles.includes(expectedFile)) {
        throw new Error(`Expected file not generated: ${expectedFile}`);
      }
    }
  }

  private validateJSXSyntax(code: string): void {
    // Basic JSX validation
    assertValidCode(code);
    
    // Check for JSX-specific patterns
    const jsxPatterns = [
      /<[A-Z][a-zA-Z]*/, // Component tags
      /className=/, // JSX attributes
      /\{.*\}/, // JSX expressions
    ];

    let hasJSX = false;
    for (const pattern of jsxPatterns) {
      if (pattern.test(code)) {
        hasJSX = true;
        break;
      }
    }

    if (!hasJSX && code.includes('<')) {
      throw new Error('Code appears to contain JSX but lacks proper JSX syntax');
    }
  }

  private validateSQLSyntax(sql: string): void {
    // Basic SQL validation
    if (!sql.trim()) {
      throw new Error('SQL cannot be empty');
    }

    // Check for SQL keywords
    const sqlKeywords = ['CREATE', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TABLE'];
    const hasKeyword = sqlKeywords.some(keyword => 
      sql.toUpperCase().includes(keyword)
    );

    if (!hasKeyword) {
      throw new Error('SQL must contain valid SQL keywords');
    }

    // Basic syntax checks
    if (sql.includes(';;')) {
      throw new Error('SQL contains double semicolons');
    }
  }

  private validateTypeScriptSyntax(code: string): void {
    assertValidCode(code);
    
    // Check for TypeScript-specific patterns
    const tsPatterns = [
      /interface\s+\w+/, // Interface declarations
      /type\s+\w+/, // Type aliases
      /:\s*\w+/, // Type annotations
    ];

    let hasTS = false;
    for (const pattern of tsPatterns) {
      if (pattern.test(code)) {
        hasTS = true;
        break;
      }
    }

    if (code.includes('any') && !hasTS) {
      throw new Error('Code contains TypeScript syntax but lacks proper type definitions');
    }
  }

  private validateAPIDBIntegration(apiOutput: any, dbOutput: any): void {
    // Check that API routes correspond to database tables
    const routes = Object.keys(apiOutput.routes || {});
    const tables = Object.keys(dbOutput.tables || {});

    for (const route of routes) {
      const entityName = route.replace(/^\/api\//, '').replace(/s$/, ''); // Remove /api/ prefix and trailing 's'
      const tableName = entityName.toLowerCase();
      
      if (!tables.includes(tableName)) {
        throw new Error(`API route ${route} has no corresponding database table`);
      }
    }
  }

  private validateUIAPIIntegration(uiOutput: any, apiOutput: any): void {
    // Check that UI components reference valid API endpoints
    const routes = Object.keys(apiOutput.routes || {});
    const components = Object.values(uiOutput.components || {});

    for (const component of components) {
      if (typeof component === 'string') {
        // Look for API calls in component code
        const apiCalls = component.match(/\/api\/\w+/g) || [];
        
        for (const apiCall of apiCalls) {
          if (!routes.includes(apiCall)) {
            throw new Error(`UI component references invalid API endpoint: ${apiCall}`);
          }
        }
      }
    }
  }

  private validateTypesEntityIntegration(typesOutput: any, entities: Record<string, any>): void {
    // Check that generated types match entity definitions
    const typeCode = typeof typesOutput === 'string' ? typesOutput : typesOutput.types || '';
    const entityNames = Object.keys(entities);

    for (const entityName of entityNames) {
      if (!typeCode.includes(`interface ${entityName}`) && !typeCode.includes(`type ${entityName}`)) {
        throw new Error(`Type definition missing for entity: ${entityName}`);
      }
    }
  }
}

/**
 * Create a generator tester with common generators
 */
export function createGeneratorTester(generators: Record<string, any> = {}): GeneratorTester {
  return new GeneratorTester(generators);
}

/**
 * Quick utility to test a single generator
 */
export async function testGenerator<T>(
  app: AppDefinition,
  generatorName: string,
  GeneratorClass: any,
  options: Partial<GeneratorTestCase<T>> = {}
): Promise<T> {
  const tester = createGeneratorTester({ [generatorName]: GeneratorClass });
  
  const testCase: GeneratorTestCase<T> = {
    name: `Test ${generatorName}`,
    app,
    generator: generatorName,
    ...options
  };

  const result = await tester.testGenerator(testCase);
  
  if (!result.success) {
    throw result.error || new Error('Generator test failed');
  }

  // Return the generated output (would need to be stored in result)
  const generator = new GeneratorClass(app);
  return await generator.generate();
}