import { 
  FrameworkConfig, 
  ConfigSource, 
  ConfigChangeListener, 
  ConfigChangeEvent,
  ConfigValidationResult 
} from './types.ts';
import { 
  DefaultConfigSource, 
  FileConfigSource, 
  EnvConfigSource, 
  CLIConfigSource 
} from './sources.ts';
import { ConfigValidator } from './validator.ts';
import { ConfigurationError } from '../errors/index.ts';

export class ConfigManager {
  private config: FrameworkConfig | null = null;
  private sources: ConfigSource[] = [];
  private validator: ConfigValidator;
  private listeners: ConfigChangeListener[] = [];
  private watchEnabled = false;
  
  constructor() {
    this.validator = new ConfigValidator();
    this.initializeSources();
  }
  
  private initializeSources(): void {
    // Initialize default sources in priority order (lower numbers = higher priority)
    this.sources = [
      new DefaultConfigSource(),      // Priority 1: Base defaults
      new FileConfigSource(),         // Priority 2: Configuration files
      new EnvConfigSource(),          // Priority 3: Environment variables
      new CLIConfigSource()           // Priority 4: CLI arguments (highest priority)
    ].sort((a, b) => a.priority - b.priority);
  }
  
  async initialize(): Promise<FrameworkConfig> {
    console.log('⚙️  Initializing configuration...');
    
    try {
      this.config = await this.loadConfiguration();
      
      // Validate configuration
      const validationResult = this.validator.validate(this.config);
      this.handleValidationResult(validationResult);
      
      console.log(`✅ Configuration loaded successfully`);
      console.log(`   Environment: ${this.config.environment}`);
      console.log(`   Database: ${this.config.database.type} (${this.config.database.url})`);
      console.log(`   Server: ${this.config.server.host}:${this.config.server.port}`);
      console.log(`   Log Level: ${this.config.logging.level}`);
      
      // Disable config file watching for now (it was causing server instability)
      // TODO: Implement proper file watching instead of polling
      // if (this.config.development.hotReload && this.config.environment === 'development') {
      //   this.startWatching();
      // }
      
      return this.config;
    } catch (error) {
      const configError = new ConfigurationError(
        'initialization',
        undefined,
        error instanceof Error ? error.message : 'Unknown configuration error'
      );
      console.error('❌ Failed to initialize configuration:', configError.message);
      throw configError;
    }
  }
  
