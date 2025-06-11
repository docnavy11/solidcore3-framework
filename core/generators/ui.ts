import { AppDefinition, EntityDefinition, ViewDefinition } from '../types/index.ts';
import { Generator, GeneratorError } from './types.ts';
import { DashboardGenerator } from './dashboard.ts';
import { 
  Stack, 
  Grid, 
  Card, 
  Heading, 
  Text, 
  Button, 
  View,
  Page,
  EntityView
} from '../ui/components/index.ts';
import { generateToastJS } from '../ui/components/Feedback.ts';
import { generateInteractionRuntime } from '../ui/runtime/interactions.ts';
import { TemplateLoader } from '../ui/templates/template-loader.ts';

export class UIGenerator implements Generator<Record<string, string>> {
  constructor(private app: AppDefinition) {}

  async generate(): Promise<Record<string, string>> {
    console.log(`[UIGenerator] Generating UI pages for ${Object.keys(this.app.entities || {}).length} entities`);
    
    if (!this.app.entities) {
      throw new GeneratorError('UIGenerator', 'No entities defined in app');
    }
    const pages: Record<string, string> = {};

    // Generate index page using components
    pages['/'] = this.generateIndexPage();

    // Generate pages for each view
    if (this.app.views) {
      for (const [viewName, view] of Object.entries(this.app.views)) {
        pages[view.route] = await this.generateViewPage(viewName, view);
      }
    }

    // Generate edit pages for entities
    for (const [entityName, entity] of Object.entries(this.app.entities)) {
      const editRoute = `/${entityName.toLowerCase()}s/:id/edit`; // Add 's' for plural
      pages[editRoute] = this.generateEditPage(entityName, entity);
    }

    // Generate system dashboard pages
    const dashboardGenerator = new DashboardGenerator(this.app);
    const dashboardPages = await dashboardGenerator.generate();
    Object.assign(pages, dashboardPages);

    console.log('[UIGenerator] Done');
    return pages;
  }

  private generateIndexPage(): string {
    const entityCards = Object.keys(this.app.entities).map(entityName => 
      Card({ 
        children: `
          ${Heading({ level: 3, children: entityName })}
          ${Text({ children: `Manage ${entityName.toLowerCase()} records` })}
          ${Button({ 
            children: `View ${entityName}s`,
            onClick: `window.location.href='/api/${entityName.toLowerCase()}'`
          })}
        `,
        p: 4
      })
    ).join('');

    const viewCards = this.app.views ? Object.entries(this.app.views).map(([viewName, view]) => 
      Card({ 
        children: `
          ${Heading({ level: 3, children: view.title || viewName })}
          ${Button({ 
            children: 'Open',
            onClick: `window.location.href='${view.route}'`
          })}
        `,
        p: 4
      })
    ).join('') : '';

    const content = Stack({
      gap: 6,
      children: `
        ${Card({ 
          children: Heading({ level: 1, children: `Welcome to ${this.app.name}` }),
          p: 6
        })}
        
        <div class="section">
          ${Heading({ level: 2, children: 'API Entities' })}
          ${Grid({ 
            cols: 3, 
            gap: 4, 
            children: entityCards 
          })}
        </div>
        
        ${this.app.views ? `
          <div class="section">
            ${Heading({ level: 2, children: 'Views' })}
            ${Grid({ 
              cols: 3, 
              gap: 4, 
              children: viewCards 
            })}
          </div>
        ` : ''}
        
        <div class="section">
          ${Card({
            children: `
              ${Heading({ level: 2, children: 'Quick Actions' })}
              ${Stack({
                direction: 'horizontal',
                gap: 4,
                children: `
                  ${Button({ children: '🎯 Truth Explorer', onClick: "window.location.href='/dashboard/truth'" })}
                  ${Button({ children: '🏠 System Dashboard', onClick: "window.location.href='/dashboard'", variant: 'secondary' })}
                  ${Button({ children: 'System Health', onClick: "window.location.href='/health'", variant: 'secondary' })}
                `
              })}
            `,
            p: 4
          })}
        </div>
      `
    });

    return Page({
      title: this.app.name,
      children: content,
      styles: `
        .section { margin-bottom: 2rem; }
        ul { list-style: none; padding: 0; }
        li { margin: 0.5rem 0; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .badge { 
          background: #e3f2fd; 
          color: #1976d2; 
          padding: 0.2rem 0.5rem; 
          border-radius: 12px; 
          font-size: 0.8rem; 
        }
      `
    });
  }

