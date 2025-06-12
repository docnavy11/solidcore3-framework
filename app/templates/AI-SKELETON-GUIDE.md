# 🤖 AI Guide: Creating New Component Skeletons

This guide explains how AI can create new template skeletons for Solidcore3's advanced scaffolding system with built-in validation, authentication, and testing support.

## Overview

Solidcore3 uses a **comprehensive template-based scaffolding system** where:
- **Template files** (`.template.js`) define the component structure with placeholders
- **Generator files** (`.js`) handle the logic, validation, and placeholder replacement
- **Generated components** include authentication, validation, error handling, and testing
- **AI guidance comments** provide contextual help and suggestions
- **Built-in safety features** prevent common errors and provide recovery mechanisms

## When to Create a New Skeleton

Create a new skeleton when you need a **fundamentally different component type** that doesn't fit existing patterns:

### Existing Skeletons
- `form.template.js` - Create/edit forms with validation
- `list.template.js` - Data tables with filtering, sorting, actions
- `detail.template.js` - Single item detail views with actions

### New Skeleton Examples
- **Dashboard widgets** - Chart components, KPI cards, analytics with real-time data
- **File upload** - Drag & drop file handling with validation and preview
- **Calendar/scheduler** - Date/time selection with events and permissions
- **Chat interface** - Message threads with real-time updates and auth
- **Kanban board** - Drag & drop task management with role-based permissions
- **Settings panel** - Configuration forms with validation and role restrictions
- **Data visualization** - Charts and graphs with permission-based data filtering
- **Workflow builders** - Visual process designers with validation
- **Multi-step forms** - Complex forms with validation at each step

## Step-by-Step Process

### 1. Create the Template File

Create `app/templates/system/{name}.template.js`:

```javascript
// Generated __VIEW_NAME__ Component
// Edit this file directly - it won't be regenerated unless deleted
//
// 🤖 AI: For structural changes ({specific changes}),
//     consider modifying the template skeleton first: app/templates/system/{name}.template.js
//     Then touch app/app.truth.ts to regenerate all {type}s with your improvements!
import { use__ENTITY__s, use__ENTITY__Mutations } from '/runtime/generated/models/__ENTITY_LOWER__.js'
import { {required components} } from '/app/components/system/index.js'
import { useAuth, usePermissions } from '/runtime/auth/hooks.js'
import { useValidation } from '/runtime/validation/hooks.js'
import { useErrorHandler } from '/core/errors/hooks.js'

// Optional hooks for customization
let hooks = {}
try {
  const module = await import('./__VIEW_NAME__.hooks.js')
  hooks = module.default || {}
} catch {
  // No hooks file - that's fine
}

export default function __VIEW_NAME__() {
  const { html, useState, useEffect } = window
  
  // Hook safety check for navigation transitions
  try {
    const [testState] = useState(true)
    if (testState === undefined) {
      throw new Error('Hook context not ready')
    }
  } catch (error) {
    console.warn('__VIEW_NAME__: Hook context not ready during navigation:', error.message)
    return html`
      <div style="min-height: 50vh; display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center;">
          <div class="spinner"></div>
          <p style="color: #6b7280; margin-top: 1rem;">Loading...</p>
        </div>
      </div>
    `
  }
  
  // Built-in framework features
  const { user, isAuthenticated } = useAuth()
  const { validateInput, errors } = useValidation('__ENTITY__')
  const { canAccess } = usePermissions('__ENTITY__')
  const { handleError, clearErrors } = useErrorHandler()
  
  // Permission check for protected components
  if (!canAccess('read')) {
    return html`
      <div class="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to view this content.</p>
      </div>
    `
  }
  
  // Component-specific logic here
  __COMPONENT_LOGIC__
  
  return html`
    <div class="__ENTITY_LOWER__-{type}">
      ${hooks.beforeContent?.() || ''}
      
      __COMPONENT_TEMPLATE__
      
      ${hooks.afterContent?.() || ''}
    </div>
  `
}

__HELPER_FUNCTIONS__
```

### 2. Create the Generator File

Create `app/templates/system/{name}.js`:

