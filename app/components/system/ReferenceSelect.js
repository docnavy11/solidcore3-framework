// Reference Select Component
// Smart dropdown for selecting referenced entities

export default function ReferenceSelect({ 
  label,
  value,
  onChange,
  entityType,
  required = false,
  error = null,
  disabled = false,
  placeholder = 'Select...'
}) {
  // Access global hooks and utilities
  const { html, useState, useEffect } = window
  
  // Safety check for hooks availability
  if (!useState || !useEffect || !html) {
    return html`<div class="form-group">
      <label class="form-label">${label}</label>
      <div class="form-input bg-gray-50">Loading...</div>
    </div>`
  }
  
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  // Fetch options from the referenced entity
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true)
        setFetchError(null)
        
        const entityLower = entityType.toLowerCase()
        const response = await fetch(`/api/${entityLower}s`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${entityType} options`)
        }
        
        const data = await response.json()
        const items = data.success ? data.data?.items || data.data : data
        
        if (Array.isArray(items)) {
          const optionsList = items.map(item => ({
            value: item.id,
            label: getDisplayLabel(item, entityType)
          }))
          
          // Add empty option for optional fields
          if (!required) {
            optionsList.unshift({ value: '', label: 'None' })
          }
          
          setOptions(optionsList)
        } else {
          setOptions([])
        }
      } catch (err) {
        console.error(`Error fetching ${entityType} options:`, err)
        setFetchError(err.message)
        setOptions([])
      } finally {
        setLoading(false)
      }
    }

    fetchOptions()
  }, [entityType, required])

  // Generate a display label from the entity data
  const getDisplayLabel = (item, entityType) => {
    // Try common name fields
    if (item.name) return item.name
    if (item.title) return item.title
    if (item.label) return item.label
    
    // For Person entities, try to construct a nice label
    if (entityType === 'Person' && item.name && item.role) {
      return `${item.name} (${item.role})`
    }
    
    // Fallback to ID or first available field
    return item.id || 'Unknown'
  }

  if (loading) {
    return html`
      <div class="form-group">
        <label class="form-label">${label}</label>
        <div class="form-input bg-gray-50 flex items-center">
          <div class="spinner mr-2"></div>
          Loading ${entityType} options...
        </div>
      </div>
    `
  }

  if (fetchError) {
    return html`
      <div class="form-group">
        <label class="form-label">${label}</label>
        <div class="form-input bg-red-50 text-red-600">
          Error loading options: ${fetchError}
        </div>
      </div>
    `
  }

  return html`
    <div class="form-group">
      <label class="form-label">
        ${label}
        ${required && html`<span class="text-red-500">*</span>`}
      </label>
      <select
        class="form-select ${error ? 'border-red-500' : ''}"
        value=${value || ''}
        onChange=${(e) => onChange(e.target.value)}
        disabled=${disabled}
        required=${required}
      >
        ${!value && html`<option value="">${placeholder}</option>`}
        ${options.map(option => html`
          <option 
            key=${option.value} 
            value=${option.value}
            selected=${value === option.value}
          >
            ${option.label}
          </option>
        `)}
      </select>
      ${error && html`
        <div class="text-red-500 text-sm mt-1">${error}</div>
      `}
    </div>
  `
}