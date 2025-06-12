# 🤖 AI Guide: Layouts Directory

This directory contains **page layout templates** that wrap your views and provide consistent structure across your application.

## Directory Structure

```
layouts/
├── AI-LAYOUTS-GUIDE.md    # This guide
├── system/                # Framework-level layouts (shared across apps)
│   ├── main.js           # Default layout for most pages
│   ├── dashboard.js      # Layout for dashboard pages
│   ├── auth.js           # Layout for login/signup pages
│   └── index.js          # Exports all system layouts
└── app/                  # App-specific layouts
    └── [your layouts]    # Your custom layouts here
```

## Layout Purpose

Layouts provide **consistent page structure** including:

- **Navigation** - Headers, sidebars, menus, breadcrumbs
- **Page chrome** - Titles, metadata, CSS/JS includes
- **Common elements** - Footers, notifications, modals
- **Responsive structure** - Grid systems, breakpoints
- **Theme support** - Dark/light modes, brand styling

## Layout Types

### 🏗️ **System Layouts** (`layouts/system/`)
**Use for:** Framework-level, reusable across ANY app

#### Main Layout (`main.js`)
**Purpose:** Default layout for most application pages

```javascript
// layouts/system/main.js
export default function MainLayout({ children, route }) {
  const { html } = window
  
  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TaskManager</title>
        <link rel="stylesheet" href="/app/static/styles.css">
      </head>
      <body>
        <div class="app-container">
          <!-- Navigation Header -->
          <header class="app-header">
            <nav class="main-nav">
              <div class="nav-brand">
                <a href="/">TaskManager</a>
              </div>
              <div class="nav-links">
                <a href="/tasks" class=${route?.startsWith('/tasks') ? 'active' : ''}>Tasks</a>
                <a href="/people" class=${route?.startsWith('/people') ? 'active' : ''}>People</a>
                <a href="/dashboard" class=${route?.startsWith('/dashboard') ? 'active' : ''}>Dashboard</a>
              </div>
            </nav>
          </header>
          
          <!-- Main Content Area -->
          <main class="app-main">
            <div class="content-container">
              ${children}
            </div>
          </main>
          
          <!-- Footer -->
          <footer class="app-footer">
            <p>&copy; 2024 TaskManager. Built with Solidcore3.</p>
          </footer>
        </div>
        
        <!-- Global Scripts -->
        <script type="module" src="/app/index.js"></script>
      </body>
    </html>
  `
}
```

#### Dashboard Layout (`dashboard.js`)
**Purpose:** Special layout for dashboard/analytics pages

```javascript
// layouts/system/dashboard.js
export default function DashboardLayout({ children, route }) {
  const { html } = window
  
  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Dashboard - TaskManager</title>
        <link rel="stylesheet" href="/app/static/styles.css">
        <link rel="stylesheet" href="/app/static/dashboard.css">
      </head>
      <body class="dashboard-body">
        <div class="dashboard-container">
          <!-- Dashboard Sidebar -->
          <aside class="dashboard-sidebar">
            <div class="sidebar-header">
              <h2>Dashboard</h2>
            </div>
            <nav class="sidebar-nav">
              <a href="/dashboard" class=${route === '/dashboard' ? 'active' : ''}>Overview</a>
              <a href="/dashboard/tasks">Task Analytics</a>
              <a href="/dashboard/people">Team Performance</a>
              <a href="/dashboard/reports">Reports</a>
            </nav>
          </aside>
          
          <!-- Dashboard Content -->
          <main class="dashboard-main">
            <div class="dashboard-header">
              <h1>Analytics Dashboard</h1>
              <div class="dashboard-actions">
                <button class="btn btn-secondary">Export</button>
                <button class="btn btn-primary">Refresh</button>
              </div>
            </div>
            <div class="dashboard-content">
              ${children}
            </div>
          </main>
        </div>
        
        <script type="module" src="/app/index.js"></script>
        <script src="/app/static/dashboard.js"></script>
      </body>
    </html>
  `
}
```

#### Auth Layout (`auth.js`)
**Purpose:** Clean layout for login/signup/password reset pages

```javascript
// layouts/system/auth.js
export default function AuthLayout({ children, route }) {
  const { html } = window
  
  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Login - TaskManager</title>
        <link rel="stylesheet" href="/app/static/styles.css">
        <link rel="stylesheet" href="/app/static/auth.css">
      </head>
      <body class="auth-body">
        <div class="auth-container">
          <div class="auth-card">
            <div class="auth-header">
              <img src="/app/static/logo.svg" alt="TaskManager" class="auth-logo">
              <h1>TaskManager</h1>
            </div>
            <div class="auth-content">
              ${children}
            </div>
            <div class="auth-footer">
              <p>© 2024 TaskManager. All rights reserved.</p>
            </div>
          </div>
        </div>
        
        <script type="module" src="/app/index.js"></script>
      </body>
    </html>
  `
}
```

### 🎨 **App Layouts** (`layouts/app/`)
**Use for:** App-specific layout variations

```javascript
// layouts/app/admin.js - Admin-specific layout
export default function AdminLayout({ children, route }) {
  const { html } = window
  
  return html`
    <div class="admin-layout">
      <header class="admin-header">
        <div class="admin-nav">
          <span class="admin-badge">Admin Panel</span>
          <nav class="admin-links">
            <a href="/admin/users">Users</a>
            <a href="/admin/settings">Settings</a>
            <a href="/admin/logs">Logs</a>
          </nav>
        </div>
      </header>
      
      <div class="admin-content">
        <aside class="admin-sidebar">
          <!-- Admin-specific sidebar -->
        </aside>
        <main class="admin-main">
          ${children}
        </main>
      </div>
    </div>
  `
}
```

## Using Layouts

### 🎯 **In Truth File**
Reference layouts in your view definitions:

```typescript
// app.truth.ts
views: {
  TaskList: {
    type: 'list',
    route: '/tasks',
    entity: 'Task',
    layout: 'main'  // Uses layouts/system/main.js
  },
  
  Dashboard: {
    type: 'custom',
    route: '/dashboard',
    layout: 'dashboard'  // Uses layouts/system/dashboard.js
  },
  
  AdminPanel: {
    type: 'custom', 
    route: '/admin',
    layout: 'admin'  // Uses layouts/app/admin.js
  }
}
```

### 🔧 **In Generated Router**
Layouts are automatically applied by the router generator:

```javascript
// app/router.js (generated)
import MainLayout from './layouts/system/main.js'
import DashboardLayout from './layouts/system/dashboard.js'

