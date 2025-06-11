import { TruthLoader } from '../../core/loader/loader.ts';
import { DatabaseMigrator } from '../database/migrator.ts';
import { APIGenerator } from '../../core/generators/api.ts';
import { UIGenerator } from '../../core/generators/ui.ts';
import { DashboardGenerator } from '../../core/dashboard/generator.ts';
import { EventEmitter } from '../events/emitter.ts';
import { ExtensionLoader } from '../extensions/loader.ts';
import { ExtensionRegistry } from '../extensions/registry.ts';
import { TruthFileValidator, ValidationResult } from '../../core/validators/index.ts';
import { AppDefinition } from '../../core/types/index.ts';
import { Hono } from 'https://deno.land/x/hono@v4.3.11/mod.ts';
import { 
  TruthFileLoadError, 
  GeneratorError, 
  ConfigurationError,
  FrameworkError
} from '../../core/errors/index.ts';
import { ConfigManager, FrameworkConfig } from '../../core/config/index.ts';

export class RuntimeEngine {
  private loader: TruthLoader;
  private migrator: DatabaseMigrator;
  private validator: TruthFileValidator;
  private configManager: ConfigManager;
  private config: FrameworkConfig | null = null;
  private currentApp: AppDefinition | null = null;
  private apiRoutes: Hono | null = null;
  private uiPages: Record<string, string> = {};
  private dashboardPages: Record<string, string> = {};
  private eventEmitter: EventEmitter | null = null;
  private extensionLoader: ExtensionLoader | null = null;
  private extensionRegistry: ExtensionRegistry | null = null;
  private lastValidationResult: ValidationResult | null = null;

  constructor() {
    this.loader = new TruthLoader();
    this.migrator = new DatabaseMigrator();
    this.validator = new TruthFileValidator();
    this.configManager = new ConfigManager();
  }

  async initialize(): Promise<AppDefinition> {
    console.log('🚀 Initializing Solidcore3 Runtime Engine...');
    
    try {
      // Initialize configuration first
      console.log('⚙️  Loading configuration...');
      this.config = await this.configManager.initialize();
      console.log(`✅ Configuration loaded for ${this.config.environment} environment`);
      
      // Load truth file
      console.log('📖 Loading truth file...');
      this.currentApp = await this.loader.load();
      console.log(`✅ Loaded app: ${this.currentApp.name}`);
      
      // Validate truth file
      console.log('🔍 Validating truth file...');
      this.lastValidationResult = this.validator.validate(this.currentApp);
      this.logValidationResult(this.lastValidationResult);
      
      // Continue even if there are warnings, but stop on errors
      if (!this.lastValidationResult.isValid) {
        console.error('❌ Truth file validation failed. Cannot continue.');
        throw new Error(`Truth file validation failed with ${this.lastValidationResult.errors.length} error(s)`);
      }

      // Run database migrations
      await this.migrator.migrate(this.currentApp);

      // Initialize event system
      console.log('📡 Initializing event system...');
      this.eventEmitter = new EventEmitter(this.currentApp);
      console.log('✅ Event system initialized');

      // Initialize extension system
      console.log('📦 Initializing extension system...');
      const { getDatabase } = await import('../database/client.ts');
      this.extensionLoader = new ExtensionLoader(
        this.currentApp,
        getDatabase(),
        this.eventEmitter
      );
      this.extensionRegistry = new ExtensionRegistry(this.extensionLoader);
      await this.extensionRegistry.initialize();
      console.log('✅ Extension system initialized');

      // Generate API routes
      console.log('🔌 Generating API routes...');
      const apiGenerator = new APIGenerator(this.currentApp);
      apiGenerator.setEventEmitter(this.eventEmitter);
      this.apiRoutes = await apiGenerator.generate();
      console.log('✅ API routes generated');

      // Generate UI pages
      console.log('🎨 Generating UI pages...');
      const uiGenerator = new UIGenerator(this.currentApp);
      this.uiPages = await uiGenerator.generate();
      console.log('✅ UI pages generated');

      // Generate dashboard pages
      console.log('📊 Generating dashboard pages...');
      const dashboardGenerator = new DashboardGenerator(this.currentApp);
      this.dashboardPages = await dashboardGenerator.generate();
      console.log('✅ Dashboard pages generated');

      // Start watching for changes in development
      if (this.config.development.hotReload && this.config.development.truthFileWatch) {
        this.startWatching();
      }

      return this.currentApp;
    } catch (error) {
      console.error('❌ Failed to initialize runtime:', error);
      throw error;
    }
  }

