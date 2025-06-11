# Template System

The Solidcore3 framework includes a flexible template system for custom pages that supports both system templates and app-specific templates.

## Template Types

### 1. App-Specific TypeScript Templates
**Location**: `/app/templates/templatename.ts`
- Full access to component system
- Receives context object with app data
- Highest priority in template resolution

### 2. Core System Templates  
**Location**: `/core/ui/templates/templatename.ts`
- Built-in framework templates
- Available across all apps
- Second priority in template resolution

### 3. Static HTML Templates
**Location**: `/app/static/templatename.html`
- Simple HTML files with variable substitution
- Support `{{variable}}` syntax
- Third priority in template resolution

### 4. Built-in Fallback Templates
- Hardcoded in TemplateLoader
- Always available as final fallback

## Template Resolution Order

1. **App Template**: `/app/templates/about.ts`
2. **Core Template**: `/core/ui/templates/about.ts`  
3. **Static HTML**: `/app/static/about.html`
4. **Built-in Fallback**: Hardcoded templates

## Usage in Truth File

```typescript
views: {
  AboutPage: {
    type: 'custom',
    route: '/about',
    title: 'About Us',
    template: 'about'  // Template name (no extension)
  }
}
```

## Example Templates

### App-Specific Template
```typescript
// app/templates/about.ts
import { TemplateContext } from '../../core/ui/templates/template-loader.ts';
import { Heading, Text, Card, Button } from '../../core/ui/components/index.ts';

export default function aboutTemplate(context: TemplateContext): string {
  const { app, view } = context;
  
  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 2rem;">
      ${Heading({ level: 1, children: \`About \${app.name}\` })}
      ${Text({ children: 'Custom content here...', size: 'lg' })}
    </div>
  `;
}
```

### Static HTML Template
```html
<!-- app/static/contact.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Contact - {{name}}</title>
</head>
<body>
    <h1>Contact {{name}}</h1>
    <p>Get in touch with us!</p>
</body>
</html>
```

## Available Routes

Based on current truth file:

- **`/about`** - Uses app-specific about template
- **`/help`** - Uses core system help template  
- **`/contact`** - Uses static HTML template
- **`/static/contact.html`** - Direct static file access

## Template Context

Templates receive a context object:

```typescript
interface TemplateContext {
  app: AppDefinition;     // Full app definition from truth file
  view: ViewDefinition;   // Current view definition
  viewName: string;       // View name (e.g., 'AboutPage')
  currentDate: string;    // ISO date string
  environment: string;    // 'development' | 'production'
  [key: string]: any;     // Additional custom context
}
```

## Variable Substitution (Static HTML)

Static HTML templates support simple variable substitution:

- `{{name}}` → App name from truth file
- `{{version}}` → App version from truth file
- Any property from the app definition

## Component System Access

TypeScript templates have full access to the constrained component system:

- `Heading()` - Semantic headings
- `Text()` - Text with styling
- `Card()` - Content containers  
- `Button()` - Interactive buttons
- `Stack()` - Layout containers
- `Grid()` - Grid layouts

## Error Handling

If a template fails to load, the system:

1. Logs the error to console
2. Shows a template error page to user
3. Provides navigation back to home
4. Continues serving other routes normally

## Development Tips

1. **Start with built-in templates** - See what's available first
2. **Create app-specific overrides** - Copy and customize for your needs
3. **Use static HTML for simple pages** - Great for contact forms, legal pages
4. **Use TypeScript templates for complex pages** - When you need components and logic
5. **Check template resolution** - Server logs show which template was loaded

This system provides maximum flexibility while maintaining the declarative nature of the Solidcore3 framework!