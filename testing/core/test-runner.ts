/**
 * Core test runner for Solidcore3 testing framework
 */

import type {
  TestCase,
  TestResult,
  TestSuite,
  TestConfig,
  TestContext
} from '../types/test-types.ts';
import { MockDatabase } from './mocks.ts';
import { createTestApp } from '../utils/test-utils.ts';

export class TestRunner {
  private config: TestConfig;
  private suites: TestSuite[] = [];
  private results: TestResult[] = [];
  private context?: TestContext;

  constructor(config: TestConfig = {}) {
    this.config = {
      parallel: false,
      timeout: 10000,
      retries: 0,
      verbose: false,
      coverage: false,
      reporter: 'default',
      ...config
    };
  }

  /**
   * Add a test suite to the runner
   */
  addSuite(suite: TestSuite): void {
    this.suites.push(suite);
  }

  /**
   * Run all test suites
   */
  async run(): Promise<TestResult[]> {
    console.log(`\n🧪 Running ${this.suites.length} test suite(s)\n`);
    
    // Setup test context
    await this.setupContext();

    try {
      if (this.config.parallel) {
        await this.runParallel();
      } else {
        await this.runSequential();
      }
    } finally {
      await this.teardownContext();
    }

    this.printSummary();
    return this.results;
  }

  /**
   * Run a single test case
   */
  async runTest(testCase: TestCase): Promise<TestResult> {
    const startTime = performance.now();
    
    if (this.config.verbose) {
      console.log(`  📝 ${testCase.name}`);
    }

    try {
      // Apply timeout
      const timeout = testCase.timeout || this.config.timeout!;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout);
      });

      // Run the test with timeout
      const testPromise = this.executeTest(testCase);
      await Promise.race([testPromise, timeoutPromise]);

      const duration = performance.now() - startTime;
      const result: TestResult = {
        name: testCase.name,
        success: true,
        duration
      };

      if (this.config.verbose) {
        console.log(`    ✅ PASS (${duration.toFixed(2)}ms)`);
      }

      this.results.push(result);
      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      const result: TestResult = {
        name: testCase.name,
        success: false,
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      };

      if (this.config.verbose) {
        console.log(`    ❌ FAIL (${duration.toFixed(2)}ms)`);
        console.log(`       ${result.error?.message}`);
      }

      this.results.push(result);
      return result;
    }
  }

  /**
   * Execute a test case based on its type
   */
  private async executeTest(testCase: TestCase): Promise<void> {
    // This is overridden by specific test runners
    throw new Error(`Test execution not implemented for test: ${testCase.name}`);
  }

  /**
   * Run suites sequentially
   */
  private async runSequential(): Promise<void> {
    for (const suite of this.suites) {
      await this.runSuite(suite);
    }
  }

  /**
   * Run suites in parallel
   */
  private async runParallel(): Promise<void> {
    await Promise.all(this.suites.map(suite => this.runSuite(suite)));
  }

  /**
   * Run a single test suite
   */
  private async runSuite(suite: TestSuite): Promise<void> {
    console.log(`📦 ${suite.name}`);
    if (suite.description) {
      console.log(`   ${suite.description}`);
    }

    // Filter tests
    const tests = this.filterTests(suite.tests);

    if (tests.length === 0) {
      console.log(`   ⚠️  No tests to run (filtered out)`);
      return;
    }

    try {
      // Setup
      if (suite.setup) {
        await suite.setup();
      }

      // Run tests
      const suiteResults = this.config.parallel
        ? await Promise.all(tests.map(test => this.runTest(test)))
        : await Promise.all(tests.map(test => this.runTest(test)));

      // Summary for this suite
      const passed = suiteResults.filter(r => r.success).length;
      const failed = suiteResults.length - passed;
      
      console.log(`   📊 ${passed} passed, ${failed} failed\n`);

    } finally {
      // Teardown
      if (suite.teardown) {
        try {
          await suite.teardown();
        } catch (error) {
          console.error(`   ⚠️  Suite teardown failed:`, error);
        }
      }
    }
  }

  /**
   * Filter tests based on configuration
   */
  private filterTests(tests: TestCase[]): TestCase[] {
    let filtered = tests;

    // Skip tests
    filtered = filtered.filter(test => !test.skip);

    // Only tests (if any exist, run only those)
    const onlyTests = filtered.filter(test => test.only);
    if (onlyTests.length > 0) {
      filtered = onlyTests;
    }

    // Tag filter
    if (this.config.filter?.tags) {
      filtered = filtered.filter(test => 
        test.tags?.some(tag => this.config.filter!.tags!.includes(tag))
      );
    }

    // Pattern filter
    if (this.config.filter?.pattern) {
      const pattern = new RegExp(this.config.filter.pattern, 'i');
      filtered = filtered.filter(test => 
        pattern.test(test.name) || pattern.test(test.description || '')
      );
    }

    return filtered;
  }

  /**
   * Setup test context
   */
  private async setupContext(): Promise<void> {
    const database = new MockDatabase();
    const app = createTestApp();

    this.context = {
      app,
      database,
      config: this.config
    };

    if (this.config.setup?.database) {
      // Initialize database with test schema
      await this.setupTestDatabase();
    }
  }

  /**
   * Teardown test context
   */
  private async teardownContext(): Promise<void> {
    if (this.context?.database) {
      this.context.database.reset();
    }
  }

  /**
   * Setup test database
   */
  private async setupTestDatabase(): Promise<void> {
    if (!this.context) return;

    // Create tables for test entities
    for (const [entityName, entity] of Object.entries(this.context.app.entities || {})) {
      const fields = Object.entries(entity.fields || {})
        .map(([name, field]) => {
          let type = 'TEXT';
          if (field.type === 'number') type = 'INTEGER';
          if (field.type === 'boolean') type = 'BOOLEAN';
          if (field.type === 'date') type = 'DATETIME';
          
          const constraints = [];
          if (field.required) constraints.push('NOT NULL');
          if (field.unique) constraints.push('UNIQUE');
          
          return `${name} ${type} ${constraints.join(' ')}`;
        })
        .join(', ');

      const createTableSQL = `CREATE TABLE IF NOT EXISTS ${entityName.toLowerCase()} (${fields})`;
      await this.context.database.execute(createTableSQL);
    }
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    const duration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n📊 Test Summary:`);
    console.log(`   Total: ${total}`);
    console.log(`   Passed: ${passed} ✅`);
    console.log(`   Failed: ${failed} ❌`);
    console.log(`   Duration: ${duration.toFixed(2)}ms`);

    if (failed > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   • ${r.name}: ${r.error?.message}`);
        });
    }

    console.log(`\n${failed === 0 ? '🎉 All tests passed!' : '💥 Some tests failed'}\n`);
  }

  /**
   * Get test results
   */
  getResults(): TestResult[] {
    return [...this.results];
  }

  /**
   * Get test context
   */
  getContext(): TestContext | undefined {
    return this.context;
  }
}

