// System Table Component
// Data table with sorting, actions, and responsive design


export default function Table({ 
  data = [], 
  columns = [], 
  actions = [],
  sortConfig,
  onSort,
  loading = false,
  emptyMessage = 'No data available'
}) {
  // Access global hooks and utilities
  const { html } = window
  
  if (loading) {
    return html`
      <div class="loading">
        <div class="spinner"></div>
        <span>Loading...</span>
      </div>
    `
  }

  if (data.length === 0) {
    return html`
      <div class="loading">
        <span class="text-gray">${emptyMessage}</span>
      </div>
    `
  }

  const normalizedColumns = columns.map(col => 
    typeof col === 'string' ? { key: col, label: col } : col
  )

  return html`
    <div>
      <table class="table">
        <thead>
          <tr>
            ${normalizedColumns.map(col => html`
              <th 
                style="${onSort ? 'cursor: pointer;' : ''}"
                onClick=${onSort ? () => onSort(col.key) : null}
              >
                <div class="flex items-center gap-2">
                  <span>${col.label}</span>
                  ${sortConfig?.field === col.key && html`
                    <span style="color: #3b82f6;">
                      ${sortConfig.order === 'asc' ? '↑' : '↓'}
                    </span>
                  `}
                </div>
              </th>
            `)}
            ${actions.length > 0 && html`
              <th style="text-align: right;">Actions</th>
            `}
          </tr>
        </thead>
        <tbody>
          ${data.map((row, index) => html`
            <tr>
              ${normalizedColumns.map(col => html`
                <td>
                  ${formatCellValue(row[col.key], col.type)}
                </td>
              `)}
              ${actions.length > 0 && html`
                <td style="text-align: right;">
                  <div class="flex gap-2" style="justify-content: flex-end;">
                    ${actions.map(action => html`
                      <button
                        class="btn btn-secondary"
                        style="padding: 0.25rem 0.5rem; font-size: 0.875rem;"
                        onClick=${() => action.onClick(row)}
                      >
                        ${action.label}
                      </button>
                    `)}
                  </div>
                </td>
              `}
            </tr>
          `)}
        </tbody>
      </table>
    </div>
  `
}

function formatCellValue(value, type) {
  // Access global hooks and utilities
  const { html } = window
  
  if (value === null || value === undefined) return '-'
  
  switch (type) {
    case 'date':
      return new Date(value).toLocaleDateString()
    case 'boolean':
      return value ? '✓' : '✗'
    case 'enum':
      return html`<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">${value}</span>`
    default:
      return value.toString()
  }
}