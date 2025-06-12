// Generated Task Model
// Always regenerated from truth file - do not edit
import { apiClient } from '../api/client.js'

// Entity schema
export const TaskSchema = {
  name: 'Task',
  fields: {
  "id": {
    "type": "string",
    "unique": true
  },
  "createdAt": {
    "type": "date"
  },
  "updatedAt": {
    "type": "date"
  },
  "title": {
    "type": "string",
    "required": true,
    "maxLength": 200
  },
  "description": {
    "type": "string",
    "required": false
  },
  "status": {
    "type": "enum",
    "options": [
      "todo",
      "in-progress",
      "done",
      "archived"
    ],
    "default": "todo",
    "required": true
  },
  "priority": {
    "type": "enum",
    "options": [
      "low",
      "medium",
      "high"
    ],
    "default": "medium"
  },
  "dueDate": {
    "type": "date",
    "required": false
  },
  "assignedTo": {
    "type": "relation",
    "to": "Person",
    "required": false
  },
  "createdBy": {
    "type": "relation",
    "to": "User",
    "required": true
  }
}
}

// Data hook for fetching Task entities
export function useTasks(options = {}) {
  // Access global hooks and utilities
  const { useState, useEffect, useCallback } = window
  
  // Safety check for hooks availability and context
  if (!useState || !useEffect || !useCallback) {
    console.error('Preact hooks not available yet, returning empty state')
    return { 
      data: [], 
      loading: true, 
      error: null, 
      refetch: () => {}, 
      tasks: [] 
    }
  }
  
  // Enhanced hook context validation with retry mechanism
  try {
    // Test if hooks work by actually attempting to use them
    const [testState] = useState(null)
    if (testState === undefined) {
      throw new Error('Hook state undefined')
    }
  } catch (hookError) {
    console.warn('Hook context not ready, returning safe state:', hookError.message)
    
    // Schedule a retry after a short delay to allow Preact to fully initialize
    setTimeout(() => {
      if (window.__PREACT_RETRY_COUNT__ < 3) {
        window.__PREACT_RETRY_COUNT__ = (window.__PREACT_RETRY_COUNT__ || 0) + 1
        console.log(`Retrying hook initialization, attempt ${window.__PREACT_RETRY_COUNT__}`)
        
        // Force a re-render by updating a global flag
        window.__PREACT_HOOKS_READY__ = false
        setTimeout(() => {
          window.__PREACT_HOOKS_READY__ = true
        }, 50)
      }
    }, 100)
    
    // Return a safe state without using hooks  
    return { 
      data: [], 
      loading: true, 
      error: null, 
      refetch: () => {
        console.log('Refetch called while hooks not ready - will retry when hooks available')
      }, 
      tasks: [] 
    }
  }
  
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/api/tasks', { params: options })
      
      // Handle different response formats
      const items = response.data?.items || response.items || response.data || response
      setData(Array.isArray(items) ? items : [])
      
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(options)])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return { 
    data, 
    loading, 
    error, 
    refetch,
    // Alias for backwards compatibility
    tasks: data
  }
}

// Mutation hooks for Task operations
export function useTaskMutations() {
  return {
    createTask: async (data) => {
      const result = await apiClient.post('/api/tasks', data)
      return result.data || result
    },

    updateTask: async (id, data) => {
      const result = await apiClient.put(`/api/tasks/${id}`, data)
      return result.data || result
    },

    deleteTask: async (id) => {
      await apiClient.delete(`/api/tasks/${id}`)
    },

    // Batch operations
    createManyTasks: async (items) => {
      const results = await Promise.all(
        items.map(item => apiClient.post('/api/tasks', item))
      )
      return results.map(r => r.data || r)
    },

    deleteManyTasks: async (ids) => {
      await Promise.all(
        ids.map(id => apiClient.delete(`/api/tasks/${id}`))
      )
    }
  }
}

// Individual Task hook (for detail views)
export function useTask(id) {
  // Access global hooks and utilities
  const { useState, useEffect } = window
  
  // Safety check for hooks availability
  if (!useState || !useEffect) {
    console.error('Preact hooks not available yet, returning empty state')
    return { data: null, loading: true, error: null }
  }
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setData(null)
      setLoading(false)
      return
    }

    const fetchItem = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await apiClient.get(`/api/tasks/${id}`)
        setData(response.data || response)
        
      } catch (err) {
        console.error(`Error fetching task ${id}:`, err)
        setError(err)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [id])

  return { data, loading, error }
}

// Validation helpers
export function validateTask(data) {
  const errors = {}
  
  
  if (!data.title) {
    errors.title = 'Title is required'
  }
  if (!data.status) {
    errors.status = 'Status is required'
  }
  if (!data.createdBy) {
    errors.createdBy = 'CreatedBy is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Field metadata helpers
export function getTaskFields() {
  return Object.keys(TaskSchema.fields)
}

export function getTaskFieldType(fieldName) {
  return TaskSchema.fields[fieldName]?.type
}

export function getTaskFieldOptions(fieldName) {
  const field = TaskSchema.fields[fieldName]
  return field?.type === 'enum' ? field.options : []
}