  private startWatching(): void {
    this.loader.watch(async (app) => {
      console.log('🔄 Truth file changed, reloading...');
      this.currentApp = app;
      
      try {
        // Validate before proceeding
        this.lastValidationResult = this.validator.validate(app);
        this.logValidationResult(this.lastValidationResult);
        
        if (!this.lastValidationResult.isValid) {
          console.error('❌ Hot reload failed: Truth file validation errors');
          return; // Don't update runtime if validation fails
        }
        
        await this.migrator.migrate(app);
        
        // Reinitialize event system
        this.eventEmitter = new EventEmitter(app);
        
        // Regenerate API routes
        const apiGenerator = new APIGenerator(app);
        apiGenerator.setEventEmitter(this.eventEmitter);
        this.apiRoutes = await apiGenerator.generate();
        
        // Regenerate UI pages
        const uiGenerator = new UIGenerator(app);
        this.uiPages = await uiGenerator.generate();
        
        // Regenerate dashboard pages
        const dashboardGenerator = new DashboardGenerator(app);
        this.dashboardPages = await dashboardGenerator.generate();
        
        console.log('✅ Hot reload completed');
      } catch (error) {
        console.error('❌ Hot reload failed:', error);
      }
    });
  }

  getCurrentApp(): AppDefinition | null {
    return this.currentApp;
  }

  getAPIRoutes(): Hono | null {
    return this.apiRoutes;
  }

  getUIPages(): Record<string, string> {
    return this.uiPages;
  }

  getDashboardPages(): Record<string, string> {
    return this.dashboardPages;
  }

  getEventEmitter(): EventEmitter | null {
    return this.eventEmitter;
  }

  getExtensionRegistry(): ExtensionRegistry | null {
    return this.extensionRegistry;
  }
  
  getLastValidationResult(): ValidationResult | null {
    return this.lastValidationResult;
  }
  
  getConfig(): FrameworkConfig | null {
    return this.config;
  }
  
  getConfigManager(): ConfigManager {
    return this.configManager;
  }

  async reload(): Promise<AppDefinition> {
    this.currentApp = await this.loader.load();
    
    // Validate truth file
    this.lastValidationResult = this.validator.validate(this.currentApp);
    this.logValidationResult(this.lastValidationResult);
    
    if (!this.lastValidationResult.isValid) {
      throw new Error(`Truth file validation failed with ${this.lastValidationResult.errors.length} error(s)`);
    }
    
    await this.migrator.migrate(this.currentApp);
    
    // Reinitialize event system
    this.eventEmitter = new EventEmitter(this.currentApp);
    
    // Regenerate API routes
    const apiGenerator = new APIGenerator(this.currentApp);
    apiGenerator.setEventEmitter(this.eventEmitter);
    this.apiRoutes = await apiGenerator.generate();
    
    // Regenerate UI pages
    const uiGenerator = new UIGenerator(this.currentApp);
    this.uiPages = await uiGenerator.generate();
    
    // Regenerate dashboard pages
    const dashboardGenerator = new DashboardGenerator(this.currentApp);
    this.dashboardPages = await dashboardGenerator.generate();
    
    return this.currentApp;
  }
  
