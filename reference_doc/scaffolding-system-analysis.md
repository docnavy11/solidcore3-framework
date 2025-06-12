# Solidcore3 Scaffolding System Analysis

## Overview

The Solidcore3 scaffolding system is a sophisticated code generation framework that transforms declarative truth file definitions into a complete, working web application. It follows a clear separation between what gets generated (runtime code) and what can be customized (app-specific code).

## Architecture

### Core Components

1. **Truth File (`app/app.truth.ts`)**
   - Single source of truth for the entire application
   - Defines entities, views, workflows, and behaviors
   - Drives all code generation

2. **Generator System**
   - Located in `core/generators/` (interfaces) and `runtime/generators/` (implementations)
   - Each generator handles a specific aspect of the application
   - Generators are stateless and deterministic

3. **Template System**
   - Templates in `app/templates/` and `core/ui/templates/`
   - Supports both TypeScript templates and static HTML
   - Fallback system: app → core → built-in

## Generation Pipeline

```
Truth File → Load → Validate → Generate → Output
                                    ↓
                              ┌─────┴─────┐
                              │ Generators │
                              ├───────────┤
                              │ Database  │ → SQL schemas, migrations
                              │ API       │ → REST endpoints
                              │ UI        │ → Components, hooks
                              │ Router    │ → Client-side routing
                              │ Models    │ → Data access layer
                              └───────────┘
```

## Key Design Patterns

### 1. **Separation of Generated vs Custom Code**

**Always Regenerated (runtime/generated/):**
- API clients
- Data hooks
- Models
- Base routing

**Generated Once with Conflict Resolution (app/components/):**
- UI components
- Can be customized after generation
- New versions created as `.new` files if truth changes

### 2. **Template-Based Generation**

The system uses a sophisticated template approach:

```javascript
// Template metadata defines inputs
export const metadata = {
  inputs: {
    entity: { required: true, type: 'entity' },
    route: { required: true, type: 'string' }
  }
}

// Generation function creates component
export function generateComponent(viewName, viewDef, entityDef) {
  // Generate component code
}
```

### 3. **Layered Template System**

Templates are resolved in priority order:
1. **App-specific templates** (`app/templates/`) - Custom implementations
2. **Core system templates** (`core/ui/templates/`) - Default implementations
3. **Static HTML** (`app/static/`) - Simple content pages
4. **Built-in fallbacks** - Hardcoded defaults

### 4. **Hook-Based Extensibility**

Generated components support hooks for customization:
```javascript
// Component looks for optional hooks file
const module = await import('./${viewName}.hooks.js')
hooks = module.default || {}

// Hooks can modify data and add content
const processedData = hooks.beforeRender?.(data) || data
```

## Generator Types

### 1. **Database Generator** (`core/generators/database.ts`)
- Generates SQLite schemas from entity definitions
- Creates tables with audit columns (created_at, updated_at)
- Adds update triggers and indexes
- Handles field type mapping

### 2. **API Generator** (`core/generators/api.ts`)
- Creates REST endpoints for each entity
- Implements CRUD operations (GET, POST, PUT, DELETE)
- Generates behavior endpoints from entity behaviors
- Includes validation and error handling
- Emits events for workflow integration

### 3. **UI Manager** (`runtime/generators/ui-manager.ts`)
- Orchestrates all UI-related generation
- Manages conflict resolution for components
- Coordinates component, hook, and API client generation
- Creates `.new` files when changes detected

### 4. **Component Generator** (`runtime/generators/component-generator.ts`)
- Generates React/Preact components for views
- Creates list, detail, and form components
- Integrates with generated hooks and API clients
- Supports customization after generation

### 5. **Router Generator** (`runtime/generators/router-generator.ts`)
- Creates client-side routing configuration
- Generates route components with layouts
- Handles parameterized routes
- Includes fallback and redirect logic

### 6. **Model Generator** (`runtime/generators/model-generator.ts`)
- Generates data access hooks for entities
- Creates API client with standard methods
- Provides React hooks for data fetching
- Includes mutation functions

## Generation Strategy

### Development Mode
- Hot reload on truth file changes
- Regenerates only affected parts
- Provides detailed error messages
- Preserves customizations

### Production Mode
- Pre-generates all code
- Optimizes for performance
- Bundles assets
- No runtime generation

## Key Features

### 1. **Conflict Resolution**
When regenerating components:
- Existing files are compared with new generation
- If different, creates `.new` file for manual merge
- Preserves customizations while showing updates

### 2. **Template Interpolation**
The template engine supports variable substitution:
- `${variable}` syntax in workflow actions
- Context includes entity, data, user, timestamp
- Nested property access (e.g., `${data.title}`)

### 3. **Type Safety**
- Generated TypeScript interfaces from entities
- Type-safe API clients
- Validated field definitions

### 4. **Extension Points**
- Custom templates can override system templates
- Hook files for component customization
- Extension system for API and UI modifications

## File Structure

```
app/
├── app.truth.ts          # Source of truth
├── components/           # Generated once, customizable
│   ├── TaskList.js
│   └── TaskList.js.new   # New version if truth changed
├── templates/            # Custom templates
│   ├── system/          # System component templates
│   └── app/             # App-specific templates
└── static/              # Static HTML files

runtime/
├── generated/           # Always regenerated
│   ├── api/            # API client
│   ├── hooks/          # Data hooks
│   └── models/         # Entity models
└── generators/         # Generator implementations

core/
├── generators/         # Generator interfaces
├── ui/
│   ├── components/     # Base UI components
│   └── templates/      # Core templates
└── types/             # Type definitions
```

## Benefits

1. **Rapid Development**: Full app from single truth file
2. **Consistency**: All code follows same patterns
3. **Maintainability**: Changes in one place update everywhere
4. **Customizability**: Generated code can be modified
5. **Type Safety**: Full TypeScript support
6. **AI-Friendly**: Simple declarative format

## Limitations and Considerations

1. **Learning Curve**: Understanding generation vs customization boundaries
2. **Merge Complexity**: Manual merging needed when truth changes affect customized components
3. **Generation Time**: Initial generation can take time for large apps
4. **Debugging**: Need to understand both truth file and generated code

## Best Practices

1. **Start with Truth**: Define structure before customizing
2. **Use Templates**: Create reusable templates for common patterns
3. **Leverage Hooks**: Use hook files instead of modifying generated components
4. **Version Control**: Commit both truth file and customizations
5. **Document Changes**: Note why components were customized

## Conclusion

The Solidcore3 scaffolding system represents a sophisticated approach to code generation that balances automation with customization. By maintaining a clear separation between generated and custom code, using a layered template system, and providing multiple extension points, it enables rapid development while preserving flexibility for complex requirements.