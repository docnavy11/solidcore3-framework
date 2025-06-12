// Model Generator - Always regenerated for runtime/generated/models
// Creates data hooks and API clients for entities

import { AppDefinition, EntityDefinition } from '../../core/types/index.ts'

export class ModelGenerator {
  constructor(private app: AppDefinition) {}

  async generateAllModels(): Promise<void> {
    console.log('📦 Generating entity models and hooks...')
    
    // Ensure directory exists
    await Deno.mkdir('./runtime/generated/models', { recursive: true })
    await Deno.mkdir('./runtime/generated/api', { recursive: true })
    
    // Generate API client
    await this.generateAPIClient()
    
    // Generate models for each entity
    if (this.app.entities) {
      for (const [entityName, entityDef] of Object.entries(this.app.entities)) {
        await this.generateEntityModel(entityName, entityDef)
      }
    }
    
    console.log('✅ Model generation complete')
  }

  private async generateAPIClient(): Promise<void> {
    const clientCode = `// Generated API Client
// Always regenerated - do not edit

const API_BASE = window.location.origin

export const apiClient = {
  async get(url, options = {}) {
    const { params, ...fetchOptions } = options
    
    let fullUrl = API_BASE + url
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          searchParams.append(key, String(value))
        }
      })
      if (searchParams.toString()) {
        fullUrl += '?' + searchParams.toString()
      }
    }
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        ...fetchOptions.headers 
      },
      ...fetchOptions
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(\`API Error: \${response.status} \${response.statusText} - \${errorText}\`)
    }
    
    return response.json()
  },

  async post(url, data, options = {}) {
    const response = await fetch(API_BASE + url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...options.headers 
      },
      body: JSON.stringify(data),
      ...options
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(\`API Error: \${response.status} \${response.statusText} - \${errorText}\`)
    }
    
    return response.json()
  },

  async put(url, data, options = {}) {
    const response = await fetch(API_BASE + url, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...options.headers 
      },
      body: JSON.stringify(data),
      ...options
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(\`API Error: \${response.status} \${response.statusText} - \${errorText}\`)
    }
    
    return response.json()
  },

  async delete(url, options = {}) {
    const response = await fetch(API_BASE + url, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        ...options.headers 
      },
      ...options
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(\`API Error: \${response.status} \${response.statusText} - \${errorText}\`)
    }
    
    return response.json()
  }
}`

    await Deno.writeTextFile('./runtime/generated/api/client.js', clientCode)
    console.log('📝 Generated API client')
  }

  private async generateEntityModel(entityName: string, entityDef: EntityDefinition): Promise<void> {
    const entityLower = entityName.toLowerCase()
    
    const modelCode = `// Generated ${entityName} Model
// Always regenerated from truth file - do not edit
import { apiClient } from '../api/client.js'

// Entity schema
export const ${entityName}Schema = {
  name: '${entityName}',
  fields: ${JSON.stringify(entityDef.fields, null, 2)}
}

// Data hook for fetching ${entityName} entities
export function use${entityName}s(options = {}) {
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
      ${entityName.toLowerCase()}s: [] 
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
        console.log(\`Retrying hook initialization, attempt \${window.__PREACT_RETRY_COUNT__}\`)
        
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
      ${entityName.toLowerCase()}s: [] 
    }
  }
  
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/api/${entityLower}s', { params: options })
      
      // Handle different response formats
      const items = response.data?.items || response.items || response.data || response
      setData(Array.isArray(items) ? items : [])
      
    } catch (err) {
      console.error('Error fetching ${entityLower}s:', err)
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
    ${entityLower}s: data
  }
}

// Mutation hooks for ${entityName} operations
export function use${entityName}Mutations() {
  return {
    create${entityName}: async (data) => {
      const result = await apiClient.post('/api/${entityLower}s', data)
      return result.data || result
    },

    update${entityName}: async (id, data) => {
      const result = await apiClient.put(\`/api/${entityLower}s/\${id}\`, data)
      return result.data || result
    },

    delete${entityName}: async (id) => {
      await apiClient.delete(\`/api/${entityLower}s/\${id}\`)
    },

    // Batch operations
    createMany${entityName}s: async (items) => {
      const results = await Promise.all(
        items.map(item => apiClient.post('/api/${entityLower}s', item))
      )
      return results.map(r => r.data || r)
    },

    deleteMany${entityName}s: async (ids) => {
      await Promise.all(
        ids.map(id => apiClient.delete(\`/api/${entityLower}s/\${id}\`))
      )
    }
  }
}

// Individual ${entityName} hook (for detail views)
export function use${entityName}(id) {
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
        
        const response = await apiClient.get(\`/api/${entityLower}s/\${id}\`)
        setData(response.data || response)
        
      } catch (err) {
        console.error(\`Error fetching ${entityLower} \${id}:\`, err)
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
export function validate${entityName}(data) {
  const errors = {}
  
  ${Object.entries(entityDef.fields).map(([fieldName, fieldDef]) => {
    if (fieldDef.required) {
      return `
  if (!data.${fieldName}) {
    errors.${fieldName} = '${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required'
  }`
    }
    return ''
  }).filter(Boolean).join('')}
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Field metadata helpers
export function get${entityName}Fields() {
  return Object.keys(${entityName}Schema.fields)
}

export function get${entityName}FieldType(fieldName) {
  return ${entityName}Schema.fields[fieldName]?.type
}

export function get${entityName}FieldOptions(fieldName) {
  const field = ${entityName}Schema.fields[fieldName]
  return field?.type === 'enum' ? field.options : []
}`

    await Deno.writeTextFile(`./runtime/generated/models/${entityLower}.js`, modelCode)
    console.log(`📝 Generated ${entityName} model`)
  }
}