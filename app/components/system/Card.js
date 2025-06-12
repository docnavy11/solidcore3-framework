// System Card Component
// Container component with consistent styling


export default function Card({ 
  children,
  title,
  className = '',
  padding = true
}) {
  // Access global hooks and utilities
  const { html } = window
  
  const baseClasses = 'solidcore-card bg-white rounded-lg border border-gray-200 shadow-sm'
  const paddingClasses = padding ? 'p-6' : ''

  return html`
    <div class="${baseClasses} ${paddingClasses} ${className}">
      ${title && html`
        <div class="card-header mb-4 pb-2 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
        </div>
      `}
      <div class="card-content">
        ${children}
      </div>
    </div>
  `
}