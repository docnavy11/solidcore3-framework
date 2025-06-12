// Generated Person Model
// Always regenerated from truth file - do not edit
import { apiClient } from '../api/client.js'

// Entity schema
export const PersonSchema = {
  name: 'Person',
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
  "name": {
    "type": "string",
    "required": true,
    "maxLength": 100
  },
  "email": {
    "type": "string",
    "required": true,
    "maxLength": 255
  },
  "role": {
    "type": "enum",
    "options": [
      "developer",
      "designer",
      "manager",
      "tester"
    ],
    "default": "developer",
    "required": true
  },
  "department": {
    "type": "string",
    "required": false,
    "maxLength": 100
  },
  "userId": {
    "type": "relation",
    "to": "User",
    "required": false
  }
}
}

// Data hook for fetching Person entities
export function usePersons(options = {}) {
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
      persons: [] 
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
      persons: [] 
    }
  }
  
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/api/persons', { params: options })
      
      // Handle different response formats
      const items = response.data?.items || response.items || response.data || response
      setData(Array.isArray(items) ? items : [])
      
    } catch (err) {
      console.error('Error fetching persons:', err)
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
    persons: data
  }
}

// Mutation hooks for Person operations
export function usePersonMutations() {
  return {
    createPerson: async (data) => {
      const result = await apiClient.post('/api/persons', data)
      return result.data || result
    },

    updatePerson: async (id, data) => {
      const result = await apiClient.put(`/api/persons/${id}`, data)
      return result.data || result
    },

    deletePerson: async (id) => {
      await apiClient.delete(`/api/persons/${id}`)
    },

    // Batch operations
    createManyPersons: async (items) => {
      const results = await Promise.all(
        items.map(item => apiClient.post('/api/persons', item))
      )
      return results.map(r => r.data || r)
    },

    deleteManyPersons: async (ids) => {
      await Promise.all(
        ids.map(id => apiClient.delete(`/api/persons/${id}`))
      )
    }
  }
}

// Individual Person hook (for detail views)
export function usePerson(id) {
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
        
        const response = await apiClient.get(`/api/persons/${id}`)
        setData(response.data || response)
        
      } catch (err) {
        console.error(`Error fetching person ${id}:`, err)
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
export function validatePerson(data) {
  const errors = {}
  
  
  if (!data.name) {
    errors.name = 'Name is required'
  }
  if (!data.email) {
    errors.email = 'Email is required'
  }
  if (!data.role) {
    errors.role = 'Role is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Field metadata helpers
export function getPersonFields() {
  return Object.keys(PersonSchema.fields)
}

export function getPersonFieldType(fieldName) {
  return PersonSchema.fields[fieldName]?.type
}

export function getPersonFieldOptions(fieldName) {
  const field = PersonSchema.fields[fieldName]
  return field?.type === 'enum' ? field.options : []
}