  private async generateViewPage(viewName: string, view: ViewDefinition): Promise<string> {
    console.log(`[UIGenerator] Generating view page: ${viewName} (type: ${view.type})`);
    
    // 🎯 DIRECT MAPPING: Truth file type → EntityView component
    switch (view.type || view.layout) {
      case 'list':
        return this.renderWithEntityView(viewName, view, 'list');
      case 'form':
        return this.renderWithEntityView(viewName, view, 'form');
      case 'detail':
        return this.renderWithEntityView(viewName, view, 'detail');
      case 'custom':
        return await this.renderCustomPage(viewName, view);
      default:
        // For non-custom views, entity is required
        const entity = view.entity ? this.app.entities[view.entity] : null;
        if (!entity) {
          return this.generateErrorPage(`Entity '${view.entity}' not found for view '${viewName}'`);
        }
        return this.renderWithEntityView(viewName, view, 'list');
    }
  }

  private async renderCustomPage(viewName: string, view: ViewDefinition): Promise<string> {
    const template = (view as any).template || 'default';
    
    try {
      // Use the new template system with fallback
      const customContent = await TemplateLoader.loadTemplate(template, {
        app: this.app,
        view,
        viewName,
        // Additional context can be added here
        currentDate: new Date().toISOString(),
        environment: 'development' // Could be from config
      });
      
      return Page({
        title: view.title || viewName,
        appName: this.app.name,
        children: View({ children: customContent })
      });
    } catch (error) {
      console.error(`[UIGenerator] Error loading template '${template}':`, error);
      
      // Fallback to simple error page
      const errorContent = `
        <div style="max-width: 600px; margin: 0 auto; padding: 2rem; text-align: center;">
          ${Heading({ level: 1, children: 'Template Error' })}
          ${Text({ 
            children: `Failed to load template '${template}'. Please check the template file.`,
            size: 'lg',
            color: 'red'
          })}
          <div style="margin: 2rem 0;">
            ${Button({ 
              children: 'Go Home',
              variant: 'primary',
              onClick: "window.location.href='/'"
            })}
          </div>
        </div>
      `;
      
      return Page({
        title: 'Template Error',
        appName: this.app.name,
        children: View({ children: errorContent })
      });
    }
  }

  private renderWithEntityView(viewName: string, view: ViewDefinition, viewType: 'list' | 'form' | 'detail'): string {
    const entityName = view.entity || '';

    const content = View({
      children: `
        <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
          ${Heading({ level: 1, children: view.title || viewName })}
          ${this.generateNavigationButtons(viewType, entityName)}
        </div>
        
        <div id="content" data-entity="${entityName}" data-view="${viewType}">
          <div style="text-align: center; padding: 2rem; color: #6b7280;">Loading...</div>
        </div>
      `
    });

    return this.wrapInPage(content, view, viewType);
  }


  private generateNavigationButtons(viewType: string, entityName: string): string {
    switch (viewType) {
      case 'list':
        return Button({ 
          children: 'Create New',
          variant: 'primary',
          onClick: `window.location.href='/${entityName.toLowerCase()}s/new'`
        });
      case 'form':
        return Button({ 
          children: 'Back to List',
          variant: 'secondary',
          onClick: `window.location.href='/${entityName.toLowerCase()}s'`
        });
      case 'detail':
        return Button({ 
          children: 'Back to List',
          variant: 'secondary',
          onClick: `window.location.href='/${entityName.toLowerCase()}s'`
        });
      default:
        return '';
    }
  }

