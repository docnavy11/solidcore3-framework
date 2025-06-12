// Generated TaskDetail Component
// Edit this file directly - it won't be regenerated unless deleted
//
// 🤖 AI: For structural changes (field display, actions, layout patterns),
//     consider modifying the template skeleton first: app/templates/system/detail.template.js
//     Then touch app/app.truth.ts to regenerate all detail views with your improvements!
import { useTasks, useTaskMutations } from '/runtime/generated/models/task.js'
import { Card, Button } from '/app/components/system/index.js'

// Optional hooks for customization
let hooks = {}
try {
  const module = await import('./TaskDetail.hooks.js')
  hooks = module.default || {}
} catch {
  // No hooks file - that's fine
}

export default function TaskDetail() {
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
    console.warn('TaskDetail: Hook context not ready during navigation:', error.message)
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
  
  const { data, loading, error } = useTasks()
  const { deleteTask } = useTaskMutations()
  
  if (loading) return html`<div class="loading">Loading...</div>`
  if (error) return html`<div class="text-red">Error: ${error.message}</div>`
  
  const item = data.find(d => d.id === id)
  if (!item) return html`<div class="text-center">Task not found</div>`

  // Apply hooks processing
  const processedItem = hooks.beforeRender?.(item) || item

  const handleDelete = async () => {
    if (confirm(`Delete this task?`)) {
      try {
        await deleteTask(item.id)
        window.location.href = '/tasks'
      } catch (err) {
        alert('Failed to delete: ' + err.message)
      }
    }
  }

  return html`
    <div class="task-detail">
      ${hooks.beforeContent?.() || ''}
      
      <${Card}>
        <div class="flex justify-between items-center mb-4">
          <div>
            <h1>
              ${processedItem.title || processedItem.name || 'Task Details'}
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
            <${Button} onClick=${() => window.location.href = `/tasks/${item.id}/edit`}>
              Edit
            </${Button}>
            <${Button} variant="danger" onClick=${handleDelete}>
              Delete
            </${Button}>
          </div>
        </div>

        ${hooks.headerContent?.() || ''}

        <div class="detail-grid">
          <div class="field-group">
            <label class="form-label">
              CreatedAt
            </label>
            <div>
              ${formatFieldValue(processedItem.createdAt, 'date')}
            </div>
          </div>
          <div class="field-group">
            <label class="form-label">
              UpdatedAt
            </label>
            <div>
              ${formatFieldValue(processedItem.updatedAt, 'date')}
            </div>
          </div>
          <div class="field-group">
            <label class="form-label">
              Title
            </label>
            <div>
              ${formatFieldValue(processedItem.title, 'string')}
            </div>
          </div>
          <div class="field-group">
            <label class="form-label">
              Description
            </label>
            <div>
              ${formatFieldValue(processedItem.description, 'string')}
            </div>
          </div>
          <div class="field-group">
            <label class="form-label">
              Status
            </label>
            <div>
              ${formatFieldValue(processedItem.status, 'enum')}
            </div>
          </div>
          <div class="field-group">
            <label class="form-label">
              Priority
            </label>
            <div>
              ${formatFieldValue(processedItem.priority, 'enum')}
            </div>
          </div>
          <div class="field-group">
            <label class="form-label">
              DueDate
            </label>
            <div>
              ${formatFieldValue(processedItem.dueDate, 'date')}
            </div>
          </div>
          <div class="field-group">
            <label class="form-label">
              AssignedTo
            </label>
            <div>
              ${formatFieldValue(processedItem.assignedTo, 'relation')}
            </div>
          </div>
          <div class="field-group">
            <label class="form-label">
              CreatedBy
            </label>
            <div>
              ${formatFieldValue(processedItem.createdBy, 'relation')}
            </div>
          </div>
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