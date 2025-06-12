// System Calendar Template
// Template for calendar views with events

export const metadata = {
  inputs: {
    entity: { required: true, type: 'entity' },
    route: { required: true, type: 'string', pattern: /^\/[\w-\/]+$/ },
    dateField: { required: true, type: 'string' },
    titleField: { required: false, type: 'string', default: 'title' },
    eventFields: { required: false, type: 'array' },
    colorField: { required: false, type: 'string' }
  }
}

export async function generateComponent(viewName, viewDef, entityDef) {
  const entity = viewDef.entity
  const entityLower = entity.toLowerCase()
  const dateField = viewDef.dateField
  const titleField = viewDef.titleField || 'title'
  
  // Validate date field exists
  if (!entityDef.fields[dateField] || entityDef.fields[dateField].type !== 'date') {
    throw new Error(`Calendar dateField '${dateField}' must be a date field`)
  }
  
  // Fields to display in event details
  const eventFields = viewDef.eventFields || Object.keys(entityDef.fields).filter(f => 
    !['id', 'createdAt', 'updatedAt', dateField].includes(f)
  ).slice(0, 4)

  // Color field for event styling
  const colorField = viewDef.colorField

  // Load the template file with full syntax highlighting!
  const templatePath = new URL('./calendar.template.js', import.meta.url).pathname
  let template = await Deno.readTextFile(templatePath)
  
  // Replace placeholders with actual values
  template = template
    .replaceAll('__VIEW_NAME__', viewName)
    .replaceAll('__ENTITY__', entity)
    .replaceAll('__ENTITY_LOWER__', entityLower)
    .replaceAll('__DATE_FIELD__', dateField)
    .replaceAll('__TITLE_FIELD__', titleField)
    .replaceAll('__CREATE_ROUTE__', `/${entityLower}s/new`)
    
    // Generate event styling
    .replace('__EVENT_CLASS__', colorField ? `event-\${event.${colorField}}` : 'event-default')
    
    // Generate event content (what shows on calendar)
    .replace('__EVENT_CONTENT__', generateEventContent(titleField, entityDef))
    
    // Generate modal content (event details)
    .replace('__MODAL_CONTENT__', generateModalContent(eventFields, entityDef))
  
  return template
}

function generateEventContent(titleField, entityDef) {
  return `                      <span class="event-title">\${event.${titleField} || 'Untitled'}</span>`
}

function generateModalContent(eventFields, entityDef) {
  return eventFields.map(field => {
    const fieldDef = entityDef.fields[field]
    const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1)
    
    if (fieldDef?.type === 'enum') {
      return `              <div class="detail-field">
                <label>${fieldLabel}:</label>
                <span class="badge badge-\${selectedEvent.${field}}">\${selectedEvent.${field}}</span>
              </div>`
    } else if (fieldDef?.type === 'date') {
      return `              <div class="detail-field">
                <label>${fieldLabel}:</label>
                <span>\${selectedEvent.${field} ? new Date(selectedEvent.${field}).toLocaleDateString() : '-'}</span>
              </div>`
    } else if (fieldDef?.type === 'reference') {
      return `              <div class="detail-field">
                <label>${fieldLabel}:</label>
                <span>\${selectedEvent.${field}?.name || selectedEvent.${field} || '-'}</span>
              </div>`
    } else {
      return `              <div class="detail-field">
                <label>${fieldLabel}:</label>
                <span>\${selectedEvent.${field} || '-'}</span>
              </div>`
    }
  }).join('\n')
}