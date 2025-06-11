import { ConfigSource, FrameworkConfig } from './types.ts';
import { getDefaultConfig, getProductionOverrides, getStagingOverrides } from './defaults.ts';

// File-based configuration source
export class FileConfigSource implements ConfigSource {
  name = 'file';
  priority = 2;
  
  constructor(private paths: string[] = [
    './solidcore.config.ts',
    './solidcore.config.js',
    './config/solidcore.ts',
    './config/solidcore.js'
  ]) {}
  
  async load(): Promise<Partial<FrameworkConfig>> {
    for (const path of this.paths) {
      try {
        const stat = await Deno.stat(path);
        if (stat.isFile) {
          console.log(`📄 Loading config from ${path}`);
          const module = await import(path);
          return module.default || module.config || {};
        }
      } catch (error) {
        // File doesn't exist or can't be read, continue to next path
        continue;
      }
    }
    
    return {};
  }
}

// Environment variable configuration source
export class EnvConfigSource implements ConfigSource {
  name = 'environment';
  priority = 3;
  
  async load(): Promise<Partial<FrameworkConfig>> {
    const config: Partial<FrameworkConfig> = {};
    
    // Database configuration
    if (Deno.env.get('DATABASE_TYPE')) {
      config.database = {
        ...config.database,
        type: Deno.env.get('DATABASE_TYPE') as 'sqlite' | 'turso',
        url: Deno.env.get('DATABASE_URL') || './data/app.db',
        token: Deno.env.get('DATABASE_TOKEN'),
        poolSize: parseInt(Deno.env.get('DATABASE_POOL_SIZE') || '5'),
        timeout: parseInt(Deno.env.get('DATABASE_TIMEOUT') || '5000'),
        enableWAL: Deno.env.get('DATABASE_WAL') === 'true'
      };
    }
    
    // Server configuration
    if (Deno.env.get('PORT') || Deno.env.get('HOST')) {
      config.server = {
        ...config.server,
        port: parseInt(Deno.env.get('PORT') || '8000'),
        host: Deno.env.get('HOST') || 'localhost',
        cors: {
          ...config.server?.cors,
          origin: Deno.env.get('CORS_ORIGIN')?.split(',') || ['*'],
          credentials: Deno.env.get('CORS_CREDENTIALS') === 'true'
        }
      };
    }
    
    // Development configuration
    const nodeEnv = Deno.env.get('NODE_ENV') || Deno.env.get('DENO_ENV');
    if (nodeEnv || Deno.env.get('DEBUG')) {
      config.development = {
        ...config.development,
        hotReload: Deno.env.get('HOT_RELOAD') === 'true',
        debugMode: Deno.env.get('DEBUG') === 'true' || nodeEnv === 'development',
        logLevel: (Deno.env.get('LOG_LEVEL') || 'info') as any,
        truthFileWatch: Deno.env.get('TRUTH_FILE_WATCH') !== 'false',
        extensionReload: Deno.env.get('EXTENSION_RELOAD') === 'true'
      };
    }
    
    // Logging configuration
    if (Deno.env.get('LOG_LEVEL') || Deno.env.get('LOG_FORMAT')) {
      config.logging = {
        ...config.logging,
        level: (Deno.env.get('LOG_LEVEL') || 'info') as any,
        format: (Deno.env.get('LOG_FORMAT') || 'console') as any,
        destination: (Deno.env.get('LOG_DESTINATION') || 'stdout') as any,
        filePath: Deno.env.get('LOG_FILE_PATH')
      };
    }
    
    // Security configuration
    if (Deno.env.get('JWT_SECRET') || Deno.env.get('AUTH_ENABLED')) {
      config.security = {
        ...config.security,
        authentication: {
          ...config.security?.authentication,
          enabled: Deno.env.get('AUTH_ENABLED') === 'true',
          secret: Deno.env.get('JWT_SECRET'),
          expiresIn: Deno.env.get('JWT_EXPIRES_IN') || '24h',
          issuer: Deno.env.get('JWT_ISSUER'),
          audience: Deno.env.get('JWT_AUDIENCE')
        }
      };
    }
    
    // Extensions configuration
    if (Deno.env.get('EXTENSIONS_DIR') || Deno.env.get('EXTENSIONS_UNSAFE')) {
      config.extensions = {
        ...config.extensions,
        directory: Deno.env.get('EXTENSIONS_DIR') || './app/extensions',
        allowUnsafe: Deno.env.get('EXTENSIONS_UNSAFE') === 'true',
        timeout: parseInt(Deno.env.get('EXTENSIONS_TIMEOUT') || '10000')
      };
    }
    
    // Cache configuration
    if (Deno.env.get('CACHE_ENABLED') || Deno.env.get('REDIS_URL')) {
      config.cache = {
        ...config.cache,
        enabled: Deno.env.get('CACHE_ENABLED') === 'true',
        provider: Deno.env.get('CACHE_PROVIDER') as any || 'memory',
        ttl: parseInt(Deno.env.get('CACHE_TTL') || '3600'),
        redis: Deno.env.get('REDIS_URL') ? {
          host: new URL(Deno.env.get('REDIS_URL')!).hostname,
          port: parseInt(new URL(Deno.env.get('REDIS_URL')!).port) || 6379,
          password: new URL(Deno.env.get('REDIS_URL')!).password || undefined,
          database: parseInt(Deno.env.get('REDIS_DATABASE') || '0')
        } : undefined
      };
    }
    
    // Environment detection
    const environment = nodeEnv || 'development';
    config.environment = environment as any;
    
    return config;
  }
}

