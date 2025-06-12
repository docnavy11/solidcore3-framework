// System FilterBar Component
// Filtering interface for lists and tables


import { Select } from './Form.js'

export default function FilterBar({ 
  filters = [],
  values = {},
  onChange,
  onClear,
  className = ''
}) {
  // Access global hooks and utilities
  const { html } = window
  
  if (filters.length === 0) return null

  const handleFilterChange = (field, value) => {
    const newValues = { ...values, [field]: value }
    if (value === '') {
      delete newValues[field]
    }
    onChange?.(newValues)
  }

  const hasActiveFilters = Object.keys(values).length > 0

  return html`
    <div class="solidcore-filter-bar bg-gray-50 p-4 rounded-lg border ${className}">
      <div class="flex flex-wrap items-center gap-4">
        <span class="text-sm font-medium text-gray-700">Filters:</span>
        
        ${filters.map(filter => {
          const filterConfig = typeof filter === 'string' 
            ? { field: filter, label: filter, options: [] }
            : filter

          return html`
            <div class="min-w-48">
              <${Select}
                label=${filterConfig.label}
                value=${values[filterConfig.field] || ''}
                onChange=${(value) => handleFilterChange(filterConfig.field, value)}
                options=${filterConfig.options.map(opt => ({
                  value: opt,
                  label: opt.charAt(0).toUpperCase() + opt.slice(1)
                }))}
              />
            </div>
          `
        })}

        ${hasActiveFilters && html`
          <button
            type="button"
            onClick=${onClear}
            class="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear all
          </button>
        `}
      </div>

      ${hasActiveFilters && html`
        <div class="mt-3 flex flex-wrap gap-2">
          ${Object.entries(values).map(([field, value]) => html`
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              ${field}: ${value}
              <button
                type="button"
                onClick=${() => handleFilterChange(field, '')}
                class="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          `)}
        </div>
      `}
    </div>
  `
}