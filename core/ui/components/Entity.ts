// Entity-aware components for automatic UI generation

import { AppDefinition, EntityDefinition } from '../../types/index.ts';
import { BaseProps, InteractionProps } from '../types/base-props.ts';
import { Card } from './Containers.ts';
import { Text, Heading, Badge, Table } from './Content.ts';
import { Button, Input, Select, Form } from './Forms.ts';
import { Stack, Grid } from './Layout.ts';
import { Alert } from './Feedback.ts';

export interface EntityFieldProps extends BaseProps {
  app: AppDefinition;
  entity: string;
  field: string;
  data: Record<string, any>;
  variant?: 'default' | 'primary' | 'secondary' | 'badge' | 'metadata';
  showLabel?: boolean;
  inline?: boolean;
}

export function EntityField({ 
  app, 
  entity, 
  field, 
  data, 
  variant = 'default',
  showLabel = false,
  inline = false,
  ...props 
}: EntityFieldProps): string {
  const entityDef = app.entities[entity];
  if (!entityDef) {
    return Alert({ 
      type: 'error', 
      children: `Entity '${entity}' not found`,
      ...props 
    });
  }

  const fieldDef = entityDef.fields[field];
  if (!fieldDef) {
    return Alert({ 
      type: 'error', 
      children: `Field '${field}' not found`,
      ...props 
    });
  }

  const value = data[field];
  if (value === null || value === undefined) {
    return Text({ 
      children: '—', 
      color: 'gray.400',
      ...props 
    });
  }

  // Get color mapping if exists
  const colorMapping = entityDef.ui?.display?.color;
  let color = 'inherit';
  if (colorMapping && colorMapping.field === field && colorMapping.map[value]) {
    color = colorMapping.map[value];
  }

  // Format value based on field type
  let formattedValue = formatFieldValue(value, fieldDef.type);

  // Create label if needed
  const labelComponent = showLabel ? Text({ 
    children: `${field}:`,
    size: 'sm',
    weight: 'medium',
    color: 'gray.600'
  }) : '';

  // Create value component based on variant
  let valueComponent = '';
  switch (variant) {
    case 'primary':
      valueComponent = Heading({ 
        level: 3, 
        children: formattedValue,
        color: color,
        ...props 
      });
      break;
      
    case 'secondary':
      valueComponent = Text({ 
        size: 'sm', 
        color: 'gray.600', 
        children: formattedValue,
        ...props 
      });
      break;
      
    case 'badge':
      valueComponent = Badge({
        children: formattedValue,
        bg: color === 'inherit' ? 'gray.100' : color,
        color: color === 'inherit' ? 'gray.800' : 'white',
        ...props
      });
      break;
      
    case 'metadata':
      valueComponent = Text({ 
        size: 'xs', 
        color: 'gray.400', 
        children: formattedValue,
        ...props 
      });
      break;
      
    default:
      valueComponent = Text({ 
        children: formattedValue, 
        color: color,
        ...props 
      });
  }

  // Combine label and value
  if (showLabel && labelComponent) {
    if (inline) {
      return Stack({
        direction: 'horizontal',
        gap: 2,
        align: 'center',
        children: labelComponent + valueComponent
      });
    } else {
      return Stack({
        gap: 1,
        children: labelComponent + valueComponent
      });
    }
  }

  return valueComponent;
}

export interface EntityCardProps extends BaseProps, InteractionProps {
  app: AppDefinition;
  entity: string;
  data: Record<string, any>;
  actions?: string[];
  onClick?: string;
  compact?: boolean;
  showActions?: boolean;
}

