# Solidcore3 🚀

**AI-First Full-Stack Framework for Declarative Web Development**

Solidcore3 is a revolutionary web framework designed for the AI era. Instead of writing hundreds of files, you declare your entire application in a single truth file, and the framework generates everything else.

## ✨ Features

- **🎯 Single Source of Truth** - One file defines your entire app
- **🤖 AI-Friendly** - Declarative syntax perfect for AI development
- **⚡ Real-Time Hot Reload** - Instant feedback during development  
- **🎨 Constrained Component System** - 20 semantic components for consistent UIs
- **🔄 Flexible Template System** - Support for TypeScript, HTML, and static templates
- **🚀 Edge-Ready** - Built for modern deployment with Deno and SQLite
- **📊 Auto-Generated APIs** - REST endpoints created automatically
- **🔒 Built-in Permissions** - Declarative security model
- **📱 Responsive by Default** - Mobile-first design system

## 🚀 Quick Start

### Prerequisites

- [Deno](https://deno.land/) 2.x or later

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/solidcore3.git
cd solidcore3

# Start development server
deno task dev
```

The server will start at `http://localhost:8000` with hot reload enabled.

### Your First App

Everything is defined in `app/app.truth.ts`:

```typescript
export const App = {
  name: "TaskManager",
  
  entities: {
    Task: {
      fields: {
        title: { type: 'string', required: true },
        status: { type: 'enum', options: ['todo', 'done'] },
        priority: { type: 'enum', options: ['low', 'medium', 'high'] }
      },
      behaviors: {
        complete: {
          type: 'update',
          fields: { status: 'done' }
        }
      }
    }
  },
  
  views: {
    TaskList: {
      type: 'list',
      route: '/tasks',
      entity: 'Task'
    }
  }
}
```

That's it! The framework generates:
- ✅ Database schema and migrations
- ✅ REST API endpoints (`/api/task`)
- ✅ Task list UI at `/tasks`
- ✅ CRUD forms and detail views
- ✅ TypeScript types
- ✅ Validation logic

## 🛠️ Development

### Available Commands

```bash
# Development with hot reload
deno task dev

# Production server
deno task start

# Run tests
deno task test

# Format code
deno task fmt

# Lint code  
deno task lint

# Type checking
deno task type-check
```

### Project Structure

```
solidcore3/
├── app/                    # Your application
│   ├── app.truth.ts       # Single source of truth
│   ├── templates/         # Custom page templates
│   ├── static/           # Static HTML files
│   └── extensions/       # Custom extensions
├── core/                  # Framework core
│   ├── types/            # Type definitions
│   ├── validators/       # Truth validation
│   ├── generators/       # Code generators
│   └── ui/               # UI system
└── runtime/               # Runtime engine
    ├── server/           # HTTP server
    ├── database/         # Database layer
    └── engine/           # Main runtime
```

## 🎨 Template System

Flexible page templates with automatic fallbacks:

```typescript
// In truth file
views: {
  AboutPage: {
    type: 'custom',
    route: '/about',
    template: 'about'  // Resolves to best available template
  }
}
```

**Template Resolution Order:**
1. App-specific TypeScript (`/app/templates/about.ts`)
2. Core system template (`/core/ui/templates/about.ts`)
3. Static HTML (`/app/static/about.html`)
4. Built-in fallback template

## 🎯 Current Status

### ✅ Fully Implemented
- TypeScript type system with validation
- Truth file loader and validator
- HTTP server with Hono
- Database layer with SQLite
- REST API generation
- UI component generation
- Constrained component system (20 components)
- Template system with fallbacks
- Hot reload development
- Custom view types
- Extension system
- Event system and workflows

### 🚧 In Progress
- Documentation and examples
- Test coverage
- Production optimizations

### 📋 Roadmap
- CLI tool for project scaffolding
- Visual truth file editor
- Plugin marketplace
- Performance monitoring
- Edge deployment templates

## 📚 Documentation

- [Template System](README-TEMPLATES.md) - Custom page templates
- [AI Framework Overview](ai-framework-overview.md) - Complete framework design
- [Development Plan](development-plan.md) - Implementation roadmap
- [Technology Stack](technology-stack.md) - Technical details

## 🌐 Live Demo

Visit the included TaskManager example:
- **http://localhost:8000/** - Home dashboard
- **http://localhost:8000/tasks** - Task management
- **http://localhost:8000/about** - About page (custom template)
- **http://localhost:8000/help** - Help page (system template)
- **http://localhost:8000/contact** - Contact form (static HTML)

## 🔧 Technology Stack

- **Runtime**: Deno with TypeScript
- **Web Framework**: Hono (ultra-fast, edge-first)
- **Database**: SQLite with hot reload
- **UI**: Constrained Component System
- **Templates**: TypeScript + HTML with fallbacks

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the AI-first future of web development**