  private async loadConfiguration(): Promise<FrameworkConfig> {
    let mergedConfig: Partial<FrameworkConfig> = {};
    
    // Load from all sources in priority order
    for (const source of this.sources) {
      try {
        const sourceConfig = await source.load();
        
        if (Object.keys(sourceConfig).length > 0) {
          console.log(`📄 Loaded configuration from ${source.name}`);
          mergedConfig = this.deepMerge(mergedConfig, sourceConfig);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to load configuration from ${source.name}:`, error instanceof Error ? error.message : error);
        
        // For critical sources, throw the error
        if (source.name === 'defaults') {
          throw new ConfigurationError(
            'defaults',
            undefined,
            `Failed to load default configuration: ${error instanceof Error ? error.message : error}`
          );
        }
      }
    }
    
    return mergedConfig as FrameworkConfig;
  }
  
  private deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (sourceValue === null || sourceValue === undefined) {
        continue;
      }
      
      if (this.isObject(sourceValue) && this.isObject(targetValue)) {
        result[key] = this.deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }
    
    return result;
  }
  
  private isObject(item: any): item is Record<string, any> {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
  
  private handleValidationResult(result: ConfigValidationResult): void {
    if (result.errors.length > 0) {
      console.error(`❌ Configuration validation failed with ${result.errors.length} error(s):`);
      result.errors.forEach(error => {
        console.error(`   ${error.path}: ${error.message}`);
      });
      
      throw new ConfigurationError(
        'validation',
        undefined,
        `Configuration validation failed with ${result.errors.length} error(s)`
      );
    }
    
    if (result.warnings.length > 0) {
      console.warn(`⚠️  Configuration has ${result.warnings.length} warning(s):`);
      result.warnings.forEach(warning => {
        console.warn(`   ${warning.path}: ${warning.message}`);
        if (warning.suggestion) {
          console.warn(`      💡 ${warning.suggestion}`);
        }
      });
    }
  }
  
  private startWatching(): void {
    if (this.watchEnabled) return;
    
    this.watchEnabled = true;
    console.log('👁️  Starting configuration file watching...');
    
    // Watch for file changes (simplified implementation)
    // In a real implementation, you'd use a proper file watcher
    const watchInterval = setInterval(async () => {
      try {
        const newConfig = await this.loadConfiguration();
        
        if (this.hasConfigChanged(this.config!, newConfig)) {
          console.log('🔄 Configuration changed, reloading...');
          
          const oldConfig = this.config!;
          this.config = newConfig;
          
          // Notify listeners
          this.notifyConfigChange(oldConfig, newConfig);
        }
      } catch (error) {
        console.warn('⚠️  Failed to reload configuration:', error instanceof Error ? error.message : error);
      }
    }, 5000); // Check every 5 seconds
    
    // Cleanup on process exit
    globalThis.addEventListener('beforeunload', () => {
      clearInterval(watchInterval);
    });
  }
  
  private hasConfigChanged(oldConfig: FrameworkConfig, newConfig: FrameworkConfig): boolean {
    // Simple deep comparison (in production, use a proper deep equality check)
    return JSON.stringify(oldConfig) !== JSON.stringify(newConfig);
  }
  
  private notifyConfigChange(oldConfig: FrameworkConfig, newConfig: FrameworkConfig): void {
    const changes = this.getConfigChanges(oldConfig, newConfig);
    
    changes.forEach(change => {
      this.listeners.forEach(listener => {
        try {
          listener(change);
        } catch (error) {
          console.warn('⚠️  Config change listener error:', error);
        }
      });
    });
  }
  
  private getConfigChanges(oldConfig: FrameworkConfig, newConfig: FrameworkConfig): ConfigChangeEvent[] {
    const changes: ConfigChangeEvent[] = [];
    
    // Simplified change detection - compare top-level properties
    for (const key in newConfig) {
      const oldValue = (oldConfig as any)[key];
      const newValue = (newConfig as any)[key];
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          path: key,
          oldValue,
          newValue,
          source: 'file-watch',
          timestamp: new Date()
        });
      }
    }
    
    return changes;
  }
  
  // Public API
  getConfig(): FrameworkConfig {
    if (!this.config) {
      throw new ConfigurationError(
        'access',
        undefined,
        'Configuration not initialized. Call initialize() first.'
      );
    }
    return this.config;
  }
  
  get<T = any>(path: string): T | undefined {
    if (!this.config) return undefined;
    
    return path.split('.').reduce((obj: any, key) => {
      return obj?.[key];
    }, this.config);
  }
  
  set(path: string, value: any): void {
    if (!this.config) {
      throw new ConfigurationError(
        'modification',
        undefined,
        'Configuration not initialized. Call initialize() first.'
      );
    }
    
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    let current: any = this.config;
    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    const oldValue = current[lastKey];
    current[lastKey] = value;
    
    // Notify listeners
    const event: ConfigChangeEvent = {
      path,
      oldValue,
      newValue: value,
      source: 'programmatic',
      timestamp: new Date()
    };
    
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.warn('⚠️  Config change listener error:', error);
      }
    });
  }
  
  addChangeListener(listener: ConfigChangeListener): void {
    this.listeners.push(listener);
  }
  
  removeChangeListener(listener: ConfigChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  addSource(source: ConfigSource): void {
    this.sources.push(source);
    this.sources.sort((a, b) => a.priority - b.priority);
  }
  
  removeSource(sourceName: string): void {
    this.sources = this.sources.filter(source => source.name !== sourceName);
  }
  
  async reload(): Promise<FrameworkConfig> {
    console.log('🔄 Reloading configuration...');
    return this.initialize();
  }
  
  validate(): ConfigValidationResult {
    if (!this.config) {
      return {
        isValid: false,
        errors: [{ path: 'root', message: 'Configuration not initialized', value: null }],
        warnings: []
      };
    }
    
    return this.validator.validate(this.config);
  }
  
  // Export configuration to file
  async export(filePath: string, format: 'json' | 'ts' = 'json'): Promise<void> {
    if (!this.config) {
      throw new ConfigurationError(
        'export',
        undefined,
        'Configuration not initialized. Call initialize() first.'
      );
    }
    
    try {
      let content: string;
      
      if (format === 'ts') {
        content = `import { FrameworkConfig } from './core/config/types.ts';\n\n`;
        content += `export default ${JSON.stringify(this.config, null, 2)} as FrameworkConfig;\n`;
      } else {
        content = JSON.stringify(this.config, null, 2);
      }
      
      await Deno.writeTextFile(filePath, content);
      console.log(`✅ Configuration exported to ${filePath}`);
    } catch (error) {
      throw new ConfigurationError(
        'export',
        filePath,
        `Failed to export configuration: ${error instanceof Error ? error.message : error}`
      );
    }
  }
}