export function EntityCard({ 
  app, 
  entity, 
  data, 
  actions = [], 
  onClick, 
  compact = false,
  showActions = true,
  ...props 
}: EntityCardProps): string {
  const entityDef = app.entities[entity];
  if (!entityDef) {
    return Alert({ 
      type: 'error',
      children: `Entity '${entity}' not found`,
      ...props 
    });
  }

  const uiConfig = entityDef.ui?.display;
  if (!uiConfig) {
    // Fallback to basic display
    const primaryField = Object.keys(entityDef.fields)[0];
    return Card({
      children: Text({ children: data[primaryField] || 'No data' }),
      p: compact ? 3 : 4,
      'data-action': onClick ? 'click' : undefined,
      'data-entity': entity,
      'data-id': data.id,
      ...props
    });
  }

  const contentParts = [];

  // Primary content
  if (uiConfig.primary) {
    contentParts.push(EntityField({ 
      app, 
      entity, 
      field: uiConfig.primary, 
      data, 
      variant: 'primary'
    }));
  }

  // Secondary and badge in horizontal stack
  const topMeta = [];
  if (uiConfig.secondary) {
    topMeta.push(EntityField({ 
      app, 
      entity, 
      field: uiConfig.secondary, 
      data, 
      variant: 'secondary'
    }));
  }
  
  if (uiConfig.badge) {
    topMeta.push(EntityField({ 
      app, 
      entity, 
      field: uiConfig.badge, 
      data, 
      variant: 'badge'
    }));
  }
  
  if (topMeta.length > 0) {
    contentParts.push(Stack({
      direction: 'horizontal',
      gap: 2,
      align: 'center',
      children: topMeta.join('')
    }));
  }

  // Metadata fields
  if (uiConfig.metadata && uiConfig.metadata.length > 0 && !compact) {
    const metadataItems = uiConfig.metadata.map(field => 
      EntityField({ 
        app, 
        entity, 
        field, 
        data, 
        variant: 'metadata',
        showLabel: true,
        inline: true
      })
    );
    
    contentParts.push(Stack({
      direction: compact ? 'horizontal' : 'vertical',
      gap: compact ? 4 : 2,
      children: metadataItems.join('')
    }));
  }

  // Actions
  if (showActions && actions.length > 0) {
    const actionButtons = actions.map(action => {
      const actionConfig = getActionConfig(action, entity, data);
      return Button({
        children: actionConfig.label,
        variant: actionConfig.variant,
        size: compact ? 'xs' : 'sm',
        'data-action': action,
        'data-entity': entity,
        'data-id': data.id,
        'data-confirm': actionConfig.confirm
      });
    });
    
    contentParts.push(Stack({
      direction: 'horizontal',
      gap: 1,
      children: actionButtons.join('')
    }));
  }

  const cardContent = Stack({
    gap: compact ? 2 : 3,
    children: contentParts.join('')
  });

  return Card({
    children: cardContent,
    p: compact ? 3 : 4,
    shadow: compact ? 0 : 1,
    'data-action': onClick && !actions.length ? 'click' : undefined,
    'data-entity': entity,
    'data-id': data.id,
    ...props
  });
}

export interface EntityListProps extends BaseProps {
  app: AppDefinition;
  entity: string;
  data: Record<string, any>[];
  actions?: string[];
  onItemClick?: (item: Record<string, any>) => string;
  view?: 'cards' | 'table' | 'compact';
  columns?: number | number[];
  emptyMessage?: string;
  loading?: boolean;
}

export function EntityList({ 
  app, 
  entity, 
  data, 
  actions = [], 
  onItemClick,
  view = 'cards',
  columns = [1, 2, 3],
  emptyMessage,
  loading = false,
  ...props 
}: EntityListProps): string {
  if (loading) {
    return Card({
      children: Text({ 
        children: `Loading ${entity.toLowerCase()}s...`, 
        color: 'gray.600',
        align: 'center'
      }),
      p: 6,
      ...props
    });
  }

  if (!data || data.length === 0) {
    const message = emptyMessage || `No ${entity.toLowerCase()}s found`;
    return Card({
      children: Text({ 
        children: message, 
        color: 'gray.400',
        align: 'center'
      }),
      p: 6,
      ...props
    });
  }

  const entityDef = app.entities[entity];
  const listConfig = entityDef?.ui?.list;

  // Determine view type
  const useTableView = view === 'table' || (listConfig?.columns && listConfig.columns.length > 0);
  
  if (useTableView) {
    return renderEntityTable(app, entity, data, listConfig, actions, props);
  } else {
    // Card grid view
    const isCompact = view === 'compact';
    const cards = data.map(item => 
      EntityCard({
        app,
        entity,
        data: item,
        actions,
        onClick: onItemClick ? onItemClick(item) : undefined,
        compact: isCompact
      })
    ).join('');

    return Grid({
      cols: columns,
      gap: isCompact ? 2 : 4,
      children: cards,
      ...props
    });
  }
}

