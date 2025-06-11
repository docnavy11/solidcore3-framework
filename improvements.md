# Solidcore3 Framework Improvements Plan

## Executive Summary

This document outlines a comprehensive plan to address critical issues and improve the Solidcore3 framework based on codebase analysis. The plan focuses on production readiness, developer experience, and architectural consistency while maintaining the framework's innovative AI-first approach.

## Priority Classification

- **P0 (Critical)**: Blocking production use, security issues
- **P1 (High)**: Essential for good developer experience  
- **P2 (Medium)**: Important improvements, nice-to-have features
- **P3 (Low)**: Future enhancements, optimization

---

## Phase 1: Foundation Hardening (Week 1-2)

### P0: Security & Critical Issues

#### 1.1 Fix Expression Evaluation Security Issue
**Location**: `/runtime/events/emitter.ts:167-196`
**Issue**: Uses `new Function()` which is unsafe and unreliable
**Solution**: Implement proper expression parser
```typescript
// core/expression/parser.ts
export class SafeExpressionParser {
  private allowedOperators = ['==', '!=', '>', '<', '>=', '<=', '&&', '||'];
  private allowedVariables: Set<string>;
  
  evaluate(expression: string, context: Record<string, any>): boolean {
    // Parse AST safely
    // Validate operators and variables
    // Evaluate without code execution
  }
}
```

#### 1.2 SQL Injection Protection  
**Location**: Various generators using dynamic table names
**Issue**: Dynamic SQL construction without proper escaping
**Solution**: Create safe query builder
```typescript
// core/database/query-builder.ts
export class SafeQueryBuilder {
  private escapeIdentifier(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
  }
  
  select(table: string, fields: string[]): Query {
    const safeTable = this.escapeIdentifier(table);
    const safeFields = fields.map(f => this.escapeIdentifier(f));
    // Build safe query
  }
}
```

### P0: Truth File Validation System

#### 1.3 Core Validation Framework
**Create**: `/core/validators/truth-validator.ts`
```typescript
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

export class TruthFileValidator {
  validate(truth: AppDefinition): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Entity validation
    this.validateEntities(truth.entities, errors);
    
    // View validation  
    this.validateViews(truth.views, errors);
    
    // Workflow validation
    this.validateWorkflows(truth.workflows, errors);
    
    // Cross-reference validation
    this.validateReferences(truth, errors);
    
    return { 
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors: errors.filter(e => e.severity === 'error'),
      warnings: errors.filter(e => e.severity === 'warning')
    };
  }
}
```

#### 1.4 Field Type Validation
**Create**: `/core/validators/field-validator.ts`
```typescript
export class FieldValidator {
  validateField(field: FieldDefinition, entityName: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Type validation
    if (!this.isValidFieldType(field.type)) {
      errors.push({
        code: 'INVALID_FIELD_TYPE',
        message: `Invalid field type '${field.type}'`,
        path: `entities.${entityName}.fields.${field.name}`,
        severity: 'error',
        suggestion: `Valid types: string, number, boolean, date, enum`
      });
    }
    
    // Enum validation
    if (field.type === 'enum' && !field.options) {
      errors.push({
        code: 'MISSING_ENUM_OPTIONS',
        message: 'Enum field must have options',
        path: `entities.${entityName}.fields.${field.name}`,
        severity: 'error'
      });
    }
    
    // Relationship validation
    if (field.type === 'reference' && !field.entity) {
      errors.push({
        code: 'MISSING_REFERENCE_ENTITY',
        message: 'Reference field must specify target entity',
        path: `entities.${entityName}.fields.${field.name}`,
        severity: 'error'
      });
    }
    
    return errors;
  }
}
```

#### 1.5 Permission Expression Validation
**Create**: `/core/validators/permission-validator.ts`
```typescript
export class PermissionValidator {
  validatePermission(permission: string, entityName: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    try {
      // Parse permission expression
      const ast = this.parsePermissionExpression(permission);
      
      // Validate referenced fields exist
      const referencedFields = this.extractFieldReferences(ast);
      // Check against entity definition
      
      // Validate operators are allowed
      this.validateOperators(ast, errors);
      
    } catch (error) {
      errors.push({
        code: 'INVALID_PERMISSION_SYNTAX',
        message: `Invalid permission expression: ${error.message}`,
        path: `entities.${entityName}.permissions`,
        severity: 'error'
      });
    }
    
    return errors;
  }
}
```