/**
 * Convenience function to create and run tests
 */
export async function runTests(
  suites: TestSuite[],
  config: TestConfig = {}
): Promise<TestResult[]> {
  const runner = new TestRunner(config);
  suites.forEach(suite => runner.addSuite(suite));
  return await runner.run();
}

/**
 * Create a test suite
 */
export function describe(
  name: string,
  fn: (suite: TestSuiteBuilder) => void,
  description?: string
): TestSuite {
  const builder = new TestSuiteBuilder(name, description);
  fn(builder);
  return builder.build();
}

/**
 * Test suite builder for fluent API
 */
export class TestSuiteBuilder {
  private tests: TestCase[] = [];
  private setupFn?: () => Promise<void> | void;
  private teardownFn?: () => Promise<void> | void;

  constructor(
    private name: string,
    private description?: string
  ) {}

  /**
   * Add a test case
   */
  test(name: string, fn: () => Promise<void> | void, options: Partial<TestCase> = {}): this {
    this.tests.push({
      name,
      ...options,
      // Store the test function for later execution
      _fn: fn
    } as TestCase & { _fn: () => Promise<void> | void });
    return this;
  }

  /**
   * Add setup function
   */
  setup(fn: () => Promise<void> | void): this {
    this.setupFn = fn;
    return this;
  }

  /**
   * Add teardown function
   */
  teardown(fn: () => Promise<void> | void): this {
    this.teardownFn = fn;
    return this;
  }

  /**
   * Build the test suite
   */
  build(): TestSuite {
    return {
      name: this.name,
      description: this.description,
      setup: this.setupFn,
      teardown: this.teardownFn,
      tests: this.tests
    };
  }
}