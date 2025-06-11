# Runtime Engine Implementation Guide

relevant files:
@ai-framework-overview.md
@development-plan.md
@technology-stack.md

When app schema's are changed (/app), that will trigger a schema validation workflow. The results are written in @schema_validation_result.txt. After changing the validation, check the file for potential errors.

When you need to do multiple tool calls and they can be done simultaneously, please do so.

## Core Runtime Responsibilities

The runtime engine is the heart of the framework. It must:

1. **Load and Process Truth Files**
   - Load `app.truth.ts` from the app directory
   - Validate the structure and types
   - Build internal representation for fast access
   - Watch for changes in development mode

2. **Generate Representations**
   - Transform truth declarations into executable code
   - Generate database schemas, API routes, UI components
   - Cache generated representations for performance
   - Regenerate only what changed

3. **Handle HTTP Requests**
   - Route incoming requests to appropriate handlers
   - Execute permission checks before processing
   - Validate request data against schemas
   - Execute business logic and return responses

4. **Manage State and Events**
   - Track entity state changes
   - Emit events for behaviors
   - Execute workflows in response to events
   - Maintain transactional consistency

## Architecture Principles

### 1. Pipeline Architecture
```
Truth → Load → Validate → Compile → Generate → Execute
```
Each stage has clear input/output and can be tested independently.

### 2. Lazy Generation
- Generate representations on-demand
- Cache aggressively but invalidate smartly
- In development: generate per request
- In production: pre-generate everything

### 3. Extension Points
- Clear hooks for extensions to modify behavior
- Extensions can wrap but not replace core functionality
- Maintain security boundaries

## Implementation Rules

### Truth Loading

```typescript
// runtime/loader/truth-loader.ts
interface TruthLoader {
  load(path: string): Promise<AppDefinition>
  watch(path: string, callback: (app: AppDefinition) => void): void
  validate(app: unknown): AppDefinition
}
```

**Requirements:**
- Must handle TypeScript files (use esbuild or similar)
- Validate against strict schema
- Provide helpful error messages
- Support hot reload in development

### Generator System

```typescript
// runtime/generators/base.ts
interface Generator<T> {
  name: string
  generate(app: AppDefinition): T
  invalidate(change: ChangeEvent): void
}
```

**Key Generators:**
1. **DatabaseGenerator**: SQL schemas, migrations
2. **APIGenerator**: Route handlers, validators
3. **UIGenerator**: Preact components, layouts
4. **TypeGenerator**: TypeScript definitions

**Rules:**
- Generators must be stateless
- Output must be deterministic
- Support incremental generation
- Handle circular dependencies

### Request Pipeline

```typescript
// runtime/server/pipeline.ts
interface Pipeline {
  // Order matters!
  stages: [
    'parse',      // Parse request
    'route',      // Match route
    'authorize',  // Check permissions
    'validate',   // Validate input
    'execute',    // Run business logic
    'respond'     // Send response
  ]
}
```

**Each Stage:**
- Single responsibility
- Can short-circuit (e.g., auth failure)
- Passes context to next stage
- Handles errors gracefully

### Permission System

```typescript
// runtime/permissions/evaluator.ts
interface PermissionEvaluator {
  evaluate(
    expression: string,
    context: {
      user: User
      entity: Entity
      action: string
    }
  ): boolean
}
```

**Expression Language:**
- Simple boolean logic: `&&`, `||`, `!`
- Built-in variables: `user`, `owner`, `authenticated`
- Role checks: `user.role === 'admin'`
- Ownership: `entity.ownerId === user.id`

### Database Layer

```typescript
// runtime/database/executor.ts
interface DatabaseExecutor {
  execute(query: Query): Promise<Result>
  transaction<T>(fn: () => Promise<T>): Promise<T>
  migrate(schemas: Schema[]): Promise<void>
}
```

**Requirements:**
- Use Turso for SQLite at edge
- Support transactions
- Handle JSON columns for complex types
- Auto-generate indexes from queries

### Event System

```typescript
// runtime/events/emitter.ts
interface EventEmitter {
  emit(event: string, data: unknown): void
  on(event: string, handler: Handler): void
  workflow(trigger: string, actions: Action[]): void
}
```

