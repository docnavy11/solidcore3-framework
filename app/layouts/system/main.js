// Main Layout Component
// Primary layout for the application

export default function MainLayout({ children, route = '' }) {
  // Access global hooks and utilities
  const { html, useState, useEffect, useCallback } = window
  
  return html`
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <!-- Logo/Brand -->
            <div class="flex items-center">
              <h1 class="text-xl font-semibold text-gray-900">
                TaskManager
              </h1>
            </div>
            
            <!-- Navigation -->
            <nav class="hidden md:flex space-x-8">
              <a 
                href="/tasks" 
                class="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium ${route.startsWith('/tasks') ? 'text-blue-600 border-b-2 border-blue-600' : ''}"
              >
                Tasks
              </a>
              <a 
                href="/dashboard" 
                class="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium ${route === '/dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : ''}"
              >
                Dashboard
              </a>
            </nav>
            
            <!-- User Menu -->
            <div class="flex items-center space-x-4">
              <button class="text-gray-600 hover:text-gray-900">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12"/>
                </svg>
              </button>
              <div class="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-gray-600">U</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Mobile Navigation -->
      <nav class="md:hidden bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex space-x-8 py-4">
            <a 
              href="/tasks" 
              class="text-gray-600 hover:text-gray-900 text-sm font-medium ${route.startsWith('/tasks') ? 'text-blue-600' : ''}"
            >
              Tasks
            </a>
            <a 
              href="/dashboard" 
              class="text-gray-600 hover:text-gray-900 text-sm font-medium ${route === '/dashboard' ? 'text-blue-600' : ''}"
            >
              Dashboard
            </a>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        ${children}
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t border-gray-200 mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="text-center text-sm text-gray-500">
            © 2024 TaskManager. Built with Solidcore3.
          </div>
        </div>
      </footer>
    </div>
  `
}