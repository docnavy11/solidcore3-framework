// Generated TaskList2 Component
// Edit this file directly - it won't be regenerated unless deleted
//
// 🤖 AI: For structural changes (table layout, filtering, actions, sorting),
//     consider modifying the template skeleton first: app/templates/system/list.template.js
//     Then touch app/app.truth.ts to regenerate all lists with your improvements!
import { useTasks, useTaskMutations } from '/runtime/generated/models/task.js'
import { Table, FilterBar, Button, Card } from '/app/components/system/index.js'

// Optional hooks for customization
let hooks = {}
try {
  const module = await import('./TaskList2.hooks.js')
  hooks = module.default || {}
} catch {
  // No hooks file - that's fine
}

export default function TaskList2() {
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
    console.warn('TaskList2: Hook context not ready during navigation:', error.message)
    return html`
      <div style="min-height: 50vh; display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center;">
          <div class="spinner"></div>
          <p style="color: #6b7280; margin-top: 1rem;">Loading...</p>
        </div>
      </div>
    `
  }
  
  const { data, loading, error, refetch } = useTasks()
  const { deleteTask } = useTaskMutations()
  
  const [filters, setFilters] = useState({})
  const [sortConfig, setSortConfig] = useState({ field: 'createdAt', order: 'asc' })

  if (loading) return html`<div class="loading">Loading...</div>`
  if (error) return html`<div class="text-red">Error: ${error.message}</div>`

  // Apply hooks processing
  const processedData = hooks.beforeRender?.(data) || data
  
  // Filter data
  const filteredData = processedData.filter(item => {
    return Object.entries(filters).every(([field, value]) => {
      if (!value) return true
      return item[field] === value
    })
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortConfig.field]
    const bVal = b[sortConfig.field]
    const order = sortConfig.order === 'asc' ? 1 : -1
    
    if (aVal < bVal) return -1 * order
    if (aVal > bVal) return 1 * order
    return 0
  })

  const handleDelete = async (item) => {
    if (confirm(`Delete ${item.title || item.name || 'this item'}?`)) {
      try {
        await deleteTask(item.id)
        refetch()
      } catch (err) {
        alert('Failed to delete: ' + err.message)
      }
    }
  }

  const tableActions = [
    { label: 'Edit', onClick: (item) => window.location.href = `/tasks2/${item.id}/edit` },
    { label: 'Delete', onClick: handleDelete },
    ...(hooks.customActions || [])
  ].filter(Boolean)

  return html`
    <div class="task-list">
      ${hooks.beforeContent?.() || ''}
      
      <${Card}>
        <div class="flex justify-between items-center mb-4">
          <h1>Tasks Alternative View</h1>
          <${Button} onClick=${() => window.location.href = '/tasks2/new'}>
            Add Task
          </${Button}>
        </div>

        ${hooks.headerContent?.() || ''}



        <${Table}
          data=${sortedData}
          columns=${[{"key":"createdAt","label":"CreatedAt"},{"key":"updatedAt","label":"UpdatedAt"},{"key":"title","label":"Title"},{"key":"description","label":"Description"},{"key":"status","label":"Status"},{"key":"priority","label":"Priority"},{"key":"dueDate","label":"DueDate"},{"key":"assignedTo","label":"AssignedTo"},{"key":"createdBy","label":"CreatedBy"}]}
          actions=${tableActions}
          sortConfig=${sortConfig}
          onSort=${(field) => setSortConfig(prev => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
          }))}
          emptyMessage="No tasks found"
        />

        ${hooks.footerContent?.() || ''}
      </${Card}>
      
      ${hooks.afterContent?.() || ''}
    </div>
  `
}