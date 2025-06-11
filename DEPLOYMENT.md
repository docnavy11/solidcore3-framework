# Deployment Guide

This guide covers deploying Solidcore3 applications to various platforms.

## 🚀 Quick Deployment

### Deno Deploy (Recommended)

Deno Deploy is the easiest way to deploy Solidcore3 applications:

```bash
# Install deployctl
deno install -A -r -f https://deno.land/x/deploy/deployctl.ts

# Deploy your app
deployctl deploy --project=your-app-name runtime/server/main.ts
```

**Advantages:**
- ✅ Zero configuration required
- ✅ Global edge deployment
- ✅ Automatic HTTPS
- ✅ Built-in analytics
- ✅ Free tier available

### Cloudflare Workers

Deploy to Cloudflare's edge network:

```bash
# Install Wrangler
npm install -g wrangler

# Configure wrangler.toml
# Deploy
wrangler publish
```

### Docker Deployment

Deploy using Docker containers:

```dockerfile
FROM denoland/deno:1.40.0

WORKDIR /app
COPY . .

# Cache dependencies
RUN deno cache runtime/server/main.ts

EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "--allow-write", "runtime/server/main.ts"]
```

```bash
# Build and run
docker build -t solidcore3-app .
docker run -p 8000:8000 solidcore3-app
```

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Database (optional for SQLite)
DATABASE_URL=file:./data/app.db

# Or for Turso
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Server configuration
PORT=8000
HOST=0.0.0.0
DENO_ENV=production

# Security (in production)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Production Settings

Update your truth file for production:

```typescript
// app/app.truth.ts
export const App = {
  name: "YourApp",
  
  // Production-specific settings
  config: {
    environment: "production",
    debug: false,
    logging: {
      level: "info",
      format: "json"
    }
  },
  
  // Your entities, views, etc.
  entities: { /* ... */ }
}
```

## 🌐 Platform-Specific Guides

### Deno Deploy

1. **Create a new project** at [dash.deno.com](https://dash.deno.com/)

2. **Connect your GitHub repository**

3. **Configure deployment settings:**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy
   on:
     push:
       branches: [main]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: denoland/setup-deno@v1
         - uses: denoland/deployctl@v1
           with:
             project: your-project-name
             entrypoint: runtime/server/main.ts
   ```

4. **Set environment variables** in the Deno Deploy dashboard

### Cloudflare Workers

1. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Create wrangler.toml:**
   ```toml
   name = "solidcore3-app"
   main = "runtime/server/main.ts"
   compatibility_date = "2024-01-01"
   
   [env.production]
   vars = { DENO_ENV = "production" }
   ```

3. **Deploy:**
   ```bash
   wrangler deploy
   ```

### Railway

1. **Connect your GitHub repository** at [railway.app](https://railway.app/)

2. **Create railway.toml:**
   ```toml
   [build]
   command = "echo 'No build step needed'"
   
   [deploy]
   startCommand = "deno run --allow-net --allow-read --allow-env --allow-write runtime/server/main.ts"
   ```

### Fly.io

1. **Install flyctl** and login

2. **Create fly.toml:**
   ```toml
   app = "your-app-name"
   
   [http_service]
   internal_port = 8000
   force_https = true
   
   [[vm]]
   cpu_kind = "shared"
   cpus = 1
   memory_mb = 256
   ```

3. **Deploy:**
   ```bash
   fly deploy
   ```

## 🗄️ Database Deployment

### SQLite (Local Development)

For local development, SQLite files work great:

```typescript
// No additional setup needed
// Database file is created automatically
```

### Turso (Production)

For production, use Turso for global SQLite:

1. **Create a Turso database:**
   ```bash
   # Install Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash
   
   # Create database
   turso db create your-app-db
   
   # Get connection details
   turso db show your-app-db
   turso db tokens create your-app-db
   ```

2. **Set environment variables:**
   ```bash
   TURSO_DATABASE_URL=libsql://your-app-db.turso.io
   TURSO_AUTH_TOKEN=your-auth-token
   ```

### PostgreSQL/MySQL

While Solidcore3 is optimized for SQLite, you can use other databases:

```typescript
// app/extensions/database-adapter.ts
export default {
  name: 'custom-database',
  database: {
    adapter: 'postgresql',
    connection: process.env.DATABASE_URL
  }
}
```

## 🔒 Security Considerations

### Production Checklist

- [ ] **Environment variables** - Never commit secrets to git
- [ ] **HTTPS only** - Ensure all traffic uses HTTPS
- [ ] **CORS configuration** - Restrict origins in production
- [ ] **Rate limiting** - Implement rate limiting for APIs
- [ ] **Input validation** - Validate all user inputs
- [ ] **Error handling** - Don't expose stack traces
- [ ] **Logging** - Use structured logging for monitoring
- [ ] **Dependencies** - Keep Deno and dependencies updated

### Security Headers

Add security headers in production:

```typescript
// Add to runtime/server/main.ts
app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('X-XSS-Protection', '1; mode=block')
  c.header('Strict-Transport-Security', 'max-age=31536000')
  await next()
})
```

## 📊 Monitoring

### Health Checks

Solidcore3 includes built-in health checks:

```bash
# Check application health
curl https://your-app.com/health