```javascript
// System {Name} Template
// Template for {description}

export const metadata = {
  inputs: {
    entity: { required: true, type: 'entity' },
    route: { required: true, type: 'string', pattern: /^\/[\w-\/:]+$/ },
    // Add specific inputs for your template
    {customField}: { required: false, type: 'string', default: 'defaultValue' },
    requiresAuth: { required: false, type: 'boolean', default: false },
    permissions: { required: false, type: 'array', default: [] },
    validation: { required: false, type: 'object', default: {} }
  },
  features: {
    authentication: true,
    validation: true,
    permissions: true,
    errorHandling: true,
    testing: true
  }
}

export async function generateComponent(viewName, viewDef, entityDef, appDef) {
  const entity = viewDef.entity
  const entityLower = entity.toLowerCase()
  
  // Process template-specific data with validation and auth context
  const {specificData} = processTemplateData(viewDef, entityDef, appDef)
  
  // Check if authentication is enabled in the app
  const authEnabled = appDef.settings?.auth?.enabled || false
  const hasPermissions = entityDef.permissions && Object.keys(entityDef.permissions).length > 0

  // Load the template file with full syntax highlighting!
  const templatePath = new URL('./{name}.template.js', import.meta.url).pathname
  let template = await Deno.readTextFile(templatePath)
  
  // Replace placeholders with actual values
  template = template
    .replaceAll('__VIEW_NAME__', viewName)
    .replaceAll('__ENTITY__', entity)
    .replaceAll('__ENTITY_LOWER__', entityLower)
    
    // Replace component-specific placeholders
    .replace('__COMPONENT_LOGIC__', generateComponentLogic(viewDef, entityDef, authEnabled))
    .replace('__COMPONENT_TEMPLATE__', generateComponentTemplate(viewDef, entityDef, hasPermissions))
    .replace('__HELPER_FUNCTIONS__', generateHelperFunctions(viewDef, entityDef))
    .replace('__VALIDATION_HOOKS__', generateValidationHooks(entityDef))
    .replace('__AUTH_CHECKS__', generateAuthChecks(viewDef, authEnabled))
    .replace('__ERROR_HANDLING__', generateErrorHandling(viewName))
  
  return template
}

function processTemplateData(viewDef, entityDef) {
  // Process and prepare data for template generation
  return {
    // Return processed data
  }
}

function generateComponentLogic(viewDef, entityDef) {
  // Generate component-specific logic
  return `
  // Generated logic here
  `
}

function generateComponentTemplate(viewDef, entityDef) {
  // Generate the main template structure
  return `
  <div class="component-content">
    <!-- Generated template here -->
  </div>
  `
}

function generateHelperFunctions(viewDef, entityDef) {
  // Generate any helper functions needed
  return `
// Helper functions here
function helperFunction() {
  // Implementation
}
  `
}
```

### 3. Register the Template Type

Add your new template type to the generator's legacy mapping in `core/generators/component.ts`:

```typescript
private mapLegacyTypeToTemplate(type: string): string {
  const mapping: Record<string, string> = {
    'list': 'system/list',
    'detail': 'system/detail',
    'form': 'system/form',
    '{newType}': 'system/{name}' // Add your new type here
  }
  
  return mapping[type] || 'system/list'
}
```

### 4. Add Testing Support

Create test templates in `testing/templates/{name}-test.template.js`:

```javascript
// Testing template for {name} components
import { {Name}Tester } from '/testing/specialized/{name}-tester.js'

export async function test__VIEW_NAME__() {
  const tester = new {Name}Tester()
  
  await tester.test({
    name: '__VIEW_NAME__ Component Test',
    component: '__VIEW_NAME__',
    entity: '__ENTITY__',
    // Add component-specific test scenarios
  })
}
```

### 5. Update Truth File Schema (Optional)

If needed, add your new view type to the TypeScript types in `core/types/view.ts`:

```typescript
export type ViewType = 'list' | 'detail' | 'form' | 'custom' | 'template' | '{newType}'
```

### 6. Use in Truth File

Now you can use your new template in `app.truth.ts`:

```typescript
views: {
  MyNewComponent: {
    type: '{newType}',
    route: '/my-route',
    entity: 'Task',
    // Add template-specific configuration
    {customField}: 'customValue'
  }
}
```

## Key Principles

### 1. **Template Structure**
- Use `__PLACEHOLDER__` format for replacements
- Include AI guidance comments at the top
- Add hook safety checks for navigation
- Include built-in authentication and validation hooks
- Add permission checks for protected components
- Include comprehensive error handling
- Add extension points (`hooks.beforeContent`, etc.)
- Include testing hooks and data attributes