### P0: Error Handling Standardization

#### 1.6 Framework Error System
**Create**: `/core/errors/framework-error.ts`
```typescript
export enum ErrorCode {
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_FIELD_TYPE = 'INVALID_FIELD_TYPE',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Database errors
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  QUERY_EXECUTION_FAILED = 'QUERY_EXECUTION_FAILED',
  
  // API errors
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // System errors
  TRUTH_FILE_LOAD_FAILED = 'TRUTH_FILE_LOAD_FAILED',
  EXTENSION_LOAD_FAILED = 'EXTENSION_LOAD_FAILED'
}

export class FrameworkError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public context?: Record<string, any>,
    public cause?: Error
  ) {
    super(message);
    this.name = 'FrameworkError';
  }
  
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack
    };
  }
}

export class ValidationError extends FrameworkError {
  constructor(message: string, field: string, value: any) {
    super(ErrorCode.VALIDATION_FAILED, message, { field, value });
  }
}
```

#### 1.7 Standardized API Responses
**Create**: `/core/http/response.ts`
```typescript
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export class ResponseBuilder {
  constructor(private requestId: string) {}
  
  success<T>(data: T): APIResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.requestId,
        version: '0.1.0'
      }
    };
  }
  
  error(error: FrameworkError): APIResponse {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.context
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.requestId,
        version: '0.1.0'
      }
    };
  }
}
```

### P0: Configuration Management

#### 1.8 Configuration System
**Create**: `/core/config/manager.ts`
```typescript
export interface DatabaseConfig {
  type: 'sqlite' | 'turso';
  url: string;
  token?: string;
  poolSize?: number;
  timeout?: number;
}

export interface ServerConfig {
  port: number;
  host: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
}

export interface DevelopmentConfig {
  hotReload: boolean;
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  truthFileWatch: boolean;
}

export interface FrameworkConfig {
  database: DatabaseConfig;
  server: ServerConfig;
  development: DevelopmentConfig;
  extensions: {
    directory: string;
    allowUnsafe: boolean;
  };
}

export class ConfigManager {
  private config: FrameworkConfig;
  
  constructor() {
    this.config = this.loadConfig();
  }
  
  private loadConfig(): FrameworkConfig {
    // 1. Load defaults
    const defaults = this.getDefaults();
    
    // 2. Load from config file (solidcore.config.ts)
    const fileConfig = this.loadConfigFile();
    
    // 3. Load from environment variables
    const envConfig = this.loadFromEnv();
    
    // 4. Merge with precedence: env > file > defaults
    return deepMerge(defaults, fileConfig, envConfig);
  }
  
  get<K extends keyof FrameworkConfig>(key: K): FrameworkConfig[K] {
    return this.config[key];
  }
}
```

---

## Phase 2: Generator Pattern Standardization (Week 2-3)

### P1: Base Generator Framework

#### 2.1 Abstract Base Generator
**Create**: `/core/generators/base-generator.ts`
```typescript
export abstract class BaseGenerator<TInput, TOutput> {
  protected logger: Logger;
  protected validator: TruthFileValidator;
  
  constructor(
    protected app: AppDefinition,
    protected config: FrameworkConfig
  ) {
    this.logger = new Logger(this.constructor.name);
    this.validator = new TruthFileValidator();
  }
  
  abstract generate(input: TInput): Promise<TOutput>;
  
  protected validate(): void {
    const result = this.validator.validate(this.app);
    if (!result.isValid) {
      throw new FrameworkError(
        ErrorCode.VALIDATION_FAILED,
        'Truth file validation failed',
        { errors: result.errors }
      );
    }
  }
  
  protected log(level: LogLevel, message: string, context?: Record<string, any>): void {
    this.logger.log(level, message, {
      generator: this.constructor.name,
      ...context
    });
  }
}
```

