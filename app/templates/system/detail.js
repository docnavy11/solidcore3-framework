// System Detail Template
// Template for displaying a single entity

export const metadata = {
  inputs: {
    entity: { required: true, type: 'entity' },
    route: { required: true, type: 'string', pattern: /^\/[\w-\/:]+$/ },
    layout: { required: false, type: 'layout', default: 'main' },
    sections: { required: false, type: 'array' },
    actions: { required: false, type: 'array' }
  }
}

export async function generateComponent(viewName, viewDef, entityDef) {
  const entity = viewDef.entity
  const entityLower = entity.toLowerCase()
  const fields = Object.keys(entityDef.fields).filter(f => !['id'].includes(f))
  const actions = viewDef.actions || ['edit', 'delete']

  // Load the template file with full syntax highlighting!
  const templatePath = new URL('./detail.template.js', import.meta.url).pathname
  let template = await Deno.readTextFile(templatePath)
  
  // Replace placeholders with actual values
  template = template
    .replaceAll('__VIEW_NAME__', viewName)
    .replaceAll('__ENTITY__', entity)
    .replaceAll('__ENTITY_LOWER__', entityLower)
    .replaceAll('__LIST_ROUTE__', viewDef.route.replace('/:id', ''))
    
    // Generate action buttons
    .replace('__ACTION_BUTTONS__', generateActionButtons(actions, viewDef.route))
    
    // Generate field displays
    .replace('__FIELD_DISPLAYS__', generateFieldDisplays(fields, entityDef))
  
  return template
}

function generateActionButtons(actions, route) {
  const buttons = []
  
  if (actions.includes('edit')) {
    buttons.push(`            <\${Button} onClick=\${() => window.location.href = \`${route.replace(':id', '\${item.id}')}/edit\`}>
              Edit
            </\${Button}>`)
  }
  
  if (actions.includes('delete')) {
    buttons.push(`            <\${Button} variant="danger" onClick=\${handleDelete}>
              Delete
            </\${Button}>`)
  }
  
  return buttons.join('\n')
}

function generateFieldDisplays(fields, entityDef) {
  return fields.map(field => {
    const fieldType = entityDef.fields[field]?.type || 'string'
    const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1)
    
    return `          <div class="field-group">
            <label class="form-label">
              ${fieldLabel}
            </label>
            <div>
              \${formatFieldValue(processedItem.${field}, '${fieldType}')}
            </div>
          </div>`
  }).join('\n')
}