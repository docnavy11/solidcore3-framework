// Generated __VIEW_NAME__ Component
// Edit this file directly - it won't be regenerated unless deleted
//
// 🤖 AI: For structural changes (layout, validation patterns, UI components),
//     consider modifying the template skeleton first: app/templates/system/form.template.js
//     Then touch app/app.truth.ts to regenerate all forms with your improvements!
import { use__ENTITY__s, use__ENTITY__Mutations } from '/runtime/generated/models/__ENTITY_LOWER__.js'
import { Card, Button, Form, Input, Select, ReferenceSelect } from '/app/components/system/index.js'

// Optional hooks for customization
let hooks = {}
try {
  const module = await import('./__VIEW_NAME__.hooks.js')
  hooks = module.default || {}
} catch {
  // No hooks file - that's fine
}

export default function __VIEW_NAME__() {
  const { html, useState, useEffect } = window
  
  // Hook safety check for navigation transitions
  try {
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
          <p style="color: #6b7280; margin-top: 1rem;">Loading form...</p>
        </div>
      </div>
    `
  }
  
__EDIT_MODE_SETUP__
  
  const { __MUTATION_FUNCTION__ } = use__ENTITY__Mutations()
  
  // Form state
  const [formData, setFormData] = useState({
__INITIAL_FORM_STATE__
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

__EDIT_MODE_EFFECT__

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
__VALIDATION_RULES__
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    // Apply hooks processing
    const processedData = hooks.beforeSubmit?.(formData) || formData
    
    setLoading(true)
    try {
__SUBMIT_LOGIC__
      
      hooks.afterSubmit?.() || (window.location.href = '/__ENTITY_LOWER__s')
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setLoading(false)
    }
  }

  return html`
    <div class="__ENTITY_LOWER__-form">
      ${hooks.beforeContent?.() || ''}
      
      <${Card}>
        <div class="mb-4">
          <h1>__FORM_TITLE__</h1>
        </div>

        ${hooks.headerContent?.() || ''}

        ${errors.submit && html`
          <div class="text-red mb-4">
            ${errors.submit}
          </div>
        `}

        <${Form} onSubmit=${handleSubmit}>
          <div class="form-grid">
__FIELD_COMPONENTS__
          </div>

          ${hooks.formContent?.() || ''}

          <div class="flex gap-2 mt-4">
            <${Button} 
              type="button" 
              variant="secondary" 
              onClick=${() => window.history.back()}
            >
              Cancel
            </${Button}>
            <${Button} 
              type="submit" 
              loading=${loading}
            >
              __SUBMIT_BUTTON_TEXT__
            </${Button}>
          </div>
        </${Form}>

        ${hooks.footerContent?.() || ''}
      </${Card}>
      
      ${hooks.afterContent?.() || ''}
    </div>
  `
}