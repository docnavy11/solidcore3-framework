// New UI Manager - Orchestrates the new architecture
// Replaces old UI manager with template-based approach

import { AppDefinition } from '../types/index.ts'
import { NewComponentGenerator } from './component.ts'
import { RouterGenerator } from './router.ts'
import { ModelGenerator } from './model.ts'

export class NewUIManager {
  private componentGenerator: NewComponentGenerator
  private routerGenerator: RouterGenerator
  private modelGenerator: ModelGenerator
  
  constructor(private app: AppDefinition) {
    this.componentGenerator = new NewComponentGenerator(app)
    this.routerGenerator = new RouterGenerator(app)
    this.modelGenerator = new ModelGenerator(app)
  }

  async generateAll(): Promise<void> {
    console.log('🎨 Generating new UI architecture...')
    
    try {
      // 1. Generate runtime models and API clients (always regenerated)
      await this.modelGenerator.generateAllModels()
      
      // 2. Generate router (always regenerated)
      await this.routerGenerator.generateRouter()
      
      // 3. Generate views (only if missing)
      await this.componentGenerator.generateAllViews()
      
      console.log('✅ New UI generation complete')
      
    } catch (error) {
      console.error('❌ UI generation failed:', error)
      throw error
    }
  }

  // Generate single view (for CLI usage)
  async generateView(viewName: string): Promise<void> {
    const view = this.app.views?.[viewName]
    if (!view) {
      throw new Error(`View ${viewName} not found in truth file`)
    }
    
    await this.componentGenerator.generateView(viewName, view)
  }

  // Force regenerate view (for CLI --force flag)
  async regenerateView(viewName: string): Promise<void> {
    await this.componentGenerator.regenerateView(viewName)
  }

  // Serve SPA (for development)
  async generateSPAResponse(): Promise<string> {
    // Just serve the index.html file
    try {
      return await Deno.readTextFile('./app/index.html')
    } catch (error) {
      // Fallback if index.html doesn't exist
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${this.app.name || 'App'}</title>
        </head>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h1>SPA Loading Error</h1>
          <p>Could not load index.html: ${error.message}</p>
          <p><a href="/app/index.html">Try direct link</a></p>
        </body>
        </html>
      `
    }
  }

  // Get info about generated files
  async getGenerationInfo(): Promise<{
    views: Array<{ name: string, exists: boolean, path: string }>
    router: { exists: boolean, path: string }
    models: Array<{ name: string, exists: boolean, path: string }>
  }> {
    const info = {
      views: [] as Array<{ name: string, exists: boolean, path: string }>,
      router: { exists: false, path: './app/router.js' },
      models: [] as Array<{ name: string, exists: boolean, path: string }>
    }

    // Check views
    if (this.app.views) {
      for (const viewName of Object.keys(this.app.views)) {
        const path = `./app/views/${viewName}.js`
        try {
          await Deno.stat(path)
          info.views.push({ name: viewName, exists: true, path })
        } catch {
          info.views.push({ name: viewName, exists: false, path })
        }
      }
    }

    // Check router
    try {
      await Deno.stat('./app/router.js')
      info.router.exists = true
    } catch {
      info.router.exists = false
    }

    // Check models
    if (this.app.entities) {
      for (const entityName of Object.keys(this.app.entities)) {
        const path = `./runtime/generated/models/${entityName.toLowerCase()}.js`
        try {
          await Deno.stat(path)
          info.models.push({ name: entityName, exists: true, path })
        } catch {
          info.models.push({ name: entityName, exists: false, path })
        }
      }
    }

    return info
  }

  // Development helper: list all templates
  async getAvailableTemplates(): Promise<Array<{ name: string, path: string, metadata?: any }>> {
    const templates: Array<{ name: string, path: string, metadata?: any }> = []

    try {
      // Scan system templates
      for await (const entry of Deno.readDir('./app/templates/system')) {
        if (entry.isFile && entry.name.endsWith('.js')) {
          const templateName = `system/${entry.name.replace('.js', '')}`
          const templatePath = `./app/templates/system/${entry.name}`
          
          try {
            // Try to load metadata
            const module = await import(`file://${Deno.cwd()}/${templatePath}`)
            templates.push({
              name: templateName,
              path: templatePath,
              metadata: module.metadata
            })
          } catch {
            templates.push({ name: templateName, path: templatePath })
          }
        }
      }

      // Scan app templates
      try {
        for await (const entry of Deno.readDir('./app/templates/app')) {
          if (entry.isFile && entry.name.endsWith('.js')) {
            const templateName = `app/${entry.name.replace('.js', '')}`
            const templatePath = `./app/templates/app/${entry.name}`
            
            try {
              const module = await import(`file://${Deno.cwd()}/${templatePath}`)
              templates.push({
                name: templateName,
                path: templatePath,
                metadata: module.metadata
              })
            } catch {
              templates.push({ name: templateName, path: templatePath })
            }
          }
        }
      } catch {
        // app/templates/app might not exist yet
      }

    } catch (error) {
      console.warn('Could not scan templates:', error.message)
    }

    return templates
  }
}