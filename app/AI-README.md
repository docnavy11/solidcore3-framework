# 🤖 AI Guide: Solidcore3 App Directory Structure

This is the **application layer** of Solidcore3 - where your app-specific code lives. Here's how to navigate and modify different parts of the system.

## Directory Overview

```
app/
├── app.truth.ts              # 🎯 SINGLE SOURCE OF TRUTH
├── AI-README.md              # This file - start here!
├── components/               # UI building blocks
├── extensions/               # Custom business logic
├── layouts/                  # Page layout templates
├── templates/                # Code generation skeletons
├── views/                    # Generated pages (scaffolded)
├── router.js                 # Generated routing (don't edit)
└── static/                   # Static assets
```

## 🎯 Start Here: The Truth File

**`app.truth.ts`** is the **single source of truth** for your entire application:

- **Entities** - Data models with validation, relationships, and behaviors
- **Views** - Web pages (lists, forms, details, custom) with routing and permissions
- **Workflows** - Business processes and event-driven automation
- **Permissions** - Role-based access control with expression evaluation
- **Authentication** - User management and security settings
- **Extensions** - Custom business logic and API endpoints

**🚨 Most changes start here!** Modify the truth file, then let the system generate everything else.

### 🔐 Authentication Integration
The framework now includes built-in authentication:
```typescript
settings: {
  auth: {
    enabled: true,
    jwtSecret: 'your-secret-key',
    sessionTimeout: '7d'
  }
}
```

### ✅ Validation System
Entities are automatically validated based on field definitions:
```typescript
entities: {
  Task: {
    fields: {
      title: { type: 'string', required: true, minLength: 3 },
      email: { type: 'string', pattern: '^[^@]+@[^@]+\.[^@]+$' },
      status: { type: 'enum', options: ['todo', 'done'], required: true }
    },
    permissions: {
      create: 'authenticated',
      update: 'user.id == entity.createdBy || user.role == "admin"'
    }
  }
}
```

## Decision Matrix: Where to Make Changes

| Change Type | Primary Location | Secondary Options | Regenerates |
|-------------|-----------------|-------------------|-------------|
| **Data Models** | `app.truth.ts` → entities | - | ✅ API, DB, Models, Validation |
| **Authentication** | `app.truth.ts` → settings.auth | `extensions/auth/*` | ✅ Auth Routes, Middleware |
| **Permissions** | `app.truth.ts` → entity permissions | `extensions/permissions/*` | ✅ API Protection |
| **Validation Rules** | `app.truth.ts` → field definitions | `extensions/validation/*` | ✅ API Validation |
| **Page Structure** | `templates/system/*.template.js` | `views/*` (individual) | ✅ All views |
| **Custom Pages** | `app.truth.ts` → views | `components/app/*` | ✅ Router |
| **Business Logic** | `extensions/*` | `views/*.hooks.js` | ❌ Manual |
| **Error Handling** | Framework built-in | `extensions/errors/*` | ✅ Enhanced debugging |
| **Testing** | `testing/` framework | App-specific tests | ✅ Test generation |

## 🔄 Regeneration Flow

```
Truth File Change → Validation → Auto-Regeneration →
├── Database schema + migrations
├── API routes + validation + permissions
├── UI views (from templates)
├── TypeScript types
├── Authentication routes (if enabled)
├── Router configuration
└── Testing scaffolds
```

**To trigger regeneration:** `touch app/app.truth.ts`

### 🛡️ Built-in Safety Features
- **Hot reload with error recovery** - Invalid changes won't crash the server
- **Database migration safety** - Handles schema changes without data loss
- **Validation on file change** - Catches errors before regeneration
- **Comprehensive error messages** - Clear guidance on fixing issues

## Quick Decision Guide

### 🎯 **I want to add a new data type (User, Product, etc.)**
→ **Edit `app.truth.ts` entities section**
→ System generates everything automatically

### 🎯 **I want to add a new page**
→ **Edit `app.truth.ts` views section**  
→ Choose type: `list`, `detail`, `form`, `kanban`, `calendar`, `dashboard`, or `custom`

### 🎯 **I want to change how ALL forms look**
→ **Edit `templates/system/form.template.js`**
→ Touch truth file to regenerate

### 🎯 **I want to change ONE specific page**
→ **Edit the file in `views/*` directly**
→ Or create a `.hooks.js` file for clean extension

### 🎯 **I want to add custom business logic**
→ **Create files in `extensions/*`**
→ Or use view-specific `.hooks.js` files

### 🎯 **I want to add authentication**
→ **Set `settings.auth.enabled = true` in truth file**
→ Framework generates everything automatically

### 🎯 **I want to add field validation**
→ **Add validation rules to entity field definitions**
→ Supports: required, minLength, maxLength, pattern, enum, unique

### 🎯 **I want to add permissions**
→ **Add permission expressions to entity definitions**
→ Examples: `'authenticated'`, `'user.role == "admin"'`, `'user.id == entity.ownerId'`

### 🎯 **I want to create reusable UI components**
→ **Add to `components/system/*` (framework-level)**
→ Or `components/app/*` (app-specific)

### 🎯 **I want to change page layouts**
→ **Edit `layouts/system/*` (framework-level)**
→ Or `layouts/app/*` (app-specific)

## Directory-Specific Guides

Each directory contains its own AI instructions:

- 📁 **`components/`** → [Component development guide](components/AI-COMPONENTS-GUIDE.md)
- 📁 **`extensions/`** → [Business logic guide](extensions/AI-EXTENSIONS-GUIDE.md)  
- 📁 **`layouts/`** → [Layout development guide](layouts/AI-LAYOUTS-GUIDE.md)
- 📁 **`templates/`** → [Skeleton creation guide](templates/AI-SKELETON-GUIDE.md)
- 📁 **`views/`** → [Scaffolded view guide](views/AI-INSTRUCTIONS.md)

