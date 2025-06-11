# Technology Stack Specification

## Core Technologies

### Runtime Environment: Deno
- **Version**: Latest stable (2.x)
- **Why Deno**: 
  - Built-in TypeScript support (no build step)
  - Secure by default with explicit permissions
  - Edge-ready with Deno Deploy
  - Built-in testing, formatting, and linting
  - Web standard APIs

### Web Framework: Hono
- **Version**: 4.x
- **Why Hono**:
  - Ultra-fast, edge-first design
  - Minimal overhead
  - Excellent TypeScript support
  - Middleware ecosystem
  - Works perfectly with Deno

### Database: libSQL (Turso)
- **Version**: Latest
- **Why Turso**:
  - SQLite at the edge
  - Built-in replication
  - Embedded replicas for low latency
  - HTTP API for edge environments
  - ACID transactions

### UI Framework: Preact + HTM
- **Preact Version**: 10.x
- **HTM Version**: 3.x
- **Why Preact+HTM**:
  - Tiny size (3KB)
  - No build step with HTM
  - React-compatible API
  - Fast virtual DOM
  - Perfect for server-side rendering

## Implementation Details

### Deno Configuration

```typescript
// deno.json
{
  "tasks": {
    "dev": "deno run --allow-net --allow-read --allow-env --watch runtime/server.ts",
    "test": "deno test --allow-read",
    "fmt": "deno fmt",
    "lint": "deno lint"
  },
  "imports": {
    "@hono/hono": "https://deno.land/x/hono@v4.0.0/mod.ts",
    "@libsql/client": "npm:@libsql/client@0.4.0",
    "preact": "https://esm.sh/preact@10.19.0",
    "preact/hooks": "https://esm.sh/preact@10.19.0/hooks",
    "htm": "https://esm.sh/htm@3.1.1",
    "htm/preact": "https://esm.sh/htm@3.1.1/preact"
  },
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

### Hono Server Setup

```typescript
// runtime/server.ts
import { Hono } from '@hono/hono'
import { cors } from '@hono/hono/cors'
import { logger } from '@hono/hono/logger'
import { timing } from '@hono/hono/timing'

const app = new Hono()

// Middleware stack
app.use('*', timing())
app.use('*', logger())
app.use('/api/*', cors())

// Error handling
app.onError((err, c) => {
  console.error(`${err}`)
  return c.json({ error: err.message }, 500)
})

// Start server
Deno.serve({ port: 8000 }, app.fetch)
```

### Database Connection with Turso

```typescript
// runtime/database/client.ts
import { createClient } from '@libsql/client'

export function createDatabaseClient() {
  return createClient({
    url: Deno.env.get('TURSO_DATABASE_URL') || 'file:local.db',
    authToken: Deno.env.get('TURSO_AUTH_TOKEN'),
  })
}

// Query execution
export async function executeQuery(sql: string, params: any[] = []) {
  const client = createDatabaseClient()
  try {
    return await client.execute({ sql, args: params })
  } finally {
    client.close()
  }
}

// Transaction support
export async function transaction<T>(
  fn: (tx: Transaction) => Promise<T>
): Promise<T> {
  const client = createDatabaseClient()
  const tx = await client.transaction()
  try {
    const result = await fn(tx)
    await tx.commit()
    return result
  } catch (error) {
    await tx.rollback()
    throw error
  } finally {
    client.close()
  }
}
```

### Preact + HTM Setup

```typescript
// runtime/ui/renderer.ts
import { html } from 'htm/preact'
import { render } from 'preact-render-to-string'

// No build step needed - HTM transforms at runtime
export function renderComponent(Component: any, props: any) {
  return render(html`<${Component} ...${props} />`)
}

// Example component using HTM
export function TaskList({ tasks }) {
  return html`
    <div class="task-list">
      <h2>Tasks</h2>
      <ul>
        ${tasks.map(task => html`
          <li key=${task.id}>
            <span class=${task.completed ? 'completed' : ''}>
              ${task.title}
            </span>
          </li>
        `)}
      </ul>
    </div>
  `
}
```

### SSR with Hono and Preact

```typescript
// runtime/ui/ssr.ts
import { html } from 'htm/preact'
import { render } from 'preact-render-to-string'

export function createPageHandler(Component: any) {
  return async (c: Context) => {
    const props = await getPropsFromContext(c)
    
    const app = html`<${Component} ...${props} />`
    const html = render(app)
    
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${props.title || 'App'}</title>
          <script type="module">
            import { hydrate } from 'https://esm.sh/preact@10.19.0'
            import { html } from 'https://esm.sh/htm@3.1.1/preact'
            import App from '/app.js'
            
            hydrate(html\`<\${App} ...${JSON.stringify(props)} />\`, document.body)
          </script>
        </head>
        <body>${html}</body>
      </html>
    `)
  }
}
```

### API Generator with Hono

```typescript
// runtime/generators/api.ts
import { Hono } from '@hono/hono'
import { validator } from '@hono/hono/validator'

