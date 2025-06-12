// New Component Generator - Uses templates and "generate if missing" rule
// Replaces the old component generator with template-based approach

import { AppDefinition, ViewDefinition } from '../../core/types/index.ts'
import { exists } from 'https://deno.land/std@0.208.0/fs/mod.ts'

export class NewComponentGenerator {
  constructor(private app: AppDefinition) {}

  async generateAllViews(): Promise<void> {
    console.log('🎨 Generating views from templates...')
    
    if (!this.app.views) {
      console.log('No views defined in truth file')
      return
    }

    for (const [viewName, view] of Object.entries(this.app.views)) {
      await this.generateView(viewName, view)
    }
    
    console.log('✅ View generation complete')
  }

  async generateView(viewName: string, view: ViewDefinition): Promise<void> {
    const viewPath = `./app/views/${viewName}.js`
    
    // Always regenerate views (removed the exists check)
    console.log(`🔄 Regenerating ${viewName}.js...`)

    try {
      // Determine which template to use
      let componentCode: string

      if (view.type === 'custom') {
        // Custom view points to existing component
        componentCode = this.generateCustomViewWrapper(viewName, view)
      } else if (view.type === 'template') {
        // Template-based view
        componentCode = await this.generateFromTemplate(viewName, view)
      } else {
        // Legacy support - treat as template type
        const templateName = this.mapLegacyTypeToTemplate(view.type)
        componentCode = await this.generateFromTemplate(viewName, { ...view, template: templateName })
      }

      // Ensure views directory exists
      await Deno.mkdir('./app/views', { recursive: true })
      
      // Write the component
      await Deno.writeTextFile(viewPath, componentCode)
      console.log(`✨ Generated ${viewName}.js`)
      
    } catch (error) {
      console.error(`❌ Failed to generate ${viewName}:`, error)
      // Generate error component as fallback
      const errorComponent = this.generateErrorComponent(viewName, error.message)
      await Deno.writeTextFile(viewPath, errorComponent)
    }
  }

  private generateCustomViewWrapper(viewName: string, view: ViewDefinition): string {
    const componentName = view.component || viewName
    const importName = componentName + 'Component'  // Avoid naming conflicts
    
    return `// Custom View: ${viewName}
// Points to existing component: ${componentName}
import ${importName} from '../components/app/${componentName}.js'

export default function ${viewName}(props) {
  const { html } = window
  
  return html\`<\${${importName}} ....\${props} />\`
}`
  }

  private async generateFromTemplate(viewName: string, view: ViewDefinition): Promise<string> {
    if (!view.template) {
      throw new Error(`Template not specified for view ${viewName}`)
    }

    // Load template
    const templatePath = `./app/templates/${view.template}.js`
    
    if (!await exists(templatePath)) {
      throw new Error(`Template not found: ${view.template}`)
    }

    try {
      // Import template module
      const templateModule = await import(`file://${Deno.cwd()}/${templatePath}`)
      
      if (!templateModule.generateComponent) {
        throw new Error(`Template ${view.template} does not export generateComponent function`)
      }

      // Validate template inputs
      if (templateModule.metadata) {
        this.validateTemplateInputs(view, templateModule.metadata, viewName)
      }

      // Get entity definition if specified
      const entityDef = view.entity ? this.app.entities?.[view.entity] : null
      
      // Generate component code
      return templateModule.generateComponent(viewName, view, entityDef)
      
    } catch (error) {
      throw new Error(`Failed to process template ${view.template}: ${error.message}`)
    }
  }

  private validateTemplateInputs(view: any, metadata: any, viewName: string): void {
    if (!metadata.inputs) return

    const errors: string[] = []

    for (const [inputName, rules] of Object.entries(metadata.inputs as any)) {
      const value = view[inputName]
      const inputRules = rules as any

      // Check required inputs
      if (inputRules.required && (value === undefined || value === null || value === '')) {
        errors.push(`Missing required input: ${inputName}`)
      }

      // Check entity references
      if (inputRules.type === 'entity' && value) {
        if (!this.app.entities?.[value]) {
          errors.push(`Unknown entity: ${value}`)
        }
      }

      // Check layout references
      if (inputRules.type === 'layout' && value) {
        const layoutPath = `./app/layouts/${value}.js`
        // Note: We could check if layout exists, but for now just warn
      }

      // Check string patterns
      if (inputRules.pattern && value && typeof value === 'string') {
        if (!inputRules.pattern.test(value)) {
          errors.push(`Invalid format for ${inputName}: ${value}`)
        }
      }

      // Check enum values
      if (inputRules.values && value) {
        if (!inputRules.values.includes(value)) {
          errors.push(`Invalid value for ${inputName}: ${value}. Expected one of: ${inputRules.values.join(', ')}`)
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Template validation failed for ${viewName}:\n${errors.join('\n')}`)
    }
  }

  private mapLegacyTypeToTemplate(type: string): string {
    const mapping: Record<string, string> = {
      'list': 'system/list',
      'detail': 'system/detail',
      'form': 'system/form',
      'kanban': 'system/kanban',
      'calendar': 'system/calendar',
      'dashboard': 'system/dashboard'
    }
    
    return mapping[type] || 'system/list'
  }

  private generateErrorComponent(viewName: string, error: string): string {
    return `// Error Component: ${viewName}
// Generated due to template error: ${error}

export default function ${viewName}() {
  return html\`
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div class="text-red-800 mb-2">
        <h2 class="text-lg font-semibold">View Generation Error</h2>
      </div>
      <div class="text-red-600 mb-4">
        <p class="text-sm">View: ${viewName}</p>
        <p class="text-sm">Error: ${error.replace(/'/g, "\\'")}</p>
      </div>
      <div class="text-red-500 text-xs">
        <p>This component was auto-generated due to an error.</p>
        <p>Check the truth file configuration and template settings.</p>
      </div>
    </div>
  \`
}`
  }

  // Helper method to regenerate a single view (force)
  async regenerateView(viewName: string): Promise<void> {
    const view = this.app.views?.[viewName]
    if (!view) {
      throw new Error(`View ${viewName} not found in truth file`)
    }

    const viewPath = `./app/views/${viewName}.js`
    
    // Remove existing file
    try {
      await Deno.remove(viewPath)
    } catch {
      // File might not exist, that's ok
    }

    // Regenerate
    await this.generateView(viewName, view)
  }
}