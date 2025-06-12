// Generated User Model
// Always regenerated from truth file - do not edit
import { apiClient } from '../api/client.js'

// Entity schema
export const UserSchema = {
  name: 'User',
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
  "email": {
    "type": "string",
    "required": true,
    "maxLength": 255,
    "unique": true
  },
  "password": {
    "type": "string",
    "required": true,
    "maxLength": 255
  },
  "name": {
    "type": "string",
    "required": true,
    "maxLength": 100
  },
  "role": {
    "type": "enum",
    "options": [
      "admin",
      "manager",
      "user"
    ],
    "default": "user",
    "required": true
  },
  "isActive": {
    "type": "boolean",
    "default": true,
    "required": true
  },
  "lastLoginAt": {
    "type": "date",
    "required": false
  }
}
}

// Data hook for fetching User entities
export function useUsers(options = {}) {
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
      users: [] 
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
      users: [] 
    }
  }
  
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/api/users', { params: options })
      
      // Handle different response formats
      const items = response.data?.items || response.items || response.data || response
      setData(Array.isArray(items) ? items : [])
      
    } catch (err) {
      console.error('Error fetching users:', err)
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
    users: data
  }
}

// Mutation hooks for User operations
export function useUserMutations() {
  return {
    createUser: async (data) => {
      const result = await apiClient.post('/api/users', data)
      return result.data || result
    },

    updateUser: async (id, data) => {
      const result = await apiClient.put(`/api/users/${id}`, data)
      return result.data || result
    },

    deleteUser: async (id) => {
      await apiClient.delete(`/api/users/${id}`)
    },

    // Batch operations
    createManyUsers: async (items) => {
      const results = await Promise.all(
        items.map(item => apiClient.post('/api/users', item))
      )
      return results.map(r => r.data || r)
    },

    deleteManyUsers: async (ids) => {
      await Promise.all(
        ids.map(id => apiClient.delete(`/api/users/${id}`))
      )
    }
  }
}

// Individual User hook (for detail views)
export function useUser(id) {
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
        
        const response = await apiClient.get(`/api/users/${id}`)
        setData(response.data || response)
        
      } catch (err) {
        console.error(`Error fetching user ${id}:`, err)
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
export function validateUser(data) {
  const errors = {}
  
  
  if (!data.email) {
    errors.email = 'Email is required'
  }
  if (!data.password) {
    errors.password = 'Password is required'
  }
  if (!data.name) {
    errors.name = 'Name is required'
  }
  if (!data.role) {
    errors.role = 'Role is required'
  }
  if (!data.isActive) {
    errors.isActive = 'IsActive is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Field metadata helpers
export function getUserFields() {
  return Object.keys(UserSchema.fields)
}

export function getUserFieldType(fieldName) {
  return UserSchema.fields[fieldName]?.type
}

export function getUserFieldOptions(fieldName) {
  const field = UserSchema.fields[fieldName]
  return field?.type === 'enum' ? field.options : []
}