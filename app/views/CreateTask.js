// Generated CreateTask Component
// Edit this file directly - it won't be regenerated unless deleted
//
// 🤖 AI: For structural changes (layout, validation patterns, UI components),
//     consider modifying the template skeleton first: app/templates/system/form.template.js
//     Then touch app/app.truth.ts to regenerate all forms with your improvements!
import { useTasks, useTaskMutations } from '/runtime/generated/models/task.js'
import { Card, Button, Form, Input, Select, ReferenceSelect } from '/app/components/system/index.js'

// Optional hooks for customization
let hooks = {}
try {
  const module = await import('./CreateTask.hooks.js')
  hooks = module.default || {}
} catch {
  // No hooks file - that's fine
}

export default function CreateTask() {
  const { html, useState, useEffect } = window
  
  // Hook safety check for navigation transitions
  try {
    const [testState] = useState(true)
    if (testState === undefined) {
      throw new Error('Hook context not ready')
    }
  } catch (error) {
    console.warn('CreateTask: Hook context not ready during navigation:', error.message)
    return html`
      <div style="min-height: 50vh; display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center;">
          <div class="spinner"></div>
          <p style="color: #6b7280; margin-top: 1rem;">Loading form...</p>
        </div>
      </div>
    `
  }
  

  
  const { createTask } = useTaskMutations()
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
    createdBy: ''
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
    
    if (!formData.title) {
      newErrors.title = 'Title is required'
    }
    if (!formData.status) {
      newErrors.status = 'Status is required'
    }
    if (!formData.createdBy) {
      newErrors.createdBy = 'CreatedBy is required'
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
      await createTask(processedData)
      
      hooks.afterSubmit?.() || (window.location.href = '/tasks')
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setLoading(false)
    }
  }

  return html`
    <div class="task-form">
      ${hooks.beforeContent?.() || ''}
      
      <${Card}>
        <div class="mb-4">
          <h1>Create Task</h1>
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
              label="Title"
              type="text"
              value=${formData.title}
              onChange=${(value) => updateField('title', value)}
              required=${true}
              error=${errors.title}
            />
            <${Input}
              label="Description"
              type="text"
              value=${formData.description}
              onChange=${(value) => updateField('description', value)}
              required=${false}
              error=${errors.description}
            />
            <${Select}
              label="Status"
              value=${formData.status}
              onChange=${(value) => updateField('status', value)}
              options=${[{"value":"todo","label":"Todo"},{"value":"in-progress","label":"In-progress"},{"value":"done","label":"Done"},{"value":"archived","label":"Archived"}]}
              required=${true}
              error=${errors.status}
            />
            <${Select}
              label="Priority"
              value=${formData.priority}
              onChange=${(value) => updateField('priority', value)}
              options=${[{"value":"low","label":"Low"},{"value":"medium","label":"Medium"},{"value":"high","label":"High"}]}
              required=${false}
              error=${errors.priority}
            />
            <${Input}
              label="DueDate"
              type="date"
              value=${formData.dueDate}
              onChange=${(value) => updateField('dueDate', value)}
              required=${false}
              error=${errors.dueDate}
            />
            <${Input}
              label="AssignedTo"
              type="text"
              value=${formData.assignedTo}
              onChange=${(value) => updateField('assignedTo', value)}
              required=${false}
              error=${errors.assignedTo}
            />
            <${Input}
              label="CreatedBy"
              type="text"
              value=${formData.createdBy}
              onChange=${(value) => updateField('createdBy', value)}
              required=${true}
              error=${errors.createdBy}
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
              Create Task
            </${Button}>
          </div>
        </${Form}>

        ${hooks.footerContent?.() || ''}
      </${Card}>
      
      ${hooks.afterContent?.() || ''}
    </div>
  `
}