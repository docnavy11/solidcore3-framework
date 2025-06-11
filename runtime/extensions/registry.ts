import { Extension, APIExtension, UIExtension, WorkflowExtension } from '../../core/types/extensions.ts';
import { ExtensionLoader } from './loader.ts';
import { Hono } from 'https://deno.land/x/hono@v4.3.11/mod.ts';

export class ExtensionRegistry {
  private loader: ExtensionLoader;
  private apiExtensions = new Map<string, APIExtension>();
  private uiExtensions = new Map<string, UIExtension>();
  private workflowExtensions = new Map<string, WorkflowExtension>();

  constructor(loader: ExtensionLoader) {
    this.loader = loader;
  }

  async initialize(): Promise<void> {
    await this.loader.loadExtensions();
    this.categorizeExtensions();
  }

  private categorizeExtensions(): void {
    for (const extension of this.loader.getExtensions()) {
      switch (extension.type) {
        case 'api':
          this.apiExtensions.set(extension.name, extension as APIExtension);
          break;
        case 'ui':
          this.uiExtensions.set(extension.name, extension as UIExtension);
          break;
        case 'workflow':
          this.workflowExtensions.set(extension.name, extension as WorkflowExtension);
          break;
      }
    }

    console.log(`📊 Extension summary:
    - API: ${this.apiExtensions.size}
    - UI: ${this.uiExtensions.size}
    - Workflow: ${this.workflowExtensions.size}`);
  }

  // API Extension Methods
  mountAPIExtensions(app: Hono): void {
    for (const [name, extension] of this.apiExtensions) {
      try {
        this.mountAPIExtension(app, extension);
        console.log(`🔌 Mounted API extension: ${name}`);
      } catch (error) {
        console.error(`❌ Error mounting API extension ${name}:`, error);
      }
    }
  }

  private mountAPIExtension(app: Hono, extension: APIExtension): void {
    // Mount custom routes
    if (extension.routes) {
      for (const route of extension.routes) {
        const path = `/extensions/${extension.name}${route.path}`;
        
        switch (route.method.toLowerCase()) {
          case 'get':
            app.get(path, route.handler);
            break;
          case 'post':
            app.post(path, route.handler);
            break;
          case 'put':
            app.put(path, route.handler);
            break;
          case 'delete':
            app.delete(path, route.handler);
            break;
          case 'patch':
            app.patch(path, route.handler);
            break;
        }
        
        console.log(`  📍 Route: ${route.method} ${path}`);
      }
    }

    // Apply middleware
    if (extension.middleware) {
      for (const middleware of extension.middleware) {
        if (middleware.routes) {
          // Apply to specific routes
          for (const routePattern of middleware.routes) {
            app.use(routePattern, middleware.handler);
          }
        } else {
          // Apply globally
          app.use('*', middleware.handler);
        }
        console.log(`  🛡️  Middleware: ${middleware.name}`);
      }
    }
  }

  getAPIHooks(entity?: string): APIExtension[] {
    return Array.from(this.apiExtensions.values())
      .filter(ext => !entity || !ext.entity || ext.entity === entity)
      .filter(ext => ext.hooks);
  }

  // UI Extension Methods
  getUIExtensions(target?: string): UIExtension[] {
    return Array.from(this.uiExtensions.values())
      .filter(ext => !target || !ext.target || ext.target === target);
  }

  generateUIExtensionsHTML(target?: string): string {
    const extensions = this.getUIExtensions(target);
    let html = '';
    let styles = '';
    let scripts = '';

    for (const extension of extensions) {
      // Collect styles
      if (extension.styles) {
        styles += `\n/* ${extension.name} styles */\n${extension.styles}`;
      }

      // Collect scripts
      if (extension.scripts) {
        scripts += `\n// ${extension.name} scripts\n${extension.scripts}`;
      }

      // Generate component injections
      if (extension.components) {
        for (const component of extension.components) {
          if (component.inject) {
            html += `\n<!-- ${extension.name}: ${component.name} -->\n${component.inject.content}`;
          }
        }
      }
    }

    return {
      html,
      styles: styles ? `<style>${styles}</style>` : '',
      scripts: scripts ? `<script>${scripts}</script>` : ''
    } as any;
  }

  // Workflow Extension Methods
  getWorkflowActions(): Record<string, any> {
    const actions: Record<string, any> = {};

    for (const [name, extension] of this.workflowExtensions) {
      for (const [actionName, action] of Object.entries(extension.actions)) {
        const fullActionName = `${name}.${actionName}`;
        actions[fullActionName] = action;
      }
    }

    return actions;
  }

  getWorkflowTriggers(): Record<string, any> {
    const triggers: Record<string, any> = {};

    for (const [name, extension] of this.workflowExtensions) {
      if (extension.triggers) {
        for (const [triggerName, trigger] of Object.entries(extension.triggers)) {
          const fullTriggerName = `${name}.${triggerName}`;
          triggers[fullTriggerName] = trigger;
        }
      }
    }

    return triggers;
  }

  // General methods
  getExtension(name: string): Extension | undefined {
    return this.loader.getExtension(name);
  }

  getAllExtensions(): Extension[] {
    return this.loader.getExtensions();
  }

  async reloadExtensions(): Promise<void> {
    this.apiExtensions.clear();
    this.uiExtensions.clear();
    this.workflowExtensions.clear();
    
    await this.loader.reloadExtensions();
    this.categorizeExtensions();
  }

  getExtensionInfo(): any {
    return {
      total: this.loader.getExtensions().length,
      api: this.apiExtensions.size,
      ui: this.uiExtensions.size,
      workflow: this.workflowExtensions.size,
      extensions: this.loader.getExtensions().map(ext => ({
        name: ext.name,
        type: ext.type,
        version: ext.version,
        description: ext.description,
        author: ext.author
      }))
    };
  }
}