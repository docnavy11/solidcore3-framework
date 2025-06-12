// Base component exports for the new htm/Preact system

export { Table } from './Table.js'
export { EntityList } from './EntityList.js'
export { useEntity } from './useEntity.js'

// Simple components that can be implemented inline

export function Card({ children, className = '', ...props }) {
  return html`
    <div 
      class="card ${className}"
      style="
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        ${props.style || ''}
      "
      ...${props}
    >
      ${children}
    </div>
  `
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) {
  const variants = {
    primary: 'background: #3b82f6; color: white; border: 1px solid #3b82f6;',
    secondary: 'background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;',
    danger: 'background: #ef4444; color: white; border: 1px solid #ef4444;',
    success: 'background: #10b981; color: white; border: 1px solid #10b981;'
  }
  
  const sizes = {
    sm: 'padding: 0.5rem 1rem; font-size: 0.875rem;',
    md: 'padding: 0.75rem 1.5rem; font-size: 1rem;',
    lg: 'padding: 1rem 2rem; font-size: 1.125rem;'
  }
  
  return html`
    <button
      type=${type}
      disabled=${disabled || loading}
      onClick=${onClick}
      class="btn ${className}"
      style="
        ${variants[variant]}
        ${sizes[size]}
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: ${disabled || loading ? 'not-allowed' : 'pointer'};
        opacity: ${disabled || loading ? '0.6' : '1'};
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        ${props.style || ''}
      "
      ...${props}
    >
      ${loading && html`
        <span style="
          width: 1rem;
          height: 1rem;
          border: 2px solid currentColor;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></span>
      `}
      ${children}
    </button>
  `
}

export function FilterBar({ filters = [], value = {}, onChange }) {
  return html`
    <div style="
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    ">
      <span style="font-weight: 500; color: #374151;">Filters:</span>
      
      ${filters.map(filter => html`
        <div key=${filter.field} style="display: flex; flex-direction: column; gap: 0.25rem;">
          <label style="font-size: 0.875rem; color: #6b7280;">
            ${filter.label || filter.field}
          </label>
          <select
            value=${value[filter.field] || ''}
            onChange=${(e) => onChange({ ...value, [filter.field]: e.target.value || undefined })}
            style="
              padding: 0.5rem;
              border: 1px solid #d1d5db;
              border-radius: 0.375rem;
              background: white;
              min-width: 120px;
            "
          >
            <option value="">All</option>
            ${filter.options.map(option => html`
              <option key=${option} value=${option}>
                ${option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            `)}
          </select>
        </div>
      `)}
      
      ${Object.keys(value).some(key => value[key]) && html`
        <button
          onClick=${() => onChange({})}
          style="
            padding: 0.5rem 1rem;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.875rem;
          "
        >
          Clear All
        </button>
      `}
    </div>
  `
}

export function Form({ children, onSubmit, className = '', ...props }) {
  return html`
    <form
      onSubmit=${onSubmit}
      class="form ${className}"
      style="display: flex; flex-direction: column; gap: 1rem; ${props.style || ''}"
      ...${props}
    >
      ${children}
    </form>
  `
}

export function Input({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  required = false,
  error,
  help,
  className = '',
  ...props 
}) {
  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`
  
  return html`
    <div class="input-group ${className}" style="display: flex; flex-direction: column; gap: 0.5rem;">
      ${label && html`
        <label for=${inputId} style="font-weight: 500; color: #374151; font-size: 0.875rem;">
          ${label}
          ${required && html`<span style="color: #ef4444; margin-left: 0.25rem;">*</span>`}
        </label>
      `}
      
      ${type === 'textarea' ? html`
        <textarea
          id=${inputId}
          value=${value}
          onInput=${(e) => onChange?.(e.target.value)}
          placeholder=${placeholder}
          required=${required}
          style="
            padding: 0.75rem;
            border: 1px solid ${error ? '#ef4444' : '#d1d5db'};
            border-radius: 0.375rem;
            font-size: 1rem;
            resize: vertical;
            min-height: 100px;
            ${props.style || ''}
          "
          ...${props}
        />
      ` : html`
        <input
          id=${inputId}
          type=${type}
          value=${value}
          onInput=${(e) => onChange?.(e.target.value)}
          placeholder=${placeholder}
          required=${required}
          style="
            padding: 0.75rem;
            border: 1px solid ${error ? '#ef4444' : '#d1d5db'};
            border-radius: 0.375rem;
            font-size: 1rem;
            ${props.style || ''}
          "
          ...${props}
        />
      `}
      
      ${error && html`
        <span style="color: #ef4444; font-size: 0.875rem;">${error}</span>
      `}
      
      ${help && !error && html`
        <span style="color: #6b7280; font-size: 0.875rem;">${help}</span>
      `}
    </div>
  `
}

export function Select({ 
  label, 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select an option',
  required = false,
  error,
  className = '',
  ...props 
}) {
  const selectId = `select-${Math.random().toString(36).substr(2, 9)}`
  
  return html`
    <div class="select-group ${className}" style="display: flex; flex-direction: column; gap: 0.5rem;">
      ${label && html`
        <label for=${selectId} style="font-weight: 500; color: #374151; font-size: 0.875rem;">
          ${label}
          ${required && html`<span style="color: #ef4444; margin-left: 0.25rem;">*</span>`}
        </label>
      `}
      
      <select
        id=${selectId}
        value=${value}
        onChange=${(e) => onChange?.(e.target.value)}
        required=${required}
        style="
          padding: 0.75rem;
          border: 1px solid ${error ? '#ef4444' : '#d1d5db'};
          border-radius: 0.375rem;
          font-size: 1rem;
          background: white;
          ${props.style || ''}
        "
        ...${props}
      >
        <option value="" disabled>${placeholder}</option>
        ${options.map(option => {
          const optionValue = typeof option === 'string' ? option : option.value
          const optionLabel = typeof option === 'string' ? option : option.label
          
          return html`
            <option key=${optionValue} value=${optionValue}>
              ${optionLabel}
            </option>
          `
        })}
      </select>
      
      ${error && html`
        <span style="color: #ef4444; font-size: 0.875rem;">${error}</span>
      `}
    </div>
  `
}

// Add global CSS for animations
const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`
document.head.appendChild(style)