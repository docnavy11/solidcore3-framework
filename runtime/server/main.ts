import { Hono } from 'https://deno.land/x/hono@v4.3.11/mod.ts';
import { logger } from 'https://deno.land/x/hono@v4.3.11/middleware/logger/index.ts';
import { timing } from 'https://deno.land/x/hono@v4.3.11/middleware/timing/index.ts';
import { cors } from 'https://deno.land/x/hono@v4.3.11/middleware/cors/index.ts';
import { RuntimeEngine } from '../engine/runtime.ts';

const app = new Hono();
const runtime = new RuntimeEngine();

// Global middleware (excluding WebSocket routes)
app.use('*', async (c, next) => {
  // Skip middleware for WebSocket upgrade requests
  const upgrade = c.req.header('upgrade')?.toLowerCase()
  if (upgrade === 'websocket') {
    await next()
    return
  }
  
  // Apply middleware for regular requests
  await timing()(c, async () => {
    await logger()(c, next)
  })
});

// Request timeout middleware to prevent hanging (but not for WebSocket)
app.use('*', async (c, next) => {
  // Skip timeout for WebSocket upgrades
  const upgrade = c.req.header('upgrade')?.toLowerCase()
  if (upgrade === 'websocket') {
    await next()
    return
  }
  
  const timeoutId = setTimeout(() => {
    console.warn(`Request timeout: ${c.req.method} ${c.req.url}`);
  }, 30000); // 30 second timeout
  
  try {
    await next();
  } finally {
    clearTimeout(timeoutId);
  }
});

// CORS for API routes
app.use('/api/*', cors({
  origin: '*', // Configure properly for production
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  const currentApp = runtime.getCurrentApp();
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    app: currentApp ? {
      name: currentApp.name,
      entities: Object.keys(currentApp.entities)
    } : null
  });
});

// Debug endpoint
app.get('/debug/db', async (c) => {
  try {
    const { getDatabase } = await import('../database/client.ts');
    const db = getDatabase();
    const result = await db.execute('SELECT * FROM task LIMIT 5');
    return c.json({ tables: result.rows });
  } catch (error) {
    return c.json({ error: error.message });
  }
});

// Debug API routes endpoint
app.get('/debug/api', (c) => {
  const apiRoutes = runtime.getAPIRoutes();
  if (apiRoutes) {
    // Get all the routes from the Hono instance
    return c.json({ 
      message: 'API routes are available',
      routesGenerated: true,
      apiRoutesInstance: !!apiRoutes
    });
  }
  return c.json({ 
    message: 'No API routes available',
    routesGenerated: false 
  });
});

// Extensions info endpoint
app.get('/debug/extensions', (c) => {
  const extensionRegistry = runtime.getExtensionRegistry();
  if (extensionRegistry) {
    return c.json(extensionRegistry.getExtensionInfo());
  }
  return c.json({ message: 'Extensions not initialized' });
});

// Validation info endpoint
app.get('/debug/validation', (c) => {
  const validationResult = runtime.getLastValidationResult();
  if (validationResult) {
    return c.json(validationResult);
  }
  return c.json({ message: 'No validation result available' });
});

// Dashboard routes
app.get('/dashboard', (c) => {
  const dashboardPages = runtime.getDashboardPages();
  if (dashboardPages['/dashboard']) {
    return c.html(dashboardPages['/dashboard']);
  }
  return c.text('Dashboard not ready');
});

app.get('/dashboard/extensions', (c) => {
  const dashboardPages = runtime.getDashboardPages();
  if (dashboardPages['/dashboard/extensions']) {
    return c.html(dashboardPages['/dashboard/extensions']);
  }
  return c.text('Extensions page not ready');
});

app.get('/dashboard/database', (c) => {
  const dashboardPages = runtime.getDashboardPages();
  if (dashboardPages['/dashboard/database']) {
    return c.html(dashboardPages['/dashboard/database']);
  }
  return c.text('Database page not ready');
});

app.get('/dashboard/api', (c) => {
  const dashboardPages = runtime.getDashboardPages();
  if (dashboardPages['/dashboard/api']) {
    return c.html(dashboardPages['/dashboard/api']);
  }
  return c.text('API page not ready');
});

