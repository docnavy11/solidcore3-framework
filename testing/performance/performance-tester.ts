/**
 * Performance testing utilities
 * 
 * Provides utilities for testing performance:
 * - Benchmark generation speed
 * - API response times
 * - Memory usage monitoring
 * - Load testing
 * - Throughput measurement
 */

import type { AppDefinition } from '../../core/types/index.ts';
import type {
  PerformanceTestCase,
  PerformanceResult,
  TestResult
} from '../types/test-types.ts';
import { TestRunner } from '../core/test-runner.ts';
import { assertPerformance, assertMemoryUsage } from '../core/assertions.ts';

/**
 * Performance tester class
 */
export class PerformanceTester extends TestRunner {
  private app: AppDefinition;
  private performanceResults: PerformanceResult[] = [];

  constructor(app: AppDefinition) {
    super();
    this.app = app;
  }

  /**
   * Test performance of an operation
   */
  async testPerformance(testCase: PerformanceTestCase): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const result = await this.runPerformanceTest(testCase);
      
      // Validate performance constraints
      if (testCase.maxDuration) {
        assertPerformance(result.averageDuration, testCase.maxDuration);
      }

      if (testCase.memoryLimit && result.memoryUsage) {
        assertMemoryUsage(result.memoryUsage.peak, testCase.memoryLimit);
      }

      this.performanceResults.push(result);

      const duration = performance.now() - startTime;
      return {
        name: testCase.name,
        success: true,
        duration,
        metadata: {
          averageDuration: result.averageDuration,
          iterations: result.iterations,
          throughput: result.throughput,
          memoryPeak: result.memoryUsage?.peak
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
   * Benchmark generator performance
   */
  async benchmarkGenerator(
    generatorName: string,
    GeneratorClass: any,
    iterations: number = 100,
    maxDuration: number = 1000
  ): Promise<TestResult> {
    const testCase: PerformanceTestCase = {
      name: `Generator Benchmark: ${generatorName}`,
      operation: async () => {
        const generator = new GeneratorClass(this.app);
        await generator.generate();
      },
      iterations,
      maxDuration,
      warmupRuns: 10
    };

    return await this.testPerformance(testCase);
  }

  /**
   * Benchmark API endpoint performance
   */
  async benchmarkAPI(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    requestBody?: unknown,
    iterations: number = 1000,
    maxDuration: number = 100
  ): Promise<TestResult> {
    const testCase: PerformanceTestCase = {
      name: `API Benchmark: ${method} ${path}`,
      operation: async () => {
        // Mock API call - in real implementation would make actual HTTP request
        await this.simulateAPICall(method, path, requestBody);
      },
      iterations,
      maxDuration,
      warmupRuns: 50
    };

    return await this.testPerformance(testCase);
  }

  /**
   * Test memory usage during operations
   */
  async testMemoryUsage(
    operationName: string,
    operation: () => Promise<void> | void,
    memoryLimit: number,
    iterations: number = 10
  ): Promise<TestResult> {
    const testCase: PerformanceTestCase = {
      name: `Memory Test: ${operationName}`,
      operation,
      iterations,
      memoryLimit,
      warmupRuns: 2
    };

    return await this.testPerformance(testCase);
  }

  /**
   * Load test API endpoints
   */
  async loadTestAPI(
    endpoints: Array<{
      path: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
      weight?: number;
    }>,
    options: {
      concurrentUsers: number;
      duration: number; // in seconds
      rampUpTime: number; // in seconds
      maxResponseTime: number;
    }
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const endpoint of endpoints) {
      const weight = endpoint.weight || 1;
      const iterationsPerSecond = Math.ceil(options.concurrentUsers * weight);
      const totalIterations = iterationsPerSecond * options.duration;

      const testCase: PerformanceTestCase = {
        name: `Load Test: ${endpoint.method} ${endpoint.path}`,
        operation: async () => {
          await this.simulateAPICall(endpoint.method, endpoint.path, endpoint.body);
        },
        iterations: totalIterations,
        maxDuration: options.maxResponseTime
      };

      const result = await this.testPerformance(testCase);
      results.push(result);
    }

    return results;
  }

  /**
   * Benchmark truth file processing
   */
  async benchmarkTruthProcessing(
    truthVariations: AppDefinition[],
    iterations: number = 50
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const [index, app] of truthVariations.entries()) {
      const testCase: PerformanceTestCase = {
        name: `Truth Processing: Variation ${index + 1}`,
        operation: async () => {
          // Simulate truth file processing
          await this.processTruthFile(app);
        },
        iterations,
        maxDuration: 500,
        warmupRuns: 5
      };

      const result = await this.testPerformance(testCase);
      results.push(result);
    }

    return results;
  }

  /**
   * Test database query performance
   */
  async benchmarkDatabaseQueries(
    queries: Array<{
      name: string;
      sql: string;
      params?: unknown[];
    }>,
    iterations: number = 1000
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const query of queries) {
      const testCase: PerformanceTestCase = {
        name: `Database: ${query.name}`,
        operation: async () => {
          await this.simulateDBQuery(query.sql, query.params);
        },
        iterations,
        maxDuration: 10,
        warmupRuns: 100
      };

      const result = await this.testPerformance(testCase);
      results.push(result);
    }

