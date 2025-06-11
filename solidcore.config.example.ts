import { FrameworkConfig } from './core/config/types.ts';

// Example Solidcore3 configuration file
// Copy this file to 'solidcore.config.ts' and customize for your needs

export default {
  // Database configuration
  database: {
    type: 'sqlite',                    // 'sqlite' or 'turso'
    url: './data/app.db',              // File path for SQLite, URL for Turso
    // token: 'your-turso-token',      // Required for Turso
    poolSize: 5,                       // Connection pool size
    timeout: 5000,                     // Query timeout in milliseconds
    enableWAL: true,                   // Enable Write-Ahead Logging (SQLite)
    maxConnections: 10,                // Maximum concurrent connections
    idleTimeout: 30000,                // Connection idle timeout
    retryAttempts: 3,                  // Number of retry attempts for failed operations
    retryDelay: 1000                   // Delay between retries in milliseconds
  },

  // Server configuration
  server: {
    port: 8000,                        // Server port
    host: 'localhost',                 // Server host (use '0.0.0.0' for all interfaces)
    
    // CORS configuration
    cors: {
      origin: [                        // Allowed origins
        'http://localhost:3000',       // Your frontend URL
        'http://localhost:8000'        // Your backend URL
      ],
      credentials: true,               // Allow credentials
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
      maxAge: 86400                    // Preflight cache duration
    },
    
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000,       // 15 minutes
      max: 100,                       // Max requests per window
      message: 'Too many requests',   // Rate limit message
      standardHeaders: true,          // Include rate limit headers
      legacyHeaders: false           // Don't include legacy headers
    },
    
    // Compression
    compression: {
      enabled: true,                  // Enable response compression
      level: 6,                       // Compression level (1-9)
      threshold: 1024                 // Minimum response size to compress
    },
    
    // Security headers
    security: {
      helmet: true,                   // Enable security headers
      hsts: true,                     // HTTP Strict Transport Security
      noSniff: true,                  // X-Content-Type-Options
      xssFilter: true                 // X-XSS-Protection
    }
  },

  // Development configuration
  development: {
    hotReload: true,                  // Enable hot reload
    debugMode: true,                  // Enable debug mode
    logLevel: 'debug',                // Log level in development
    truthFileWatch: true,             // Watch truth file for changes
    extensionReload: true,            // Auto-reload extensions
    enableProfiler: false,            // Enable performance profiler
    sourceMapSupport: true,           // Enable source map support
    verboseErrors: true,              // Show detailed error messages
    mockExternalServices: false       // Mock external API calls
  },

  // Extensions configuration
  extensions: {
    directory: './app/extensions',    // Extensions directory
    allowUnsafe: false,              // Allow unsafe extensions
    timeout: 10000,                  // Extension execution timeout
    maxMemory: 100 * 1024 * 1024,   // Max memory per extension (100MB)
    enableSandbox: true,             // Enable extension sandboxing
    autoReload: true,                // Auto-reload extensions on change
    allowedImports: [],              // Allowed import patterns
    blockedImports: [                // Blocked import patterns
      'fs', 'child_process', 'cluster'
    ]
  },

  // Logging configuration
  logging: {
    level: 'info',                   // Log level: 'debug', 'info', 'warn', 'error'
    format: 'console',               // Log format: 'console' or 'json'
    destination: 'stdout',           // Log destination: 'stdout' or 'file'
    // filePath: './logs/app.log',   // Log file path (when destination is 'file')
    maxFileSize: 10 * 1024 * 1024,  // Max log file size (10MB)
    maxFiles: 5,                     // Max number of log files to keep
    includeStackTrace: true,         // Include stack traces in errors
    includeTimestamp: true,          // Include timestamps
    includeRequestId: true,          // Include request IDs
    sensitiveFields: [               // Fields to redact from logs
      'password', 'token', 'secret', 'key', 'credential'
    ]
  },

  // Validation configuration
  validation: {
    enabled: true,                   // Enable truth file validation
    strict: false,                   // Strict validation mode
    warnOnMissingFields: true,       // Warn about missing optional fields
    failOnWarnings: false,           // Treat warnings as errors
    writeResultToFile: true,         // Write validation results to file
    resultFilePath: './schema_validation_result.txt',
    customValidators: []             // Custom validation modules
  },

  // Cache configuration (optional)
  cache: {
    enabled: false,                  // Enable caching
    provider: 'memory',              // Cache provider: 'memory', 'redis', 'file'
    ttl: 3600,                      // Default TTL in seconds (1 hour)
    maxSize: 50 * 1024 * 1024,      // Max cache size (50MB for memory cache)
    
    // Redis configuration (when provider is 'redis')
    // redis: {
    //   host: 'localhost',
    //   port: 6379,
    //   password: 'your-redis-password',
    //   database: 0
    // },
    
    // File cache configuration (when provider is 'file')
    // file: {
    //   directory: './cache',
    //   maxFileSize: 10 * 1024 * 1024  // 10MB per cache file
    // }
  },

  // Security configuration (optional)
  security: {
    // Authentication
    authentication: {
      enabled: false,                // Enable authentication
      provider: 'jwt',               // Provider: 'jwt', 'session', 'custom'
      // secret: 'your-jwt-secret',  // JWT secret (set via environment variable)
      expiresIn: '24h',              // Token expiration
      issuer: 'solidcore3',          // JWT issuer
      audience: 'solidcore3-app'     // JWT audience
    },
    
    // Authorization
    authorization: {
      enabled: false,                // Enable authorization
      defaultRole: 'user',           // Default user role
      roleField: 'role',             // User role field
      permissionField: 'permissions' // User permissions field
    },
    
    // Encryption
    encryption: {
      algorithm: 'AES-256-GCM',      // Encryption algorithm
      keyDerivation: 'PBKDF2',       // Key derivation function
      saltRounds: 12                 // Salt rounds for password hashing
    },
    
    // Rate limiting (additional security)
    rateLimit: {
      enabled: true,                 // Enable rate limiting
      global: true,                  // Apply globally
      perUser: false,                // Apply per user
      whitelist: ['127.0.0.1', '::1'], // Whitelisted IPs
      blacklist: []                  // Blacklisted IPs
    }
  },

  // Monitoring configuration (optional)
  monitoring: {
    enabled: false,                  // Enable monitoring
    
    // Metrics collection
    metrics: {
      enabled: false,                // Enable metrics collection
      endpoint: '/metrics',          // Metrics endpoint
      interval: 60000,               // Collection interval (1 minute)
      includeSystemMetrics: true     // Include system metrics (CPU, memory)
    },
    
    // Health checks
    healthCheck: {
      enabled: true,                 // Enable health checks
      endpoint: '/health',           // Health check endpoint
      timeout: 5000,                 // Health check timeout
      dependencies: ['database']     // Dependencies to check
    },
    
    // Alerting
    alerting: {
      enabled: false,                // Enable alerting
      channels: [                    // Alert channels
        // {
        //   type: 'email',
        //   config: {
        //     to: 'admin@example.com',
        //     smtp: { ... }
        //   }
        // },
        // {
        //   type: 'slack',
        //   config: {
        //     webhook: 'https://hooks.slack.com/...'
        //   }
        // }
      ]
    }
  },

  // Meta configuration
  configVersion: '1.0.0',           // Configuration schema version
  environment: 'development',       // Environment: 'development', 'staging', 'production'
  
  // Custom configuration (add your own settings here)
  custom: {
    // Add any custom configuration options specific to your application
    // myCustomSetting: 'value',
    // features: {
    //   enableNewFeature: true
    // }
  }
} as FrameworkConfig;