app.get('/dashboard/config', (c) => {
  const dashboardPages = runtime.getDashboardPages();
  if (dashboardPages['/dashboard/config']) {
    return c.html(dashboardPages['/dashboard/config']);
  }
  return c.text('Config page not ready');
});

app.get('/dashboard/truth', (c) => {
  const uiPages = runtime.getUIPages();
  if (uiPages['/dashboard/truth']) {
    return c.html(uiPages['/dashboard/truth']);
  }
  return c.text('Truth explorer not ready');
});

// Dynamic UI route registration from truth file
let routesRegistered = false;

function registerUIRoutes() {
  if (routesRegistered) {
    console.log('UI routes already registered, skipping...');
    return;
  }
  
  console.log('📍 Registering SPA routes...');
  
  // Serve static files from app directory
  app.get('/app/*', async (c) => {
    const path = c.req.path.slice(4); // Remove '/app' prefix
    const filePath = `./app${path}`;
    
    try {
      const file = await Deno.readFile(filePath);
      const ext = filePath.split('.').pop();
      
      // Set appropriate content type
      const contentType = {
        'js': 'application/javascript',
        'html': 'text/html',
        'css': 'text/css',
        'json': 'application/json'
      }[ext || ''] || 'text/plain';
      
      return new Response(file, {
        headers: { 'Content-Type': contentType }
      });
    } catch {
      return c.notFound();
    }
  });

  // Serve runtime generated files
  app.get('/runtime/generated/*', async (c) => {
    const path = c.req.path;
    const filePath = `.${path}`;
    
    try {
      const file = await Deno.readFile(filePath);
      return new Response(file, {
        headers: { 'Content-Type': 'application/javascript' }
      });
    } catch {
      return c.notFound();
    }
  });

  // Serve SPA for all other routes (client-side routing)
  app.get('*', (c) => {
    // Skip API routes, dev routes, and static file routes
    if (c.req.path.startsWith('/api/') || 
        c.req.path.startsWith('/dev/') || 
        c.req.path.startsWith('/dashboard/') ||
        c.req.path.startsWith('/debug/') ||
        c.req.path.startsWith('/app/') ||
        c.req.path.startsWith('/runtime/')) {
      return c.notFound();
    }
    
    const currentPages = runtime.getUIPages();
    if (currentPages['/']) {
      return c.html(currentPages['/']);
    }
    return c.text('SPA not ready');
  });

  
  routesRegistered = true;
}

// Serve static HTML files from app/static
app.get('/static/:filename', async (c) => {
  const filename = c.req.param('filename');
  if (!filename.endsWith('.html')) {
    return c.text('Only HTML files are served', 400);
  }
  
  try {
    const filePath = `./app/static/${filename}`;
    const content = await Deno.readTextFile(filePath);
    
    // Simple variable substitution for static HTML
    const processedContent = content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const appDefinition = runtime.getCurrentApp();
      if (appDefinition && appDefinition[varName] !== undefined) {
        return String(appDefinition[varName]);
      }
      return match; // Keep original if not found
    });
    
    return c.html(processedContent);
  } catch (error) {
    return c.text('File not found', 404);
  }
});

// Serve component files from /app/components/
app.get('/app/components/*', async (c) => {
  const path = c.req.path.slice(1) // Remove leading slash
  try {
    const content = await Deno.readTextFile(`./${path}`)
    return new Response(content, {
      headers: { 'Content-Type': 'application/javascript' }
    })
  } catch {
    return c.notFound()
  }
})

// Serve generated runtime files
app.get('/runtime/components/*', async (c) => {
  const path = c.req.path.slice(1) // Remove leading slash
  try {
    const content = await Deno.readTextFile(`./${path}`)
    return new Response(content, {
      headers: { 'Content-Type': 'application/javascript' }
    })
  } catch {
    return c.notFound()
  }
})

// Serve generated hooks
app.get('/runtime/generated/*', async (c) => {
  const path = c.req.path.slice(1) // Remove leading slash
  try {
    const content = await Deno.readTextFile(`./${path}`)
    return new Response(content, {
      headers: { 'Content-Type': 'application/javascript' }
    })
  } catch {
    return c.notFound()
  }
})

