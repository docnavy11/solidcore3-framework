// System Form Component
// Form wrapper with validation and submission handling


export default function Form({ 
  children,
  onSubmit,
  className = '',
  loading = false
}) {
  // Access global hooks and utilities
  const { html } = window
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSubmit && !loading) {
      onSubmit(e)
    }
  }

  return html`
    <form 
      class="solidcore-form space-y-4 ${className}"
      onSubmit=${handleSubmit}
    >
      ${children}
    </form>
  `
}

// Input Component
export function Input({ 
  label,
  type = 'text',
  value = '',
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  className = ''
}) {
  // Access global hooks and utilities
  const { html } = window
  
  const id = `input-${Math.random().toString(36).substr(2, 9)}`

  return html`
    <div class="solidcore-input-group ${className}">
      ${label && html`
        <label 
          for=${id}
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          ${label}
          ${required && html`<span class="text-red-500">*</span>`}
        </label>
      `}
      <input
        id=${id}
        type=${type}
        value=${value}
        onInput=${(e) => onChange?.(e.target.value)}
        placeholder=${placeholder}
        required=${required}
        disabled=${disabled}
        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${error ? 'border-red-300' : ''}"
      />
      ${error && html`
        <p class="mt-1 text-sm text-red-600">${error}</p>
      `}
    </div>
  `
}

// Select Component
export function Select({ 
  label,
  value = '',
  onChange,
  options = [],
  required = false,
  disabled = false,
  error,
  className = ''
}) {
  // Access global hooks and utilities
  const { html } = window
  
  const id = `select-${Math.random().toString(36).substr(2, 9)}`

  return html`
    <div class="solidcore-select-group ${className}">
      ${label && html`
        <label 
          for=${id}
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          ${label}
          ${required && html`<span class="text-red-500">*</span>`}
        </label>
      `}
      <select
        id=${id}
        value=${value}
        onChange=${(e) => onChange?.(e.target.value)}
        required=${required}
        disabled=${disabled}
        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${error ? 'border-red-300' : ''}"
      >
        <option value="">Choose...</option>
        ${options.map(option => html`
          <option value=${option.value}>
            ${option.label}
          </option>
        `)}
      </select>
      ${error && html`
        <p class="mt-1 text-sm text-red-600">${error}</p>
      `}
    </div>
  `
}