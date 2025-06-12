// Dashboard Layout Component
// Layout for dashboard and admin pages

export default function DashboardLayout({ children, route = '' }) {
  // Access global html helper
  const { html } = window
  
  console.log('DashboardLayout rendering with children:', children)
  
  return html`
    <div style="min-height: 100vh; background-color: #f9fafb;">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <!-- Logo/Brand -->
            <div class="flex items-center">
              <h1 class="text-xl font-semibold text-gray-900">
                TaskManager Dashboard
              </h1>
            </div>
            
            <!-- Quick Actions -->
            <div class="flex items-center space-x-4">
              <a 
                href="/tasks" 
                class="text-gray-600 hover:text-gray-900 text-sm"
              >
                ← Back to App
              </a>
              <div class="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-gray-600">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div class="flex">
        <!-- Sidebar -->
        <aside class="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <nav class="mt-8">
            <div class="px-4 space-y-2">
              <a 
                href="/dashboard" 
                class="flex items-center px-4 py-2 text-sm font-medium rounded-md ${route === '/dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}"
              >
                <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Overview
              </a>
              
              <a 
                href="/dashboard/database" 
                class="flex items-center px-4 py-2 text-sm font-medium rounded-md ${route === '/dashboard/database' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}"
              >
                <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
                </svg>
                Database
              </a>
              
              <a 
                href="/dashboard/api" 
                class="flex items-center px-4 py-2 text-sm font-medium rounded-md ${route === '/dashboard/api' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}"
              >
                <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
                </svg>
                API
              </a>
              
              <a 
                href="/dashboard/config" 
                class="flex items-center px-4 py-2 text-sm font-medium rounded-md ${route === '/dashboard/config' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}"
              >
                <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Settings
              </a>
            </div>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 p-8">
          ${children}
        </main>
      </div>
    </div>
  `
}