#### 2.2 Standardize API Generator
**Refactor**: `/core/generators/api.ts`
```typescript
export class APIGenerator extends BaseGenerator<void, Hono> {
  async generate(): Promise<Hono> {
    this.validate();
    this.log('info', 'Starting API generation');
    
    const app = new Hono();
    
    for (const [entityName, entity] of Object.entries(this.app.entities)) {
      this.generateEntityRoutes(app, entityName, entity);
    }
    
    this.log('info', 'API generation completed', { 
      entityCount: Object.keys(this.app.entities).length 
    });
    
    return app;
  }
  
  private generateEntityRoutes(app: Hono, entityName: string, entity: EntityDefinition): void {
    // Existing logic but with proper error handling and logging
  }
}
```

#### 2.3 Standardize UI Generator
**Refactor**: `/core/generators/ui.ts`
```typescript
export class UIGenerator extends BaseGenerator<void, Record<string, string>> {
  async generate(): Promise<Record<string, string>> {
    this.validate();
    this.log('info', 'Starting UI generation');
    
    const pages: Record<string, string> = {};
    
    for (const [viewName, view] of Object.entries(this.app.views || {})) {
      pages[view.route] = this.generateViewPage(viewName, view);
    }
    
    this.log('info', 'UI generation completed', { 
      pageCount: Object.keys(pages).length 
    });
    
    return pages;
  }
}
```

#### 2.4 Standardize Dashboard Generator
**Refactor**: `/core/dashboard/generator.ts`
```typescript
export class DashboardGenerator extends BaseGenerator<void, Record<string, string>> {
  async generate(): Promise<Record<string, string>> {
    this.validate();
    this.log('info', 'Starting dashboard generation');
    
    const pages = {
      '/dashboard': this.generateMainDashboard(),
      '/dashboard/extensions': this.generateExtensionsPage(),
      '/dashboard/database': this.generateDatabasePage(),
      '/dashboard/api': this.generateAPIPage(),
      '/dashboard/config': this.generateConfigPage()
    };
    
    this.log('info', 'Dashboard generation completed');
    return pages;
  }
}
```

---

## Phase 3: Structured Logging & Observability (Week 3-4)

### P1: Logging System

