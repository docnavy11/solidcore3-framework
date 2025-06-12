# 🤖 AI Guide: Components Directory

This directory contains **reusable UI components** with built-in authentication, validation, and error handling - the secure building blocks of your application.

## Directory Structure

```
components/
├── AI-COMPONENTS-GUIDE.md  # This guide
├── system/                 # Framework-level components (shared across apps)
│   ├── Button.js          # Reusable button component
│   ├── Card.js            # Card container component  
│   ├── Form.js            # Form wrapper component
│   ├── Table.js           # Data table component
│   └── index.js           # Exports all system components
└── app/                   # App-specific components
    ├── Dashboard.js       # Custom dashboard component
    └── [your components]  # Your custom components here
```

## When to Create Components

### 🔧 **System Components** (`components/system/`)
**Use for:** Framework-level, reusable across ANY app

- **Form controls** - Inputs, selects, buttons, validation
- **Layout components** - Cards, modals, navigation, grids
- **Data display** - Tables, lists, charts, badges
- **Interactive elements** - Dropdowns, tabs, accordions

**Examples:**
```javascript
// Button.js - Used everywhere
export default function Button({ variant, loading, children, ...props }) {
  return html`
    <button class="btn btn-${variant}" disabled=${loading} ...${props}>
      ${loading ? 'Loading...' : children}
    </button>
  `
}
```

### 🎨 **App Components** (`components/app/`)
**Use for:** App-specific, business logic components

- **Domain-specific widgets** - UserProfile, TaskCard, OrderSummary
- **Custom integrations** - PaymentForm, MapWidget, ChatBox
- **Composite components** - ProductGallery, ReportDashboard
- **One-off custom UI** - Special layouts, unique interactions

**Examples:**
```javascript
// Dashboard.js - Specific to this app
export default function Dashboard() {
  const { html } = window
  const { data: tasks } = useTasks()
  
  return html`
    <div class="dashboard">
      <div class="kpi-grid">
        <div class="kpi-card">
          <h3>Total Tasks</h3>
          <span class="kpi-value">${tasks.length}</span>
        </div>
        <!-- More KPIs -->
      </div>
    </div>
  `
}
```

## Component Patterns

### 🏗️ **Basic Component Structure**
```javascript
// Good component template
export default function ComponentName({ prop1, prop2, children, ...props }) {
  const { html, useState, useEffect } = window
  
  // Component logic here
  const [state, setState] = useState(initialValue)
  
  // Event handlers
  const handleClick = () => {
    // Handle event
  }
  
  return html`
    <div class="component-name" ...${props}>
      ${children}
    </div>
  `
}
```

### 🎛️ **Props Patterns**
```javascript
// ✅ Good: Flexible props with defaults
function Button({ variant = 'primary', size = 'medium', loading = false, children, ...props }) {
  return html`
    <button 
      class="btn btn-${variant} btn-${size}" 
      disabled=${loading}
      ...${props}
    >
      ${loading ? 'Loading...' : children}
    </button>
  `
}

// ✅ Good: Boolean props
<Button loading=${true} disabled=${false}>Save</Button>

// ✅ Good: Spread remaining props
<Button onClick=${handleClick} data-testid="save-btn">Save</Button>
```

### 🪝 **Using Enhanced Hooks with Auth/Validation**
```javascript
export default function DataComponent({ entityId, permission = 'read' }) {
  const { html, useState, useEffect } = window
  
  // Framework hooks with built-in functionality
  const { user } = useAuth()
  const { canAccess } = usePermissions()
  const { handleError } = useErrorHandler()
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    // Check permission before fetching
    if (!canAccess(permission)) {
      setError(new Error('Access denied'))
      setLoading(false)
      return
    }
    
    // Fetch data with error handling
    loadData(entityId, { userId: user.id })
      .then(setData)
      .catch(error => {
        setError(error)
        handleError(error) // Framework error handling
      })
      .finally(() => setLoading(false))
  }, [entityId, user.id])
  
  if (loading) return html`<div class="loading">Loading...</div>`
  if (error) return html`<div class="error">Error: ${error.message}</div>`
  
  return html`
    <div class="data-display">
      ${data ? html`
        <span>${data.name}</span>
        <div class="data-meta">Loaded for ${user.name}</div>
      ` : 'No data'}
    </div>
  `
}
```

## Integration with Generated Code

### 📦 **Using in Templates**
System components are automatically imported in templates:

```javascript
// In templates/system/form.template.js
import { Card, Button, Form, Input, Select } from '/app/components/system/index.js'

// Use in template
<${Card}>
  <${Form}>
    <${Input} label="Title" value=${formData.title} />
    <${Button} type="submit">Save</${Button}>
  </${Form}>
</${Card}>
```

### 🎯 **Custom Components in Truth File**
Reference app components in truth file:

```typescript
// In app.truth.ts
views: {
  Dashboard: {
    type: 'custom',
    component: 'Dashboard',  // References components/app/Dashboard.js
    route: '/dashboard'
  }
}
```

## Styling Approach

### 🎨 **CSS Classes**
Use semantic class names that work with your CSS system:

