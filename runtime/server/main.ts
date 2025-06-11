import { Hono } from 'https://deno.land/x/hono@v4.3.11/mod.ts';
import { logger } from 'https://deno.land/x/hono@v4.3.11/middleware/logger/index.ts';
import { timing } from 'https://deno.land/x/hono@v4.3.11/middleware/timing/index.ts';
import { cors } from 'https://deno.land/x/hono@v4.3.11/middleware/cors/index.ts';
import { RuntimeEngine } from '../engine/runtime.ts';

const app = new Hono();
const runtime = new RuntimeEngine();

// Global middleware
app.use('*', timing());
app.use('*', logger());

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
function registerUIRoutes() {
  const appDefinition = runtime.getCurrentApp();
  const uiPages = runtime.getUIPages();
  
  // Register home page
  app.get('/', (c) => {
    if (uiPages['/']) {
      return c.html(uiPages['/']);
    }
    return c.text('UI not ready');
  });
  
  // Register routes from truth file views
  if (appDefinition?.views) {
    for (const [viewName, view] of Object.entries(appDefinition.views)) {
      const route = view.route;
      console.log(`📍 Registering UI route: GET ${route} (${viewName})`);
      
      app.get(route, (c) => {
        if (uiPages[route]) {
          return c.html(uiPages[route]);
        }
        return c.text(`UI page not ready for ${route}`);
      });
    }
  }
  
  // Register edit routes for entities (these are generated automatically)
  if (appDefinition?.entities) {
    for (const [entityName] of Object.entries(appDefinition.entities)) {
      const editRoute = `/${entityName.toLowerCase()}s/:id/edit`;
      console.log(`📍 Registering edit route: GET ${editRoute}`);
      
      app.get(editRoute, (c) => {
        if (uiPages[editRoute]) {
          return c.html(uiPages[editRoute]);
        }
        return c.text(`Edit page not ready for ${editRoute}`);
      });
    }
  }
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

// Error handling
app.onError((err, c) => {
  console.error(`Error: ${err}`);
  return c.json({ 
    error: 'Internal Server Error',
    message: Deno.env.get('DENO_ENV') === 'development' ? err.message : undefined
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Initialize runtime and start server
async function startServer() {
  try {
    await runtime.initialize();
    
    // Register dynamic UI routes from truth file
    registerUIRoutes();
    
    // Mount API routes
    const apiRoutes = runtime.getAPIRoutes();
    if (apiRoutes) {
      app.route('/api', apiRoutes);
      console.log('✅ API routes mounted at /api');
    }

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
    
    Deno.serve({ port, hostname: host }, app.fetch);
  } catch (error) {
    console.error('Failed to start server:', error);
    Deno.exit(1);
  }
}

startServer();