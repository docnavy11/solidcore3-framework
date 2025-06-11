import { FrameworkConfig, ConfigValidationResult, LogLevel, DatabaseType } from './types.ts';

export class ConfigValidator {
  validate(config: FrameworkConfig): ConfigValidationResult {
    const errors: Array<{ path: string; message: string; value: any; constraint?: string }> = [];
    const warnings: Array<{ path: string; message: string; suggestion?: string }> = [];
    
    // Validate database configuration
    this.validateDatabase(config.database, errors, warnings);
    
    // Validate server configuration
    this.validateServer(config.server, errors, warnings);
    
    // Validate development configuration
    this.validateDevelopment(config.development, errors, warnings);
    
    // Validate logging configuration
    this.validateLogging(config.logging, errors, warnings);
    
    // Validate extensions configuration
    this.validateExtensions(config.extensions, errors, warnings);
    
    // Validate security configuration
    this.validateSecurity(config.security, errors, warnings);
    
    // Validate cache configuration
    this.validateCache(config.cache, errors, warnings);
    
    // Validate monitoring configuration
    this.validateMonitoring(config.monitoring, errors, warnings);
    
    // Cross-validation checks
    this.validateCrossReferences(config, errors, warnings);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private validateDatabase(config: FrameworkConfig['database'], errors: any[], warnings: any[]): void {
    // Required fields
    if (!config.type) {
      errors.push({
        path: 'database.type',
        message: 'Database type is required',
        value: config.type,
        constraint: 'Must be "sqlite" or "turso"'
      });
    } else if (!['sqlite', 'turso'].includes(config.type)) {
      errors.push({
        path: 'database.type',
        message: 'Invalid database type',
        value: config.type,
        constraint: 'Must be "sqlite" or "turso"'
      });
    }
    
    if (!config.url) {
      errors.push({
        path: 'database.url',
        message: 'Database URL is required',
        value: config.url
      });
    }
    
    // Turso-specific validation
    if (config.type === 'turso') {
      if (!config.token) {
        errors.push({
          path: 'database.token',
          message: 'Token is required for Turso database',
          value: config.token,
          constraint: 'Set DATABASE_TOKEN environment variable'
        });
      }
      
      if (!config.url.includes('turso.tech')) {
        warnings.push({
          path: 'database.url',
          message: 'URL does not appear to be a Turso URL',
          suggestion: 'Turso URLs typically contain "turso.tech"'
        });
      }
    }
    
    // SQLite-specific validation
    if (config.type === 'sqlite') {
      if (config.url.startsWith('http')) {
        errors.push({
          path: 'database.url',
          message: 'SQLite URL should be a file path, not HTTP URL',
          value: config.url,
          constraint: 'Use a local file path like "./data/app.db"'
        });
      }
      
      if (config.token) {
        warnings.push({
          path: 'database.token',
          message: 'Token is not used with SQLite databases',
          suggestion: 'Remove token for SQLite or switch to Turso'
        });
      }
    }
    
    // Numeric validation
    if (config.poolSize <= 0) {
      errors.push({
        path: 'database.poolSize',
        message: 'Pool size must be greater than 0',
        value: config.poolSize,
        constraint: 'Minimum value: 1'
      });
    }
    
    if (config.poolSize > 100) {
      warnings.push({
        path: 'database.poolSize',
        message: 'Pool size is very large',
        suggestion: 'Consider reducing pool size for better resource management'
      });
    }
    
    if (config.timeout <= 0) {
      errors.push({
        path: 'database.timeout',
        message: 'Timeout must be greater than 0',
        value: config.timeout,
        constraint: 'Minimum value: 1000 (1 second)'
      });
    }
    
    if (config.timeout > 60000) {
      warnings.push({
        path: 'database.timeout',
        message: 'Database timeout is very long',
        suggestion: 'Consider reducing timeout to avoid hanging requests'
      });
    }
  }
  
  private validateServer(config: FrameworkConfig['server'], errors: any[], warnings: any[]): void {
    // Port validation
    if (config.port < 1 || config.port > 65535) {
      errors.push({
        path: 'server.port',
        message: 'Invalid port number',
        value: config.port,
        constraint: 'Must be between 1 and 65535'
      });
    }
    
    if (config.port < 1024 && config.port !== 80 && config.port !== 443) {
      warnings.push({
        path: 'server.port',
        message: 'Using privileged port',
        suggestion: 'Ports below 1024 may require elevated permissions'
      });
    }
    
    // Host validation
    if (!config.host) {
      errors.push({
        path: 'server.host',
        message: 'Host is required',
        value: config.host
      });
    }
    
    // CORS validation
    if (Array.isArray(config.cors.origin) && config.cors.origin.length === 0) {
      warnings.push({
        path: 'server.cors.origin',
        message: 'CORS origin is empty array',
        suggestion: 'Add allowed origins or use "*" for development'
      });
    }
    
    if (config.cors.origin === '*' && config.cors.credentials) {
      warnings.push({
        path: 'server.cors',
        message: 'Using credentials with wildcard origin is not secure',
        suggestion: 'Specify exact origins when using credentials'
      });
    }
    
    // Rate limiting validation
    if (config.rateLimit.max <= 0) {
      errors.push({
        path: 'server.rateLimit.max',
        message: 'Rate limit max must be greater than 0',
        value: config.rateLimit.max
      });
    }
    
    if (config.rateLimit.windowMs <= 0) {
      errors.push({
        path: 'server.rateLimit.windowMs',
        message: 'Rate limit window must be greater than 0',
        value: config.rateLimit.windowMs
      });
    }
  }
  
  private validateDevelopment(config: FrameworkConfig['development'], errors: any[], warnings: any[]): void {
    // Log level validation
    const validLogLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    if (!validLogLevels.includes(config.logLevel)) {
      errors.push({
        path: 'development.logLevel',
        message: 'Invalid log level',
        value: config.logLevel,
        constraint: 'Must be one of: debug, info, warn, error'
      });
    }
    
    // Hot reload dependency validation
    if (config.hotReload && !config.truthFileWatch) {
      warnings.push({
        path: 'development.truthFileWatch',
        message: 'Hot reload enabled but truth file watching is disabled',
        suggestion: 'Enable truthFileWatch for hot reload to work properly'
      });
    }
  }
  
  private validateLogging(config: FrameworkConfig['logging'], errors: any[], warnings: any[]): void {
    // Log level validation
    const validLogLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    if (!validLogLevels.includes(config.level)) {
      errors.push({
        path: 'logging.level',
        message: 'Invalid log level',
        value: config.level,
        constraint: 'Must be one of: debug, info, warn, error'
      });
    }
    
    // Format validation
    if (!['json', 'console'].includes(config.format)) {
      errors.push({
        path: 'logging.format',
        message: 'Invalid log format',
        value: config.format,
        constraint: 'Must be "json" or "console"'
      });
    }
    
    // Destination validation
    if (!['stdout', 'file'].includes(config.destination)) {
      errors.push({
        path: 'logging.destination',
        message: 'Invalid log destination',
        value: config.destination,
        constraint: 'Must be "stdout" or "file"'
      });
    }
    
    // File destination validation
    if (config.destination === 'file' && !config.filePath) {
      errors.push({
        path: 'logging.filePath',
        message: 'File path is required when destination is "file"',
        value: config.filePath
      });
    }
    
    // File size validation
    if (config.maxFileSize && config.maxFileSize <= 0) {
      errors.push({
        path: 'logging.maxFileSize',
        message: 'Max file size must be greater than 0',
        value: config.maxFileSize
      });
    }
    
    if (config.maxFiles && config.maxFiles <= 0) {
      errors.push({
        path: 'logging.maxFiles',
        message: 'Max files must be greater than 0',
        value: config.maxFiles
      });
    }
  }
  
  private validateExtensions(config: FrameworkConfig['extensions'], errors: any[], warnings: any[]): void {
    // Directory validation
    if (!config.directory) {
      errors.push({
        path: 'extensions.directory',
        message: 'Extensions directory is required',
        value: config.directory
      });
    }
    
    // Timeout validation
    if (config.timeout <= 0) {
      errors.push({
        path: 'extensions.timeout',
        message: 'Extensions timeout must be greater than 0',
        value: config.timeout,
        constraint: 'Minimum value: 1000 (1 second)'
      });
    }
    
    if (config.timeout > 300000) { // 5 minutes
      warnings.push({
        path: 'extensions.timeout',
        message: 'Extensions timeout is very long',
        suggestion: 'Consider reducing timeout to avoid hanging extensions'
      });
    }
    
    // Security warnings
    if (config.allowUnsafe) {
      warnings.push({
        path: 'extensions.allowUnsafe',
        message: 'Unsafe extensions are allowed',
        suggestion: 'Only enable in trusted development environments'
      });
    }
    
    // Memory validation
    if (config.maxMemory && config.maxMemory <= 0) {
      errors.push({
        path: 'extensions.maxMemory',
        message: 'Max memory must be greater than 0',
        value: config.maxMemory
      });
    }
  }
  
  private validateSecurity(config: FrameworkConfig['security'], errors: any[], warnings: any[]): void {
    // Authentication validation
    if (config.authentication.enabled) {
      if (!['jwt', 'session', 'custom'].includes(config.authentication.provider)) {
        errors.push({
          path: 'security.authentication.provider',
          message: 'Invalid authentication provider',
          value: config.authentication.provider,
          constraint: 'Must be "jwt", "session", or "custom"'
        });
      }
      
      if (config.authentication.provider === 'jwt' && !config.authentication.secret) {
        errors.push({
          path: 'security.authentication.secret',
          message: 'JWT secret is required when using JWT authentication',
          value: config.authentication.secret,
          constraint: 'Set a strong secret key'
        });
      }
      
      if (config.authentication.secret && config.authentication.secret.length < 32) {
        warnings.push({
          path: 'security.authentication.secret',
          message: 'JWT secret is too short',
          suggestion: 'Use at least 32 characters for better security'
        });
      }
    }
    
    // Encryption validation
    if (!['AES-256-GCM', 'AES-256-CBC', 'ChaCha20-Poly1305'].includes(config.encryption.algorithm)) {
      warnings.push({
        path: 'security.encryption.algorithm',
        message: 'Non-standard encryption algorithm',
        suggestion: 'Consider using AES-256-GCM for better security'
      });
    }
    
    if (config.encryption.saltRounds && (config.encryption.saltRounds < 10 || config.encryption.saltRounds > 15)) {
      warnings.push({
        path: 'security.encryption.saltRounds',
        message: 'Salt rounds should be between 10-15',
        suggestion: 'Use 12 rounds for good balance of security and performance'
      });
    }
  }
  
  private validateCache(config: FrameworkConfig['cache'], errors: any[], warnings: any[]): void {
    if (!config.enabled) return;
    
    // Provider validation
    if (!['memory', 'redis', 'file'].includes(config.provider)) {
      errors.push({
        path: 'cache.provider',
        message: 'Invalid cache provider',
        value: config.provider,
        constraint: 'Must be "memory", "redis", or "file"'
      });
    }
    
    // TTL validation
    if (config.ttl <= 0) {
      errors.push({
        path: 'cache.ttl',
        message: 'Cache TTL must be greater than 0',
        value: config.ttl
      });
    }
    
    // Redis-specific validation
    if (config.provider === 'redis' && config.redis) {
      if (!config.redis.host) {
        errors.push({
          path: 'cache.redis.host',
          message: 'Redis host is required',
          value: config.redis.host
        });
      }
      
      if (config.redis.port < 1 || config.redis.port > 65535) {
        errors.push({
          path: 'cache.redis.port',
          message: 'Invalid Redis port',
          value: config.redis.port,
          constraint: 'Must be between 1 and 65535'
        });
      }
    }
    
    // Memory cache validation
    if (config.provider === 'memory' && config.maxSize && config.maxSize <= 0) {
      errors.push({
        path: 'cache.maxSize',
        message: 'Cache max size must be greater than 0',
        value: config.maxSize
      });
    }
  }
  
  private validateMonitoring(config: FrameworkConfig['monitoring'], errors: any[], warnings: any[]): void {
    if (!config.enabled) return;
    
    // Health check validation
    if (config.healthCheck.enabled) {
      if (!config.healthCheck.endpoint) {
        errors.push({
          path: 'monitoring.healthCheck.endpoint',
          message: 'Health check endpoint is required',
          value: config.healthCheck.endpoint
        });
      }
      
      if (config.healthCheck.timeout <= 0) {
        errors.push({
          path: 'monitoring.healthCheck.timeout',
          message: 'Health check timeout must be greater than 0',
          value: config.healthCheck.timeout
        });
      }
    }
    
    // Metrics validation
    if (config.metrics.enabled) {
      if (config.metrics.interval <= 0) {
        errors.push({
          path: 'monitoring.metrics.interval',
          message: 'Metrics interval must be greater than 0',
          value: config.metrics.interval
        });
      }
      
      if (config.metrics.interval < 1000) {
        warnings.push({
          path: 'monitoring.metrics.interval',
          message: 'Metrics interval is very short',
          suggestion: 'Consider increasing interval to reduce overhead'
        });
      }
    }
  }
  
  private validateCrossReferences(config: FrameworkConfig, errors: any[], warnings: any[]): void {
    // Environment-specific validations
    if (config.environment === 'production') {
      if (config.development.debugMode) {
        warnings.push({
          path: 'development.debugMode',
          message: 'Debug mode is enabled in production',
          suggestion: 'Disable debug mode for production deployment'
        });
      }
      
      if (config.development.hotReload) {
        warnings.push({
          path: 'development.hotReload',
          message: 'Hot reload is enabled in production',
          suggestion: 'Disable hot reload for production deployment'
        });
      }
      
      if (config.logging.level === 'debug') {
        warnings.push({
          path: 'logging.level',
          message: 'Debug logging in production may impact performance',
          suggestion: 'Use "warn" or "error" log level in production'
        });
      }
      
      if (config.server.cors.origin === '*') {
        warnings.push({
          path: 'server.cors.origin',
          message: 'Wildcard CORS origin in production is not secure',
          suggestion: 'Specify exact allowed origins for production'
        });
      }
    }
    
    // Development-specific validations
    if (config.environment === 'development') {
      if (!config.development.debugMode) {
        warnings.push({
          path: 'development.debugMode',
          message: 'Debug mode is disabled in development',
          suggestion: 'Enable debug mode for better development experience'
        });
      }
    }
    
    // Consistency checks
    if (config.cache.enabled && config.cache.provider === 'redis' && !config.cache.redis) {
      errors.push({
        path: 'cache.redis',
        message: 'Redis configuration is required when using Redis cache provider',
        value: config.cache.redis
      });
    }
    
    if (config.security.authentication.enabled && !config.monitoring.enabled) {
      warnings.push({
        path: 'monitoring.enabled',
        message: 'Monitoring is disabled but authentication is enabled',
        suggestion: 'Enable monitoring to track authentication events'
      });
    }
  }
}