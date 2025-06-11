import { FrameworkConfig } from './types.ts';

export function getDefaultConfig(): FrameworkConfig {
  return {
    // Core configuration
    database: {
      type: 'sqlite',
      url: './data/app.db',
      poolSize: 5,
      timeout: 5000,
      enableWAL: true,
      maxConnections: 10,
      idleTimeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000
    },
    
    server: {
      port: 8000,
      host: 'localhost',
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:8000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
        maxAge: 86400
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP',
        standardHeaders: true,
        legacyHeaders: false
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
      hotReload: true,
      debugMode: true,
      logLevel: 'debug',
      truthFileWatch: true,
      extensionReload: true,
      enableProfiler: false,
      sourceMapSupport: true,
      verboseErrors: true,
      mockExternalServices: false
    },
    
    // Feature configuration
    extensions: {
      directory: './app/extensions',
      allowUnsafe: false,
      timeout: 10000,
      maxMemory: 100 * 1024 * 1024, // 100MB
      allowedImports: [],
      blockedImports: ['fs', 'child_process', 'cluster'],
      enableSandbox: true,
      autoReload: true
    },
    
    logging: {
      level: 'info',
      format: 'console',
      destination: 'stdout',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      includeStackTrace: true,
      includeTimestamp: true,
      includeRequestId: true,
      sensitiveFields: ['password', 'token', 'secret', 'key', 'credential']
    },
    
    validation: {
      enabled: true,
      strict: false,
      warnOnMissingFields: true,
      failOnWarnings: false,
      writeResultToFile: true,
      resultFilePath: './schema_validation_result.txt',
      customValidators: []
    },
    
    cache: {
      enabled: false,
      provider: 'memory',
      ttl: 3600, // 1 hour
      maxSize: 50 * 1024 * 1024 // 50MB
    },
    
    security: {
      authentication: {
        enabled: false,
        provider: 'jwt',
        expiresIn: '24h',
        issuer: 'solidcore3',
        audience: 'solidcore3-app'
      },
      authorization: {
        enabled: false,
        defaultRole: 'user',
        roleField: 'role',
        permissionField: 'permissions'
      },
      encryption: {
        algorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2',
        saltRounds: 12
      },
      rateLimit: {
        enabled: true,
        global: true,
        perUser: false,
        whitelist: ['127.0.0.1', '::1'],
        blacklist: []
      }
    },
    
    monitoring: {
      enabled: false,
      metrics: {
        enabled: false,
        endpoint: '/metrics',
        interval: 60000, // 1 minute
        includeSystemMetrics: true
      },
      healthCheck: {
        enabled: true,
        endpoint: '/health',
        timeout: 5000,
        dependencies: ['database']
      },
      alerting: {
        enabled: false,
        channels: []
      }
    },
    
    // Meta configuration
    configVersion: '1.0.0',
    environment: 'development'
  };
}

export function getProductionOverrides(): Partial<FrameworkConfig> {
  return {
    development: {
      hotReload: false,
      debugMode: false,
      logLevel: 'warn',
      truthFileWatch: false,
      extensionReload: false,
      enableProfiler: false,
      sourceMapSupport: false,
      verboseErrors: false,
      mockExternalServices: false
    },
    
    logging: {
      level: 'warn',
      format: 'json',
      destination: 'file',
      filePath: './logs/app.log',
      includeStackTrace: false,
      includeTimestamp: true,
      includeRequestId: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
      sensitiveFields: ['password', 'token', 'secret', 'key', 'credential', 'auth']
    },
    
    server: {
      host: '0.0.0.0',
      cors: {
        origin: [], // Must be explicitly configured for production
        credentials: false,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        headers: ['Content-Type', 'Authorization']
      },
      rateLimit: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 50, // More restrictive in production
        message: 'Rate limit exceeded',
        standardHeaders: true,
        legacyHeaders: false
      },
      security: {
        helmet: true,
        hsts: true,
        noSniff: true,
        xssFilter: true
      }
    },
    
    validation: {
      strict: true,
      failOnWarnings: true,
      writeResultToFile: false
    },
    
    cache: {
      enabled: true,
      ttl: 7200 // 2 hours in production
    },
    
    monitoring: {
      enabled: true,
      metrics: {
        enabled: true,
        includeSystemMetrics: true
      },
      healthCheck: {
        enabled: true,
        timeout: 3000
      }
    },
    
    environment: 'production'
  };
}

export function getStagingOverrides(): Partial<FrameworkConfig> {
  return {
    development: {
      hotReload: false,
      debugMode: true,
      logLevel: 'info',
      truthFileWatch: false,
      extensionReload: false,
      enableProfiler: true,
      sourceMapSupport: true,
      verboseErrors: true,
      mockExternalServices: true
    },
    
    logging: {
      level: 'info',
      format: 'json',
      destination: 'file',
      filePath: './logs/staging.log'
    },
    
    validation: {
      strict: true,
      failOnWarnings: false,
      writeResultToFile: true
    },
    
    monitoring: {
      enabled: true,
      metrics: {
        enabled: true
      }
    },
    
    environment: 'staging'
  };
}