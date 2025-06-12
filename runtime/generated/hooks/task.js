// /runtime/generated/hooks/task.js
// Always regenerated from truth file - do not edit directly
import { apiClient } from '/runtime/generated/api/client.js'

export function useTasks(options = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    apiClient.get('/api/tasks', { params: options })
      .then(response => {
        setData(response.data?.items || response.items || response.data || response)
        setError(null)
      })
      .catch(err => {
        setError(err)
        setData([])
      })
      .finally(() => setLoading(false))
  }, [JSON.stringify(options)])

  return { data, loading, error, refetch: () => {} }
}

export function useTaskMutations() {
  return {
    createTask: async (data) => {
      const result = await apiClient.post('/api/tasks', data)
      // TODO: Add cache invalidation when needed
      return result.data || result
    },

    updateTask: async (id, data) => {
      const result = await apiClient.put(`/api/tasks/${id}`, data)
      // TODO: Add cache invalidation when needed
      return result.data || result
    },

    deleteTask: async (id) => {
      await apiClient.delete(`/api/tasks/${id}`)
      // TODO: Add cache invalidation when needed
    }
  }
}