## Advanced Guides

- 🚀 **[Advanced UI Patterns](templates/AI-ADVANCED-PATTERNS.md)** → Complex UIs from scratch (LAST RESORT)

## Core Principles

### 🏗️ **Architecture Layers**
1. **Truth Layer** (`app.truth.ts`) - What your app IS
2. **Validation Layer** (built-in) - Data integrity and security
3. **Authentication Layer** (optional) - User management and permissions
4. **Template Layer** (`templates/`) - How things are STRUCTURED  
5. **Component Layer** (`components/`) - Reusable UI PIECES
6. **Extension Layer** (`extensions/`) - Custom BUSINESS LOGIC
7. **Generated Layer** (`views/`, `router.js`) - AUTO-CREATED code
8. **Testing Layer** (`testing/`) - Quality assurance and examples

### ⚡ **The Magic Principle**
**Change once, improve everywhere:**
- Modify truth → All related code updates
- Modify template → All components of that type update
- Modify system component → All pages using it update

### 🎯 **AI Decision Priority**
1. **Can this be solved in the truth file?** (Usually yes)
   - Data models, validation, permissions, auth settings
2. **Is this a structural change for all components?** → Modify template
3. **Is this app-specific reusable logic?** → Create extension
4. **Does this need testing?** → Use built-in testing framework
5. **Is this page-specific?** → Edit view or create hooks
6. **Is this one-off styling?** → Direct component edit

### 🔍 **Debugging and Development**
- **Enhanced error messages** with source context and suggestions
- **Debug endpoints** at `/api/_debug/*` for runtime inspection
- **Development validator** runs automatically and suggests improvements
- **Hot reload with error recovery** keeps the development server stable

## Examples

### Adding a Blog System with Authentication
```typescript
// 1. Add to app.truth.ts
settings: {
  auth: { enabled: true }
},
entities: {
  Post: {
    fields: {
      title: { type: 'string', required: true, minLength: 5 },
      content: { type: 'text', rich: true, required: true },
      published: { type: 'boolean', default: false },
      authorId: { type: 'relation', to: 'User', required: true }
    },
    permissions: {
      create: 'authenticated',
      update: 'user.id == entity.authorId || user.role == "admin"',
      delete: 'user.role == "admin"'
    }
  }
},
views: {
  BlogList: { type: 'list', entity: 'Post', route: '/blog' },
  BlogPost: { type: 'detail', entity: 'Post', route: '/blog/:id' },
  CreatePost: { type: 'form', entity: 'Post', route: '/blog/new' }
}

// 2. Touch truth file → Everything generated automatically!
// - Database with User and Post tables
// - Auth routes (/api/auth/login, /api/auth/register)
// - Protected API endpoints with permission checking
// - Validated forms with error messages
// - Complete UI with authentication flows
```

### Adding Rich Text Editor to ALL Forms
```javascript
// Edit templates/system/form.template.js
if (field.type === 'text' && field.rich) {
  return `<${RichTextEditor} 
    value=${formData.${field.name}} 
    onChange=${(value) => updateField('${field.name}', value)} 
  />`
}

// Touch truth file → All forms get rich text editors!
```

### Adding Custom Validation Logic
```javascript
// Create extensions/validation.js
export function validateBusinessRules(entityType, data) {
  if (entityType === 'Post' && data.published && !data.content) {
    return { error: 'Published posts must have content' }
  }
  return { valid: true }
}

// Use in any view's hooks file
```

## 🚨 Important Notes

### ⚠️ **Don't Edit These Files**
- `router.js` - Generated from truth file
- `runtime/generated/*` - Generated models and API
- Any file with "Generated" comment header (unless specifically customizing)

### ✅ **Safe to Edit**
- `app.truth.ts` - The source of truth
- `templates/*.template.js` - Skeleton structures  
- `components/app/*` - Your custom components
- `extensions/*` - Your business logic
- `layouts/app/*` - Your custom layouts
- `static/*` - Your assets

### 🔄 **Generated but Customizable**
- `views/*` - Edit directly or use `.hooks.js` files
- `components/app/*` - Custom components referenced by truth file

## Getting Started Checklist

1. **📖 Read this guide** - Understand the architecture
2. **🎯 Check `app.truth.ts`** - See what's already defined
3. **🔐 Enable authentication** - Set `settings.auth.enabled = true` if needed
4. **📁 Read directory-specific guides** - Deep dive into relevant areas
5. **✨ Make changes** - Start with truth file when possible
6. **🔄 Regenerate** - Touch truth file to see changes
7. **🧪 Test your changes** - Use `deno task test` for comprehensive testing
8. **🐛 Debug issues** - Check `/api/_debug` endpoints for insights

## Built-in Development Tools

- **`deno task test`** - Run comprehensive test suite
- **`GET /api/_debug`** - Runtime inspection and performance analysis
- **`GET /api/_debug/validate`** - Validation report with improvement suggestions
- **Enhanced error messages** - Rich context and actionable suggestions
- **Hot reload with recovery** - Graceful error handling during development

Remember: **The system is designed to do the heavy lifting for you. Describe what you want in the truth file, and let the magic happen!** ✨

### 🚀 **Production Ready Features**
- **Comprehensive validation** - Automatic input validation and sanitization
- **Security by default** - Built-in authentication and permission system
- **Performance optimized** - Efficient code generation and caching
- **Testing framework** - Complete test coverage with examples
- **Error recovery** - Graceful handling of edge cases and failures