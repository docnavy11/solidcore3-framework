// Hot reload manager with error recovery and feedback
import { AppDefinition } from '../types/index.ts';
import { TruthFileValidator } from '../validators/truth-validator.ts';
import { DevelopmentValidator } from '../validation/development-validator.ts';
import { logger } from '../logging/logger.ts';
import { FrameworkError, TruthFileLoadError } from '../errors/index.ts';
import { formatErrorForConsole, extractLineNumberFromStack } from '../errors/error-formatter.ts';

export interface ReloadResult {
  success: boolean;
  app?: AppDefinition;
  errors: FrameworkError[];
  warnings: string[];
  tips: string[];
  duration: number;
  changedFiles: string[];
}

export interface ReloadListener {
  onReloadStart: (files: string[]) => void;
  onReloadSuccess: (result: ReloadResult) => void;
  onReloadError: (result: ReloadResult) => void;
  onReloadComplete: (result: ReloadResult) => void;
}

export class HotReloadManager {
  private watchers: Map<string, Deno.FsWatcher> = new Map();
  private listeners: ReloadListener[] = [];
  private lastValidApp: AppDefinition | null = null;
  private reloadInProgress = false;
  private debounceTimer: number | null = null;
  private readonly debounceMs = 300;

  constructor(private truthFilePath: string) {}

  async start(): Promise<void> {
    logger.info('Starting hot reload manager', {
      component: 'HotReload',
      truthFile: this.truthFilePath
    });

    // Initial load
    await this.performReload([this.truthFilePath], true);

    // Watch truth file
    await this.watchFile(this.truthFilePath);

    // Watch extensions directory if it exists
    try {
      const extensionsPath = './app/extensions';
      const stat = await Deno.stat(extensionsPath);
      if (stat.isDirectory) {
        await this.watchDirectory(extensionsPath);
      }
    } catch {
      // Extensions directory doesn't exist, that's fine
    }

    logger.info('Hot reload manager started successfully', {
      component: 'HotReload',
      watchedFiles: Array.from(this.watchers.keys()).length
    });
  }

  async stop(): Promise<void> {
    logger.info('Stopping hot reload manager', {
      component: 'HotReload'
    });

    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  addListener(listener: ReloadListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: ReloadListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  getLastValidApp(): AppDefinition | null {
    return this.lastValidApp;
  }

  async forceReload(): Promise<ReloadResult> {
    return await this.performReload([this.truthFilePath], false);
  }

  private async watchFile(filePath: string): Promise<void> {
    try {
      const watcher = Deno.watchFs(filePath);
      this.watchers.set(filePath, watcher);

      // Process file system events
      (async () => {
        for await (const event of watcher) {
          if (event.kind === 'modify' || event.kind === 'create') {
            this.scheduleReload(event.paths);
          }
        }
      })().catch((error) => {
        logger.error('File watcher error', error, {
          component: 'HotReload',
          filePath
        });
      });

    } catch (error) {
      logger.error('Failed to watch file', error, {
        component: 'HotReload',
        filePath
      });
    }
  }

  private async watchDirectory(dirPath: string): Promise<void> {
    try {
      const watcher = Deno.watchFs(dirPath, { recursive: true });
      this.watchers.set(dirPath, watcher);

      // Process directory events
      (async () => {
        for await (const event of watcher) {
          if (event.kind === 'modify' || event.kind === 'create' || event.kind === 'remove') {
            // Filter for relevant file types
            const relevantFiles = event.paths.filter(path => 
              path.endsWith('.ts') || path.endsWith('.js')
            );
            
            if (relevantFiles.length > 0) {
              this.scheduleReload(relevantFiles);
            }
          }
        }
      })().catch((error) => {
        logger.error('Directory watcher error', error, {
          component: 'HotReload',
          dirPath
        });
      });

    } catch (error) {
      logger.error('Failed to watch directory', error, {
        component: 'HotReload',
        dirPath
      });
    }
  }

  private scheduleReload(changedPaths: string[]): void {
    if (this.reloadInProgress) {
      logger.debug('Reload already in progress, skipping', {
        component: 'HotReload',
        changedPaths
      });
      return;
    }

    // Debounce multiple changes
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.performReload(changedPaths, false);
    }, this.debounceMs);
  }

