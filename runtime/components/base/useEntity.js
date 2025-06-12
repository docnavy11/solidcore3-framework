// Generic hook for entity CRUD operations
export function useEntity(entityName, apiEndpoint) {
  // List state
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Load all entities
  async function loadAll(filters = {}) {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      
      const response = await apiClient.get(apiEndpoint + (params.toString() ? `?${params}` : ''))
      let responseData = response.data?.items || response.items || response.data || response
      
      if (!Array.isArray(responseData)) {
        responseData = responseData ? [responseData] : []
      }
      
      setData(responseData)
      return responseData
    } catch (err) {
      setError(err.message)
      setData([])
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // Load single entity
  async function loadOne(id) {
    try {
      const response = await apiClient.get(`${apiEndpoint}/${id}`)
      return response.data || response
    } catch (err) {
      throw new Error(`Failed to load ${entityName.toLowerCase()}: ${err.message}`)
    }
  }
  
  // Create entity
  async function create(data) {
    try {
      const response = await apiClient.post(apiEndpoint, data)
      toast.success(`${entityName} created successfully`)
      return response.data || response
    } catch (err) {
      toast.error(`Failed to create ${entityName.toLowerCase()}: ${err.message}`)
      throw err
    }
  }
  
  // Update entity
  async function update(id, data) {
    try {
      const response = await apiClient.put(`${apiEndpoint}/${id}`, data)
      toast.success(`${entityName} updated successfully`)
      return response.data || response
    } catch (err) {
      toast.error(`Failed to update ${entityName.toLowerCase()}: ${err.message}`)
      throw err
    }
  }
  
  // Delete entity
  async function deleteOne(id) {
    try {
      await apiClient.delete(`${apiEndpoint}/${id}`)
      toast.success(`${entityName} deleted successfully`)
      // Refresh the list
      await loadAll()
    } catch (err) {
      toast.error(`Failed to delete ${entityName.toLowerCase()}: ${err.message}`)
      throw err
    }
  }
  
  // Delete multiple entities
  async function deleteMany(ids) {
    try {
      await Promise.all(ids.map(id => apiClient.delete(`${apiEndpoint}/${id}`)))
      toast.success(`${ids.length} ${entityName.toLowerCase()}s deleted`)
      // Refresh the list
      await loadAll()
    } catch (err) {
      toast.error(`Failed to delete ${entityName.toLowerCase()}s: ${err.message}`)
      throw err
    }
  }
  
  return {
    // State
    data,
    loading,
    error,
    
    // Actions
    loadAll,
    loadOne,
    create,
    update,
    deleteOne,
    deleteMany,
    
    // Helpers
    refresh: () => loadAll(),
  }
}