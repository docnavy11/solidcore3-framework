// Generic EntityList component - handles any entity type
import { Table, Card, Button } from './index.js'

export function EntityList({ 
  entityName,
  title,
  columns = [],
  apiEndpoint,
  createRoute,
  editRoute = (id) => `/${entityName.toLowerCase()}s/${id}/edit`
}) {
  // Data loading
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filters and sorting
  const [filters, setFilters] = useState({})
  const [sortConfig, setSortConfig] = useState({ 
    field: columns[0]?.key || 'id', 
    direction: 'asc' 
  })
  
  // Selection state
  const [selectedRows, setSelectedRows] = useState([])
  
  // Load data on mount and when filters change
  useEffect(() => {
    loadData()
  }, [filters])
  
  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      
      // Build query parameters
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      
      const response = await apiClient.get(apiEndpoint + (params.toString() ? `?${params}` : ''))
      
      // Handle different response formats and ensure we always get an array
      let responseData = response.data?.items || response.items || response.data || response
      
      if (!Array.isArray(responseData)) {
        console.warn('API returned non-array data:', responseData)
        responseData = responseData ? [responseData] : []
      }
      
      setData(responseData)
    } catch (err) {
      setError(err.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }
  
  // Generic action handlers
  async function handleEdit(item) {
    window.location.href = editRoute(item.id)
  }
  
  async function handleDelete(item) {
    if (!confirm(`Are you sure you want to delete this ${entityName.toLowerCase()}?`)) return
    
    try {
      await apiClient.delete(`${apiEndpoint}/${item.id}`)
      toast.success(`${entityName} deleted successfully`)
      await loadData() // Refresh the list
    } catch (err) {
      toast.error(`Failed to delete ${entityName.toLowerCase()}: ` + err.message)
    }
  }
  
  async function handleBulkDelete() {
    if (selectedRows.length === 0) return
    if (!confirm(`Delete ${selectedRows.length} ${entityName.toLowerCase()}s?`)) return
    
    try {
      await Promise.all(
        selectedRows.map(id => apiClient.delete(`${apiEndpoint}/${id}`))
      )
      toast.success(`${selectedRows.length} ${entityName.toLowerCase()}s deleted`)
      setSelectedRows([])
      await loadData()
    } catch (err) {
      toast.error('Failed to delete items: ' + err.message)
    }
  }
  
  // Standard actions
  const tableActions = [
    { key: 'edit', label: 'Edit', variant: 'secondary', onClick: handleEdit },
    { key: 'delete', label: 'Delete', variant: 'danger', onClick: handleDelete },
  ]
  
  if (error) {
    return html`
      <${Card}>
        <div style="text-align: center; padding: 2rem; color: #ef4444;">
          <h2>Error Loading ${entityName}s</h2>
          <p>${error}</p>
          <${Button} onClick=${loadData}>Try Again</${Button}>
        </div>
      </${Card}>
    `
  }
  
  return html`
    <div class="${entityName.toLowerCase()}list-view">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h1 style="margin: 0; color: #111827;">${title}</h1>
        <div style="display: flex; gap: 1rem;">
          ${selectedRows.length > 0 && html`
            <${Button} variant="danger" onClick=${handleBulkDelete}>
              Delete ${selectedRows.length} Selected
            </${Button}>
          `}
          <${Button} onClick=${() => window.location.href = createRoute}>
            Add ${entityName}
          </${Button}>
        </div>
      </div>
      
      <${Table}
        data=${data}
        columns=${columns}
        actions=${tableActions}
        loading=${loading}
        sortable=${true}
        selectable=${true}
        selectedRows=${selectedRows}
        onSelectionChange=${setSelectedRows}
        sortConfig=${sortConfig}
        onSort=${setSortConfig}
        emptyMessage="No ${entityName.toLowerCase()}s found"
        striped=${true}
        hoverable=${true}
      />
    </div>
  `
}