  private wrapInPage(content: string, view: ViewDefinition, viewType: string): string {
    const entityName = view.entity || '';
    
    const scripts = `
      <script type="module">
        const app = ${JSON.stringify(this.app, null, 2)};
        
        // Interaction system
        ${generateInteractionRuntime()}
        
        // Toast notifications
        ${generateToastJS()}
        
        ${this.generateViewScript(viewType, entityName)}
        
        // Load data on page load
        loadData();
      </script>
    `;
    
    return Page({
      title: view.title || view.route,
      appName: this.app.name,
      children: content,
      scripts
    });
  }

  private generateViewScript(viewType: string, entityName: string): string {
    return `
      async function loadData() {
        try {
          ${this.generateDataLoadingScript(viewType, entityName)}
        } catch (error) {
          document.getElementById('content').innerHTML = 
            \`<div class="error" style="color: #dc2626; background: #fef2f2; padding: 1rem; border-radius: 0.5rem;">Error loading data: \${error.message}</div>\`;
        }
      }
      
      ${this.generateFormSubmissionHandler(entityName)}
    `;
  }

  private generateDataLoadingScript(viewType: string, entityName: string): string {
    switch (viewType) {
      case 'list':
        return `
          const response = await fetch('/api/${entityName.toLowerCase()}');
          const result = await response.json();
          
          // Handle different response formats
          let data = [];
          if (result.data && result.data.items) {
            data = result.data.items;
          } else if (result.data && Array.isArray(result.data)) {
            data = result.data;
          } else if (Array.isArray(result)) {
            data = result;
          }

          // Render task list as data grid based on truth file configuration
          if (data.length === 0) {
            document.getElementById('content').innerHTML = 
              \`<div style="text-align: center; padding: 3rem; color: #9ca3af;">No ${entityName.toLowerCase()}s found</div>\`;
          } else {
            // Get entity configuration from app
            const entity = app.entities['${entityName}'];
            const listConfig = entity?.ui?.list;
            const columns = listConfig?.columns || ['title', 'status', 'priority', 'dueDate'];
            
            // Create table headers
            const headers = columns.map(col => \`
              <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; color: #374151; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                \${col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ')}
              </th>
            \`).join('');
            
            // Add actions column header
            const actionsHeader = \`<th style="padding: 0.75rem 1rem; text-align: right; font-weight: 600; color: #374151; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">Actions</th>\`;
            
            // Create table rows
            const rows = data.map((item, index) => {
              // Format each column value
              const cells = columns.map(col => {
                let value = item[col];
                
                // Format based on field type
                if (col === 'dueDate' && value) {
                  value = new Date(value).toLocaleDateString();
                } else if (col === 'status') {
                  // Add color coding for status
                  const statusColors = {
                    'todo': '#6b7280',
                    'in-progress': '#3b82f6',
                    'done': '#10b981',
                    'archived': '#9ca3af'
                  };
                  const color = statusColors[value] || '#6b7280';
                  value = \`<span style="background: \${color}20; color: \${color}; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 500;">\${value}</span>\`;
                } else if (col === 'priority') {
                  // Add color coding for priority
                  const priorityColors = {
                    'high': '#ef4444',
                    'medium': '#f59e0b',
                    'low': '#10b981'
                  };
                  const color = priorityColors[value] || '#6b7280';
                  value = \`<span style="color: \${color}; font-weight: 500;">\${value}</span>\`;
                }
                
                return \`<td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">\${value || '—'}</td>\`;
              }).join('');
              
              // Add action buttons
              const actions = \`
                <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; text-align: right;">
                  <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button onclick="window.location.href='/${entityName.toLowerCase()}s/\${item.id}/edit'" 
                            style="padding: 0.375rem 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.75rem;">
                      Edit
                    </button>
                    <button data-action="delete" data-entity="${entityName}" data-id="\${item.id}" 
                            data-method="DELETE" data-url="/api/${entityName.toLowerCase()}/\${item.id}"
                            data-confirm="Are you sure you want to delete this ${entityName.toLowerCase()}?" data-success="reload"
                            style="padding: 0.375rem 0.75rem; background: #ef4444; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.75rem;">
                      Delete
                    </button>
                  </div>
                </td>
              \`;
              
              const rowStyle = index % 2 === 0 ? 'background: white;' : 'background: #f9fafb;';
              return \`<tr style="\${rowStyle} transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='\${index % 2 === 0 ? 'white' : '#f9fafb'}'">\${cells}\${actions}</tr>\`;
            }).join('');
            
            // Render complete data grid
            document.getElementById('content').innerHTML = \`
              <div style="background: white; border-radius: 0.5rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr>
                      \${headers}
                      \${actionsHeader}
                    </tr>
                  </thead>
                  <tbody>
                    \${rows}
                  </tbody>
                </table>
              </div>
            \`;
          }
        `;
        
      case 'form':
        return `
          const pathParts = window.location.pathname.split('/');
          const isEdit = pathParts.includes('edit');
          const id = isEdit ? pathParts[pathParts.length - 2] : null;
          
          let data = {};
          if (isEdit && id) {
            const response = await fetch(\`/api/${entityName.toLowerCase()}/\${id}\`);
            const result = await response.json();
            data = result.data || result;
          }

          // Use simplified form rendering
          const mode = isEdit ? 'edit' : 'create';
          document.getElementById('content').innerHTML = 
            \`<div class="entity-form">\${mode} form for ${entityName} (ID: \${id || 'new'})</div>\`;
        `;
        
      case 'detail':
        return `
          const pathParts = window.location.pathname.split('/');
          const id = pathParts[pathParts.length - 1];
          
          const response = await fetch(\`/api/${entityName.toLowerCase()}/\${id}\`);
          const result = await response.json();
          
          if (response.ok && result.data) {
            document.getElementById('content').innerHTML = 
              \`<div class="entity-detail">Detail view for ${entityName} ID: \${id}</div>\`;
          } else {
            document.getElementById('content').innerHTML = 
              \`<div class="error" style="color: #dc2626; background: #fef2f2; padding: 1rem; border-radius: 0.5rem;">Item not found</div>\`;
          }
        `;
        
      default:
        return this.generateDataLoadingScript('list', entityName);
    }
  }

