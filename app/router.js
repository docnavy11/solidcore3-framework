// Generated Router Configuration
// This file is always regenerated from the truth file - do not edit

// Import Router components
import { Router, Route } from 'https://esm.sh/preact-router@4.1.2'

// Import layouts
import MainLayout from './layouts/system/main.js'

// Import views
import TaskBoard from './views/TaskBoard.js'
import CreatePerson from './views/CreatePerson.js'
import Dashboard from './views/Dashboard.js'
import CreateTask from './views/CreateTask.js'
import Register from './views/Register.js'
import TaskList2 from './views/TaskList2.js'
import PersonList from './views/PersonList.js'
import TaskList from './views/TaskList.js'
import Login from './views/Login.js'
import UserList from './views/UserList.js'
import EditPerson from './views/EditPerson.js'
import EditTask from './views/EditTask.js'
import UserProfile from './views/UserProfile.js'
import PersonDetail from './views/PersonDetail.js'
import TaskDetail from './views/TaskDetail.js'

export default function AppRouter() {
  // Access global utilities
  const { html } = window
  
  console.log('🛣️ AppRouter rendering, path:', window.location.pathname)
  
  return html`
    <${Router}>
      <!-- Root redirect to first list view -->
      <${Route} 
        path="/" 
        component=${RootRedirect} 
      />
      
      <${Route} 
        path="/tasks/board" 
        component=${(props) => {
          console.log('📍 Route matched:', '/tasks/board', 'component:', 'TaskBoard')
          return withLayout(TaskBoard, MainLayout)(props)
        }} 
      />
      <${Route} 
        path="/people/new" 
        component=${(props) => {
          console.log('📍 Route matched:', '/people/new', 'component:', 'CreatePerson')
          return withLayout(CreatePerson, MainLayout)(props)
        }} 
      />
      <${Route} 
        path="/dashboard" 
        component=${(props) => {
          console.log('📍 Route matched:', '/dashboard', 'component:', 'Dashboard')
          return withLayout(Dashboard, MainLayout)(props)
        }} 
      />
      <${Route} 
        path="/tasks/new" 
        component=${(props) => {
          console.log('📍 Route matched:', '/tasks/new', 'component:', 'CreateTask')
          return withLayout(CreateTask, MainLayout)(props)
        }} 
      />
      <${Route} 
        path="/register" 
        component=${(props) => {
          console.log('📍 Route matched:', '/register', 'component:', 'Register')
          return withLayout(Register, MainLayout)(props)
        }} 
      />
      <${Route} 
        path="/tasks2" 
        component=${(props) => {
          console.log('📍 Route matched:', '/tasks2', 'component:', 'TaskList2')
          return withLayout(TaskList2, MainLayout)(props)
        }} 
      />
      <${Route} 
        path="/people" 
        component=${(props) => {
          console.log('📍 Route matched:', '/people', 'component:', 'PersonList')
          return withLayout(PersonList, MainLayout)(props)
        }} 
      />
      <${Route} 
        path="/tasks" 
        component=${(props) => {
          console.log('📍 Route matched:', '/tasks', 'component:', 'TaskList')
          return withLayout(TaskList, MainLayout)(props)
        }} 
      />
      <${Route} 
        path="/login" 
        component=${(props) => {
          console.log('📍 Route matched:', '/login', 'component:', 'Login')
          return withLayout(Login, MainLayout)(props)
        }} 
      />
      <${Route} 
        path="/users" 
        component=${(props) => {
          console.log('📍 Route matched:', '/users', 'component:', 'UserList')
          return withLayout(UserList, MainLayout)(props)
        }} 
      />
      <${Route} 
        path="/people/:id/edit" 
        component=${(props) => {
          console.log('📍 Route matched:', '/people/:id/edit', 'component:', 'EditPerson')
          return withLayout(EditPerson, MainLayout)(props)
        }} 
      />
      <${Route} 
        path="/tasks/:id/edit" 
        component=${(props) => {
          console.log('📍 Route matched:', '/tasks/:id/edit', 'component:', 'EditTask')
          return withLayout(EditTask, MainLayout)(props)
        }} 
      />
      <${Route} 
        path="/profile/:id" 
        component=${(props) => {
          console.log('📍 Route matched:', '/profile/:id', 'component:', 'UserProfile')
          return withLayout(UserProfile, MainLayout)(props)
        }} 
      />
      <${Route} 
        path="/people/:id" 
        component=${(props) => {
          console.log('📍 Route matched:', '/people/:id', 'component:', 'PersonDetail')
          return withLayout(PersonDetail, MainLayout)(props)
        }} 
      />
      <${Route} 
        path="/tasks/:id" 
        component=${(props) => {
          console.log('📍 Route matched:', '/tasks/:id', 'component:', 'TaskDetail')
          return withLayout(TaskDetail, MainLayout)(props)
        }} 
      />
      
      <!-- Fallback route -->
      <${Route} 
        default 
        component=${NotFound} 
      />
    <//>
  `
}

// Root redirect component
function RootRedirect() {
  // Access global hooks and utilities
  const { html, useEffect } = window
  
  // Redirect to the first list view
  const firstListRoute = '/tasks'
  
  useEffect(() => {
    window.location.href = firstListRoute
  }, [])
  
  return html`
    <div style="display: flex; align-items: center; justify-content: center; min-height: 50vh; background: #f9fafb;">
      <div class="text-center">
        <div class="spinner"></div>
        <p style="color: #6b7280; margin-top: 1rem;">Redirecting to TaskManager...</p>
      </div>
    </div>
  `
}

// Layout wrapper HOC with error boundary
function withLayout(Component, Layout) {
  return function WrappedComponent(props) {
    // Access global utilities
    const { html } = window
    
    console.log('🔧 withLayout rendering:', Component.name, 'with layout:', Layout.name)
    
    // Wrap component rendering in error boundary for hook failures
    try {
      return html`
        <${Layout} route=${props.url || props.path || window.location.pathname}>
          <${Component} ....${props} />
        </${Layout}>
      `
    } catch (error) {
      // Only catch and handle hook-related errors
      if (error.message && error.message.includes('__H')) {
        console.warn('Hook context error caught, retrying...', error.message)
        // Brief delay then retry
        setTimeout(() => {
          window.location.reload()
        }, 100)
        
        return html`
          <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center;">
              <div class="spinner"></div>
              <p style="color: #6b7280;">Recovering from navigation error...</p>
            </div>
          </div>
        `
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
  
  return html`
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
  `
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
}