export function generateEntityRoutes(entity: EntityDefinition) {
  const router = new Hono()
  
  // List
  router.get('/', async (c) => {
    const query = c.req.query()
    const results = await db.select(entity.name).where(query).execute()
    return c.json(results)
  })
  
  // Get by ID
  router.get('/:id', async (c) => {
    const id = c.req.param('id')
    const result = await db.select(entity.name).where({ id }).first()
    return result ? c.json(result) : c.notFound()
  })
  
  // Create
  router.post('/', 
    validator('json', (value, c) => {
      // Validate against entity schema
      return validateEntity(entity, value)
    }),
    async (c) => {
      const data = await c.req.json()
      const result = await db.insert(entity.name).values(data).execute()
      return c.json(result, 201)
    }
  )
  
  // Update
  router.put('/:id', async (c) => {
    const id = c.req.param('id')
    const data = await c.req.json()
    const result = await db.update(entity.name).set(data).where({ id }).execute()
    return c.json(result)
  })
  
  // Delete
  router.delete('/:id', async (c) => {
    const id = c.req.param('id')
    await db.delete(entity.name).where({ id }).execute()
    return c.body(null, 204)
  })
  
  return router
}
```

### Database Schema Generator

```typescript
// runtime/generators/database.ts
export function generateTableSchema(entity: EntityDefinition): string {
  const columns = Object.entries(entity.fields).map(([name, field]) => {
    let column = `${name} ${getSQLType(field.type)}`
    
    if (field.required) column += ' NOT NULL'
    if (field.unique) column += ' UNIQUE'
    if (field.default !== undefined) {
      column += ` DEFAULT ${formatDefault(field.default)}`
    }
    
    return column
  })
  
  return `
    CREATE TABLE IF NOT EXISTS ${entity.name} (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      ${columns.join(',\n      ')},
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TRIGGER ${entity.name}_updated_at
    AFTER UPDATE ON ${entity.name}
    BEGIN
      UPDATE ${entity.name} SET updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.id;
    END;
  `
}

function getSQLType(type: string): string {
  const typeMap = {
    'string': 'TEXT',
    'text': 'TEXT',
    'number': 'REAL',
    'integer': 'INTEGER',
    'boolean': 'INTEGER',
    'date': 'DATETIME',
    'json': 'TEXT',
    'uuid': 'TEXT'
  }
  return typeMap[type] || 'TEXT'
}
```

### Development Hot Reload

```typescript
// runtime/dev/watcher.ts
export async function watchTruthFile(path: string, onChange: () => void) {
  const watcher = Deno.watchFs(path)
  
  for await (const event of watcher) {
    if (event.kind === 'modify') {
      console.log('Truth file changed, reloading...')
      onChange()
    }
  }
}

// runtime/dev/hot-reload.ts
export function setupHotReload(app: Hono) {
  let clients: Set<WebSocket> = new Set()
  
  app.get('/hot-reload', (c) => {
    const { socket, response } = Deno.upgradeWebSocket(c.req.raw)
    
    socket.onopen = () => {
      clients.add(socket)
    }
    
    socket.onclose = () => {
      clients.delete(socket)
    }
    
    return response
  })
  
  // Notify clients of changes
  function notifyClients() {
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send('reload')
      }
    }
  }
  
  return { notifyClients }
}
```

### Testing Setup

```typescript
// runtime/test/setup.ts
import { assertEquals } from 'https://deno.land/std/assert/mod.ts'

Deno.test('Entity route generation', async () => {
  const entity = {
    name: 'Task',
    fields: {
      title: { type: 'string', required: true },
      completed: { type: 'boolean', default: false }
    }
  }
  
  const routes = generateEntityRoutes(entity)
  const response = await routes.fetch(new Request('http://localhost/'))
  
  assertEquals(response.status, 200)
})
```

### Production Deployment

```typescript
// runtime/build.ts
export async function buildForProduction() {
  // Pre-generate all routes
  const app = new Hono()
  const truth = await loadTruth('./app/app.truth.ts')
  
  // Generate and attach all routes
  for (const [name, entity] of Object.entries(truth.entities)) {
    const routes = generateEntityRoutes(entity)
    app.route(`/api/${name.toLowerCase()}`, routes)
  }
  
  // Bundle for edge deployment
  await Deno.emit('runtime/server.ts', {
    bundle: 'module',
    compilerOptions: {
      target: 'esnext'
    }
  })
}
```

## Development Workflow

### Local Development
```bash
# Install Deno (if not installed)
curl -fsSL https://deno.land/install.sh | sh

# Run development server
deno task dev

# Run tests
deno task test

# Format code
deno task fmt
```

### Environment Variables
```bash
# .env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token
DENO_ENV=development
```

### Deployment to Deno Deploy
```bash
# Install deployctl
deno install -A -r -f https://deno.land/x/deploy/deployctl.ts

# Deploy
deployctl deploy --project=your-project runtime/server.ts
```

## Performance Optimizations

### Edge Caching
```typescript
// Use Turso embedded replicas
const client = createClient({
  url: 'libsql://your-db.turso.io',
  authToken: 'your-token',
  syncUrl: 'https://your-db.turso.io',
  syncInterval: 60, // Sync every 60 seconds
})
```

### Preact Optimization
```typescript
// Use preact/compat for smaller React libraries
import { render } from 'preact/compat'

// Lazy load components
const LazyComponent = lazy(() => import('./Component'))
```

### Hono Optimization
```typescript
// Use streaming for large responses
app.get('/large-data', async (c) => {
  return c.streamText(async (stream) => {
    for await (const chunk of generateLargeData()) {
      await stream.write(chunk)
    }
  })
})
```

## Security Best Practices

### Input Validation
```typescript
// Always validate with Hono validator
import { z } from 'https://deno.land/x/zod/mod.ts'

const taskSchema = z.object({
  title: z.string().min(1).max(100),
  completed: z.boolean().optional()
})

router.post('/', validator('json', taskSchema), handler)
```

### SQL Injection Prevention
```typescript
// Always use parameterized queries
const result = await client.execute({
  sql: 'SELECT * FROM tasks WHERE user_id = ?',
  args: [userId]
})
```

### CORS Configuration
```typescript
app.use('/api/*', cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}))
```