# Response:
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": "2h 30m",
  "database": "connected"
}
```

### Logging

Configure structured logging:

```typescript
// app/app.truth.ts
export const App = {
  config: {
    logging: {
      level: "info",
      format: "json",
      destinations: ["console", "file"]
    }
  }
}
```

### Performance Monitoring

Monitor your deployment:

```bash
# Built-in performance endpoint
curl https://your-app.com/metrics

# Response includes:
# - Request counts
# - Response times
# - Database query performance
# - Memory usage
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Complete CI/CD pipeline:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1
      - run: deno task test
      - run: deno task lint
      - run: deno task type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1
      - uses: denoland/deployctl@v1
        with:
          project: ${{ secrets.DENO_PROJECT }}
          entrypoint: runtime/server/main.ts
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - deploy

test:
  image: denoland/deno:latest
  script:
    - deno task test
    - deno task lint

deploy:
  image: denoland/deno:latest
  script:
    - deployctl deploy --project=$DENO_PROJECT runtime/server/main.ts
  only:
    - main
```

## 🚀 Performance Optimization

### Production Optimizations

1. **Enable caching:**
   ```typescript
   // app/app.truth.ts
   export const App = {
     config: {
       cache: {
         enabled: true,
         ttl: 3600, // 1 hour
         strategy: "memory" // or "redis"
       }
     }
   }
   ```

2. **Optimize database:**
   ```sql
   -- Create indexes for better performance
   CREATE INDEX idx_tasks_status ON tasks(status);
   CREATE INDEX idx_tasks_created_at ON tasks(created_at);
   ```

3. **Use edge caching:**
   ```typescript
   // Add cache headers
   app.use('*', async (c, next) => {
     await next()
     if (c.req.method === 'GET') {
       c.header('Cache-Control', 'public, max-age=300')
     }
   })
   ```

## 🆘 Troubleshooting

### Common Issues

**Port binding errors:**
```bash
# Solution: Use environment PORT variable
const port = Deno.env.get("PORT") || 8000
```

**Database connection issues:**
```bash
# Check environment variables
echo $TURSO_DATABASE_URL
echo $TURSO_AUTH_TOKEN

# Test connection
deno run --allow-net test-db-connection.ts
```

**Memory issues:**
```bash
# Increase memory limit (if needed)
deno run --v8-flags="--max-old-space-size=4096" runtime/server/main.ts
```

### Debug Mode

Enable debug mode for troubleshooting:

```bash
DENO_ENV=development deno task dev
```

This enables:
- Detailed error messages
- Request/response logging
- Hot reload
- Debug endpoints

---

For more help, check the [GitHub Issues](https://github.com/docnavy11/solidcore3-framework/issues) or create a new issue.