// Automatically wraps components with specified layout
<Route path="/tasks" component=${withLayout(TaskList, MainLayout)} />
<Route path="/dashboard" component=${withLayout(Dashboard, DashboardLayout)} />
```

## Layout Patterns

### 🧩 **Layout Composition**
```javascript
// layouts/system/main.js
export default function MainLayout({ children, route }) {
  return html`
    <div class="app">
      <${AppHeader} currentRoute=${route} />
      <${AppSidebar} currentRoute=${route} />
      <main class="content">
        ${children}
      </main>
      <${AppFooter} />
    </div>
  `
}
```

### 📱 **Responsive Layouts**
```javascript
export default function ResponsiveLayout({ children, route }) {
  const { html, useState, useEffect } = window
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return html`
    <div class="layout ${isMobile ? 'mobile' : 'desktop'}">
      ${isMobile ? html`
        <${MobileHeader} />
        <main class="mobile-content">${children}</main>
        <${MobileNavigation} />
      ` : html`
        <${DesktopHeader} />
        <div class="desktop-container">
          <${DesktopSidebar} />
          <main class="desktop-content">${children}</main>
        </div>
      `}
    </div>
  `
}
```

### 🎨 **Theme Support**
```javascript
export default function ThemedLayout({ children, route }) {
  const { html, useState } = window
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }
  
  return html`
    <div class="app theme-${theme}">
      <header class="app-header">
        <nav class="main-nav">
          <!-- Navigation items -->
          <button class="theme-toggle" onClick=${toggleTheme}>
            ${theme === 'light' ? '🌙' : '☀️'}
          </button>
        </nav>
      </header>
      <main class="app-content">
        ${children}
      </main>
    </div>
  `
}
```

## Layout Features

### 🧭 **Navigation Integration**
```javascript
function AppNavigation({ currentRoute }) {
  const { html } = window
  
  const navItems = [
    { path: '/tasks', label: 'Tasks', icon: '📋' },
    { path: '/people', label: 'People', icon: '👥' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' }
  ]
  
  return html`
    <nav class="app-nav">
      ${navItems.map(item => html`
        <a 
          href=${item.path}
          class="nav-item ${currentRoute?.startsWith(item.path) ? 'active' : ''}"
        >
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </a>
      `)}
    </nav>
  `
}
```

### 🔔 **Global Notifications**
```javascript
function LayoutWithNotifications({ children }) {
  const { html, useState } = window
  const [notifications, setNotifications] = useState([])
  
  // Global notification system
  window.showNotification = (message, type = 'info') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => removeNotification(id), 5000)
  }
  
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }
  
  return html`
    <div class="layout">
      <!-- Notification Container -->
      <div class="notifications">
        ${notifications.map(notif => html`
          <div key=${notif.id} class="notification notification-${notif.type}">
            ${notif.message}
            <button onClick=${() => removeNotification(notif.id)}>×</button>
          </div>
        `)}
      </div>
      
      <!-- Main Content -->
      ${children}
    </div>
  `
}
```

### 🍞 **Breadcrumbs**
```javascript
function BreadcrumbLayout({ children, route }) {
  const { html } = window
  
  const generateBreadcrumbs = (path) => {
    const segments = path.split('/').filter(Boolean)
    const breadcrumbs = []
    
    let currentPath = ''
    for (const segment of segments) {
      currentPath += `/${segment}`
      breadcrumbs.push({
        path: currentPath,
        label: segment.charAt(0).toUpperCase() + segment.slice(1)
      })
    }
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs(route)
  
  return html`
    <div class="layout">
      <header class="page-header">
        <nav class="breadcrumbs">
          <a href="/">Home</a>
          ${breadcrumbs.map((crumb, index) => html`
            <span class="breadcrumb-separator">></span>
            ${index === breadcrumbs.length - 1 ? html`
              <span class="breadcrumb-current">${crumb.label}</span>
            ` : html`
              <a href=${crumb.path}>${crumb.label}</a>
            `}
          `)}
        </nav>
      </header>
      <main class="page-content">
        ${children}
      </main>
    </div>
  `
}
```

## Best Practices

### ✅ **Do**

```javascript
// ✅ Accept route information for navigation state
function Layout({ children, route }) {

// ✅ Use semantic HTML structure
<header role="banner">
<nav role="navigation">
<main role="main">

// ✅ Include meta tags and accessibility
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<html lang="en">

// ✅ Handle loading and error states
if (!children) return html`<div class="loading">Loading...</div>`

// ✅ Make layouts configurable
function Layout({ children, route, config = {} }) {
  const showSidebar = config.showSidebar !== false
```

### ❌ **Avoid**

```javascript
// ❌ Don't hardcode content that should be dynamic
<title>My App</title> // Should use app name from config

// ❌ Don't include view-specific logic in layouts
if (route === '/tasks') {
  // Task-specific code
} // This belongs in the view

// ❌ Don't break responsive design
<div style="width: 1200px"> // Use responsive CSS instead
```

## Layout Integration

### 🔗 **Exporting Layouts**
```javascript
// layouts/system/index.js
export { default as MainLayout } from './main.js'
export { default as DashboardLayout } from './dashboard.js'
export { default as AuthLayout } from './auth.js'

// layouts/app/index.js  
export { default as AdminLayout } from './admin.js'
export { default as PublicLayout } from './public.js'
```

### 🎯 **Layout Registration**
Layouts are automatically registered by the router generator based on the truth file.

### 🎨 **Styling Layouts**
```css
/* app/static/styles.css */
.app-container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.app-header {
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
}

.app-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  background: var(--footer-bg);
  padding: 1rem;
  text-align: center;
}

/* Responsive layout */
@media (max-width: 768px) {
  .app-main {
    padding: 1rem;
  }
}
```

## Common Layout Patterns

### 📊 **Dashboard Layout**
- Full-width header with actions
- Sidebar navigation for different dashboard sections
- Grid-based content area for widgets/charts

### 📋 **CRUD Layout** 
- Standard header with breadcrumbs
- Content area optimized for forms and tables
- Action buttons in consistent locations

### 🔒 **Auth Layout**
- Centered card design
- Minimal navigation
- Brand-focused presentation

### 📱 **Mobile Layout**
- Collapsible navigation
- Touch-friendly controls
- Optimized content flow

Remember: **Layouts provide the stage for your content to shine. Keep them consistent, accessible, and focused on user experience!** 🎭✨