// New Component Generator - Uses templates and "generate if missing" rule
// Replaces the old component generator with template-based approach

import { AppDefinition, ViewDefinition } from '../../core/types/index.ts'
import { exists } from 'https://deno.land/std@0.208.0/fs/mod.ts'
import { logger } from '../../runtime/utils/logger.ts'
import { PathResolver } from '../utils/path-resolver.ts'

export class NewComponentGenerator {
  constructor(
    private app: AppDefinition,
    private pathResolver?: PathResolver
  ) {}

  async generateAllViews(): Promise<void> {
    logger.gen('Generating views from templates...');
    
    if (!this.app.views) {
      logger.gen('No views defined in truth file');
      return
    }

    for (const [viewName, view] of Object.entries(this.app.views)) {
      await this.generateView(viewName, view)
    }
    
    logger.gen('View generation complete');
  }

  async generateView(viewName: string, view: ViewDefinition): Promise<void> {
    // Determine feature directory
    const featureDir = this.getFeatureDirectory(viewName, view)
    
    // Step 1: Always generate the _ prefixed template file
    const templatePath = this.getViewPath(featureDir, `_${viewName}.js`)
    const customPath = this.getViewPath(featureDir, `${viewName}.js`)
    
    logger.gen(`Generating _${viewName}.js template...`);

    try {
      // Determine which template to use
      let componentCode: string

      switch (view.type) {
        case 'generator':
          // Generate from template
          componentCode = await this.generateFromTemplate(viewName, view)
          break;
          
        case 'custom':
          // Point to existing component
          componentCode = this.generateCustomViewWrapper(viewName, view)
          break;
          
        case 'static':
          // Serve static content
          componentCode = this.generateStaticViewWrapper(viewName, view)
          break;
          
        default:
          throw new Error(`Unknown view type: ${view.type}`)
      }

      // Ensure feature directory exists
      const viewDir = this.getViewDirectory(featureDir)
      await Deno.mkdir(viewDir, { recursive: true })
      
      // Step 2: Always write the _ prefixed template
      await Deno.writeTextFile(templatePath, this.addGeneratedHeader(componentCode, viewName))
      logger.gen(`Generated _${viewName}.js template`);
      
      // Step 3: Determine which version to use for runtime
      const hasCustom = await exists(customPath)
      
      // Ensure runtime directory exists
      const runtimeDir = this.getRuntimePath('views')
      await Deno.mkdir(runtimeDir, { recursive: true })
      const runtimePath = this.getRuntimePath(`views/${viewName}.js`)
      
      if (hasCustom) {
        logger.gen(`Using custom override: ${viewName}.js`);
        // Copy custom file to runtime (user's version is the source of truth)
        const customContent = await Deno.readTextFile(customPath)
        await Deno.writeTextFile(runtimePath, customContent)
      } else {
        // Use generated template for runtime
        await Deno.writeTextFile(runtimePath, componentCode)
        logger.gen(`Generated ${viewName}.js from template`);
      }
      
    } catch (error) {
      logger.genError(`Failed to generate ${viewName}`, { error: error.message });
      // Generate error component as fallback
      const errorComponent = this.generateErrorComponent(viewName, error.message)
      await Deno.writeTextFile(templatePath, this.addGeneratedHeader(errorComponent, viewName))
    }
  }

  private addGeneratedHeader(componentCode: string, viewName: string): string {
    const header = `// Generated ${viewName} Component - DO NOT EDIT
//
// 🤖 This is a generated template file. To customize:
//     1. Copy this file to ${viewName}.js (remove the _)
//     2. Edit your copy - the generator will use your version
//     3. Your custom file will override this template
//
// Generated: ${new Date().toISOString()}

`
    
    return header + componentCode
  }

  private generateCustomViewWrapper(viewName: string, view: ViewDefinition): string {
    // Use path (required for custom views)
    const componentPath = view.path;
    const componentName = componentPath.split('/').pop()?.replace('.js', '') || viewName;
    const importName = componentName + 'Component'  // Avoid naming conflicts
    
    // Use path directly
    const importPath = `../../${componentPath}`;
    
    return `// Custom View: ${viewName}
// Points to existing component: ${componentPath}
import ${importName} from '${importPath}'

export default function ${viewName}(props) {
  const { html } = window
  
  return html\`<\${${importName}} ....\${props} />\`
}`
  }
  
  private generateStaticViewWrapper(viewName: string, view: ViewDefinition): string {
    // Use path (required for static views)
    const contentPath = view.path;
    
    return `// Static View: ${viewName}
// Serves static content from: ${contentPath}

export default function ${viewName}(props) {
  const { html, useEffect, useState } = window
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    fetch('/features/${contentPath}')
      .then(response => {
        if (!response.ok) {
          throw new Error(\`Failed to load content: \${response.status}\`)
        }
        return response.text()
      })
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])
  
  if (loading) {
    return html\`<div class="loading">Loading content...</div>\`
  }
  
  if (error) {
    return html\`<div class="error">Error loading content: \${error}</div>\`
  }
  
  return html\`<div dangerouslySetInnerHTML=\${{ __html: content }}></div>\`
}`
  }

  private async generateFromTemplate(viewName: string, view: ViewDefinition): Promise<string> {
    // Get generator value (required for generator views)
    const generatorName = view.generator;
    
    if (!generatorName) {
      throw new Error(`Generator not specified for generator view ${viewName}`)
    }

    // Load template
    const templatePath = `./app/templates/generators/${generatorName}.js`
    
    if (!await exists(templatePath)) {
      throw new Error(`Template not found: ${generatorName}`)
    }

    try {
      // Import template module
      const templateModule = await import(`file://${Deno.cwd()}/${templatePath}`)
      
      if (!templateModule.generateComponent) {
        throw new Error(`Template ${generatorName} does not export generateComponent function`)
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
      throw new Error(`Failed to process template ${generatorName}: ${error.message}`)
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
        const layoutPath = this.getLayoutPath(`${value}.js`)
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

  private getFeatureDirectory(viewName: string, view: ViewDefinition): string {
    // Extract directory from path (path is now required)
    const pathParts = view.path.split('/');
    pathParts.pop(); // Remove filename
    return pathParts.length > 0 ? `features/${pathParts.join('/')}` : 'features';
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

    const featureDir = this.getFeatureDirectory(viewName, view)
    const viewPath = this.getViewPath(featureDir, `${viewName}.js`)
    
    // Remove existing file
    try {
      await Deno.remove(viewPath)
    } catch {
      // File might not exist, that's ok
    }

    // Regenerate
    await this.generateView(viewName, view)
  }

  // Path resolver helper methods
  private getViewPath(featureDir: string, filename: string): string {
    if (this.pathResolver) {
      return this.pathResolver.getViewsPath(`${featureDir}/${filename}`)
    }
    // Legacy fallback
    return `./app/${featureDir}/${filename}`
  }

  private getViewDirectory(featureDir: string): string {
    if (this.pathResolver) {
      return this.pathResolver.getViewsPath(featureDir)
    }
    // Legacy fallback
    return `./app/${featureDir}`
  }

  private getRuntimePath(relativePath: string): string {
    if (this.pathResolver) {
      return this.pathResolver.getRuntimePath(relativePath)
    }
    // Legacy fallback
    return `./runtime/generated/${relativePath}`
  }

  private getLayoutPath(filename: string): string {
    if (this.pathResolver) {
      // Layouts are typically in a layouts directory, but we don't have that in our config yet
      // For now, use shared path as a fallback
      return this.pathResolver.getSharedPath(`layouts/${filename}`)
    }
    // Legacy fallback
    return `./app/layouts/${filename}`
  }
}