### 2. **Generator Logic**
- Use `async function generateComponent(viewName, viewDef, entityDef, appDef)`
- Check authentication and permission requirements
- Generate validation hooks based on entity field definitions
- Load template file with `Deno.readTextFile()`
- Replace placeholders with `.replaceAll()` and `.replace()`
- Include error handling and recovery mechanisms
- Generate testing scaffolds automatically
- Break complex generation into helper functions

### 3. **Placeholder Naming**
- `__VIEW_NAME__` - Component name (e.g., "TaskList")
- `__ENTITY__` - Entity name (e.g., "Task")
- `__ENTITY_LOWER__` - Lowercase entity (e.g., "task")
- `__COMPONENT_LOGIC__` - Component-specific business logic
- `__COMPONENT_TEMPLATE__` - Main template structure
- `__VALIDATION_HOOKS__` - Generated validation logic
- `__AUTH_CHECKS__` - Authentication and permission checks
- `__ERROR_HANDLING__` - Error handling and recovery code
- `__HELPER_FUNCTIONS__` - Utility functions
- `__CUSTOM_PLACEHOLDER__` - Template-specific placeholders

### 4. **File Organization**
```
app/templates/system/
├── form.template.js       # Form template
├── form.js               # Form generator
├── list.template.js      # List template  
├── list.js              # List generator
├── {name}.template.js    # Your template
└── {name}.js            # Your generator
```

## Testing Your Skeleton

1. **Create the template and generator files**
2. **Add a view to your truth file using the new type**
3. **Touch the truth file**: `touch app/app.truth.ts`
4. **Check the generated component** in `app/views/`
5. **Run the test suite**: `deno task test`
6. **Verify validation works**: Check form inputs and API endpoints
7. **Test authentication**: Try with and without login
8. **Test permissions**: Verify role-based access control
9. **Verify the component loads** in the browser
10. **Check debug endpoints**: `/api/_debug/validate` for component analysis

## Best Practices

### ✅ **Do**
- Use descriptive placeholder names
- Include comprehensive AI guidance comments
- Add metadata validation for inputs
- Generate authentication and permission checks
- Include validation hooks based on entity definitions
- Add comprehensive error handling and recovery
- Generate testing scaffolds automatically
- Break complex generation into helper functions
- Test with different entity configurations
- Include hook safety checks
- Add performance monitoring hooks

### ❌ **Don't**
- Hard-code entity names in templates
- Skip the AI guidance comments
- Create overly complex generators
- Forget to handle edge cases
- Mix template structure with generation logic
- Bypass authentication or permission checks
- Skip validation for user inputs
- Ignore error handling requirements
- Forget to include testing support

## Example: Creating a Dashboard Skeleton

Let's say you want to create a dashboard skeleton for displaying KPI cards:

### 1. Template File (`dashboard.template.js`)
```javascript
// 🤖 AI: For structural changes (widget layout, KPI calculations, chart types),
//     consider modifying the template skeleton first: app/templates/system/dashboard.template.js

export default function __VIEW_NAME__() {
  // ... hook safety and setup ...
  
  return html`
    <div class="dashboard-grid">
      __WIDGET_COMPONENTS__
    </div>
  `
}
```

### 2. Generator File (`dashboard.js`)
```javascript
export async function generateComponent(viewName, viewDef, entityDef) {
  // Generate widgets based on entity fields
  const widgets = generateWidgets(entityDef)
  
  template = template
    .replace('__WIDGET_COMPONENTS__', widgets)
  
  return template
}
```

### 3. Usage in Truth File
```typescript
DashboardView: {
  type: 'dashboard',
  route: '/dashboard',
  entity: 'Task',
  widgets: ['statusChart', 'priorityKPI', 'recentTasks']
}
```

This approach gives you **maximum flexibility** while maintaining the **magic factor** of systematic improvements across all components of the same type! 

## Framework Integration Features

### 🔐 **Authentication Integration**
- Automatic login state detection
- Permission-based component rendering
- User context available in all templates
- Role-based access control

### ✅ **Validation Integration**
- Automatic field validation based on entity definitions
- Real-time validation feedback
- Sanitization and error handling
- Custom validation rule support

### 🛡️ **Error Handling Integration**
- Graceful error boundaries
- Contextual error messages
- Automatic error recovery
- Debug information in development

### 🧪 **Testing Integration**
- Automatic test scaffold generation
- Component-specific test utilities
- Integration with framework test runner
- Performance and accessibility testing

With these built-in features, your custom skeletons automatically inherit all the framework's advanced capabilities while maintaining the simplicity of the truth-driven approach!