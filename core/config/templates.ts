// Configuration templates for different environments and use cases

import { FrameworkConfig } from './types.ts';

// Minimal development configuration
export const developmentTemplate: Partial<FrameworkConfig> = {
  database: {
    type: 'sqlite',
    url: './data/dev.db',
    poolSize: 3,
    timeout: 5000,
    enableWAL: true
  },
  
  server: {
    port: 8000,
    host: 'localhost',
    cors: {
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 1000  // High limit for development
    }
  },
  
  development: {
    hotReload: true,
    debugMode: true,
    logLevel: 'debug',
    truthFileWatch: true,
    extensionReload: true,
    verboseErrors: true
  },
  
  logging: {
    level: 'debug',
    format: 'console',
    destination: 'stdout',
    includeStackTrace: true
  },
  
  validation: {
    enabled: true,
    strict: false,
    writeResultToFile: true
  },
  
  environment: 'development'
};

// Production-ready configuration
export const productionTemplate: Partial<FrameworkConfig> = {
  database: {
    type: 'turso',  // or 'sqlite' for file-based
    // url: 'libsql://your-database.turso.tech',
    // token: 'your-turso-token',
    poolSize: 10,
    timeout: 10000,
    enableWAL: true,
    maxConnections: 20,
    retryAttempts: 3
  },
  
  server: {
    port: 8000,
    host: '0.0.0.0',
    cors: {
      origin: [],  // Must be explicitly configured
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    },
    rateLimit: {
      windowMs: 5 * 60 * 1000,  // 5 minutes
      max: 50,  // Stricter limits
      message: 'Rate limit exceeded'
    },
    compression: {
      enabled: true,
      level: 6,
      threshold: 1024
    },
    security: {
      helmet: true,
      hsts: true,
      noSniff: true,
      xssFilter: true
    }
  },
  
  development: {
    hotReload: false,
    debugMode: false,
    logLevel: 'warn',
    truthFileWatch: false,
    extensionReload: false,
    verboseErrors: false
  },
  
  logging: {
    level: 'warn',
    format: 'json',
    destination: 'file',
    filePath: './logs/production.log',
    maxFileSize: 50 * 1024 * 1024,  // 50MB
    maxFiles: 10,
    includeStackTrace: false,
    includeTimestamp: true,
    includeRequestId: true
  },
  
  validation: {
    enabled: true,
    strict: true,
    failOnWarnings: true,
    writeResultToFile: false
  },
  
  cache: {
    enabled: true,
    provider: 'redis',
    ttl: 7200,  // 2 hours
    redis: {
      host: 'redis',
      port: 6379,
      database: 0
    }
  },
  
  security: {
    authentication: {
      enabled: true,
      provider: 'jwt',
      expiresIn: '1h',  // Shorter expiry in production
      issuer: 'solidcore3',
      audience: 'solidcore3-app'
    },
    authorization: {
      enabled: true,
      defaultRole: 'user'
    },
    rateLimit: {
      enabled: true,
      global: true,
      perUser: true
    }
  },
  
  monitoring: {
    enabled: true,
    metrics: {
      enabled: true,
      endpoint: '/metrics',
      interval: 60000,
      includeSystemMetrics: true
    },
    healthCheck: {
      enabled: true,
      endpoint: '/health',
      timeout: 5000,
      dependencies: ['database', 'cache']
    }
  },
  
  environment: 'production'
};