**Rules:**
- Events are async by default
- Workflows run after transaction commits
- Failed workflows don't roll back transactions
- Support retry with exponential backoff

## Development Mode Features

### Hot Reload
```typescript
// runtime/dev/hot-reload.ts
class HotReloader {
  // Watch truth file
  watchTruth(): void
  // Regenerate affected parts
  regenerate(changes: Change[]): void
  // Notify connected clients
  notify(): void
}
```

### Development Server
- Detailed error messages with stack traces
- Request/response logging
- Performance timing for each pipeline stage
- Interactive API explorer

## Production Mode Features

### Compilation
```typescript
// runtime/compiler/compiler.ts
class Compiler {
  // Pre-generate all representations
  compile(app: AppDefinition): CompiledApp
  // Optimize for size and speed
  optimize(app: CompiledApp): OptimizedApp
  // Generate deployment artifacts
  bundle(): Bundle
}
```

### Caching Strategy
- In-memory cache for hot paths
- Redis for distributed cache
- Edge CDN for static assets
- Smart invalidation based on changes

## Error Handling

### User Errors
- Clear messages about what went wrong
- Suggestions for fixing
- Link to relevant documentation
- Never expose internals

### Developer Errors
- Full stack traces in development
- Context about what was being processed
- Truth file line numbers
- Validation error details

### System Errors
- Graceful degradation
- Automatic retries where appropriate
- Circuit breakers for external services
- Comprehensive logging

## Performance Guidelines

### Startup Performance
- Lazy load generators
- Pre-compile regex patterns
- Cache parsed truth file
- Minimize dependencies

### Request Performance
- Generate once, execute many
- Use prepared statements
- Minimize allocations
- Stream large responses

### Memory Management
- Bound cache sizes
- Clear unused generators
- Use weak references
- Monitor memory usage

## Testing Strategy

### Unit Tests
- Test each generator independently
- Mock truth file for consistent tests
- Test error conditions
- Verify generated output

### Integration Tests
- Full pipeline tests
- Database integration
- Extension loading
- Hot reload behavior

### Performance Tests
- Measure cold start time
- Request throughput
- Memory usage over time
- Generator performance

## Security Considerations

### Input Validation
- Never trust user input
- Validate at edge before processing
- Sanitize for SQL injection
- Prevent XSS in generated UI

### Permission Enforcement
- Check permissions before any action
- Default deny if no permission specified
- Log permission failures
- Rate limit by user

### Extension Sandboxing
- Extensions run in limited context
- No access to raw database
- Can't modify core behavior
- Resource limits enforced

## Debugging Support

### Developer Tools
- Truth file validator with helpful errors
- Generated code inspector
- Performance profiler
- Request tracer

### Logging
- Structured logging (JSON)
- Correlation IDs for requests
- Log levels: debug, info, warn, error
- Contextual information

## Implementation Checklist

1. **Core Engine**
   - [ ] Truth loader with TypeScript support
   - [ ] Schema validator with error messages
   - [ ] Internal representation builder
   - [ ] Change detection system

2. **Generators**
   - [ ] Base generator interface
   - [ ] Database schema generator
   - [ ] API route generator
   - [ ] UI component generator
   - [ ] TypeScript type generator

3. **Runtime**
   - [ ] HTTP server setup (Hono)
   - [ ] Request pipeline
   - [ ] Permission evaluator
   - [ ] Database executor (Turso)
   - [ ] Event emitter

4. **Development**
   - [ ] Hot reload system
   - [ ] Development server
   - [ ] Error reporting
   - [ ] Performance monitoring

5. **Production**
   - [ ] Compilation mode
   - [ ] Caching layer
   - [ ] Optimization passes
   - [ ] Deployment bundler

## Remember

The runtime engine must be:
- **Predictable**: Same input → same output
- **Fast**: Minimize overhead, maximize throughput
- **Debuggable**: Clear errors, good logging
- **Extensible**: Clean extension points
- **Secure**: Never trust input, enforce permissions

When you need to do multiple tool calls and they can be done simultaneously, please do so.

DO NOT DO a git push every single time something changes, only when users asks
