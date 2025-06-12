// Generated TaskBoard Component
// Edit this file directly - it won't be regenerated unless deleted
//
// 🤖 AI: For structural changes (column layout, card design, drag behavior),
//     consider modifying the template skeleton first: app/templates/system/kanban.template.js
//     Then touch app/app.truth.ts to regenerate all kanban boards with your improvements!
import { useTasks, useTaskMutations } from '/runtime/generated/models/task.js'
import { Card, Button } from '/app/components/system/index.js'

// Optional hooks for customization
let hooks = {}
try {
  const module = await import('./TaskBoard.hooks.js')
  hooks = module.default || {}
} catch {
  // No hooks file - that's fine
}

export default function TaskBoard() {
  const { html, useState, useEffect } = window
  
  // Hook safety check for navigation transitions
  try {
    const [testState] = useState(true)
    if (testState === undefined) {
      throw new Error('Hook context not ready')
    }
  } catch (error) {
    console.warn('TaskBoard: Hook context not ready during navigation:', error.message)
    return html`
      <div style="min-height: 50vh; display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center;">
          <div class="spinner"></div>
          <p style="color: #6b7280; margin-top: 1rem;">Loading kanban board...</p>
        </div>
      </div>
    `
  }
  
  const { data, loading, error, refetch } = useTasks()
  const { updateTask } = useTaskMutations()
  
  // Kanban state
  const [draggedItem, setDraggedItem] = useState(null)
  const [columns] = useState([{"id":"todo","title":"Todo"},{"id":"in-progress","title":"In progress"},{"id":"done","title":"Done"},{"id":"archived","title":"Archived"}])

  if (loading) return html`<div class="loading">Loading kanban board...</div>`
  if (error) return html`<div class="text-red">Error: ${error.message}</div>`

  // Apply hooks processing
  const processedData = hooks.beforeRender?.(data) || data

  // Group items by status/column
  const groupedItems = columns.reduce((acc, column) => {
    acc[column.id] = processedData.filter(item => item.status === column.id)
    return acc
  }, {})

  // Drag handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target.outerHTML)
    e.dataTransfer.setData('text/plain', item.id)
    e.target.classList.add('dragging')
  }

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging')
    setDraggedItem(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, columnId) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem.status === columnId) {
      return // No change needed
    }

    try {
      // Update item status
      await updateTask(draggedItem.id, { status: columnId })
      
      // Refresh data
      refetch()
      
      // Custom hook processing
      hooks.onItemMoved?.(draggedItem, columnId)
      
    } catch (err) {
      console.error('Failed to move item:', err)
      // Could show notification here
    }
  }

  const handleCardClick = (item) => {
    const detailRoute = '/tasks/:id'.replace(':id', item.id)
    window.location.href = detailRoute
  }

  return html`
    <div class="kanban-board">
      ${hooks.beforeContent?.() || ''}
      
      <div class="kanban-header">
        <h1>Task Board</h1>
        <div class="kanban-actions">
          <${Button} onClick=${() => window.location.href = '/tasks/new'}>
            Add Task
          </${Button}>
          ${hooks.headerActions?.() || ''}
        </div>
      </div>

      <div class="kanban-columns">
        ${columns.map(column => html`
          <div 
            key=${column.id}
            class="kanban-column"
            onDragOver=${handleDragOver}
            onDrop=${(e) => handleDrop(e, column.id)}
          >
            <div class="column-header">
              <h3 class="column-title">${column.title}</h3>
              <span class="column-count">${groupedItems[column.id]?.length || 0}</span>
              ${hooks.columnActions?.(column) || ''}
            </div>
            
            <div class="column-cards">
              ${(groupedItems[column.id] || []).map(item => html`
                <div
                  key=${item.id}
                  class="kanban-card ${draggedItem?.id === item.id ? 'dragging' : ''}"
                  draggable="true"
                  onDragStart=${(e) => handleDragStart(e, item)}
                  onDragEnd=${handleDragEnd}
                  onClick=${() => handleCardClick(item)}
                >
                  <div class="card-title">${item.title}</div>
                  <div class="card-field">
                    <span class="field-label">Description:</span>
                    <span class="field-value">${item.description || '-'}</span>
                  </div>
                  <div class="card-field">
                    <span class="field-label">Priority:</span>
                    <span class="field-value badge badge-${item.priority}">${item.priority}</span>
                  </div>
                  ${hooks.cardActions?.(item) || ''}
                </div>
              `)}
              
              ${hooks.columnFooter?.(column) || ''}
            </div>
          </div>
        `)}
      </div>
      
      ${hooks.afterContent?.() || ''}
    </div>
  `
}