// Staging configuration
export const stagingTemplate: Partial<FrameworkConfig> = {
  database: {
    type: 'sqlite',
    url: './data/staging.db',
    poolSize: 5,
    timeout: 8000,
    enableWAL: true
  },
  
  server: {
    port: 8000,
    host: '0.0.0.0',
    cors: {
      origin: ['https://staging.yourapp.com'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    },
    rateLimit: {
      windowMs: 10 * 60 * 1000,  // 10 minutes
      max: 200
    }
  },
  
  development: {
    hotReload: false,
    debugMode: true,
    logLevel: 'info',
    truthFileWatch: false,
    extensionReload: false,
    verboseErrors: true,
    mockExternalServices: true  // Useful for staging
  },
  
  logging: {
    level: 'info',
    format: 'json',
    destination: 'file',
    filePath: './logs/staging.log',
    includeStackTrace: true
  },
  
  validation: {
    enabled: true,
    strict: true,
    failOnWarnings: false,
    writeResultToFile: true
  },
  
  monitoring: {
    enabled: true,
    metrics: {
      enabled: true
    },
    healthCheck: {
      enabled: true
    }
  },
  
  environment: 'staging'
};

// Docker configuration
export const dockerTemplate: Partial<FrameworkConfig> = {
  database: {
    type: 'sqlite',
    url: '/app/data/app.db',  // Container path
    poolSize: 5,
    timeout: 10000,
    enableWAL: true
  },
  
  server: {
    port: 8000,
    host: '0.0.0.0',  // Important for Docker
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['*'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }
  },
  
  logging: {
    level: 'info',
    format: 'json',
    destination: 'stdout',  // Docker logs
    includeTimestamp: true,
    includeRequestId: true
  },
  
  extensions: {
    directory: '/app/extensions',  // Container path
    allowUnsafe: false,
    timeout: 10000
  }
};

// Testing configuration
export const testingTemplate: Partial<FrameworkConfig> = {
  database: {
    type: 'sqlite',
    url: ':memory:',  // In-memory database for tests
    poolSize: 1,
    timeout: 1000,
    enableWAL: false
  },
  
  server: {
    port: 0,  // Random port for tests
    host: 'localhost',
    cors: {
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    },
    rateLimit: {
      windowMs: 60 * 1000,
      max: 10000  // High limit for tests
    }
  },
  
  development: {
    hotReload: false,
    debugMode: false,
    logLevel: 'error',  // Minimal logging during tests
    truthFileWatch: false,
    extensionReload: false,
    verboseErrors: true,
    mockExternalServices: true  // Always mock in tests
  },
  
  logging: {
    level: 'error',
    format: 'console',
    destination: 'stdout',
    includeStackTrace: true
  },
  
  validation: {
    enabled: true,
    strict: true,
    failOnWarnings: true,
    writeResultToFile: false
  },
  
  cache: {
    enabled: false  // Disable cache in tests
  },
  
  extensions: {
    directory: './test/fixtures/extensions',
    allowUnsafe: true,  // Allow for testing
    timeout: 5000
  },
  
  monitoring: {
    enabled: false  // Disable monitoring in tests
  }
};

// High-performance configuration
export const performanceTemplate: Partial<FrameworkConfig> = {
  database: {
    type: 'turso',
    poolSize: 20,
    timeout: 5000,
    enableWAL: true,
    maxConnections: 50,
    idleTimeout: 60000,
    retryAttempts: 2,
    retryDelay: 500
  },
  
  server: {
    rateLimit: {
      windowMs: 1 * 60 * 1000,  // 1 minute
      max: 1000  // High throughput
    },
    compression: {
      enabled: true,
      level: 1,  // Fast compression
      threshold: 2048
    }
  },
  
  logging: {
    level: 'warn',  // Minimal logging for performance
    format: 'json',
    destination: 'file',
    includeStackTrace: false,
    includeTimestamp: false  // Save processing time
  },
  
  cache: {
    enabled: true,
    provider: 'redis',
    ttl: 3600,
    redis: {
      host: 'redis-cluster',
      port: 6379
    }
  },
  
  validation: {
    enabled: true,
    strict: false,  // Skip non-critical validations
    failOnWarnings: false,
    writeResultToFile: false
  },
  
  extensions: {
    timeout: 30000,  // Longer timeout for complex operations
    maxMemory: 500 * 1024 * 1024,  // 500MB
    enableSandbox: false  // Disable for performance
  }
};

// Function to generate configuration files
export function generateConfigFile(template: Partial<FrameworkConfig>, format: 'ts' | 'js' = 'ts'): string {
  const imports = format === 'ts' 
    ? `import { FrameworkConfig } from './core/config/types.ts';\n\n`
    : '';
    
  const exportStatement = format === 'ts'
    ? 'export default config as FrameworkConfig;'
    : 'module.exports = config;';
    
  const typeAnnotation = format === 'ts' ? ': Partial<FrameworkConfig>' : '';
  
  return `${imports}const config${typeAnnotation} = ${JSON.stringify(template, null, 2)};

${exportStatement}
`;
}

// Helper function to merge templates
export function mergeTemplates(...templates: Partial<FrameworkConfig>[]): Partial<FrameworkConfig> {
  return templates.reduce((merged, template) => {
    return deepMerge(merged, template);
  }, {});
}

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    
    if (sourceValue === null || sourceValue === undefined) {
      continue;
    }
    
    if (isObject(sourceValue) && isObject(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  }
  
  return result;
}

function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}