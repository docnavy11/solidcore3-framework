import { AppDefinition } from '../types/index.ts';
import { join } from '@std/path';
import { PathResolver } from '../utils/path-resolver.ts';

export class TruthLoader {
  private pathResolver: PathResolver | null = null;
  private legacyAppPath: string; // For backward compatibility
  private cachedApp: AppDefinition | null = null;

  constructor(appPathOrResolver?: string | PathResolver) {
    if (appPathOrResolver instanceof PathResolver) {
      this.pathResolver = appPathOrResolver;
      this.legacyAppPath = './app'; // fallback
    } else {
      this.legacyAppPath = appPathOrResolver || './app';
    }
  }

  async load(): Promise<AppDefinition> {
    let truthPath: string;
    
    if (this.pathResolver) {
      truthPath = this.pathResolver.getTruthFile();
    } else {
      // Legacy mode - use the old path construction
      truthPath = join(this.legacyAppPath, 'app.truth.ts');
    }
    
    try {
      // Clear cache in development
      if (Deno.env.get('DENO_ENV') === 'development') {
        this.cachedApp = null;
      }

      // Dynamic import of the truth file
      const module = await import(`file://${Deno.cwd()}/${truthPath}?t=${Date.now()}`);
      
      if (!module.App) {
        throw new Error('Truth file must export an "App" constant');
      }

      const app = module.App as AppDefinition;
      
      // Basic validation
      if (!app.name) {
        throw new Error('App must have a name');
      }
      
      if (!app.entities || Object.keys(app.entities).length === 0) {
        throw new Error('App must define at least one entity');
      }

      this.cachedApp = app;
      return app;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new Error(`Truth file not found at ${truthPath}`);
      }
      throw error;
    }
  }

  private watcher: Deno.FsWatcher | null = null;
  private reloadTimeout: number | null = null;
  private lastReloadTime = 0;

  async watch(callback: (app: AppDefinition) => void): Promise<void> {
    // Prevent multiple watchers
    if (this.watcher) {
      console.log('File watcher already active, skipping...');
      return;
    }

    let truthPath: string;
    
    if (this.pathResolver) {
      truthPath = this.pathResolver.getTruthFile();
    } else {
      // Legacy mode
      truthPath = join(this.legacyAppPath, 'app.truth.ts');
    }
    
    try {
      this.watcher = Deno.watchFs(truthPath);
      console.log(`Watching ${truthPath} for changes...`);
      
      for await (const event of this.watcher) {
        if (event.kind === 'modify') {
          // Debounce multiple events
          if (this.reloadTimeout) {
            clearTimeout(this.reloadTimeout);
          }
          
          this.reloadTimeout = setTimeout(async () => {
            // Prevent duplicate reloads within 1 second
            const now = Date.now();
            if (now - this.lastReloadTime < 1000) {
              return;
            }
            this.lastReloadTime = now;
            
            try {
              console.log('Truth file changed, reloading...');
              const app = await this.load();
              callback(app);
            } catch (error) {
              console.error('Error reloading truth file:', error);
            }
          }, 300); // 300ms debounce
        }
      }
    } catch (error) {
      console.error('Error setting up file watcher:', error);
      this.watcher = null;
    }
  }

  stopWatching(): void {
    if (this.watcher) {
      try {
        this.watcher.close();
        this.watcher = null;
        console.log('✅ File watcher stopped');
      } catch (error) {
        console.error('Error stopping file watcher:', error);
      }
    }
  }
}