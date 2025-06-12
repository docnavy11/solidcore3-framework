// Generated __VIEW_NAME__ Component
// Edit this file directly - it won't be regenerated unless deleted
//
// 🤖 AI: For structural changes (field display, actions, layout patterns),
//     consider modifying the template skeleton first: app/templates/system/detail.template.js
//     Then touch app/app.truth.ts to regenerate all detail views with your improvements!
import { use__ENTITY__s, use__ENTITY__Mutations } from '/runtime/generated/models/__ENTITY_LOWER__.js'
import { Card, Button } from '/app/components/system/index.js'

// Optional hooks for customization
let hooks = {}
try {
  const module = await import('./__VIEW_NAME__.hooks.js')
  hooks = module.default || {}
} catch {
  // No hooks file - that's fine
}

export default function __VIEW_NAME__() {
  // Access global hooks and utilities
  const { html, useState } = window
  
  // Hook safety check for navigation transitions
  try {
    // Test if hook context is ready
    const [testState] = useState(true)
    if (testState === undefined) {
      throw new Error('Hook context not ready')
    }
  } catch (error) {
    console.warn('__VIEW_NAME__: Hook context not ready during navigation:', error.message)
    return html`
      <div style="min-height: 50vh; display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center;">
          <div class="spinner"></div>
          <p style="color: #6b7280; margin-top: 1rem;">Loading details...</p>
        </div>
      </div>
    `
  }
  
  // Extract ID from URL path
  const pathParts = window.location.pathname.split('/')
  const id = pathParts[pathParts.length - 1]
  
  const { data, loading, error } = use__ENTITY__s()
  const { delete__ENTITY__ } = use__ENTITY__Mutations()
  
  if (loading) return html`<div class="loading">Loading...</div>`
  if (error) return html`<div class="text-red">Error: ${error.message}</div>`
  
  const item = data.find(d => d.id === id)
  if (!item) return html`<div class="text-center">__ENTITY__ not found</div>`

  // Apply hooks processing
  const processedItem = hooks.beforeRender?.(item) || item

  const handleDelete = async () => {
    if (confirm(`Delete this __ENTITY_LOWER__?`)) {
      try {
        await delete__ENTITY__(item.id)
        window.location.href = '__LIST_ROUTE__'
      } catch (err) {
        alert('Failed to delete: ' + err.message)
      }
    }
  }

  return html`
    <div class="__ENTITY_LOWER__-detail">
      ${hooks.beforeContent?.() || ''}
      
      <${Card}>
        <div class="flex justify-between items-center mb-4">
          <div>
            <h1>
              ${processedItem.title || processedItem.name || '__ENTITY__ Details'}
            </h1>
            <p class="text-gray mt-1">ID: ${processedItem.id}</p>
          </div>
          
          <div class="flex gap-2">
            <${Button} 
              variant="secondary" 
              onClick=${() => window.history.back()}
            >
              Back
            </${Button}>
__ACTION_BUTTONS__
          </div>
        </div>

        ${hooks.headerContent?.() || ''}

        <div class="detail-grid">
__FIELD_DISPLAYS__
        </div>

        ${hooks.footerContent?.() || ''}
      </${Card}>
      
      ${hooks.afterContent?.() || ''}
    </div>
  `
}

function formatFieldValue(value, type) {
  if (value === null || value === undefined) return html`<span class="text-gray">-</span>`
  
  switch (type) {
    case 'date':
      return new Date(value).toLocaleDateString()
    case 'boolean':
      return value ? '✓ Yes' : '✗ No'
    case 'enum':
      return html`<span class="enum-badge">${value}</span>`
    default:
      return value.toString()
  }
}