export interface EntityViewProps extends BaseProps {
  app: AppDefinition;
  entity: string;
  view: 'list' | 'form' | 'detail';
  data?: Record<string, any> | Record<string, any>[];
  mode?: 'create' | 'edit' | 'view';
  actions?: string[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
}

export function EntityView({ 
  app, 
  entity, 
  view, 
  data, 
  mode = 'view', 
  actions = [],
  title,
  subtitle,
  loading = false,
  error,
  ...props 
}: EntityViewProps): string {
  const entityDef = app.entities[entity];
  
  if (!entityDef) {
    return Alert({ 
      type: 'error',
      title: 'Entity Not Found',
      children: `Entity '${entity}' not found`,
      ...props
    });
  }

  if (error) {
    return Alert({
      type: 'error',
      title: 'Error',
      children: error,
      ...props
    });
  }

  // Create header if title or subtitle provided
  const header = (title || subtitle) ? Stack({
    gap: 1,
    children: `
      ${title ? Heading({ level: 1, children: title }) : ''}
      ${subtitle ? Text({ size: 'lg', color: 'gray.600', children: subtitle }) : ''}
    `
  }) : '';

  let content = '';
  switch (view) {
    case 'list':
      content = EntityList({
        app,
        entity,
        data: Array.isArray(data) ? data : [],
        actions,
        loading
      });
      break;
      
    case 'form':
      content = renderEntityForm(app, entity, mode, data as Record<string, any>, props);
      break;
      
    case 'detail':
      content = renderEntityDetail(app, entity, data as Record<string, any>, actions, props);
      break;
      
    default:
      content = Alert({ 
        type: 'error',
        children: `Unknown view type: ${view}`,
        ...props
      });
  }

  if (header) {
    return Stack({
      gap: 6,
      children: header + content,
      ...props
    });
  }

  return content;
}

// Helper functions
function formatFieldValue(value: any, type: string): string {
  if (value === null || value === undefined) return '—';
  
  switch (type) {
    case 'date':
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return String(value);
      }
    case 'number':
      return Number(value).toLocaleString();
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'enum':
      return String(value).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    default:
      return String(value);
  }
}

function getActionConfig(action: string, entity: string, data: Record<string, any>) {
  const actions: Record<string, any> = {
    edit: {
      label: 'Edit',
      variant: 'secondary',
      onClick: `window.location.href='/${entity.toLowerCase()}s/${data.id}/edit'`,
      confirm: undefined
    },
    delete: {
      label: 'Delete',
      variant: 'danger',
      onClick: `confirmDelete('${entity}', '${data.id}')`,
      confirm: `Are you sure you want to delete this ${entity.toLowerCase()}?`
    },
    view: {
      label: 'View',
      variant: 'ghost',
      onClick: `window.location.href='/${entity.toLowerCase()}s/${data.id}'`,
      confirm: undefined
    },
    complete: {
      label: 'Complete',
      variant: 'success',
      onClick: undefined,
      confirm: undefined
    },
    archive: {
      label: 'Archive',
      variant: 'warning',
      onClick: undefined,
      confirm: `Are you sure you want to archive this ${entity.toLowerCase()}?`
    }
  };
  
  return actions[action] || {
    label: action.charAt(0).toUpperCase() + action.slice(1),
    variant: 'secondary',
    onClick: `console.log('${action}', '${data.id}')`,
    confirm: undefined
  };
}

