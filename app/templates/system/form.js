// New Readable Form Template
// Template for creating and editing entities - much more maintainable!

export const metadata = {
  inputs: {
    entity: { required: true, type: 'entity' },
    route: { required: true, type: 'string', pattern: /^\/[\w-\/:]+$/ },
    mode: { required: true, type: 'string', values: ['create', 'edit'] },
    layout: { required: false, type: 'layout', default: 'main' },
    fields: { required: false, type: 'array' }
  }
}

export async function generateComponent(viewName, viewDef, entityDef) {
  const entity = viewDef.entity
  const entityLower = entity.toLowerCase()
  const isEdit = viewDef.mode === 'edit'
  
  // Get fields to display (exclude system fields)
  const fields = viewDef.fields || Object.keys(entityDef.fields).filter(f => 
    !['id', 'createdAt', 'updatedAt'].includes(f)
  )
  
  // Build field objects with metadata
  const fieldObjects = fields.map(fieldName => {
    const fieldDef = entityDef.fields[fieldName]
    return {
      name: fieldName,
      label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
      type: fieldDef?.type || 'string',
      required: fieldDef?.required || false,
      default: fieldDef?.default || '',
      options: fieldDef?.options || [],
      entity: fieldDef?.entity // for reference fields
    }
  })

  // Load the template file with full syntax highlighting!
  const templatePath = new URL('./form.template.js', import.meta.url).pathname
  let template = await Deno.readTextFile(templatePath)
  
  // Replace placeholders with actual values
  template = template
    .replaceAll('__VIEW_NAME__', viewName)
    .replaceAll('__ENTITY__', entity)
    .replaceAll('__ENTITY_LOWER__', entityLower)
    .replaceAll('__FORM_TITLE__', isEdit ? `Edit ${entity}` : `Create ${entity}`)
    .replaceAll('__SUBMIT_BUTTON_TEXT__', isEdit ? `Update ${entity}` : `Create ${entity}`)
    .replaceAll('__MUTATION_FUNCTION__', isEdit ? `update${entity}` : `create${entity}`)
    
    // Generate initial form state
    .replace('__INITIAL_FORM_STATE__', 
      fieldObjects.map(f => `    ${f.name}: '${f.default}'`).join(',\n'))
    
    // Generate validation rules
    .replace('__VALIDATION_RULES__',
      fieldObjects.filter(f => f.required).map(f => 
        `    if (!formData.${f.name}) {\n      newErrors.${f.name} = '${f.label} is required'\n    }`
      ).join('\n'))
    
    // Generate field components
    .replace('__FIELD_COMPONENTS__', generateFieldComponents(fieldObjects))
    
    // Generate edit mode specific code
    .replace('__EDIT_MODE_SETUP__', isEdit ? generateEditModeSetup(entity) : '')
    .replace('__EDIT_MODE_EFFECT__', isEdit ? generateEditModeEffect(fieldObjects) : '')
    .replace('__SUBMIT_LOGIC__', isEdit ? `      await update${entity}(id, processedData)` : `      await create${entity}(processedData)`)
  
  return template
}

function generateFieldComponents(fieldObjects) {
  return fieldObjects.map(field => {
    if (field.type === 'enum') {
      return `            <\${Select}
              label="${field.label}"
              value=\${formData.${field.name}}
              onChange=\${(value) => updateField('${field.name}', value)}
              options=\${${JSON.stringify(field.options.map(opt => ({ value: opt, label: opt.charAt(0).toUpperCase() + opt.slice(1) })))}}
              required=\${${field.required}}
              error=\${errors.${field.name}}
            />`
    } else if (field.type === 'reference') {
      return `            <\${ReferenceSelect}
              label="${field.label}"
              value=\${formData.${field.name}}
              onChange=\${(value) => updateField('${field.name}', value)}
              entityType="${field.entity}"
              required=\${${field.required}}
              error=\${errors.${field.name}}
            />`
    } else {
      const inputType = field.type === 'date' ? 'date' : 
                       field.type === 'email' ? 'email' : 
                       field.type === 'number' ? 'number' : 'text'
      return `            <\${Input}
              label="${field.label}"
              type="${inputType}"
              value=\${formData.${field.name}}
              onChange=\${(value) => updateField('${field.name}', value)}
              required=\${${field.required}}
              error=\${errors.${field.name}}
            />`
    }
  }).join('\n')
}

function generateEditModeSetup(entity) {
  return `  // Extract ID from URL for edit mode
  const pathParts = window.location.pathname.split('/')
  const id = pathParts[pathParts.length - 2] // assuming /entity/id/edit pattern
  
  const { data, loading: loadingData, error: loadError } = use${entity}s()
  const existingItem = data.find(d => d.id === id)`
}

function generateEditModeEffect(fieldObjects) {
  return `  // Load existing data for edit mode
  useEffect(() => {
    if (existingItem) {
      setFormData({
${fieldObjects.map(f => `        ${f.name}: existingItem.${f.name} || ''`).join(',\n')}
      })
    }
  }, [existingItem])

  if (loadingData) return html\`<div class="loading">Loading...</div>\`
  if (loadError) return html\`<div class="text-red">Error: \${loadError.message}</div>\`
  if (!existingItem) return html\`<div class="text-center">${fieldObjects[0]?.name ? fieldObjects[0].name.charAt(0).toUpperCase() + fieldObjects[0].name.slice(1) : 'Item'} not found</div>\``
}