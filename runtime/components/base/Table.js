// Enhanced Table component using htm/Preact
// Replaces the old HTML string-based Table component

export function Table({ 
  data = [], 
  columns = [], 
  actions = [],
  sortable = true,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  onSort,
  sortConfig = { field: null, direction: 'asc' },
  loading = false,
  emptyMessage = 'No data available',
  striped = true,
  hoverable = true,
  compact = false
}) {
  const [internalSortConfig, setInternalSortConfig] = useState(sortConfig)
  
  // Use provided sort handler or internal state
  const currentSortConfig = onSort ? sortConfig : internalSortConfig
  const handleSort = onSort || setInternalSortConfig
  
  // Auto-generate columns from data if not provided
  const tableColumns = useMemo(() => {
    if (columns.length > 0) return columns
    
    if (data.length === 0) return []
    
    // Auto-generate from first row
    return Object.keys(data[0])
      .filter(key => !key.startsWith('_'))
      .map(key => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
      }))
  }, [columns, data])
  
  // Sort data
  const sortedData = useMemo(() => {
    // Ensure data is always an array
    const dataArray = Array.isArray(data) ? data : []
    
    if (!currentSortConfig.field) return dataArray
    
    return [...dataArray].sort((a, b) => {
      const aVal = getNestedValue(a, currentSortConfig.field)
      const bVal = getNestedValue(b, currentSortConfig.field)
      
      if (aVal < bVal) return currentSortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return currentSortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, currentSortConfig])
  
  function getNestedValue(obj, path) {
    return path.split('.').reduce((curr, key) => curr?.[key], obj) || ''
  }
  
  function toggleSort(field) {
    if (!sortable) return
    
    const newDirection = 
      currentSortConfig.field === field && currentSortConfig.direction === 'asc'
        ? 'desc' 
        : 'asc'
    
    handleSort({ field, direction: newDirection })
  }
  
  function handleRowSelection(rowId, checked) {
    if (!onSelectionChange) return
    
    if (checked) {
      onSelectionChange([...selectedRows, rowId])
    } else {
      onSelectionChange(selectedRows.filter(id => id !== rowId))
    }
  }
  
  function handleSelectAll(checked) {
    if (!onSelectionChange) return
    
    if (checked) {
      onSelectionChange(sortedData.map(row => row.id))
    } else {
      onSelectionChange([])
    }
  }
  
  if (loading) {
    return html`
      <div class="table-loading" style="padding: 2rem; text-align: center; color: #6b7280;">
        <div style="margin-bottom: 0.5rem;">⏳</div>
        <div>Loading...</div>
      </div>
    `
  }
  
  if (sortedData.length === 0) {
    return html`
      <div class="table-empty" style="padding: 3rem; text-align: center; color: #9ca3af;">
        <div style="margin-bottom: 0.5rem;">📋</div>
        <div>${emptyMessage}</div>
      </div>
    `
  }
  
  const allSelected = selectable && selectedRows.length === sortedData.length && sortedData.length > 0
  const someSelected = selectable && selectedRows.length > 0 && selectedRows.length < sortedData.length
  
  return html`
    <div class="table-container" style="overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
      <table style="
        width: 100%;
        border-collapse: collapse;
        background: white;
        ${compact ? 'font-size: 0.875rem;' : ''}
      ">
        <thead style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
          <tr>
            ${selectable && html`
              <th style="padding: ${compact ? '0.5rem' : '0.75rem'}; text-align: left; width: 40px;">
                <input 
                  type="checkbox"
                  checked=${allSelected}
                  indeterminate=${someSelected}
                  onChange=${(e) => handleSelectAll(e.target.checked)}
                  style="cursor: pointer;"
                />
              </th>
            `}
            
            ${tableColumns.map(col => html`
              <th 
                key=${col.key}
                style="
                  padding: ${compact ? '0.5rem' : '0.75rem'};
                  text-align: left;
                  font-weight: 600;
                  color: #374151;
                  ${sortable && col.sortable !== false ? 'cursor: pointer; user-select: none;' : ''}
                  ${col.width ? `width: ${col.width};` : ''}
                "
                onClick=${sortable && col.sortable !== false ? () => toggleSort(col.key) : undefined}
              >
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  ${col.label}
                  ${sortable && col.sortable !== false && html`
                    <span style="
                      font-size: 0.75rem;
                      color: ${currentSortConfig.field === col.key ? '#3b82f6' : '#9ca3af'};
                    ">
                      ${currentSortConfig.field === col.key 
                        ? (currentSortConfig.direction === 'asc' ? '↑' : '↓')
                        : '↕'
                      }
                    </span>
                  `}
                </div>
              </th>
            `)}
            
            ${actions.length > 0 && html`
              <th style="padding: ${compact ? '0.5rem' : '0.75rem'}; text-align: right; width: ${actions.length * 80}px;">
                Actions
              </th>
            `}
          </tr>
        </thead>
        
        <tbody>
          ${sortedData.map((row, index) => {
            const isSelected = selectable && selectedRows.includes(row.id)
            
            return html`
              <tr 
                key=${row.id || index}
                style="
                  border-bottom: 1px solid #f3f4f6;
                  ${striped && index % 2 === 1 ? 'background: #f9fafb;' : ''}
                  ${hoverable ? 'transition: background-color 0.2s;' : ''}
                  ${isSelected ? 'background: #eff6ff;' : ''}
                "
                onMouseEnter=${hoverable ? (e) => {
                  if (!isSelected) e.target.style.background = '#f3f4f6'
                } : undefined}
                onMouseLeave=${hoverable ? (e) => {
                  if (!isSelected) e.target.style.background = striped && index % 2 === 1 ? '#f9fafb' : 'white'
                } : undefined}
              >
                ${selectable && html`
                  <td style="padding: ${compact ? '0.5rem' : '0.75rem'};">
                    <input 
                      type="checkbox"
                      checked=${isSelected}
                      onChange=${(e) => handleRowSelection(row.id, e.target.checked)}
                      style="cursor: pointer;"
                    />
                  </td>
                `}
                
                ${tableColumns.map(col => html`
                  <td 
                    key=${col.key}
                    style="
                      padding: ${compact ? '0.5rem' : '0.75rem'};
                      color: #374151;
                      ${col.align === 'center' ? 'text-align: center;' : ''}
                      ${col.align === 'right' ? 'text-align: right;' : ''}
                    "
                  >
                    ${col.render 
                      ? col.render(row, getNestedValue(row, col.key))
                      : formatCellValue(getNestedValue(row, col.key), col.type)
                    }
                  </td>
                `)}
                
                ${actions.length > 0 && html`
                  <td style="padding: ${compact ? '0.5rem' : '0.75rem'}; text-align: right;">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                      ${actions.map(action => html`
                        <button
                          key=${action.key || action.label}
                          onClick=${() => action.onClick(row)}
                          disabled=${action.disabled && action.disabled(row)}
                          style="
                            padding: 0.25rem 0.75rem;
                            border: 1px solid ${getActionColor(action.variant).border};
                            background: ${getActionColor(action.variant).bg};
                            color: ${getActionColor(action.variant).text};
                            border-radius: 0.375rem;
                            cursor: pointer;
                            font-size: 0.875rem;
                            transition: all 0.2s;
                          "
                          onMouseEnter=${(e) => {
                            if (!e.target.disabled) {
                              e.target.style.background = getActionColor(action.variant).hoverBg
                            }
                          }}
                          onMouseLeave=${(e) => {
                            e.target.style.background = getActionColor(action.variant).bg
                          }}
                        >
                          ${action.label}
                        </button>
                      `)}
                    </div>
                  </td>
                `}
              </tr>
            `
          })}
        </tbody>
      </table>
    </div>
  `
}

function formatCellValue(value, type) {
  if (value === null || value === undefined) return '—'
  
  switch (type) {
    case 'date':
      try {
        return new Date(value).toLocaleDateString()
      } catch {
        return value
      }
    case 'currency':
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(value)
    case 'number':
      return Number(value).toLocaleString()
    case 'boolean':
      return value ? '✓' : '✗'
    default:
      return String(value)
  }
}

function getActionColor(variant) {
  const colors = {
    primary: {
      bg: '#3b82f6',
      hoverBg: '#2563eb',
      border: '#3b82f6',
      text: 'white'
    },
    secondary: {
      bg: '#f3f4f6',
      hoverBg: '#e5e7eb',
      border: '#d1d5db',
      text: '#374151'
    },
    danger: {
      bg: '#ef4444',
      hoverBg: '#dc2626',
      border: '#ef4444',
      text: 'white'
    },
    success: {
      bg: '#10b981',
      hoverBg: '#059669',
      border: '#10b981',
      text: 'white'
    }
  }
  
  return colors[variant] || colors.secondary
}