// Default configuration source
export class DefaultConfigSource implements ConfigSource {
  name = 'defaults';
  priority = 1;
  
  async load(): Promise<Partial<FrameworkConfig>> {
    const environment = Deno.env.get('NODE_ENV') || Deno.env.get('DENO_ENV') || 'development';
    
    let config = getDefaultConfig();
    
    // Apply environment-specific overrides
    switch (environment) {
      case 'production':
        config = { ...config, ...getProductionOverrides() };
        break;
      case 'staging':
        config = { ...config, ...getStagingOverrides() };
        break;
      default:
        // Development settings are already in defaults
        break;
    }
    
    return config;
  }
}

// CLI arguments configuration source (for future use)
export class CLIConfigSource implements ConfigSource {
  name = 'cli';
  priority = 4;
  
  constructor(private args: string[] = Deno.args) {}
  
  async load(): Promise<Partial<FrameworkConfig>> {
    const config: Partial<FrameworkConfig> = {};
    
    // Parse CLI arguments
    for (let i = 0; i < this.args.length; i++) {
      const arg = this.args[i];
      const nextArg = this.args[i + 1];
      
      switch (arg) {
        case '--port':
        case '-p':
          if (nextArg && !nextArg.startsWith('-')) {
            config.server = { ...config.server, port: parseInt(nextArg) };
            i++;
          }
          break;
          
        case '--host':
        case '-h':
          if (nextArg && !nextArg.startsWith('-')) {
            config.server = { ...config.server, host: nextArg };
            i++;
          }
          break;
          
        case '--debug':
        case '-d':
          config.development = { ...config.development, debugMode: true };
          break;
          
        case '--log-level':
          if (nextArg && !nextArg.startsWith('-')) {
            config.logging = { ...config.logging, level: nextArg as any };
            i++;
          }
          break;
          
        case '--database':
        case '--db':
          if (nextArg && !nextArg.startsWith('-')) {
            config.database = { ...config.database, url: nextArg };
            i++;
          }
          break;
          
        case '--config':
        case '-c':
          // This would be handled by the ConfigManager to load a specific config file
          break;
      }
    }
    
    return config;
  }
}