  private async performReload(changedFiles: string[], isInitial: boolean): Promise<ReloadResult> {
    if (this.reloadInProgress) {
      throw new Error('Reload already in progress');
    }

    this.reloadInProgress = true;
    const startTime = Date.now();

    logger.hotReloadInfo(
      isInitial ? 'Initial load starting' : 'Hot reload triggered',
      changedFiles
    );

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener.onReloadStart(changedFiles);
      } catch (error) {
        logger.error('Error in reload listener', error, {
          component: 'HotReload',
          listener: 'onReloadStart'
        });
      }
    }

    const result: ReloadResult = {
      success: false,
      errors: [],
      warnings: [],
      tips: [],
      duration: 0,
      changedFiles
    };

    try {
      // Step 1: Load truth file
      const app = await this.loadTruthFile();
      
      // Step 2: Validate truth file
      const validator = new TruthFileValidator();
      const validationResult = validator.validate(app);

      if (!validationResult.isValid) {
        result.errors = validationResult.errors.map(err => 
          new FrameworkError(
            err.code as any,
            err.message,
            { filePath: this.truthFilePath, suggestion: err.suggestion }
          )
        );
        throw new Error(`Validation failed with ${result.errors.length} errors`);
      }

      // Step 3: Development validation (warnings and tips)
      const devValidator = new DevelopmentValidator();
      const devResult = devValidator.validate(app);
      
      result.warnings = validationResult.warnings.map(w => w.message);
      result.tips = devResult.developmentTips.map(tip => 
        `${tip.category}: ${tip.message} (${tip.location})`
      );

      // Step 4: Success
      result.success = true;
      result.app = app;
      this.lastValidApp = app;

      logger.hotReloadInfo(
        isInitial ? 'Initial load completed' : 'Hot reload completed successfully',
        changedFiles,
        Date.now() - startTime
      );

      // Notify success
      for (const listener of this.listeners) {
        try {
          listener.onReloadSuccess(result);
        } catch (error) {
          logger.error('Error in reload listener', error, {
            component: 'HotReload',
            listener: 'onReloadSuccess'
          });
        }
      }

    } catch (error) {
      result.success = false;
      
      // Handle specific error types
      if (error instanceof FrameworkError) {
        result.errors = [error];
      } else {
        const lineNumber = extractLineNumberFromStack(error.stack, this.truthFilePath);
        result.errors = [new TruthFileLoadError(
          this.truthFilePath,
          error,
          lineNumber
        )];
      }

      logger.error(
        isInitial ? 'Initial load failed' : 'Hot reload failed',
        error,
        {
          component: 'HotReload',
          truthFile: this.truthFilePath,
          errorCount: result.errors.length
        }
      );

      // Show formatted error to console
      for (const frameworkError of result.errors) {
        console.error(formatErrorForConsole(frameworkError));
      }

      // Show recovery suggestions
      this.showRecoverySuggestions(result.errors);

      // Notify error
      for (const listener of this.listeners) {
        try {
          listener.onReloadError(result);
        } catch (listenerError) {
          logger.error('Error in reload listener', listenerError, {
            component: 'HotReload',
            listener: 'onReloadError'
          });
        }
      }
    } finally {
      result.duration = Date.now() - startTime;
      this.reloadInProgress = false;

      // Notify completion
      for (const listener of this.listeners) {
        try {
          listener.onReloadComplete(result);
        } catch (error) {
          logger.error('Error in reload listener', error, {
            component: 'HotReload',
            listener: 'onReloadComplete'
          });
        }
      }
    }

    return result;
  }

  private async loadTruthFile(): Promise<AppDefinition> {
    try {
      // Clear module cache in development
      if (this.isDevelopment()) {
        delete (globalThis as any).__truthFileCache;
      }

      // Dynamic import with cache busting
      const timestamp = Date.now();
      const module = await import(`${this.truthFilePath}?t=${timestamp}`);
      
      if (!module.App) {
        throw new Error('Truth file must export an "App" object');
      }

      return module.App as AppDefinition;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('import')) {
        throw new TruthFileLoadError(
          this.truthFilePath,
          new Error('Failed to import truth file - check syntax and exports'),
          undefined
        );
      }
      throw error;
    }
  }

  private showRecoverySuggestions(errors: FrameworkError[]): void {
    console.log('\n🔧 Recovery Suggestions:');
    console.log('─'.repeat(50));

    const suggestions = new Set<string>();

    for (const error of errors) {
      // Add error-specific suggestions
      if (error.context?.suggestion) {
        if (Array.isArray(error.context.suggestion)) {
          error.context.suggestion.forEach(s => suggestions.add(s));
        } else {
          suggestions.add(error.context.suggestion);
        }
      }

      // Add general suggestions based on error type
      if (error.name === 'TruthFileLoadError') {
        suggestions.add('Check TypeScript syntax with: deno check app/app.truth.ts');
        suggestions.add('Verify all imports and exports are correct');
        suggestions.add('Make sure the truth file exists and is readable');
      }
    }

    // Add general recovery suggestions
    suggestions.add('Previous valid configuration is still running');
    suggestions.add('Fix the errors and save to trigger hot reload');
    suggestions.add('Use development tools: GET /api/_debug for inspection');

    let index = 1;
    for (const suggestion of Array.from(suggestions).slice(0, 5)) {
      console.log(`${index}. ${suggestion}`);
      index++;
    }

    console.log('\n💡 The application continues running with the last valid configuration.');
    console.log('   Fix the errors above and save to reload automatically.\n');
  }

  private isDevelopment(): boolean {
    return Deno.env.get('DENO_ENV') === 'development' || 
           Deno.env.get('NODE_ENV') === 'development' || 
           !Deno.env.get('DENO_ENV');
  }
}

// Helper class for collecting reload statistics
export class ReloadStatistics {
  private reloads: Array<{
    timestamp: Date;
    success: boolean;
    duration: number;
    errorCount: number;
    changedFiles: number;
  }> = [];

  recordReload(result: ReloadResult): void {
    this.reloads.push({
      timestamp: new Date(),
      success: result.success,
      duration: result.duration,
      errorCount: result.errors.length,
      changedFiles: result.changedFiles.length
    });

    // Keep only last 100 reloads
    if (this.reloads.length > 100) {
      this.reloads.shift();
    }
  }

  getStatistics() {
    const total = this.reloads.length;
    const successful = this.reloads.filter(r => r.success).length;
    const averageDuration = this.reloads.reduce((sum, r) => sum + r.duration, 0) / total;
    const fastReloads = this.reloads.filter(r => r.duration < 100).length;

    return {
      totalReloads: total,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageDuration: Math.round(averageDuration),
      fastReloadPercentage: total > 0 ? (fastReloads / total) * 100 : 0,
      recentErrors: this.reloads
        .filter(r => !r.success)
        .slice(-5)
        .map(r => ({
          timestamp: r.timestamp,
          duration: r.duration,
          errorCount: r.errorCount
        }))
    };
  }
}