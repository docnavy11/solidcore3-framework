// System Dashboard Generator - Framework-level dashboard for truth file exploration
import { AppDefinition } from '../types/index.ts';
import { Generator, GeneratorError } from './types.ts';
import { TruthAnalyzer, SystemAnalysis } from '../utils/TruthAnalyzer.ts';
import { 
  View, 
  Card, 
  Heading, 
  Text, 
  Button,
  Stack,
  Grid 
} from '../ui/components/index.ts';

export class DashboardGenerator implements Generator<Record<string, string>> {
  private analyzer: TruthAnalyzer;

  constructor(private app: AppDefinition) {
    this.analyzer = new TruthAnalyzer(app);
  }

  async generate(): Promise<Record<string, string>> {
    console.log('[DashboardGenerator] Generating system dashboard pages');
    
    const pages: Record<string, string> = {};
    
    // Generate truth file explorer dashboard
    pages['/dashboard/truth'] = this.generateTruthExplorer();
    
    console.log('[DashboardGenerator] Done');
    return pages;
  }

  private generateTruthExplorer(): string {
    const analysis = this.analyzer.analyzeSystem();
    
    const content = View({
      children: `
        <div style="margin-bottom: 2rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 2rem;">
          ${Heading({ level: 1, children: '🎯 Truth File Explorer' })}
          ${Text({ children: 'Interactive visualization of your application architecture', size: 'lg', color: '#6b7280' })}
        </div>

        ${this.generateSystemOverviewCards(analysis)}
        ${this.generateEntityTabs(analysis)}
        ${this.generateViewsMatrix(analysis)}
        ${this.generateWorkflowsMatrix(analysis)}
      `
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Truth File Explorer - ${this.app.name}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: system-ui, sans-serif; 
      max-width: 1400px; 
      margin: 0 auto; 
      padding: 2rem; 
      line-height: 1.6;
      background-color: #f9fafb;
    }
    .metric-card {
      background: white;
      border-radius: 0.5rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      text-align: center;
    }
    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
    }
    .metric-label {
      font-size: 0.875rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .field-usage {
      background: #f8fafc;
      border-left: 3px solid #0066cc;
      padding: 0.75rem;
      margin: 0.5rem 0;
      border-radius: 0 0.25rem 0.25rem 0;
    }
    .usage-point {
      font-size: 0.875rem;
      color: #4b5563;
      margin: 0.25rem 0;
    }
    .impact-high { border-left-color: #ef4444; }
    .impact-medium { border-left-color: #f59e0b; }
    .impact-low { border-left-color: #10b981; }
    .warning {
      background: #fef3cd;
      border: 1px solid #fde047;
      padding: 0.75rem;
      border-radius: 0.375rem;
      margin: 0.5rem 0;
    }
    .suggestion {
      background: #ecfdf5;
      border: 1px solid #10b981;
      padding: 0.75rem;
      border-radius: 0.375rem;
      margin: 0.5rem 0;
    }
    .expandable {
      cursor: pointer;
      user-select: none;
    }
    .expandable:hover {
      background-color: #f9fafb;
    }
    .collapsible-content {
      display: none;
      margin-top: 1rem;
    }
    .collapsible-content.open {
      display: block;
    }
    
    /* Tabs Styling */
    .tabs-container {
      margin: 2rem 0;
    }
    .tabs-header {
      display: flex;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 2rem;
      gap: 0.5rem;
    }
    .tab-button {
      background: none;
      border: none;
      padding: 1rem 1.5rem;
      cursor: pointer;
      font-weight: 500;
      color: #6b7280;
      border-bottom: 3px solid transparent;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .tab-button:hover {
      color: #111827;
      background-color: #f9fafb;
    }
    .tab-button.active {
      color: #0066cc;
      border-bottom-color: #0066cc;
      background-color: #f8fafc;
    }
    .tab-badge {
      background: #e5e7eb;
      color: #374151;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-weight: 600;
    }
    .tab-button.active .tab-badge {
      background: #dbeafe;
      color: #1e40af;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
    
    /* Matrix Styling */
    .matrix-container {
      background: white;
      border-radius: 0.5rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }
    .usage-matrix, .views-matrix, .workflows-matrix {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .usage-matrix th, .views-matrix th, .workflows-matrix th {
      background: #f8fafc;
      padding: 1rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
      color: #374151;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .usage-matrix td, .views-matrix td, .workflows-matrix td {
      padding: 0.75rem;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
    }
    .usage-matrix tr:hover, .views-matrix tr:hover, .workflows-matrix tr:hover {
      background-color: #fafafa;
    }
    .field-name, .view-name, .workflow-name {
      font-weight: 600;
      color: #111827;
      min-width: 150px;
    }
    .usage-cell {
      text-align: center;
      font-size: 0.75rem;
      min-width: 80px;
    }
    .usage-cell.used {
      background: #ecfdf5;
      color: #065f46;
      font-weight: 500;
    }
    .usage-cell.unused {
      color: #9ca3af;
    }
    .impact-badge {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      border-radius: 8px;
      margin-left: 0.5rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .type-badge {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      border-radius: 8px;
      margin-left: 0.5rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .condition-badge {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      border-radius: 8px;
      margin-left: 0.5rem;
      font-weight: 600;
      text-transform: uppercase;
      background: #fef3cd;
      color: #92400e;
    }
    .route-cell code {
      background: #f3f4f6;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .entity-cell, .fields-cell, .actions-cell {
      font-size: 0.75rem;
      color: #6b7280;
    }
    .action-count {
      background: #f3f4f6;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-right: 0.5rem;
    }
    
    /* Matrix subtitles */
    .metric-subtitle {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-top: 0.25rem;
    }
    
    /* List features */
    .list-feature {
      font-size: 0.75rem;
      margin-left: 0.25rem;
      opacity: 0.8;
    }
    
    /* Route links */
    .route-link {
      text-decoration: none;
      color: inherit;
      transition: color 0.2s ease;
    }
    .route-link:hover {
      color: #0066cc;
    }
    .route-link:hover code {
      background: #dbeafe;
      color: #1e40af;
    }
    
    /* Field list with tooltips */
    .fields-list {
      font-size: 0.75rem;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    /* Action breakdown */
    .action-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .action-breakdown {
      font-size: 0.75rem;
      color: #6b7280;
      cursor: help;
    }
  </style>
</head>
<body>
  ${content}

  <script type="module">
    const app = ${JSON.stringify(this.app, null, 2)};
    const analysis = ${JSON.stringify(analysis, null, 2)};
    
    // Make sections collapsible
    document.querySelectorAll('.expandable').forEach(element => {
      element.addEventListener('click', () => {
        const content = element.nextElementSibling;
        if (content && content.classList.contains('collapsible-content')) {
          content.classList.toggle('open');
          const icon = element.querySelector('.expand-icon');
          if (icon) {
            icon.textContent = content.classList.contains('open') ? '▼' : '▶';
          }
        }
      });
    });

    // Field usage click handlers
    function showFieldUsage(entityName, fieldName) {
      const entity = analysis.entities.find(e => e.name === entityName);
      const field = entity?.fieldUsages.find(f => f.field === fieldName);
      
      if (field) {
        alert(\`Field "\${fieldName}" usage:\\n\\n\${field.usagePoints.map(p => 
          \`• \${p.context}: \${p.description}\`
        ).join('\\n')}\`);
      }
    }

    // Make field usage interactive
    document.querySelectorAll('[data-field]').forEach(element => {
      element.addEventListener('click', () => {
        const entityName = element.dataset.entity;
        const fieldName = element.dataset.field;
        showFieldUsage(entityName, fieldName);
      });
    });

    // Tab switching functionality
    function switchTab(tabId) {
      // Hide all tab contents
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // Remove active class from all tab buttons
      document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
      });
      
      // Show selected tab content
      const targetContent = document.getElementById(tabId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
      
      // Add active class to selected tab button
      const targetButton = document.querySelector(\`[data-tab="\${tabId}"]\`);
      if (targetButton) {
        targetButton.classList.add('active');
      }
    }

    window.showFieldUsage = showFieldUsage;
    window.switchTab = switchTab;
  </script>
</body>
</html>`;
  }

  private generateSystemOverview(): string {
    const entityCount = Object.keys(this.app.entities || {}).length;
    const viewCount = Object.keys(this.app.views || {}).length;
    const workflowCount = Object.keys(this.app.workflows || {}).length;
    
    const content = View({
      children: `
        <div style="margin-bottom: 2rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 2rem;">
          ${Heading({ level: 1, children: '🏠 System Dashboard' })}
          ${Text({ children: 'Framework administration and monitoring', size: 'lg', color: '#6b7280' })}
        </div>

        ${Grid({
          cols: [1, 2, 3],
          gap: 6,
          children: `
            ${Card({
              children: `
                ${Heading({ level: 3, children: '🎯 Truth File Explorer' })}
                ${Text({ children: 'Interactive visualization of your application architecture and dependencies' })}
                ${Button({ 
                  children: 'Explore Truth File',
                  onClick: "window.location.href='/dashboard/truth'"
                })}
              `,
              p: 6
            })}
            
            ${Card({
              children: `
                ${Heading({ level: 3, children: '📊 Application Stats' })}
                ${Text({ children: `${entityCount} entities, ${viewCount} views, ${workflowCount} workflows` })}
                ${Button({ 
                  children: 'View Details',
                  variant: 'secondary',
                  onClick: "window.location.href='/dashboard/truth'"
                })}
              `,
              p: 6
            })}

            ${Card({
              children: `
                ${Heading({ level: 3, children: '🛠 System Tools' })}
                ${Text({ children: 'Framework utilities and development tools' })}
                ${Button({ 
                  children: 'Coming Soon',
                  variant: 'secondary',
                  disabled: true
                })}
              `,
              p: 6
            })}
          `
        })}
      `
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <title>System Dashboard - ${this.app.name}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: system-ui, sans-serif; 
      max-width: 1200px; 
      margin: 0 auto; 
      padding: 2rem; 
      line-height: 1.6;
      background-color: #f9fafb;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
  }

  private generateSystemOverviewCards(analysis: SystemAnalysis): string {
    return `
      <div style="margin-bottom: 3rem;">
        ${Heading({ level: 2, children: '📊 System Overview' })}
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-top: 1.5rem;">
          <div class="metric-card">
            <div class="metric-value">${analysis.entities.length}</div>
            <div class="metric-label">Entities</div>
            <div class="metric-subtitle">${analysis.entities.reduce((sum, e) => sum + e.fieldCount, 0)} total fields</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${analysis.views.length}</div>
            <div class="metric-label">Views</div>
            <div class="metric-subtitle">${analysis.views.filter(v => v.type === 'list').length} lists, ${analysis.views.filter(v => v.type === 'form').length} forms</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${analysis.workflows.length}</div>
            <div class="metric-label">Workflows</div>
            <div class="metric-subtitle">${analysis.workflows.filter(w => w.hasCondition).length} conditional</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" style="color: ${this.getHealthColor(analysis.healthScore)}">${analysis.healthScore}%</div>
            <div class="metric-label">Health Score</div>
            <div class="metric-subtitle">${analysis.healthScore >= 80 ? 'Excellent' : analysis.healthScore >= 60 ? 'Good' : 'Needs attention'}</div>
          </div>
        </div>
      </div>
    `;
  }

  private generateEntityTabs(analysis: SystemAnalysis): string {
    const entityTabs = analysis.entities.map((entity, index) => `
      <button class="tab-button ${index === 0 ? 'active' : ''}" onclick="switchTab('entity-${index}')" data-tab="entity-${index}">
        📋 ${entity.name}
        <span class="tab-badge">${entity.fieldCount} fields</span>
      </button>
    `).join('');

    const entityContents = analysis.entities.map((entity, index) => `
      <div id="entity-${index}" class="tab-content ${index === 0 ? 'active' : ''}">
        ${this.generateFieldUsageMatrix(entity)}
        ${entity.warnings.length > 0 ? `
          <div style="margin-top: 2rem;">
            <h4 style="color: #dc3545; margin-bottom: 1rem;">⚠ Warnings</h4>
            ${entity.warnings.map(warning => `<div class="warning">${warning}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    return `
      <div style="margin-bottom: 3rem;">
        ${Heading({ level: 2, children: '📋 Entity Field Usage Analysis' })}
        <div class="tabs-container">
          <div class="tabs-header">
            ${entityTabs}
          </div>
          <div class="tabs-body">
            ${entityContents}
          </div>
        </div>
      </div>
    `;
  }

  private generateFieldUsageMatrix(entity: any): string {
    const usageCategories = ['Display', 'List', 'Form', 'Detail', 'Behaviors', 'Search', 'Filter'];
    
    const matrixRows = entity.fieldUsages.map((field: any) => {
      const usage = this.categorizeFieldUsage(field.usagePoints);
      return `
        <tr class="matrix-row" data-field="${field.field}">
          <td class="field-name">
            <strong>${field.field}</strong>
            <span class="impact-badge impact-${field.impactLevel}">${field.impactLevel}</span>
          </td>
          ${usageCategories.map(category => {
            const hasUsage = usage[category];
            const isListOnly = category === 'Search' || category === 'Filter';
            const showInList = isListOnly && usage['List'];
            
            if (isListOnly && !showInList) {
              return `<td class="usage-cell unused">—</td>`;
            }
            
            if (category === 'List' && (usage['Search'] || usage['Filter'])) {
              const extras = [];
              if (usage['Search']) extras.push('<span class="list-feature" title="Searchable fields available">🔍</span>');
              if (usage['Filter']) extras.push('<span class="list-feature" title="Filterable dropdowns available">🔽</span>');
              return `<td class="usage-cell used">${hasUsage || ''} ${extras.join(' ')}</td>`;
            }
            
            const tooltip = this.getDisplayTooltip(category, field.field);
            return `
              <td class="usage-cell ${hasUsage ? 'used' : 'unused'}" ${tooltip ? `title="${tooltip}"` : ''}>
                ${hasUsage || ''}
              </td>
            `;
          }).join('')}
        </tr>
      `;
    }).join('');

    return `
      <div class="matrix-container">
        <table class="usage-matrix">
          <thead>
            <tr>
              <th class="field-header">Field</th>
              ${usageCategories.map(cat => `<th class="category-header">${cat}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${matrixRows}
          </tbody>
        </table>
      </div>
    `;
  }

  private categorizeFieldUsage(usagePoints: any[]): Record<string, string> {
    const usage: Record<string, string> = {};
    
    usagePoints.forEach(point => {
      if (point.location.includes('display.primary')) usage['Display'] = '🎯';
      else if (point.location.includes('display.secondary')) usage['Display'] = '📝';
      else if (point.location.includes('display.badge')) usage['Display'] = '🏷';
      else if (point.location.includes('display.color')) usage['Display'] = '🎨';
      else if (point.location.includes('display.metadata')) usage['Display'] = '📊';
      
      if (point.location.includes('list.columns')) usage['List'] = '📊';
      if (point.location.includes('form.fields')) usage['Form'] = '📝';
      if (point.location.includes('detail.sections')) usage['Detail'] = '👁';
      if (point.location.includes('behaviors.')) usage['Behaviors'] = '⚡';
      if (point.location.includes('searchable')) usage['Search'] = '🔍';
      if (point.location.includes('filterable')) usage['Filter'] = '🔽';
    });
    
    return usage;
  }

  private generateViewsMatrix(analysis: SystemAnalysis): string {
    const matrixRows = analysis.views.map(view => `
      <tr class="matrix-row" data-view="${view.name}">
        <td class="view-name">
          <strong>${view.name}</strong>
          <span class="type-badge type-${view.type}">${view.type}</span>
        </td>
        <td class="route-cell">
          <a href="${view.route}" class="route-link" title="Navigate to ${view.name}">
            <code>${view.route}</code>
          </a>
        </td>
        <td class="entity-cell">
          ${view.entity ? `📋 ${view.entity}` : '—'}
        </td>
        <td class="fields-cell">
          <div class="fields-list" title="${this.getViewFields(view)}">
            ${this.getViewFields(view)}
          </div>
        </td>
        <td class="actions-cell">
          ${this.getViewActions(view.type)}
        </td>
      </tr>
    `).join('');

    return `
      <div style="margin-bottom: 3rem;">
        ${Heading({ level: 2, children: '📱 Views Matrix' })}
        <div class="matrix-container">
          <table class="views-matrix">
            <thead>
              <tr>
                <th class="view-header">View Name</th>
                <th class="route-header">Route</th>
                <th class="entity-header">Entity</th>
                <th class="fields-header">Fields Used</th>
                <th class="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${matrixRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  private generateWorkflowsMatrix(analysis: SystemAnalysis): string {
    const matrixRows = analysis.workflows.map(workflow => {
      const workflowDef = this.app.workflows?.[workflow.name];
      const detailedActions = this.getDetailedWorkflowActions(workflowDef);
      
      return `
        <tr class="matrix-row" data-workflow="${workflow.name}">
          <td class="workflow-name">
            <strong>${workflow.name}</strong>
            ${workflow.hasCondition ? '<span class="condition-badge">conditional</span>' : ''}
          </td>
          <td class="trigger-cell">
            <code>${workflow.trigger}</code>
          </td>
          <td class="condition-cell">
            ${this.getWorkflowCondition(workflow, workflowDef)}
          </td>
          <td class="actions-cell">
            <div class="action-details">
              <span class="action-count">${workflow.actionCount} actions</span>
              <div class="action-breakdown" title="${detailedActions.descriptions.join(' → ')}">
                ${detailedActions.icons.join(' → ')}
              </div>
            </div>
          </td>
          <td class="impact-cell">
            ${this.getWorkflowImpact(workflow)}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div style="margin-bottom: 3rem;">
        ${Heading({ level: 2, children: '🤖 Workflows Matrix' })}
        <div class="matrix-container">
          <table class="workflows-matrix">
            <thead>
              <tr>
                <th class="workflow-header">Workflow Name</th>
                <th class="trigger-header">Trigger</th>
                <th class="condition-header">Condition</th>
                <th class="actions-header">Actions</th>
                <th class="impact-header">Impact</th>
              </tr>
            </thead>
            <tbody>
              ${matrixRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Helper methods
  private getHealthColor(score: number): string {
    return score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  }

  private getImpactColor(level: 'low' | 'medium' | 'high'): string {
    switch (level) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
    }
  }

  private getViewFields(view: any): string {
    const entity = this.app.entities[view.entity];
    if (!entity) return '—';
    
    switch (view.type) {
      case 'list':
        const listFields = entity.ui?.list?.columns || Object.keys(entity.fields);
        return listFields.join(', ');
      case 'form':
        const formFields = entity.ui?.form?.fields || Object.keys(entity.fields).filter(f => !entity.fields[f].auto);
        return formFields.join(', ');
      case 'detail':
        const detailFields = entity.ui?.detail?.sections?.flatMap((s: any) => s.fields) || Object.keys(entity.fields);
        return detailFields.join(', ');
      default:
        return Object.keys(entity.fields).join(', ');
    }
  }

  private getViewActions(type: string): string {
    switch (type) {
      case 'list': return '👁 View, ✏️ Edit, 🗑 Delete';
      case 'form': return '💾 Save, ❌ Cancel';
      case 'detail': return '✏️ Edit, 🗑 Delete, ⬅ Back';
      default: return '—';
    }
  }

  private getWorkflowCondition(workflow: any, workflowDef?: any): string {
    if (!workflowDef?.condition) {
      return workflow.hasCondition ? 'Has condition' : '—';
    }
    
    // Extract actual condition from workflow definition
    const condition = workflowDef.condition;
    if (typeof condition === 'string') {
      return condition;
    }
    
    // Format object conditions
    if (typeof condition === 'object') {
      const parts = Object.entries(condition).map(([field, value]) => `${field} = "${value}"`);
      return parts.join(' AND ');
    }
    
    return 'Complex condition';
  }

  private getWorkflowActionTypes(workflow: any): string {
    // This would ideally come from actual workflow analysis
    // For now, inferring from naming patterns
    const types = [];
    if (workflow.name.includes('notify') || workflow.name.includes('Notify')) types.push('📧 Notify');
    if (workflow.name.includes('celebrate') || workflow.name.includes('log')) types.push('📝 Log');
    if (workflow.name.includes('webhook') || workflow.name.includes('api')) types.push('🔗 Webhook');
    
    return types.length > 0 ? types.join(', ') : '🔧 Custom';
  }

  private getWorkflowImpact(workflow: any): string {
    if (workflow.actionCount >= 3) return '🔴 High';
    if (workflow.actionCount >= 2) return '🟡 Medium';
    return '🟢 Low';
  }

  private getDetailedWorkflowActions(workflowDef?: any): { icons: string[], descriptions: string[] } {
    if (!workflowDef?.actions) {
      return { icons: ['🔧'], descriptions: ['Custom action'] };
    }

    const icons: string[] = [];
    const descriptions: string[] = [];

    workflowDef.actions.forEach((action: any) => {
      if (action.type === 'notify' || action.notify) {
        icons.push('📧');
        descriptions.push(`Notify: ${action.to || action.notify.to || 'recipients'}`);
      } else if (action.type === 'webhook' || action.url) {
        icons.push('🔗');
        descriptions.push(`Webhook: ${action.url || 'external API'}`);
      } else if (action.type === 'log' || action.message) {
        icons.push('📝');
        descriptions.push(`Log: ${action.message || 'system message'}`);
      } else if (action.type === 'update') {
        icons.push('✏️');
        descriptions.push(`Update: ${Object.keys(action.fields || {}).join(', ')}`);
      } else {
        icons.push('🔧');
        descriptions.push(`Custom: ${action.type || 'unknown'}`);
      }
    });

    return { icons, descriptions };
  }

  private getDisplayTooltip(category: string, fieldName: string): string | null {
    if (category !== 'Display') return null;
    
    const entity = Object.values(this.app.entities).find(e => 
      Object.keys(e.fields).includes(fieldName)
    );
    
    if (!entity?.ui?.display) return null;
    
    const display = entity.ui.display;
    
    if (display.primary === fieldName) return 'Primary display text - shown as main identifier';
    if (display.secondary === fieldName) return 'Secondary text - shown below primary';
    if (display.badge === fieldName) return 'Badge - colored status indicator';
    if (display.color?.field === fieldName) return 'Color source - determines item color based on value';
    if (display.metadata?.includes(fieldName)) return 'Metadata - small text shown at bottom';
    
    return null;
  }
}