  private logValidationResult(result: ValidationResult): void {
    const { summary, errors, warnings } = result;
    
    console.log(`📊 Validation completed in ${summary.validationTime}ms:`);
    console.log(`   - Entities: ${summary.entityCount}, Fields: ${summary.fieldCount}`);
    console.log(`   - Views: ${summary.viewCount}, Workflows: ${summary.workflowCount}`);
    
    if (errors.length > 0) {
      console.log(`❌ ${errors.length} validation error(s):`);
      errors.forEach(error => {
        console.log(`   [${error.code}] ${error.path}: ${error.message}`);
        if (error.suggestion) {
          console.log(`      💡 ${error.suggestion}`);
        }
      });
    }
    
    if (warnings.length > 0) {
      console.log(`⚠️  ${warnings.length} validation warning(s):`);
      warnings.forEach(warning => {
        console.log(`   [${warning.code}] ${warning.path}: ${warning.message}`);
        if (warning.suggestion) {
          console.log(`      💡 ${warning.suggestion}`);
        }
      });
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ Truth file validation passed with no issues');
    } else if (errors.length === 0) {
      console.log('✅ Truth file validation passed with warnings');
    }
    
    // Write validation result to file during development
    this.writeValidationResultToFile(result);
  }
  
  private writeValidationResultToFile(result: ValidationResult): void {
    // Only write to file if configured to do so
    if (!this.config?.validation.writeResultToFile) {
      return;
    }
    
    try {
      const { summary, errors, warnings } = result;
      const timestamp = new Date().toISOString();
      
      let content = `# Solidcore3 Schema Validation Result\n`;
      content += `Generated: ${timestamp}\n\n`;
      
      content += `## Summary\n`;
      content += `- Validation Status: ${result.isValid ? '✅ PASSED' : '❌ FAILED'}\n`;
      content += `- Validation Time: ${summary.validationTime}ms\n`;
      content += `- Entities: ${summary.entityCount}\n`;
      content += `- Fields: ${summary.fieldCount}\n`;
      content += `- Views: ${summary.viewCount}\n`;
      content += `- Workflows: ${summary.workflowCount}\n`;
      content += `- Errors: ${summary.errorCount}\n`;
      content += `- Warnings: ${summary.warningCount}\n\n`;
      
      if (errors.length > 0) {
        content += `## Errors (${errors.length})\n\n`;
        errors.forEach((error, index) => {
          content += `### ${index + 1}. [${error.code}] ${error.path}\n`;
          content += `**Message:** ${error.message}\n`;
          if (error.suggestion) {
            content += `**Suggestion:** ${error.suggestion}\n`;
          }
          if (error.context) {
            content += `**Context:** \`${JSON.stringify(error.context)}\`\n`;
          }
          content += `\n`;
        });
      }
      
      if (warnings.length > 0) {
        content += `## Warnings (${warnings.length})\n\n`;
        warnings.forEach((warning, index) => {
          content += `### ${index + 1}. [${warning.code}] ${warning.path}\n`;
          content += `**Message:** ${warning.message}\n`;
          if (warning.suggestion) {
            content += `**Suggestion:** ${warning.suggestion}\n`;
          }
          if (warning.context) {
            content += `**Context:** \`${JSON.stringify(warning.context)}\`\n`;
          }
          content += `\n`;
        });
      }
      
      if (errors.length === 0 && warnings.length === 0) {
        content += `## Result\n\n`;
        content += `🎉 **All validation checks passed!** Your truth file is valid and follows all framework conventions.\n\n`;
      }
      
      content += `## Validation Rules\n\n`;
      content += `### Field Types\n`;
      content += `- **string**: Text data with optional min/max length\n`;
      content += `- **number**: Numeric data with optional min/max values\n`;
      content += `- **boolean**: True/false values\n`;
      content += `- **date**: Date/time values\n`;
      content += `- **enum**: Predefined list of values\n`;
      content += `- **reference**: Reference to another entity\n\n`;
      
      content += `### View Types\n`;
      content += `- **list**: Display entities in a table/list format\n`;
      content += `- **form**: Create or edit entity forms\n`;
      content += `- **detail**: Display single entity details\n\n`;
      
      content += `### Behavior Types\n`;
      content += `- **update**: Update entity fields\n`;
      content += `- **custom**: Custom behavior logic\n\n`;
      
      content += `---\n`;
      content += `*This file is automatically generated during development and will be overwritten on each validation run.*\n`;
      
      // Write to configured path
      const filePath = this.config?.validation.resultFilePath || './schema_validation_result.txt';
      Deno.writeTextFileSync(filePath, content);
      
      console.log(`📝 Validation result written to ${filePath}`);
      
    } catch (error) {
      console.warn(`⚠️  Failed to write validation result to file: ${error.message}`);
    }
  }
}