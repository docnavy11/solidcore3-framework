// Generated CreatePerson Component
// Edit this file directly - it won't be regenerated unless deleted
//
// 🤖 AI: For structural changes (layout, validation patterns, UI components),
//     consider modifying the template skeleton first: app/templates/system/form.template.js
//     Then touch app/app.truth.ts to regenerate all forms with your improvements!
import { usePersons, usePersonMutations } from '/runtime/generated/models/person.js'
import { Card, Button, Form, Input, Select, ReferenceSelect } from '/app/components/system/index.js'

// Optional hooks for customization
let hooks = {}
try {
  const module = await import('./CreatePerson.hooks.js')
  hooks = module.default || {}
} catch {
  // No hooks file - that's fine
}

export default function CreatePerson() {
  const { html, useState, useEffect } = window
  
  // Hook safety check for navigation transitions
  try {
    const [testState] = useState(true)
    if (testState === undefined) {
      throw new Error('Hook context not ready')
    }
  } catch (error) {
    console.warn('CreatePerson: Hook context not ready during navigation:', error.message)
    return html`
      <div style="min-height: 50vh; display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center;">
          <div class="spinner"></div>
          <p style="color: #6b7280; margin-top: 1rem;">Loading form...</p>
        </div>
      </div>
    `
  }
  

  
  const { createPerson } = usePersonMutations()
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'developer',
    department: '',
    userId: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})



  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name) {
      newErrors.name = 'Name is required'
    }
    if (!formData.email) {
      newErrors.email = 'Email is required'
    }
    if (!formData.role) {
      newErrors.role = 'Role is required'
    }
    
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
      await createPerson(processedData)
      
      hooks.afterSubmit?.() || (window.location.href = '/persons')
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setLoading(false)
    }
  }

  return html`
    <div class="person-form">
      ${hooks.beforeContent?.() || ''}
      
      <${Card}>
        <div class="mb-4">
          <h1>Create Person</h1>
        </div>

        ${hooks.headerContent?.() || ''}

        ${errors.submit && html`
          <div class="text-red mb-4">
            ${errors.submit}
          </div>
        `}

        <${Form} onSubmit=${handleSubmit}>
          <div class="form-grid">
            <${Input}
              label="Name"
              type="text"
              value=${formData.name}
              onChange=${(value) => updateField('name', value)}
              required=${true}
              error=${errors.name}
            />
            <${Input}
              label="Email"
              type="text"
              value=${formData.email}
              onChange=${(value) => updateField('email', value)}
              required=${true}
              error=${errors.email}
            />
            <${Select}
              label="Role"
              value=${formData.role}
              onChange=${(value) => updateField('role', value)}
              options=${[{"value":"developer","label":"Developer"},{"value":"designer","label":"Designer"},{"value":"manager","label":"Manager"},{"value":"tester","label":"Tester"}]}
              required=${true}
              error=${errors.role}
            />
            <${Input}
              label="Department"
              type="text"
              value=${formData.department}
              onChange=${(value) => updateField('department', value)}
              required=${false}
              error=${errors.department}
            />
            <${Input}
              label="UserId"
              type="text"
              value=${formData.userId}
              onChange=${(value) => updateField('userId', value)}
              required=${false}
              error=${errors.userId}
            />
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
              Create Person
            </${Button}>
          </div>
        </${Form}>

        ${hooks.footerContent?.() || ''}
      </${Card}>
      
      ${hooks.afterContent?.() || ''}
    </div>
  `
}