```javascript
// ✅ Good: Semantic classes
<div class="card card-elevated">
  <div class="card-header">
    <h3 class="card-title">${title}</h3>
  </div>
  <div class="card-content">
    ${children}
  </div>
</div>

// ❌ Avoid: Inline styles for reusable components
<div style="padding: 1rem; border: 1px solid #ccc;">
```

### 🎛️ **Dynamic Classes**
```javascript
function Button({ variant, size, loading, className = '', ...props }) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading && 'btn-loading',
    className
  ].filter(Boolean).join(' ')
  
  return html`<button class=${classes} ...${props}>`
}
```

## Best Practices

### ✅ **Do**

```javascript
// ✅ Use destructuring with defaults
function Card({ title, elevated = false, children, ...props }) {

// ✅ Handle loading and error states
if (loading) return html`<div class="loading">Loading...</div>`
if (error) return html`<div class="error">Error: ${error.message}</div>`

// ✅ Use semantic HTML
<button type="button" role="button" aria-label="Close modal">

// ✅ Forward unused props
<div class="wrapper" ...${props}>${children}</div>

// ✅ Use consistent naming
function UserCard() // PascalCase for components
const handleClick = () => {} // camelCase for functions
```

### ❌ **Avoid**

```javascript
// ❌ Don't hardcode values that should be props
<div style="width: 300px"> // Should be configurable

// ❌ Don't mix concerns
function UserCard() {
  // ❌ Don't put API calls in UI components
  const response = await fetch('/api/users') 
  
  // ✅ Instead: Accept data as props or use hooks
  const { data, loading } = useUsers()
}

// ❌ Don't create overly complex components
function MegaComponent() {
  // 200 lines of complex logic
  // ✅ Instead: Break into smaller components
}
```

## Component Types

### 🧱 **Atomic Components**
Single-purpose, highly reusable:
```javascript
// Button, Input, Icon, Badge, Spinner
function Badge({ variant, children }) {
  return html`<span class="badge badge-${variant}">${children}</span>`
}
```

### 🏗️ **Composite Components**  
Combinations of atomic components:
```javascript
// Card, Modal, Table, Form
function Modal({ title, children, onClose }) {
  return html`
    <div class="modal-overlay" onClick=${onClose}>
      <div class="modal-content">
        <div class="modal-header">
          <h2>${title}</h2>
          <${Button} variant="ghost" onClick=${onClose}>×</Button>
        </div>
        <div class="modal-body">${children}</div>
      </div>
    </div>
  `
}
```

### 📊 **Smart Components**
Connected to data and business logic:
```javascript
// UserProfile, TaskSummary, OrderHistory
function TaskSummary({ userId }) {
  const { data: tasks } = useTasks({ assignedTo: userId })
  
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    pending: tasks.filter(t => t.status === 'todo').length
  }
  
  return html`
    <div class="task-summary">
      <div class="stat">
        <span class="stat-value">${stats.total}</span>
        <span class="stat-label">Total</span>
      </div>
      <!-- More stats -->
    </div>
  `
}
```

## Testing Components

### 🧪 **Simple Testing**
```javascript
// Test by importing and using
import Button from './Button.js'

// Visual testing in browser
function TestPage() {
  return html`
    <div>
      <${Button} variant="primary">Primary</Button>
      <${Button} variant="secondary">Secondary</Button>
      <${Button} loading=${true}>Loading</Button>
    </div>
  `
}
```

## Integration Examples

### 🔌 **Adding a New System Component**

1. **Create the component:**
```javascript
// components/system/Alert.js
export default function Alert({ type = 'info', children, onClose }) {
  return html`
    <div class="alert alert-${type}">
      <span class="alert-content">${children}</span>
      ${onClose && html`<button onClick=${onClose}>×</button>`}
    </div>
  `
}
```

2. **Export from index:**
```javascript
// components/system/index.js
export { default as Alert } from './Alert.js'
export { default as Button } from './Button.js'
// ... other exports
```

3. **Use in templates:**
```javascript
// templates/system/form.template.js
import { Alert, Card, Button } from '/app/components/system/index.js'

// Use in template
${errors.submit && html`
  <${Alert} type="error" onClose=${() => setErrors({})}>
    ${errors.submit}
  </${Alert}>
`}
```

4. **Regenerate views:** All forms now have alerts!

### 🎨 **Adding App-Specific Component**

1. **Create component:**
```javascript
// components/app/TaskCard.js
export default function TaskCard({ task, onStatusChange }) {
  return html`
    <div class="task-card task-card-${task.priority}">
      <h3 class="task-title">${task.title}</h3>
      <p class="task-description">${task.description}</p>
      <${Button} 
        variant="ghost" 
        onClick=${() => onStatusChange(task.id, 'done')}
      >
        Mark Complete
      </Button>
    </div>
  `
}
```

2. **Use in custom views:**
```javascript
// views/TaskBoard.js (custom view)
import TaskCard from '../components/app/TaskCard.js'

export default function TaskBoard() {
  const { data: tasks } = useTasks()
  
  return html`
    <div class="task-board">
      ${tasks.map(task => html`
        <${TaskCard} 
          key=${task.id} 
          task=${task} 
          onStatusChange=${handleStatusChange} 
        />
      `)}
    </div>
  `
}
```

Remember: **Components are the LEGO blocks of your app. Make them small, focused, and reusable!** 🧱✨