import { AppDefinition } from '../types/index.ts';
import { join } from '@std/path';

export class TruthLoader {
  private appPath: string;
  private cachedApp: AppDefinition | null = null;

  constructor(appPath: string = './app') {
    this.appPath = appPath;
  }

  async load(): Promise<AppDefinition> {
    const truthPath = join(this.appPath, 'app.truth.ts');
    
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

  async watch(callback: (app: AppDefinition) => void): Promise<void> {
    const truthPath = join(this.appPath, 'app.truth.ts');
    const watcher = Deno.watchFs(truthPath);
    
    console.log(`Watching ${truthPath} for changes...`);
    
    for await (const event of watcher) {
      if (event.kind === 'modify') {
        try {
          console.log('Truth file changed, reloading...');
          const app = await this.load();
          callback(app);
        } catch (error) {
          console.error('Error reloading truth file:', error);
        }
      }
    }
  }
}