function renderEntityTable(app: AppDefinition, entity: string, data: Record<string, any>[], listConfig: any, actions: string[], props?: BaseProps): string {
  const entityDef = app.entities[entity];
  const columns = listConfig?.columns || Object.keys(entityDef.fields).filter(f => f !== 'id').slice(0, 5);
  
  // Build table columns configuration
  const tableColumns = columns.map((col: string) => ({
    key: col,
    label: col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' '),
    width: undefined,
    align: 'left' as const
  }));
  
  // Add actions column if actions exist
  if (actions.length > 0) {
    tableColumns.push({ 
      key: 'actions', 
      label: 'Actions', 
      width: '150px',
      align: 'right' as const
    });
  }
  
  // Build table data
  const tableData = data.map(item => {
    const row: Record<string, any> = {};
    
    // Add field data
    columns.forEach((col: string) => {
      row[col] = EntityField({ app, entity, field: col, data: item });
    });
    
    // Add action buttons
    if (actions.length > 0) {
      const actionButtons = actions.map(action => {
        const config = getActionConfig(action, entity, item);
        return Button({ 
          children: config.label, 
          variant: config.variant, 
          size: 'sm',
          'data-action': action,
          'data-entity': entity,
          'data-id': item.id,
          'data-confirm': config.confirm
        });
      });
      
      row.actions = Stack({
        direction: 'horizontal',
        gap: 1,
        children: actionButtons.join('')
      });
    }
    
    return row;
  });
  
  return Card({
    children: Table({ 
      data: tableData, 
      columns: tableColumns,
      striped: true,
      hoverable: true
    }),
    p: 0,
    shadow: 1,
    ...props
  });
}

function renderEntityForm(app: AppDefinition, entity: string, mode: string, data?: Record<string, any>, props?: BaseProps): string {
  const entityDef = app.entities[entity];
  const formConfig = entityDef.ui?.form;
  const fields = formConfig?.fields || Object.keys(entityDef.fields).filter(f => f !== 'id' && f !== 'created_at' && f !== 'updated_at');
  
  const formFields = fields.map(fieldName => 
    renderFormField(entityDef, fieldName, data?.[fieldName])
  ).join('');
  
  const actionButtons = Stack({
    direction: 'horizontal',
    gap: 3,
    children: `
      ${Button({ 
        children: mode === 'create' ? 'Create' : 'Save Changes', 
        type: 'submit', 
        variant: 'primary',
        'data-action': mode === 'create' ? 'create' : 'update',
        'data-entity': entity
      })}
      ${Button({ 
        children: 'Cancel', 
        variant: 'secondary', 
        onClick: 'history.back()'
      })}
    `
  });
  
  const formContent = Form({
    method: 'POST',
    action: mode === 'create' ? `/${entity.toLowerCase()}s` : `/${entity.toLowerCase()}s/${data?.id}`,
    children: Stack({
      gap: 4,
      children: formFields
    }) + actionButtons,
    'data-entity': entity,
    'data-mode': mode
  });
  
  return Card({
    children: Stack({
      gap: 6,
      children: `
        ${Heading({ 
          level: 2, 
          children: `${mode === 'create' ? 'Create New' : 'Edit'} ${entity}`,
          color: 'gray.800'
        })}
        ${formContent}
      `
    }),
    p: 6,
    shadow: 1,
    ...props
  });
}