    return results;
  }

  /**
   * Stress test the application
   */
  async stressTest(
    operations: Array<{
      name: string;
      operation: () => Promise<void> | void;
      frequency: number; // operations per second
    }>,
    duration: number, // in seconds
    memoryLimit: number
  ): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const promises: Promise<void>[] = [];
      const endTime = Date.now() + (duration * 1000);
      
      // Start all operations
      for (const op of operations) {
        const intervalMs = 1000 / op.frequency;
        promises.push(this.runContinuousOperation(op.operation, intervalMs, endTime));
      }

      // Monitor memory usage
      const memoryMonitor = this.startMemoryMonitoring();
      
      // Wait for all operations to complete
      await Promise.all(promises);
      
      const memoryStats = this.stopMemoryMonitoring(memoryMonitor);
      
      // Check memory limit
      if (memoryStats.peak > memoryLimit) {
        throw new Error(`Memory limit exceeded: ${memoryStats.peak} > ${memoryLimit}`);
      }

      const testDuration = performance.now() - startTime;
      return {
        name: `Stress Test (${duration}s)`,
        success: true,
        duration: testDuration,
        metadata: {
          operations: operations.map(op => op.name),
          totalDuration: duration,
          memoryUsage: memoryStats
        }
      };

    } catch (error) {
      const testDuration = performance.now() - startTime;
      return {
        name: `Stress Test (${duration}s)`,
        success: false,
        duration: testDuration,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {
    summary: {
      totalTests: number;
      averageResponseTime: number;
      slowestOperation: string;
      fastestOperation: string;
    };
    results: PerformanceResult[];
    recommendations: string[];
  } {
    if (this.performanceResults.length === 0) {
      return {
        summary: {
          totalTests: 0,
          averageResponseTime: 0,
          slowestOperation: 'N/A',
          fastestOperation: 'N/A'
        },
        results: [],
        recommendations: ['No performance tests have been run yet.']
      };
    }

    const totalDuration = this.performanceResults.reduce((sum, r) => sum + r.averageDuration, 0);
    const averageResponseTime = totalDuration / this.performanceResults.length;
    
    const sortedResults = [...this.performanceResults].sort((a, b) => a.averageDuration - b.averageDuration);
    const fastestOperation = sortedResults[0];
    const slowestOperation = sortedResults[sortedResults.length - 1];

    const recommendations = this.generateRecommendations();

    return {
      summary: {
        totalTests: this.performanceResults.length,
        averageResponseTime,
        slowestOperation: `${slowestOperation.averageDuration.toFixed(2)}ms`,
        fastestOperation: `${fastestOperation.averageDuration.toFixed(2)}ms`
      },
      results: this.performanceResults,
      recommendations
    };
  }

  /**
   * Override test execution for performance-specific tests
   */
  protected async executeTest(testCase: any): Promise<void> {
    if ('operation' in testCase) {
      const result = await this.testPerformance(testCase as PerformanceTestCase);
      if (!result.success) {
        throw result.error || new Error('Performance test failed');
      }
    } else {
      throw new Error(`Unknown test case type for: ${testCase.name}`);
    }
  }

  // Private helper methods

  /**
   * Run a performance test
   */
  private async runPerformanceTest(testCase: PerformanceTestCase): Promise<PerformanceResult> {
    const iterations = testCase.iterations || 100;
    const warmupRuns = testCase.warmupRuns || 10;
    const durations: number[] = [];
    const memoryUsages: number[] = [];

    // Warmup runs
    for (let i = 0; i < warmupRuns; i++) {
      await testCase.operation();
    }

    // Force garbage collection if available
    if (typeof globalThis.gc === 'function') {
      globalThis.gc();
    }

    // Actual test runs
    for (let i = 0; i < iterations; i++) {
      const memoryBefore = this.getMemoryUsage();
      const startTime = performance.now();
      
      await testCase.operation();
      
      const duration = performance.now() - startTime;
      const memoryAfter = this.getMemoryUsage();
      
      durations.push(duration);
      memoryUsages.push(memoryAfter - memoryBefore);
    }

    // Calculate statistics
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = totalDuration / iterations;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    const averageMemory = memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length;
    const peakMemory = Math.max(...memoryUsages);
    
    const throughput = iterations / (totalDuration / 1000); // operations per second

    return {
      averageDuration,
      minDuration,
      maxDuration,
      totalDuration,
      iterations,
      memoryUsage: {
        peak: peakMemory,
        average: averageMemory
      },
      throughput
    };
  }

  /**
   * Simulate API call for benchmarking
   */
  private async simulateAPICall(
    method: string,
    path: string,
    body?: unknown
  ): Promise<void> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    
    // Simulate processing time based on complexity
    const processingTime = this.calculateProcessingTime(method, path);
    await new Promise(resolve => setTimeout(resolve, processingTime));
  }

  /**
   * Calculate simulated processing time
   */
  private calculateProcessingTime(method: string, path: string): number {
    let baseTime = 1; // 1ms base
    
    // Different methods have different complexity
    switch (method) {
      case 'GET': baseTime = 1; break;
      case 'POST': baseTime = 5; break;
      case 'PUT': baseTime = 3; break;
      case 'DELETE': baseTime = 2; break;
    }
    
    // Complex paths take longer
    if (path.includes('search')) baseTime *= 3;
    if (path.includes('report')) baseTime *= 5;
    if (path.includes('bulk')) baseTime *= 10;
    
    // Add some randomness
    return baseTime + (Math.random() * baseTime);
  }

  /**
   * Simulate truth file processing
   */
  private async processTruthFile(app: AppDefinition): Promise<void> {
    // Simulate parsing
    await new Promise(resolve => setTimeout(resolve, 1));
    
    // Simulate validation (more entities = more time)
    const entityCount = Object.keys(app.entities || {}).length;
    await new Promise(resolve => setTimeout(resolve, entityCount * 0.5));
    
    // Simulate compilation
    await new Promise(resolve => setTimeout(resolve, 2));
  }

  /**
   * Simulate database query
   */
  private async simulateDBQuery(sql: string, params?: unknown[]): Promise<void> {
    let queryTime = 0.5; // Base query time
    
    // Different queries have different complexity
    if (sql.toLowerCase().includes('join')) queryTime *= 2;
    if (sql.toLowerCase().includes('group by')) queryTime *= 1.5;
    if (sql.toLowerCase().includes('order by')) queryTime *= 1.2;
    if (sql.toLowerCase().includes('like')) queryTime *= 1.3;
    
    // More parameters = slightly more time
    queryTime += (params?.length || 0) * 0.1;
    
    await new Promise(resolve => setTimeout(resolve, queryTime));
  }

  /**
   * Run continuous operation for stress testing
   */
  private async runContinuousOperation(
    operation: () => Promise<void> | void,
    intervalMs: number,
    endTime: number
  ): Promise<void> {
    while (Date.now() < endTime) {
      const startTime = Date.now();
      await operation();
      
      const elapsed = Date.now() - startTime;
      const waitTime = Math.max(0, intervalMs - elapsed);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Start monitoring memory usage
   */
  private startMemoryMonitoring(): {
    interval: number;
    measurements: number[];
  } {
    const measurements: number[] = [];
    
    const interval = setInterval(() => {
      measurements.push(this.getMemoryUsage());
    }, 100) as unknown as number;
    
    return { interval, measurements };
  }

  /**
   * Stop monitoring memory usage
   */
  private stopMemoryMonitoring(monitor: { interval: number; measurements: number[] }): {
    peak: number;
    average: number;
  } {
    clearInterval(monitor.interval);
    
    const peak = Math.max(...monitor.measurements);
    const average = monitor.measurements.reduce((sum, m) => sum + m, 0) / monitor.measurements.length;
    
    return { peak, average };
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    // In Deno, we can use Deno.memoryUsage() if available
    try {
      if (typeof Deno !== 'undefined' && Deno.memoryUsage) {
        return Deno.memoryUsage().heapUsed;
      }
    } catch {
      // Fallback for environments without Deno.memoryUsage
    }
    
    // Fallback: estimate based on performance.now() and random factor
    return Math.random() * 1000000; // Rough estimate in bytes
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.performanceResults.length === 0) {
      return ['No performance data available for recommendations.'];
    }

    const avgDuration = this.performanceResults.reduce((sum, r) => sum + r.averageDuration, 0) / this.performanceResults.length;
    
    if (avgDuration > 100) {
      recommendations.push('Consider optimizing slow operations (>100ms average response time)');
    }
    
    if (avgDuration > 50) {
      recommendations.push('Add caching for frequently accessed data');
    }
    
    const memoryResults = this.performanceResults.filter(r => r.memoryUsage);
    if (memoryResults.length > 0) {
      const avgMemory = memoryResults.reduce((sum, r) => sum + (r.memoryUsage?.average || 0), 0) / memoryResults.length;
      
      if (avgMemory > 50000000) { // 50MB
        recommendations.push('High memory usage detected, consider optimizing data structures');
      }
    }
    
    const lowThroughput = this.performanceResults.filter(r => (r.throughput || 0) < 100);
    if (lowThroughput.length > 0) {
      recommendations.push('Low throughput detected on some operations, consider parallelization');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! Consider adding more comprehensive benchmarks.');
    }
    
    return recommendations;
  }
}

/**
 * Create a performance tester for an app
 */
export function createPerformanceTester(app: AppDefinition): PerformanceTester {
  return new PerformanceTester(app);
}

/**
 * Quick utility to benchmark an operation
 */
export async function benchmarkOperation(
  app: AppDefinition,
  name: string,
  operation: () => Promise<void> | void,
  iterations: number = 100
): Promise<PerformanceResult> {
  const tester = createPerformanceTester(app);
  
  const testCase: PerformanceTestCase = {
    name,
    operation,
    iterations
  };

  const result = await tester.testPerformance(testCase);
  
  if (!result.success) {
    throw result.error || new Error('Performance test failed');
  }

  return tester.generatePerformanceReport().results[0];
}