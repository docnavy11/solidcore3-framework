// Router Generator - Always regenerated from truth file
// Creates client-side router configuration

import { AppDefinition } from '../../core/types/index.ts'

export class RouterGenerator {
  constructor(private app: AppDefinition) {}

  async generateRouter(): Promise<void> {
    console.log('🛣️ Generating client-side router...')
    
    const routerCode = this.generateRouterCode()
    
    // Ensure app directory exists
    await Deno.mkdir('./app', { recursive: true })
    
    // Always overwrite router.js
    await Deno.writeTextFile('./app/router.js', routerCode)
    console.log('✅ Generated app/router.js')
  }

  private generateRouterCode(): string {
    const views = this.app.views || {}
    const appName = this.app.name || 'App'

    // Collect all routes and their configurations
    const routes: Array<{
      path: string
      viewName: string
      layout: string
      exact?: boolean
    }> = []

    // Add routes from views
    for (const [viewName, view] of Object.entries(views)) {
      routes.push({
        path: view.route,
        viewName,
        layout: view.layout || 'main'
      })
    }

    // Sort routes by specificity (more specific routes first)
    routes.sort((a, b) => {
      const aHasParams = a.path.includes(':')
      const bHasParams = b.path.includes(':')
      
      // Non-parameterized routes first
      if (!aHasParams && bHasParams) return -1
      if (aHasParams && !bHasParams) return 1
      
      // Among parameterized routes, longer paths first
      return b.path.length - a.path.length
    })

    return `// Generated Router Configuration
// This file is always regenerated from the truth file - do not edit

// Import Router components
import { Router, Route } from 'https://esm.sh/preact-router@4.1.2'

// Import layouts
${this.generateLayoutImports(routes)}

// Import views
${this.generateViewImports(routes)}

export default function AppRouter() {
  // Access global utilities
  const { html } = window
  
  console.log('🛣️ AppRouter rendering, path:', window.location.pathname)
  
  return html\`
    <\${Router}>
      <!-- Root redirect to first list view -->
      <\${Route} 
        path="/" 
        component=\${RootRedirect} 
      />
      
      ${routes.map(route => this.generateRouteComponent(route)).join('\n      ')}
      
      <!-- Fallback route -->
      <\${Route} 
        default 
        component=\${NotFound} 
      />
    </\/>
  \`
}

// Root redirect component
function RootRedirect() {
  // Access global hooks and utilities
  const { html, useEffect } = window
  
  // Redirect to the first list view
  const firstListRoute = '${this.getFirstListRoute(routes)}'
  
  useEffect(() => {
    window.location.href = firstListRoute
  }, [])
  
  return html\`
    <div style="display: flex; align-items: center; justify-content: center; min-height: 50vh; background: #f9fafb;">
      <div class="text-center">
        <div class="spinner"></div>
        <p style="color: #6b7280; margin-top: 1rem;">Redirecting to ${this.app.name}...</p>
      </div>
    </div>
  \`
}

// Layout wrapper HOC with error boundary
function withLayout(Component, Layout) {
  return function WrappedComponent(props) {
    // Access global utilities
    const { html } = window
    
    console.log('🔧 withLayout rendering:', Component.name, 'with layout:', Layout.name)
    
    // Wrap component rendering in error boundary for hook failures
    try {
      return html\`
        <\${Layout} route=\${props.url || props.path || window.location.pathname}>
          <\${Component} ....\${props} />
        </\${Layout}>
      \`
    } catch (error) {
      // Only catch and handle hook-related errors
      if (error.message && error.message.includes('__H')) {
        console.warn('Hook context error caught, retrying...', error.message)
        // Brief delay then retry
        setTimeout(() => {
          window.location.reload()
        }, 100)
        
        return html\`
          <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center;">
              <div class="spinner"></div>
              <p style="color: #6b7280;">Recovering from navigation error...</p>
            </div>
          </div>
        \`
      }
      
      // Re-throw other errors
      throw error
    }
  }
}

// 404 Not Found Component
function NotFound() {
  // Access global utilities
  const { html } = window
  
  return html\`
    <div style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #f9fafb; padding: 2rem;">
      <div class="text-center">
        <h1 style="font-size: 3rem; font-weight: bold; color: #111827; margin-bottom: 1rem;">404</h1>
        <h2 style="font-size: 1.5rem; font-weight: 600; color: #374151; margin-bottom: 1rem;">Page Not Found</h2>
        <p style="color: #6b7280; margin-bottom: 2rem;">The page you're looking for doesn't exist.</p>
        <a 
          href="/" 
          class="btn btn-primary"
        >
          Go Home
        </a>
      </div>
    </div>
  \`
}

// Navigation helper (can be used by layouts)
export function navigateTo(path) {
  // Use Preact Router's route function if available, otherwise fallback to location
  if (window.route) {
    window.route(path)
  } else {
    window.location.href = path
  }
}

// Current route helper
export function getCurrentRoute() {
  return window.location.pathname
}

// Route matching helper
export function isActiveRoute(path, currentPath = getCurrentRoute()) {
  if (path === currentPath) return true
  if (path !== '/' && currentPath.startsWith(path)) return true
  return false
}`
  }

  private generateLayoutImports(routes: Array<{ layout: string }>): string {
    const layouts = new Set(routes.map(r => r.layout))
    const imports: string[] = []

    for (const layout of layouts) {
      const layoutName = this.capitalize(layout) + 'Layout'
      imports.push(`import ${layoutName} from './layouts/system/${layout}.js'`)
    }

    return imports.join('\n')
  }

  private generateViewImports(routes: Array<{ viewName: string }>): string {
    const imports: string[] = []

    for (const route of routes) {
      imports.push(`import ${route.viewName} from './views/${route.viewName}.js'`)
    }

    return imports.join('\n')
  }

  private generateRouteComponent(route: { path: string, viewName: string, layout: string }): string {
    const layoutName = this.capitalize(route.layout) + 'Layout'
    
    return `<\${Route} 
        path="${route.path}" 
        component=\${(props) => {
          console.log('📍 Route matched:', '${route.path}', 'component:', '${route.viewName}')
          return withLayout(${route.viewName}, ${layoutName})(props)
        }} 
      />`
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  private getFirstListRoute(routes: Array<{ path: string, viewName: string }>): string {
    // Find the first list view from the truth file
    const views = this.app.views || {}
    for (const [viewName, view] of Object.entries(views)) {
      if (view.type === 'list' || view.type === 'template') {
        return view.route
      }
    }
    
    // Fallback to first route if no list view found
    if (routes.length > 0) {
      return routes[0].path
    }
    
    // Ultimate fallback
    return '/tasks'
  }
}