function renderEntityDetail(app: AppDefinition, entity: string, data: Record<string, any>, actions: string[], props?: BaseProps): string {
  const entityDef = app.entities[entity];
  const detailConfig = entityDef.ui?.detail;
  
  if (detailConfig?.sections) {
    const sections = detailConfig.sections.map(section => {
      const sectionFields = section.fields.map(field => 
        EntityField({ 
          app, 
          entity, 
          field, 
          data,
          showLabel: true
        })
      ).join('');
      
      return Stack({
        gap: 4,
        children: `
          ${Heading({ 
            level: 3, 
            children: section.title,
            color: 'gray.700',
            size: 'lg'
          })}
          ${Grid({
            cols: [1, 2],
            gap: 4,
            children: sectionFields
          })}
        `
      });
    }).join('');
    
    const actionSection = actions.length > 0 ? Stack({
      direction: 'horizontal',
      gap: 3,
      children: actions.map(action => {
        const config = getActionConfig(action, entity, data);
        return Button({ 
          children: config.label, 
          variant: config.variant,
          'data-action': action,
          'data-entity': entity,
          'data-id': data.id,
          'data-confirm': config.confirm
        });
      }).join('')
    }) : '';
    
    return Card({
      children: Stack({
        gap: 6,
        children: sections + actionSection
      }),
      p: 6,
      shadow: 1,
      ...props
    });
  }
  
  // Default detail view - show all fields except system fields
  const visibleFields = Object.keys(entityDef.fields)
    .filter(field => !['id', 'created_at', 'updated_at'].includes(field));
    
  const fieldElements = visibleFields.map(field => 
    EntityField({ 
      app, 
      entity, 
      field, 
      data,
      showLabel: true
    })
  ).join('');
  
  const actionSection = actions.length > 0 ? Stack({
    direction: 'horizontal',
    gap: 3,
    children: actions.map(action => {
      const config = getActionConfig(action, entity, data);
      return Button({ 
        children: config.label, 
        variant: config.variant,
        'data-action': action,
        'data-entity': entity,
        'data-id': data.id,
        'data-confirm': config.confirm
      });
    }).join('')
  }) : '';
  
  return Card({
    children: Stack({
      gap: 6,
      children: `
        ${Grid({
          cols: [1, 2],
          gap: 4,
          children: fieldElements
        })}
        ${actionSection}
      `
    }),
    p: 6,
    shadow: 1,
    ...props
  });
}

function renderFormField(entityDef: EntityDefinition, fieldName: string, value?: any): string {
  const fieldDef = entityDef.fields[fieldName];
  if (!fieldDef) return '';
  
  const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' ');
  const required = fieldDef.required || false;
  const help = getFieldHelp(fieldDef);
  
  switch (fieldDef.type) {
    case 'enum':
      const options = 'values' in fieldDef ? fieldDef.values || [] : [];
      return Select({
        name: fieldName,
        label: label,
        options: options,
        value: value || '',
        required: required,
        help: help,
        placeholder: `Select a ${label.toLowerCase()}...`
      });
      
    case 'date':
      return Input({
        type: 'date',
        name: fieldName,
        label: label,
        value: value ? formatDateForInput(value) : '',
        required: required,
        help: help
      });
      
    case 'text':
      return Input({
        type: 'textarea',
        name: fieldName,
        label: label,
        value: value || '',
        required: required,
        rows: 4,
        help: help
      });
      
    case 'number':
      return Input({
        type: 'number',
        name: fieldName,
        label: label,
        value: value || '',
        required: required,
        help: help
      });
      
    case 'email':
      return Input({
        type: 'email',
        name: fieldName,
        label: label,
        value: value || '',
        required: required,
        help: help
      });
      
    case 'boolean':
      return Select({
        name: fieldName,
        label: label,
        options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }],
        value: value !== undefined ? String(value) : '',
        required: required,
        help: help
      });
      
    default:
      return Input({
        type: 'text',
        name: fieldName,
        label: label,
        value: value || '',
        required: required,
        help: help
      });
  }
}

function getFieldHelp(fieldDef: any): string | undefined {
  if (fieldDef.description) return fieldDef.description;
  if (fieldDef.validation) return `Validation: ${fieldDef.validation}`;
  return undefined;
}

function formatDateForInput(value: any): string {
  try {
    const date = new Date(value);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}