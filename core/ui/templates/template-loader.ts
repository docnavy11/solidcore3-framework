import { ViewDefinition } from '../../types/view.ts';

export interface TemplateContext {
  app: any;
  view: ViewDefinition;
  viewName: string;
  [key: string]: any;
}

export class TemplateLoader {
  private static readonly CORE_TEMPLATES_PATH = './core/ui/templates';
  private static readonly APP_TEMPLATES_PATH = './app/templates';
  private static readonly APP_STATIC_PATH = './app/static';

  /**
   * Load a template with fallback system:
   * 1. Try app-specific template file
   * 2. Try core system template file  
   * 3. Try app-specific static HTML file
   * 4. Fall back to built-in templates
   */
  static async loadTemplate(templateName: string, context: TemplateContext): Promise<string> {
    // 1. Try app-specific template (can use template variables)
    try {
      const appTemplatePath = `${this.APP_TEMPLATES_PATH}/${templateName}.ts`;
      const templateModule = await import(appTemplatePath);
      if (templateModule.default && typeof templateModule.default === 'function') {
        return templateModule.default(context);
      }
    } catch (error) {
      // App template not found, continue to next option
    }

    // 2. Try core system template
    try {
      const coreTemplatePath = `${this.CORE_TEMPLATES_PATH}/${templateName}.ts`;
      const templateModule = await import(coreTemplatePath);
      if (templateModule.default && typeof templateModule.default === 'function') {
        return templateModule.default(context);
      }
    } catch (error) {
      // Core template not found, continue to next option
    }

    // 3. Try app-specific static HTML file
    try {
      const staticHtmlPath = `${this.APP_STATIC_PATH}/${templateName}.html`;
      const htmlContent = await Deno.readTextFile(staticHtmlPath);
      return this.processStaticHTML(htmlContent, context);
    } catch (error) {
      // Static HTML not found, fall back to built-in
    }

    // 4. Fall back to built-in templates
    return this.getBuiltInTemplate(templateName, context);
  }

