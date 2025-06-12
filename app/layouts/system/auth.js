// Auth Layout Component
// Layout for authentication pages (login, register, etc.)

export default function AuthLayout({ children }) {
  return html`
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            TaskManager
          </h1>
          <p class="text-sm text-gray-600">
            Manage your tasks efficiently
          </p>
        </div>
      </div>

      <!-- Main Content -->
      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          ${children}
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-8 text-center">
        <p class="text-xs text-gray-500">
          © 2024 TaskManager. Built with Solidcore3.
        </p>
      </div>
    </div>
  `
}