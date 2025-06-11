// Configuration system types and interfaces

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type DatabaseType = 'sqlite' | 'turso';
export type LogFormat = 'json' | 'console';
export type LogDestination = 'stdout' | 'file';

export interface DatabaseConfig {
  type: DatabaseType;
  url: string;
  token?: string;
  poolSize: number;
  timeout: number;
  enableWAL: boolean;
  maxConnections?: number;
  idleTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface ServerConfig {
  port: number;
  host: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
    methods: string[];
    headers?: string[];
    maxAge?: number;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    message?: string;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
  };
  compression: {
    enabled: boolean;
    level?: number;
    threshold?: number;
  };
  security: {
    helmet: boolean;
    hsts?: boolean;
    noSniff?: boolean;
    xssFilter?: boolean;
  };
}

export interface DevelopmentConfig {
  hotReload: boolean;
  debugMode: boolean;
  logLevel: LogLevel;
  truthFileWatch: boolean;
  extensionReload: boolean;
  enableProfiler: boolean;
  sourceMapSupport: boolean;
  verboseErrors: boolean;
  mockExternalServices: boolean;
}

export interface ExtensionsConfig {
  directory: string;
  allowUnsafe: boolean;
  timeout: number;
  maxMemory?: number;
  allowedImports?: string[];
  blockedImports?: string[];
  enableSandbox: boolean;
  autoReload: boolean;
}

export interface LoggingConfig {
  level: LogLevel;
  format: LogFormat;
  destination: LogDestination;
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
  includeStackTrace: boolean;
  includeTimestamp: boolean;
  includeRequestId: boolean;
  sensitiveFields?: string[];
}

export interface ValidationConfig {
  enabled: boolean;
  strict: boolean;
  warnOnMissingFields: boolean;
  failOnWarnings: boolean;
  writeResultToFile: boolean;
  resultFilePath?: string;
  customValidators?: string[];
}

export interface CacheConfig {
  enabled: boolean;
  provider: 'memory' | 'redis' | 'file';
  ttl: number;
  maxSize?: number;
  redis?: {
    host: string;
    port: number;
    password?: string;
    database?: number;
  };
  file?: {
    directory: string;
    maxFileSize: number;
  };
}

export interface SecurityConfig {
  authentication: {
    enabled: boolean;
    provider: 'jwt' | 'session' | 'custom';
    secret?: string;
    expiresIn?: string;
    issuer?: string;
    audience?: string;
  };
  authorization: {
    enabled: boolean;
    defaultRole: string;
    roleField: string;
    permissionField: string;
  };
  encryption: {
    algorithm: string;
    keyDerivation: string;
    saltRounds?: number;
  };
  rateLimit: {
    enabled: boolean;
    global: boolean;
    perUser: boolean;
    whitelist?: string[];
    blacklist?: string[];
  };
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: {
    enabled: boolean;
    endpoint: string;
    interval: number;
    includeSystemMetrics: boolean;
  };
  healthCheck: {
    enabled: boolean;
    endpoint: string;
    timeout: number;
    dependencies: string[];
  };
  alerting: {
    enabled: boolean;
    channels: Array<{
      type: 'email' | 'slack' | 'webhook';
      config: Record<string, any>;
    }>;
  };
}

export interface FrameworkConfig {
  // Core configuration
  database: DatabaseConfig;
  server: ServerConfig;
  development: DevelopmentConfig;
  
  // Feature configuration
  extensions: ExtensionsConfig;
  logging: LoggingConfig;
  validation: ValidationConfig;
  cache: CacheConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
  
  // Meta configuration
  configVersion: string;
  environment: 'development' | 'staging' | 'production';
  appName?: string;
  appVersion?: string;
  
  // Custom configuration (for user-defined settings)
  custom?: Record<string, any>;
}

export interface ConfigSource {
  name: string;
  priority: number;
  load(): Promise<Partial<FrameworkConfig>>;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: Array<{
    path: string;
    message: string;
    value: any;
    constraint?: string;
  }>;
  warnings: Array<{
    path: string;
    message: string;
    suggestion?: string;
  }>;
}

export interface ConfigChangeEvent {
  path: string;
  oldValue: any;
  newValue: any;
  source: string;
  timestamp: Date;
}

export type ConfigChangeListener = (event: ConfigChangeEvent) => void;