// Hot reload WebSocket for development
const hotReloadClients = new Set<WebSocket>()

app.get('/dev/hot-reload', (c) => {
  try {
    // More robust WebSocket upgrade check
    const upgradeHeader = c.req.header('upgrade')?.toLowerCase()
    const connectionHeader = c.req.header('connection')?.toLowerCase()
    
    if (upgradeHeader !== 'websocket' || !connectionHeader?.includes('upgrade')) {
      return c.text('Not a WebSocket upgrade request', 400)
    }

    const { socket, response } = Deno.upgradeWebSocket(c.req.raw)
    
    socket.onopen = () => {
      hotReloadClients.add(socket)
      // Don't log too verbosely to avoid noise
    }
    
    socket.onclose = () => {
      hotReloadClients.delete(socket)
    }
    
    socket.onerror = () => {
      // Silently clean up failed connections
      hotReloadClients.delete(socket)
    }
    
    return response
  } catch (error) {
    // Return a regular response instead of failing
    return c.text('Hot reload not available', 503)
  }
})

// Error handling
app.onError((err, c) => {
  console.error(`Server Error: ${err.message}`);
  console.error(err.stack);
  
  // Prevent server from hanging on errors
  try {
    return c.json({ 
      error: 'Internal Server Error',
      message: Deno.env.get('DENO_ENV') === 'development' ? err.message : undefined
    }, 500);
  } catch (responseError) {
    console.error('Failed to send error response:', responseError);
    return new Response('Internal Server Error', { status: 500 });
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Clean shutdown handler
let server: Deno.HttpServer | null = null

function setupCleanupHandlers() {
  // Handle Ctrl+C and other termination signals
  const cleanup = async () => {
    console.log('\n🛑 Shutting down server...')
    
    // Close WebSocket connections
    for (const socket of hotReloadClients) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }
    hotReloadClients.clear()
    
    // Close database connections
    try {
      const { closeDatabaseConnection } = await import('../database/client.ts')
      closeDatabaseConnection()
    } catch (e) {
      // Database might not be initialized yet
      console.log('Database cleanup skipped:', e.message)
    }
    
    // Shutdown server
    if (server) {
      server.shutdown()
    }
    
    console.log('✅ Cleanup complete')
    Deno.exit(0)
  }
  
  // Listen for termination signals
  Deno.addSignalListener('SIGINT', cleanup)
  Deno.addSignalListener('SIGTERM', cleanup)
}

// Initialize runtime and start server
async function startServer() {
  setupCleanupHandlers()
  
  try {
    await runtime.initialize();
    
    // Mount API routes FIRST (before catch-all UI routes)
    const apiRoutes = runtime.getAPIRoutes();
    if (apiRoutes) {
      console.log('🔌 Mounting API routes at /api...');
      app.route('/api', apiRoutes);
      console.log('✅ API routes mounted at /api');
    } else {
      console.error('❌ No API routes available to mount');
    }
    
    // Register dynamic UI routes from truth file AFTER API routes
    registerUIRoutes();

    // Mount extension routes
    const extensionRegistry = runtime.getExtensionRegistry();
    if (extensionRegistry) {
      extensionRegistry.mountAPIExtensions(app);
      console.log('✅ Extension routes mounted');
    }
    
    const config = runtime.getConfig();
    const port = config?.server.port || 8000;
    const host = config?.server.host || 'localhost';
    
    console.log(`🚀 Server ready on http://${host}:${port}`);
    console.log(`   Environment: ${config?.environment || 'unknown'}`);
    console.log(`   Debug Mode: ${config?.development.debugMode ? 'enabled' : 'disabled'}`);
    
    // Start server with proper error handling
    server = Deno.serve({ 
      port, 
      hostname: host,
      onError: (error) => {
        console.error('Server error:', error)
        return new Response('Internal Server Error', { status: 500 })
      }
    }, app.fetch);
    
    // Wait for server to finish
    await server.finished
    
  } catch (error) {
    console.error('Failed to start server:', error);
    Deno.exit(1);
  }
}

startServer();