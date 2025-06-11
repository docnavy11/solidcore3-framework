import { Extension, ExtensionConfig, ExtensionContext, ExtensionUtils } from '../../core/types/extensions.ts';
import { AppDefinition } from '../../core/types/index.ts';
import { walk } from '@std/fs';
import { join, extname } from '@std/path';

export class ExtensionLoader {
  private extensions = new Map<string, Extension>();
  private context: ExtensionContext;
  private config: ExtensionConfig;

  constructor(
    private app: AppDefinition,
    private db: any,
    private events: any,
    config?: Partial<ExtensionConfig>
  ) {
    this.config = {
      enabled: true,
      directory: './app/extensions',
      autoload: true,
      ...config
    };

    this.context = {
      app: this.app,
      db: this.db,
      events: this.events,
      utils: this.createUtils()
    };
  }

  async loadExtensions(): Promise<void> {
    if (!this.config.enabled) {
      console.log('📦 Extensions disabled');
      return;
    }

    console.log(`📦 Loading extensions from ${this.config.directory}...`);

    try {
      // Ensure extensions directory exists
      try {
        await Deno.stat(this.config.directory);
      } catch {
        await Deno.mkdir(this.config.directory, { recursive: true });
        console.log(`📁 Created extensions directory: ${this.config.directory}`);
        return; // No extensions to load yet
      }

      // Walk through extensions directory
      for await (const entry of walk(this.config.directory, {
        exts: ['.ts', '.js'],
        includeDirs: false
      })) {
        await this.loadExtension(entry.path);
      }

      console.log(`✅ Loaded ${this.extensions.size} extensions`);
    } catch (error) {
      console.error('❌ Error loading extensions:', error);
    }
  }

  private async loadExtension(path: string): Promise<void> {
    try {
      // Check whitelist/blacklist
      const extensionName = this.getExtensionNameFromPath(path);
      
      if (this.config.whitelist && !this.config.whitelist.includes(extensionName)) {
        return;
      }
      
      if (this.config.blacklist && this.config.blacklist.includes(extensionName)) {
        console.log(`⏭️  Skipping blacklisted extension: ${extensionName}`);
        return;
      }

      // Dynamic import the extension
      const module = await import(`file://${Deno.cwd()}/${path}?t=${Date.now()}`);
      
      if (!module.default) {
        console.warn(`⚠️  Extension ${path} has no default export`);
        return;
      }

      const extension: Extension = module.default;

      // Validate extension
      if (!this.validateExtension(extension)) {
        console.warn(`⚠️  Invalid extension: ${extensionName}`);
        return;
      }

      // Check dependencies
      if (extension.dependencies) {
        for (const dep of extension.dependencies) {
          if (!this.extensions.has(dep)) {
            console.warn(`⚠️  Extension ${extensionName} depends on ${dep} which is not loaded`);
            return;
          }
        }
      }

      // Register extension
      this.extensions.set(extension.name, extension);
      console.log(`📦 Loaded extension: ${extension.name} v${extension.version || '1.0.0'}`);

      // Initialize extension if it has an init function
      if ((module as any).init && typeof (module as any).init === 'function') {
        await (module as any).init(this.context);
      }

    } catch (error) {
      console.error(`❌ Error loading extension ${path}:`, error);
    }
  }

  private validateExtension(extension: any): extension is Extension {
    if (!extension.name || typeof extension.name !== 'string') {
      return false;
    }

    if (!extension.type || !['api', 'ui', 'workflow'].includes(extension.type)) {
      return false;
    }

    return true;
  }

  private getExtensionNameFromPath(path: string): string {
    return path.split('/').pop()?.replace(extname(path), '') || 'unknown';
  }

  private createUtils(): ExtensionUtils {
    return {
      validateInput: (data: any, schema: any) => {
        // Simple validation - in production use a proper schema validator
        return data;
      },

      hashPassword: async (password: string): Promise<string> => {
        // Mock implementation - use bcrypt or similar in production
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      },

      verifyPassword: async (password: string, hash: string): Promise<boolean> => {
        const passwordHash = await this.context.utils.hashPassword(password);
        return passwordHash === hash;
      },

      generateToken: (): string => {
        return crypto.randomUUID();
      },

      sendEmail: async (to: string, subject: string, body: string): Promise<void> => {
        console.log(`📧 Mock email sent to ${to}: ${subject}`);
        // Integrate with email service in production
      },

      callWebhook: async (url: string, data: any): Promise<any> => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          return await response.json();
        } catch (error) {
          console.error('Webhook call failed:', error);
          throw error;
        }
      },

      log: (level: 'info' | 'warn' | 'error', message: string, data?: any): void => {
        const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
        logFn(`[Extension] ${message}`, data || '');
      }
    };
  }

  getExtension(name: string): Extension | undefined {
    return this.extensions.get(name);
  }

  getExtensions(): Extension[] {
    return Array.from(this.extensions.values());
  }

  getExtensionsByType<T extends Extension>(type: T['type']): T[] {
    return Array.from(this.extensions.values())
      .filter(ext => ext.type === type) as T[];
  }

  async reloadExtensions(): Promise<void> {
    this.extensions.clear();
    await this.loadExtensions();
  }

  getContext(): ExtensionContext {
    return this.context;
  }
}