#### 3.1 Core Logger
**Create**: `/core/logging/logger.ts`
```typescript
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: Record<string, any>;
  requestId?: string;
  component: string;
}

export class Logger {
  constructor(private component: string) {}
  
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }
  
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }
  
  log(level: LogLevel, message: string, context: Record<string, any> = {}): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      component: this.component,
      requestId: this.getCurrentRequestId()
    };
    
    this.output(entry);
  }
  
  private output(entry: LogEntry): void {
    if (Deno.env.get('LOG_FORMAT') === 'json') {
      console.log(JSON.stringify(entry));
    } else {
      const color = this.getColorForLevel(entry.level);
      console.log(`${color}[${entry.timestamp}] ${LogLevel[entry.level]} ${entry.component}: ${entry.message}${this.formatContext(entry.context)}\x1b[0m`);
    }
  }
}
```

#### 3.2 Request Tracing Middleware
**Create**: `/runtime/middleware/tracing.ts`
```typescript
export function tracingMiddleware() {
  return async (c: Context, next: Next) => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    // Set request context
    c.set('requestId', requestId);
    c.set('startTime', startTime);
    
    // Log request start
    const logger = new Logger('HTTP');
    logger.info('Request started', {
      method: c.req.method,
      path: c.req.path,
      userAgent: c.req.header('user-agent'),
      requestId
    });
    
    try {
      await next();
      
      // Log successful response
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        duration,
        requestId
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Request failed', error as Error, {
        method: c.req.method,
        path: c.req.path,
        duration,
        requestId
      });
      throw error;
    }
  };
}
```

#### 3.3 Performance Monitoring
**Create**: `/core/monitoring/performance.ts`
```typescript
export interface PerformanceMetrics {
  truthFileLoadTime: number;
  generationTime: {
    api: number;
    ui: number;
    dashboard: number;
  };
  requestMetrics: {
    averageResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
}

export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  
  startTimer(operation: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
    };
  }
  
  recordMetric(operation: string, value: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const values = this.metrics.get(operation)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getMetrics(): PerformanceMetrics {
    return {
      truthFileLoadTime: this.getAverage('truth_file_load') || 0,
      generationTime: {
        api: this.getAverage('api_generation') || 0,
        ui: this.getAverage('ui_generation') || 0,
        dashboard: this.getAverage('dashboard_generation') || 0
      },
      requestMetrics: {
        averageResponseTime: this.getAverage('request_duration') || 0,
        requestsPerSecond: this.calculateRPS(),
        errorRate: this.calculateErrorRate()
      }
    };
  }
}
```

---

## Phase 4: Truth File Authoring & Debugging (Week 4-5)

### P1: Truth File Inspector Dashboard

#### 4.1 Enhanced Truth Inspector
**Add to**: `/core/dashboard/generator.ts`
```typescript
private generateTruthInspectorPage(): string {
  return `
    <div class="truth-inspector">
      <div class="inspector-nav">
        <button onclick="showEntityGraph()">Entity Graph</button>
        <button onclick="showFieldAnalysis()">Field Analysis</button>
        <button onclick="showPermissionMatrix()">Permissions</button>
        <button onclick="showWorkflowFlow()">Workflow Flow</button>
        <button onclick="showValidationStatus()">Validation</button>
      </div>
      
      <div id="entity-graph" class="inspector-panel">
        <!-- D3.js entity relationship diagram -->
      </div>
      
      <div id="field-analysis" class="inspector-panel">
        <!-- Field type breakdown, usage statistics -->
      </div>
      
      <div id="permission-matrix" class="inspector-panel">
        <!-- Permission matrix showing what roles can do what -->
      </div>
      
      <div id="workflow-flow" class="inspector-panel">
        <!-- Workflow visualization showing triggers and actions -->
      </div>
      
      <div id="validation-status" class="inspector-panel">
        <!-- Real-time validation results -->
      </div>
    </div>
  `;
}
```

#### 4.2 Truth File Analysis API
**Create**: `/core/analysis/truth-analyzer.ts`
```typescript
export interface TruthAnalysis {
  entityCount: number;
  fieldCount: number;
  relationshipCount: number;
  complexityScore: number;
  potentialIssues: AnalysisIssue[];
  suggestions: AnalysisSuggestion[];
}

export interface AnalysisIssue {
  severity: 'warning' | 'error' | 'info';
  type: 'performance' | 'design' | 'maintenance';
  message: string;
  location: string;
  suggestion?: string;
}

export class TruthFileAnalyzer {
  analyze(truth: AppDefinition): TruthAnalysis {
    const analysis: TruthAnalysis = {
      entityCount: Object.keys(truth.entities).length,
      fieldCount: this.countFields(truth.entities),
      relationshipCount: this.countRelationships(truth.entities),
      complexityScore: this.calculateComplexity(truth),
      potentialIssues: [],
      suggestions: []
    };
    
    // Analyze for potential issues
    this.analyzeEntityDesign(truth, analysis);
    this.analyzePerformanceImpact(truth, analysis);
    this.analyzeMaintainability(truth, analysis);
    
    return analysis;
  }
  
  private analyzeEntityDesign(truth: AppDefinition, analysis: TruthAnalysis): void {
    for (const [entityName, entity] of Object.entries(truth.entities)) {
      // Check for entities with too many fields
      const fieldCount = Object.keys(entity.fields).length;
      if (fieldCount > 20) {
        analysis.potentialIssues.push({
          severity: 'warning',
          type: 'design',
          message: `Entity '${entityName}' has ${fieldCount} fields, consider splitting`,
          location: `entities.${entityName}`,
          suggestion: 'Consider creating related entities or grouping fields'
        });
      }
      
      // Check for missing required fields
      const hasIdField = Object.values(entity.fields).some(f => f.name === 'id');
      if (!hasIdField) {
        analysis.potentialIssues.push({
          severity: 'error',
          type: 'design',
          message: `Entity '${entityName}' should have an 'id' field`,
          location: `entities.${entityName}.fields`,
          suggestion: 'Add an id field with type "string" and auto: true'
        });
      }
    }
  }
}
```

#### 4.3 Interactive Validation
**Create**: `/runtime/endpoints/validation.ts`
```typescript
export function addValidationEndpoints(app: Hono): void {
  app.post('/api/validate/truth', async (c) => {
    const truthData = await c.req.json();
    
    try {
      const validator = new TruthFileValidator();
      const result = validator.validate(truthData);
      
      return c.json(ResponseBuilder.success(result));
    } catch (error) {
      return c.json(ResponseBuilder.error(error as FrameworkError));
    }
  });
  
  app.post('/api/validate/field', async (c) => {
    const { entityName, field } = await c.req.json();
    
    try {
      const validator = new FieldValidator();
      const errors = validator.validateField(field, entityName);
      
      return c.json(ResponseBuilder.success({ errors }));
    } catch (error) {
      return c.json(ResponseBuilder.error(error as FrameworkError));
    }
  });
  
  app.get('/api/analyze/truth', async (c) => {
    try {
      const runtime = c.get('runtime') as RuntimeEngine;
      const truth = runtime.getCurrentApp();
      
      if (!truth) {
        throw new FrameworkError(ErrorCode.TRUTH_FILE_LOAD_FAILED, 'No truth file loaded');
      }
      
      const analyzer = new TruthFileAnalyzer();
      const analysis = analyzer.analyze(truth);
      
      return c.json(ResponseBuilder.success(analysis));
    } catch (error) {
      return c.json(ResponseBuilder.error(error as FrameworkError));
    }
  });
}
```

### P1: Development Commands

#### 4.4 CLI Task System
**Create**: `/scripts/tasks.ts`
```typescript
export async function validateTruth(): Promise<void> {
  const logger = new Logger('CLI');
  
  try {
    logger.info('Loading truth file...');
    const loader = new TruthLoader();
    const truth = await loader.load();
    
    logger.info('Validating truth file...');
    const validator = new TruthFileValidator();
    const result = validator.validate(truth);
    
    if (result.isValid) {
      logger.info('✅ Truth file is valid');
      
      if (result.warnings.length > 0) {
        logger.warn('Warnings found:', { warnings: result.warnings });
      }
    } else {
      logger.error('❌ Truth file validation failed');
      for (const error of result.errors) {
        logger.error(`  ${error.path}: ${error.message}`);
        if (error.suggestion) {
          logger.info(`    Suggestion: ${error.suggestion}`);
        }
      }
      Deno.exit(1);
    }
    
  } catch (error) {
    logger.error('Failed to validate truth file', error as Error);
    Deno.exit(1);
  }
}

export async function inspectTruth(): Promise<void> {
  const logger = new Logger('CLI');
  
  try {
    const loader = new TruthLoader();
    const truth = await loader.load();
    
    const analyzer = new TruthFileAnalyzer();
    const analysis = analyzer.analyze(truth);
    
    console.log('\n📊 Truth File Analysis');
    console.log('='.repeat(50));
    console.log(`Entities: ${analysis.entityCount}`);
    console.log(`Fields: ${analysis.fieldCount}`);
    console.log(`Relationships: ${analysis.relationshipCount}`);
    console.log(`Complexity Score: ${analysis.complexityScore}/100`);
    
    if (analysis.potentialIssues.length > 0) {
      console.log('\n⚠️  Potential Issues:');
      for (const issue of analysis.potentialIssues) {
        console.log(`  ${issue.severity.toUpperCase()}: ${issue.message}`);
        console.log(`    Location: ${issue.location}`);
        if (issue.suggestion) {
          console.log(`    Suggestion: ${issue.suggestion}`);
        }
      }
    }
    
    if (analysis.suggestions.length > 0) {
      console.log('\n💡 Suggestions:');
      for (const suggestion of analysis.suggestions) {
        console.log(`  ${suggestion.message}`);
      }
    }
    
  } catch (error) {
    logger.error('Failed to inspect truth file', error as Error);
    Deno.exit(1);
  }
}
```

#### 4.5 Update deno.json Tasks
**Update**: `/deno.json`
```json
{
  "tasks": {
    "dev": "deno run --allow-net --allow-read --allow-write --allow-env --allow-ffi runtime/server/main.ts",
    "truth:validate": "deno run --allow-read scripts/validate-truth.ts",
    "truth:inspect": "deno run --allow-read scripts/inspect-truth.ts",
    "truth:graph": "deno run --allow-read --allow-write scripts/generate-graph.ts",
    "extensions:list": "deno run --allow-read scripts/list-extensions.ts",
    "extensions:validate": "deno run --allow-read scripts/validate-extensions.ts"
  }
}
```

---

## Phase 5: Extension System Improvements (Week 5-6)

### P2: Extension Development Framework

#### 5.1 Extension Context Enhancement
**Refactor**: `/core/types/extensions.ts`
```typescript
export interface ExtensionContext {
  app: AppDefinition;
  db: DatabaseClient;
  events: EventEmitter;
  logger: Logger;
  config: FrameworkConfig;
  utils: ExtensionUtils;
  
  // Scoped access
  getEntity(name: string): EntityDefinition | null;
  validateData(entityName: string, data: any): ValidationResult;
  executeQuery(query: string, params?: any[]): Promise<any>;
  
  // Permission checks
  checkPermission(operation: string, entityName: string, context: any): boolean;
}

export interface ExtensionUtils {
  generateId(): string;
  formatDate(date: Date): string;
  sanitizeInput(input: string): string;
  hashPassword(password: string): Promise<string>;
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendWebhook(url: string, data: any): Promise<void>;
}
```

#### 5.2 Extension Testing Framework
**Create**: `/core/testing/extension-tester.ts`
```typescript
export interface ExtensionTestContext {
  mockApp: AppDefinition;
  mockDb: MockDatabaseClient;
  mockEvents: MockEventEmitter;
  logger: Logger;
}

export class ExtensionTester {
  async testExtension(extensionPath: string): Promise<ExtensionTestResult> {
    const context = this.createTestContext();
    
    try {
      // Load extension
      const extension = await import(extensionPath);
      
      // Initialize if needed
      if (extension.init) {
        await extension.init(context);
      }
      
      // Test routes if API extension
      if (extension.default.type === 'api') {
        return await this.testAPIExtension(extension.default, context);
      }
      
      // Test workflows if workflow extension
      if (extension.default.type === 'workflow') {
        return await this.testWorkflowExtension(extension.default, context);
      }
      
      // Test UI if UI extension
      if (extension.default.type === 'ui') {
        return await this.testUIExtension(extension.default, context);
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tests: []
      };
    }
  }
}
```

#### 5.3 Extension Scaffolding
**Create**: `/scripts/create-extension.ts`
```typescript
export async function createExtension(type: 'api' | 'ui' | 'workflow', name: string): Promise<void> {
  const logger = new Logger('CLI');
  
  const templates = {
    api: `
import { APIExtension } from '../../core/types/extensions.ts';

const extension: APIExtension = {
  name: '${name}',
  type: 'api',
  version: '1.0.0',
  description: '${name} API extension',
  author: 'Your Name',
  
  routes: [
    {
      method: 'GET',
      path: '/hello',
      description: 'Hello world endpoint',
      handler: async (c) => {
        return c.json({ message: 'Hello from ${name}!' });
      }
    }
  ]
};

export default extension;

export async function init(context: ExtensionContext) {
  context.logger.info('${name} extension initialized');
}
    `,
    ui: `
import { UIExtension } from '../../core/types/extensions.ts';

const extension: UIExtension = {
  name: '${name}',
  type: 'ui',
  version: '1.0.0',
  description: '${name} UI extension',
  author: 'Your Name',
  
  styles: \`
    .${name}-widget {
      background: #f0f0f0;
      padding: 1rem;
      border-radius: 4px;
    }
  \`,
  
  scripts: \`
    console.log('${name} UI extension loaded');
  \`
};

export default extension;
    `,
    workflow: `
import { WorkflowExtension } from '../../core/types/extensions.ts';

const extension: WorkflowExtension = {
  name: '${name}',
  type: 'workflow',
  version: '1.0.0',
  description: '${name} workflow extension',
  author: 'Your Name',
  
  actions: {
    'custom-action': {
      name: 'Custom Action',
      description: 'Performs a custom action',
      parameters: {
        message: { type: 'string', required: true }
      },
      handler: async (event, params) => {
        console.log(\`Custom action: \${params.message}\`);
      }
    }
  }
};

export default extension;
    `
  };
  
  const extensionPath = \`app/extensions/\${name}.ts\`;
  const template = templates[type];
  
  try {
    await Deno.writeTextFile(extensionPath, template);
    logger.info(\`Created \${type} extension: \${extensionPath}\`);
    
    logger.info('To test your extension, run:');
    logger.info(\`  deno task extensions:test \${name}\`);
    
  } catch (error) {
    logger.error('Failed to create extension', error as Error);
  }
}
```

---

## Phase 6: Database & Performance (Week 6-7)

### P1: Database Abstraction Layer

#### 6.1 Database Interface
**Create**: `/core/database/interface.ts`
```typescript
export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  execute(query: string, params?: any[]): Promise<QueryResult>;
  transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
  
  // Schema management
  createTable(tableName: string, schema: TableSchema): Promise<void>;
  dropTable(tableName: string): Promise<void>;
  addColumn(tableName: string, column: ColumnDefinition): Promise<void>;
  
  // Health checks
  ping(): Promise<boolean>;
  getStats(): Promise<DatabaseStats>;
}

export interface QueryResult {
  rows: any[];
  rowsAffected: number;
  lastInsertId?: string | number;
}

export interface Transaction {
  execute(query: string, params?: any[]): Promise<QueryResult>;
  rollback(): Promise<void>;
  commit(): Promise<void>;
}
```

#### 6.2 SQLite Adapter
**Create**: `/core/database/adapters/sqlite-adapter.ts`
```typescript
export class SQLiteAdapter implements DatabaseAdapter {
  private db: Database | null = null;
  
  constructor(private config: DatabaseConfig) {}
  
  async connect(): Promise<void> {
    try {
      this.db = new Database(this.config.url);
      await this.ping();
    } catch (error) {
      throw new FrameworkError(
        ErrorCode.DATABASE_CONNECTION_FAILED,
        'Failed to connect to SQLite database',
        { url: this.config.url },
        error
      );
    }
  }
  
  async execute(query: string, params: any[] = []): Promise<QueryResult> {
    if (!this.db) {
      throw new FrameworkError(ErrorCode.DATABASE_CONNECTION_FAILED, 'Database not connected');
    }
    
    try {
      const result = this.db.prepare(query).all(...params);
      return {
        rows: Array.isArray(result) ? result : [result],
        rowsAffected: this.db.changes,
        lastInsertId: this.db.lastInsertRowId
      };
    } catch (error) {
      throw new FrameworkError(
        ErrorCode.QUERY_EXECUTION_FAILED,
        'Query execution failed',
        { query, params },
        error
      );
    }
  }
}
```

#### 6.3 Turso Adapter  
**Create**: `/core/database/adapters/turso-adapter.ts`
```typescript
export class TursoAdapter implements DatabaseAdapter {
  private client: LibSQLDatabase | null = null;
  
  constructor(private config: DatabaseConfig) {}
  
  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: this.config.url,
        authToken: this.config.token
      });
      
      await this.ping();
    } catch (error) {
      throw new FrameworkError(
        ErrorCode.DATABASE_CONNECTION_FAILED,
        'Failed to connect to Turso database',
        { url: this.config.url },
        error
      );
    }
  }
  
  async execute(query: string, params: any[] = []): Promise<QueryResult> {
    if (!this.client) {
      throw new FrameworkError(ErrorCode.DATABASE_CONNECTION_FAILED, 'Database not connected');
    }
    
    try {
      const result = await this.client.execute({
        sql: query,
        args: params
      });
      
      return {
        rows: result.rows,
        rowsAffected: result.rowsAffected,
        lastInsertId: result.lastInsertRowId
      };
    } catch (error) {
      throw new FrameworkError(
        ErrorCode.QUERY_EXECUTION_FAILED,
        'Query execution failed',
        { query, params },
        error
      );
    }
  }
}
```

### P2: Query Builder & ORM

#### 6.4 Safe Query Builder
**Create**: `/core/database/query-builder.ts`
```typescript
export class QueryBuilder {
  private adapter: DatabaseAdapter;
  
  constructor(adapter: DatabaseAdapter) {
    this.adapter = adapter;
  }
  
  select(table: string): SelectBuilder {
    return new SelectBuilder(this.adapter, table);
  }
  
  insert(table: string): InsertBuilder {
    return new InsertBuilder(this.adapter, table);
  }
  
  update(table: string): UpdateBuilder {
    return new UpdateBuilder(this.adapter, table);
  }
  
  delete(table: string): DeleteBuilder {
    return new DeleteBuilder(this.adapter, table);
  }
}

export class SelectBuilder {
  private fields: string[] = ['*'];
  private whereConditions: WhereCondition[] = [];
  private orderBy: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  
  constructor(
    private adapter: DatabaseAdapter,
    private tableName: string
  ) {}
  
  field(...fields: string[]): this {
    this.fields = fields;
    return this;
  }
  
  where(field: string, operator: string, value: any): this {
    this.whereConditions.push({ field, operator, value });
    return this;
  }
  
  orderByAsc(field: string): this {
    this.orderBy.push(`${this.escapeIdentifier(field)} ASC`);
    return this;
  }
  
  limit(count: number): this {
    this.limitValue = count;
    return this;
  }
  
  offset(count: number): this {
    this.offsetValue = count;
    return this;
  }
  
  async execute(): Promise<any[]> {
    const { sql, params } = this.build();
    const result = await this.adapter.execute(sql, params);
    return result.rows;
  }
  
  private build(): { sql: string; params: any[] } {
    const params: any[] = [];
    
    let sql = `SELECT ${this.fields.map(f => this.escapeIdentifier(f)).join(', ')}`;
    sql += ` FROM ${this.escapeIdentifier(this.tableName)}`;
    
    if (this.whereConditions.length > 0) {
      const whereClause = this.whereConditions.map(condition => {
        params.push(condition.value);
        return `${this.escapeIdentifier(condition.field)} ${condition.operator} ?`;
      }).join(' AND ');
      
      sql += ` WHERE ${whereClause}`;
    }
    
    if (this.orderBy.length > 0) {
      sql += ` ORDER BY ${this.orderBy.join(', ')}`;
    }
    
    if (this.limitValue !== undefined) {
      sql += ` LIMIT ${this.limitValue}`;
    }
    
    if (this.offsetValue !== undefined) {
      sql += ` OFFSET ${this.offsetValue}`;
    }
    
    return { sql, params };
  }
  
  private escapeIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }
}
```

---

## Implementation Timeline

### Week 1-2: Critical Foundation
- [ ] Fix `new Function()` security issue
- [ ] Implement TruthFileValidator
- [ ] Create FrameworkError system
- [ ] Build ConfigManager
- [ ] Standardize all generators

### Week 3-4: Developer Experience  
- [ ] Implement structured logging
- [ ] Add request tracing
- [ ] Create truth file inspector
- [ ] Build CLI validation commands
- [ ] Add performance monitoring

### Week 5-6: Extensions & Database
- [ ] Enhance extension context
- [ ] Create extension testing framework
- [ ] Build database abstraction layer
- [ ] Implement query builder
- [ ] Add extension scaffolding tools

### Week 7: Polish & Testing
- [ ] Comprehensive testing of all components
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Bug fixes and edge cases

## Success Metrics

- **Security**: No use of `eval()` or `new Function()`
- **Reliability**: Truth file validation catches 95% of common errors
- **Developer Experience**: Clear error messages with actionable suggestions
- **Performance**: <100ms truth file validation, <50ms API response times
- **Maintainability**: All generators follow consistent patterns
- **Observability**: Structured logs for all operations

## Risk Mitigation

- **Scope Creep**: Focus on P0/P1 items first
- **Breaking Changes**: Maintain backwards compatibility where possible
- **Performance Regression**: Benchmark before/after changes
- **Development Velocity**: Implement incrementally, test at each step

This plan addresses the most critical issues while maintaining the innovative nature of the Solidcore3 framework and significantly improving its production readiness and developer experience.