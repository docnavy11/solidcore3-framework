// System List Template
// Template for displaying entities in a table format

export const metadata = {
  inputs: {
    entity: { required: true, type: 'entity' },
    route: { required: true, type: 'string', pattern: /^\/[\w-\/]+$/ },
    layout: { required: false, type: 'layout', default: 'main' },
    columns: { required: false, type: 'array' },
    filters: { required: false, type: 'array' },
    actions: { required: false, type: 'array' }
  }
}

export async function generateComponent(viewName, viewDef, entityDef) {
  const entity = viewDef.entity
  const entityLower = entity.toLowerCase()
  const columns = viewDef.columns || Object.keys(entityDef.fields).filter(f => !['id'].includes(f))
  const filters = viewDef.filters || []
  const actions = viewDef.actions || ['create', 'edit', 'delete']

  // Load the template file with full syntax highlighting!
  const templatePath = new URL('./list.template.js', import.meta.url).pathname
  let template = await Deno.readTextFile(templatePath)
  
  // Replace placeholders with actual values
  template = template
    .replaceAll('__VIEW_NAME__', viewName)
    .replaceAll('__ENTITY__', entity)
    .replaceAll('__ENTITY_LOWER__', entityLower)
    .replaceAll('__LIST_TITLE__', viewDef.title || `${entity} List`)
    .replaceAll('__FIRST_COLUMN__', columns[0] || 'id')
    
    // Generate table actions
    .replace('__TABLE_ACTIONS__', generateTableActions(actions, viewDef.route))
    
    // Generate create button
    .replace('__CREATE_BUTTON__', actions.includes('create') ? 
      `          <\${Button} onClick=\${() => window.location.href = '${viewDef.route}/new'}>
            Add ${entity}
          </\${Button}>` : '')
    
    // Generate filter bar
    .replace('__FILTER_BAR__', filters.length > 0 ? generateFilterBar(filters, entityDef) : '')
    
    // Generate columns configuration
    .replace('__COLUMNS_CONFIG__', JSON.stringify(columns.map(col => ({ 
      key: col, 
      label: col.charAt(0).toUpperCase() + col.slice(1) 
    }))))
  
  return template
}

function generateTableActions(actions, route) {
  const actionItems = []
  
  if (actions.includes('edit')) {
    actionItems.push(`    { label: 'Edit', onClick: (item) => window.location.href = \`${route}/\${item.id}/edit\` }`)
  }
  
  if (actions.includes('delete')) {
    actionItems.push(`    { label: 'Delete', onClick: handleDelete }`)
  }
  
  return actionItems.join(',\n')
}

function generateFilterBar(filters, entityDef) {
  const filterConfig = filters.map(f => {
    const field = entityDef.fields[f]
    if (field?.type === 'enum') {
      return { field: f, label: f.charAt(0).toUpperCase() + f.slice(1), options: field.options || [] }
    }
    return { field: f, label: f.charAt(0).toUpperCase() + f.slice(1), options: [] }
  })

  return `        <\${FilterBar}
          filters=\${${JSON.stringify(filterConfig)}}
          values=\${filters}
          onChange=\${setFilters}
          onClear=\${() => setFilters({})}
          className="mb-4"
        />`
}