  /**
   * Process static HTML with simple variable substitution
   */
  private static processStaticHTML(html: string, context: TemplateContext): string {
    let processedHtml = html;
    
    // Replace {{variable}} patterns with context values
    processedHtml = processedHtml.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      if (context[varName] !== undefined) {
        return String(context[varName]);
      }
      if (context.view[varName] !== undefined) {
        return String(context.view[varName]);
      }
      if (context.app[varName] !== undefined) {
        return String(context.app[varName]);
      }
      return match; // Keep original if not found
    });

    return processedHtml;
  }

  /**
   * Built-in template fallbacks (the current hardcoded templates)
   */
  private static getBuiltInTemplate(templateName: string, context: TemplateContext): string {
    const { Heading, Text, Card, Button } = this.getUIComponents();
    const { app, view, viewName } = context;

    switch (templateName) {
      case 'about':
        return `
          <div style="max-width: 800px; margin: 0 auto; padding: 2rem;">
            ${Heading({ level: 1, children: `About ${app.name}` })}
            
            <div style="margin: 2rem 0;">
              ${Text({ 
                children: `Welcome to ${app.name}, a powerful application built with the Solidcore3 framework.`,
                size: 'lg'
              })}
            </div>
            
            ${Card({
              children: `
                ${Heading({ level: 2, children: 'Features' })}
                <ul style="margin: 1rem 0; padding-left: 1.5rem;">
                  <li style="margin: 0.5rem 0;">Modern web application framework</li>
                  <li style="margin: 0.5rem 0;">Declarative truth file configuration</li>
                  <li style="margin: 0.5rem 0;">Real-time hot reload development</li>
                  <li style="margin: 0.5rem 0;">Constrained component system</li>
                  <li style="margin: 0.5rem 0;">Edge-ready deployment</li>
                </ul>
              `,
              p: 4,
              m: [4, 0]
            })}
            
            ${Card({
              children: `
                ${Heading({ level: 2, children: 'Technology Stack' })}
                <div style="margin: 1rem 0;">
                  <div style="margin: 0.5rem 0;"><strong>Framework:</strong> Solidcore3 Runtime Engine</div>
                  <div style="margin: 0.5rem 0;"><strong>Runtime:</strong> Deno with TypeScript</div>
                  <div style="margin: 0.5rem 0;"><strong>Database:</strong> SQLite</div>
                  <div style="margin: 0.5rem 0;"><strong>UI:</strong> Constrained Component System</div>
                  <div style="margin: 0.5rem 0;"><strong>Hot Reload:</strong> File watching enabled</div>
                </div>
              `,
              p: 4,
              m: [4, 0]
            })}
            
            <div style="margin: 3rem 0; text-align: center;">
              ${Button({ 
                children: 'Back to Home',
                variant: 'primary',
                onClick: "window.location.href='/'"
              })}
            </div>
          </div>
        `;

      case 'help':
        return `
          <div style="max-width: 800px; margin: 0 auto; padding: 2rem;">
            ${Heading({ level: 1, children: 'Help & Documentation' })}
            
            ${Card({
              children: `
                ${Heading({ level: 2, children: 'Getting Started' })}
                <p>This application is built with Solidcore3, an AI-first web framework.</p>
                <p>All functionality is defined in the truth file and automatically generated.</p>
              `,
              p: 4,
              m: [2, 0]
            })}
            
            <div style="margin: 2rem 0; text-align: center;">
              ${Button({ 
                children: 'Back to Home',
                variant: 'primary',
                onClick: "window.location.href='/'"
              })}
            </div>
          </div>
        `;

      default:
        return `
          <div style="max-width: 600px; margin: 0 auto; padding: 2rem; text-align: center;">
            ${Heading({ level: 1, children: view.title || viewName })}
            ${Text({ 
              children: 'This is a custom page with no entity data.',
              size: 'lg',
              color: 'gray.600'
            })}
            <div style="margin: 2rem 0;">
              ${Button({ 
                children: 'Go Home',
                variant: 'primary',
                onClick: "window.location.href='/'"
              })}
            </div>
          </div>
        `;
    }
  }

  /**
   * Import UI components - this allows templates to use the component system
   */
  private static getUIComponents() {
    // Import the actual UI components
    // Note: In a real implementation, these would be properly imported
    // For now, we'll use the same pattern as the existing UI generator
    return {
      Heading: (props: any) => `<h${props.level}>${props.children}</h${props.level}>`,
      Text: (props: any) => `<p style="font-size: ${props.size === 'lg' ? '1.125rem' : '1rem'};">${props.children}</p>`,
      Card: (props: any) => `<div style="background: white; padding: 1rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin: ${props.m?.[0] || 0}rem 0;">${props.children}</div>`,
      Button: (props: any) => `<button onclick="${props.onClick}" style="background: ${props.variant === 'primary' ? '#3b82f6' : '#f3f4f6'}; color: ${props.variant === 'primary' ? 'white' : '#374151'}; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; cursor: pointer;">${props.children}</button>`
    };
  }

  /**
   * List available templates in both core and app directories
   */
  static async listAvailableTemplates(): Promise<{ core: string[], app: string[], static: string[] }> {
    const result = { core: [], app: [], static: [] };

    try {
      // List core templates
      for await (const entry of Deno.readDir(this.CORE_TEMPLATES_PATH)) {
        if (entry.isFile && entry.name.endsWith('.ts') && entry.name !== 'template-loader.ts') {
          result.core.push(entry.name.replace('.ts', ''));
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    try {
      // List app templates
      for await (const entry of Deno.readDir(this.APP_TEMPLATES_PATH)) {
        if (entry.isFile && entry.name.endsWith('.ts')) {
          result.app.push(entry.name.replace('.ts', ''));
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    try {
      // List static HTML files
      for await (const entry of Deno.readDir(this.APP_STATIC_PATH)) {
        if (entry.isFile && entry.name.endsWith('.html')) {
          result.static.push(entry.name.replace('.html', ''));
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return result;
  }
}