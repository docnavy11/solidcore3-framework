// System Kanban Template
// Template for drag & drop kanban boards

export const metadata = {
  inputs: {
    entity: { required: true, type: 'entity' },
    route: { required: true, type: 'string', pattern: /^\/[\w-\/]+$/ },
    groupBy: { required: true, type: 'string', default: 'status' },
    columns: { required: false, type: 'array' },
    title: { required: false, type: 'string' },
    cardFields: { required: false, type: 'array' }
  }
}

export async function generateComponent(viewName, viewDef, entityDef) {
  const entity = viewDef.entity
  const entityLower = entity.toLowerCase()
  const groupByField = viewDef.groupBy || 'status'
  const boardTitle = viewDef.title || `${entity} Board`
  
  // Get the field definition for groupBy to extract options
  const groupByFieldDef = entityDef.fields[groupByField]
  if (!groupByFieldDef || groupByFieldDef.type !== 'enum') {
    throw new Error(`Kanban groupBy field '${groupByField}' must be an enum field`)
  }
  
  // Build columns from enum options or custom columns
  const columns = viewDef.columns || groupByFieldDef.options.map(option => ({
    id: option,
    title: option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')
  }))
  
  // Fields to display on cards (exclude system fields and groupBy field)
  const cardFields = viewDef.cardFields || Object.keys(entityDef.fields).filter(f => 
    !['id', 'createdAt', 'updatedAt', groupByField].includes(f)
  ).slice(0, 3) // Limit to first 3 fields for card readability

  // Load the template file with full syntax highlighting!
  const templatePath = new URL('./kanban.template.js', import.meta.url).pathname
  let template = await Deno.readTextFile(templatePath)
  
  // Replace placeholders with actual values
  template = template
    .replaceAll('__VIEW_NAME__', viewName)
    .replaceAll('__ENTITY__', entity)
    .replaceAll('__ENTITY_LOWER__', entityLower)
    .replaceAll('__BOARD_TITLE__', boardTitle)
    .replaceAll('__GROUP_BY_FIELD__', groupByField)
    .replaceAll('__DETAIL_ROUTE__', `/${entityLower}s/:id`)
    .replaceAll('__CREATE_ROUTE__', `/${entityLower}s/new`)
    
    // Generate columns configuration
    .replace('__KANBAN_COLUMNS__', JSON.stringify(columns))
    
    // Generate card content
    .replace('__CARD_CONTENT__', generateCardContent(cardFields, entityDef))
  
  return template
}

function generateCardContent(cardFields, entityDef) {
  return cardFields.map(field => {
    const fieldDef = entityDef.fields[field]
    const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1)
    
    if (fieldDef?.type === 'enum') {
      return `                  <div class="card-field">
                    <span class="field-label">${fieldLabel}:</span>
                    <span class="field-value badge badge-\${item.${field}}">\${item.${field}}</span>
                  </div>`
    } else if (fieldDef?.type === 'date') {
      return `                  <div class="card-field">
                    <span class="field-label">${fieldLabel}:</span>
                    <span class="field-value">\${item.${field} ? new Date(item.${field}).toLocaleDateString() : '-'}</span>
                  </div>`
    } else if (field === 'title' || field === 'name') {
      // Make title/name prominent
      return `                  <div class="card-title">\${item.${field}}</div>`
    } else {
      return `                  <div class="card-field">
                    <span class="field-label">${fieldLabel}:</span>
                    <span class="field-value">\${item.${field} || '-'}</span>
                  </div>`
    }
  }).join('\n')
}