  private generateFormSubmissionHandler(entityName: string): string {
    return `
      // Form submission handler
      document.addEventListener('submit', async function(event) {
        const form = event.target;
        if (!form.matches('[data-entity="${entityName}"]')) return;
        
        event.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const mode = form.dataset.mode || 'create';
        const id = form.dataset.id;
        
        try {
          const url = mode === 'create' 
            ? \`/api/${entityName.toLowerCase()}\` 
            : \`/api/${entityName.toLowerCase()}/\${id}\`;
          const method = mode === 'create' ? 'POST' : 'PUT';
          
          const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          if (response.ok) {
            window.showSuccess(\`\${entityName} \${mode === 'create' ? 'created' : 'updated'} successfully!\`);
            setTimeout(() => {
              window.location.href = \`/${entityName.toLowerCase()}s\`;
            }, 1500);
          } else {
            const result = await response.json();
            window.showError(\`Error: \${result.error || response.statusText}\`);
          }
        } catch (error) {
          window.showError(\`Error: \${error.message}\`);
        }
      });
    `;
  }






  private generateEditPage(entityName: string, entity: EntityDefinition): string {
    const formConfig = entity.ui?.form;
    const detailConfig = entity.ui?.detail;
    
    // Use form fields if configured, otherwise use detail sections, otherwise all fields
    let fieldsToShow: string[] = [];
    if (formConfig?.fields) {
      fieldsToShow = formConfig.fields;
    } else if (detailConfig?.sections) {
      fieldsToShow = detailConfig.sections.flatMap(section => section.fields);
    } else {
      fieldsToShow = Object.keys(entity.fields).filter(name => 
        !['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(name)
      );
    }

    const content = View({
      children: `
        <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem;">
          ${Heading({ level: 1, children: `Edit ${entityName}` })}
          <button onclick="window.location.href='/tasks'" 
                  style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 0.75rem 1.5rem; border-radius: 0.375rem; font-weight: 500; cursor: pointer;">
            Back to ${entityName}s
          </button>
        </div>
        
        <div id="loading" style="text-align: center; padding: 2rem; color: #6b7280;">Loading...</div>
        
        <div id="editForm" style="display: none;"></div>
        <div id="message"></div>
      `
    });

    const scripts = `
      <script type="module">
        const app = ${JSON.stringify(this.app, null, 2)};
        const fieldsToShow = ${JSON.stringify(fieldsToShow)};
        const pathParts = window.location.pathname.split('/');
        const id = pathParts[pathParts.length - 2]; // Get ID from /entity/id/edit
        
        // Interaction system and toast notifications
        ${generateInteractionRuntime()}
        ${generateToastJS()}
        
        ${this.generateEditPageScript(entityName)}
        
        // Form submission handler for edit page
        document.addEventListener('submit', async function(event) {
          const form = event.target;
          if (!form.matches('[data-entity="${entityName}"][data-mode="edit"]')) return;
          
          event.preventDefault();
          
          const formData = new FormData(form);
          const data = Object.fromEntries(formData.entries());
          const id = form.dataset.id;
          
          try {
            const response = await fetch(\`/api/${entityName.toLowerCase()}/\${id}\`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            if (response.ok) {
              if (window.showSuccess) {
                window.showSuccess('${entityName} updated successfully!');
              }
              window.location.href = '/tasks';
            } else {
              const result = await response.json();
              if (window.showError) {
                window.showError(\`Error: \${result.error || response.statusText}\`);
              } else {
                alert(\`Error: \${result.error || response.statusText}\`);
              }
            }
          } catch (error) {
            if (window.showError) {
              window.showError(\`Error: \${error.message}\`);
            } else {
              alert(\`Error: \${error.message}\`);
            }
          }
        });
        
        // Load record on page load
        loadRecord();
      </script>
    `;

    return Page({
      title: `Edit ${entityName}`,
      appName: this.app.name,
      children: content,
      scripts,
      styles: `
        .btn-secondary:hover { background: #545b62; }
        .btn-danger { background: #dc3545; }
        .btn-danger:hover { background: #c82333; }
        .loading { text-align: center; padding: 2rem; color: #666; }
        .button-group { margin-top: 2rem; }
      `
    });
  }

  private generateEditPageScript(entityName: string): string {
    return `
      async function loadRecord() {
        try {
          const response = await fetch(\`/api/${entityName.toLowerCase()}/\${id}\`);
          const result = await response.json();
          
          let data = null;
          if (result.data && result.data.items) {
            data = result.data.items[0];
          } else if (result.data) {
            data = result.data;
          } else if (result) {
            data = result;
          }
          
          if (data) {
            // Generate actual form fields based on entity definition
            const entity = app.entities['${entityName}'];
            const fields = fieldsToShow || Object.keys(entity.fields).filter(name => 
              !['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(name)
            );
            
            const formFields = fields.map(fieldName => {
              const fieldDef = entity.fields[fieldName];
              const value = data[fieldName] || '';
              const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' ');
              const required = fieldDef.required ? 'required' : '';
              
              let fieldHtml = '';
              
              switch (fieldDef.type) {
                case 'enum':
                  const options = fieldDef.values || fieldDef.options || [];
                  const optionHtml = options.map(opt => 
                    \`<option value="\${opt}" \${value === opt ? 'selected' : ''}>\${opt}</option>\`
                  ).join('');
                  fieldHtml = \`
                    <div style="margin-bottom: 1rem;">
                      <label style="display: block; font-weight: 500; margin-bottom: 0.5rem; color: #374151;">\${label} \${required ? '*' : ''}</label>
                      <select name="\${fieldName}" \${required} style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem;">
                        <option value="">Select \${label.toLowerCase()}...</option>
                        \${optionHtml}
                      </select>
                    </div>
                  \`;
                  break;
                  
                case 'text':
                  fieldHtml = \`
                    <div style="margin-bottom: 1rem;">
                      <label style="display: block; font-weight: 500; margin-bottom: 0.5rem; color: #374151;">\${label} \${required ? '*' : ''}</label>
                      <textarea name="\${fieldName}" rows="4" \${required} style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem; resize: vertical;">\${value}</textarea>
                    </div>
                  \`;
                  break;
                  
                case 'date':
                  const dateValue = value ? new Date(value).toISOString().split('T')[0] : '';
                  fieldHtml = \`
                    <div style="margin-bottom: 1rem;">
                      <label style="display: block; font-weight: 500; margin-bottom: 0.5rem; color: #374151;">\${label} \${required ? '*' : ''}</label>
                      <input type="date" name="\${fieldName}" value="\${dateValue}" \${required} style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem;" />
                    </div>
                  \`;
                  break;
                  
                case 'boolean':
                  fieldHtml = \`
                    <div style="margin-bottom: 1rem;">
                      <label style="display: block; font-weight: 500; margin-bottom: 0.5rem; color: #374151;">\${label}</label>
                      <select name="\${fieldName}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem;">
                        <option value="false" \${value === false || value === 'false' ? 'selected' : ''}>No</option>
                        <option value="true" \${value === true || value === 'true' ? 'selected' : ''}>Yes</option>
                      </select>
                    </div>
                  \`;
                  break;
                  
                case 'number':
                case 'integer':
                  fieldHtml = \`
                    <div style="margin-bottom: 1rem;">
                      <label style="display: block; font-weight: 500; margin-bottom: 0.5rem; color: #374151;">\${label} \${required ? '*' : ''}</label>
                      <input type="number" name="\${fieldName}" value="\${value}" \${required} style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem;" />
                    </div>
                  \`;
                  break;
                  
                default: // string and other types
                  fieldHtml = \`
                    <div style="margin-bottom: 1rem;">
                      <label style="display: block; font-weight: 500; margin-bottom: 0.5rem; color: #374151;">\${label} \${required ? '*' : ''}</label>
                      <input type="text" name="\${fieldName}" value="\${value}" \${required} style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem;" />
                    </div>
                  \`;
              }
              
              return fieldHtml;
            }).join('');
            
            document.getElementById('editForm').innerHTML = \`
              <form data-entity="${entityName}" data-mode="edit" data-id="\${id}" 
                    style="background: white; border-radius: 0.5rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div class="form-content">
                  \${formFields}
                </div>
                <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end; border-top: 1px solid #e5e7eb; padding-top: 1rem;">
                  <button type="submit" 
                          style="background: #0066cc; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; font-weight: 500; cursor: pointer;">
                    Update ${entityName}
                  </button>
                  <button type="button" 
                          onclick="window.history.back()" 
                          style="background: #6b7280; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; font-weight: 500; cursor: pointer;">
                    Cancel
                  </button>
                  <button type="button" 
                          data-action="delete" 
                          data-entity="${entityName}" 
                          data-id="\${id}" 
                          data-confirm="Are you sure you want to delete this record? This action cannot be undone."
                          data-success="redirect"
                          data-redirect="/${entityName.toLowerCase()}s"
                          style="background: #dc3545; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; font-weight: 500; cursor: pointer;">
                    Delete
                  </button>
                </div>
              </form>
            \`;
            document.getElementById('loading').style.display = 'none';
            document.getElementById('editForm').style.display = 'block';
            
            // Show success message
            if (window.showSuccess) {
              window.showSuccess('Record loaded successfully!');
            }
          } else {
            document.getElementById('loading').innerHTML = 
              '<div style="color: #dc2626; background: #fef2f2; padding: 1rem; border-radius: 0.5rem;">Record not found</div>';
          }
        } catch (error) {
          document.getElementById('loading').innerHTML = 
            \`<div style="color: #dc2626; background: #fef2f2; padding: 1rem; border-radius: 0.5rem;">Error loading record: \${error.message}</div>\`;
        }
      }
    `;
  }


  private generateErrorPage(message: string): string {
    const content = View({
      children: `
        ${Heading({ level: 1, children: 'Error' })}
        ${Text({ children: message })}
        ${Button({ 
          children: 'Back to Home',
          onClick: "window.location.href='/'"
        })}
      `
    });

    return Page({
      title: 'Error',
      appName: this.app.name,
      children: content
    });
  }
}