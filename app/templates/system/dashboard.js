// System Dashboard Template
// Template for analytics dashboards with metrics and widgets

export const metadata = {
  inputs: {
    entity: { required: true, type: 'entity' },
    route: { required: true, type: 'string', pattern: /^\/[\w-\/]+$/ },
    title: { required: false, type: 'string' },
    subtitle: { required: false, type: 'string' },
    metrics: { required: false, type: 'array' },
    widgets: { required: false, type: 'array' }
  }
}

export async function generateComponent(viewName, viewDef, entityDef) {
  const entity = viewDef.entity
  const entityLower = entity.toLowerCase()
  const dashboardTitle = viewDef.title || `${entity} Dashboard`
  const dashboardSubtitle = viewDef.subtitle || `Overview of ${entityLower} data and analytics`
  
  // Default metrics based on entity fields
  const defaultMetrics = generateDefaultMetrics(entityDef)
  const metrics = viewDef.metrics || defaultMetrics
  
  // Default widgets
  const defaultWidgets = [
    { type: 'recent-list', title: `Recent ${entity}s`, limit: 5 },
    { type: 'status-chart', title: 'Status Distribution' }
  ]
  const widgets = viewDef.widgets || defaultWidgets

  // Load the template file with full syntax highlighting!
  const templatePath = new URL('./dashboard.template.js', import.meta.url).pathname
  let template = await Deno.readTextFile(templatePath)
  
  // Replace placeholders with actual values
  template = template
    .replaceAll('__VIEW_NAME__', viewName)
    .replaceAll('__ENTITY__', entity)
    .replaceAll('__ENTITY_LOWER__', entityLower)
    .replaceAll('__DASHBOARD_TITLE__', dashboardTitle)
    .replaceAll('__DASHBOARD_SUBTITLE__', dashboardSubtitle)
    
    // Generate metric calculations
    .replace('__METRIC_CALCULATIONS__', generateMetricCalculations(metrics, entityDef))
    .replace('__CUSTOM_METRICS__', generateCustomMetrics(metrics))
    
    // Generate metric widgets
    .replace('__METRIC_WIDGETS__', generateMetricWidgets(metrics))
    
    // Generate dashboard widgets
    .replace('__DASHBOARD_WIDGETS__', generateDashboardWidgets(widgets, entityDef))
  
  return template
}

function generateDefaultMetrics(entityDef) {
  const metrics = [
    { key: 'total', title: 'Total', icon: '📊', color: 'blue' }
  ]
  
  // Add status-based metrics if status field exists
  if (entityDef.fields.status?.type === 'enum') {
    const statusOptions = entityDef.fields.status.options || []
    statusOptions.forEach(status => {
      metrics.push({
        key: status,
        title: status.charAt(0).toUpperCase() + status.slice(1),
        icon: getStatusIcon(status),
        color: getStatusColor(status)
      })
    })
  }
  
  // Add priority-based metrics if priority field exists
  if (entityDef.fields.priority?.type === 'enum') {
    metrics.push({
      key: 'high-priority',
      title: 'High Priority',
      icon: '🔥',
      color: 'red'
    })
  }
  
  return metrics
}

function generateMetricCalculations(metrics, entityDef) {
  return metrics.map(metric => {
    if (metric.calculation) {
      return `    const ${metric.key} = ${metric.calculation}`
    }
    
    // Auto-generate calculations for common patterns
    if (metric.key === 'completed' || metric.key === 'done') {
      return `    const ${metric.key} = data.filter(item => item.status === '${metric.key}').length`
    }
    
    if (metric.key === 'high-priority') {
      return `    const highPriority = data.filter(item => item.priority === 'high').length`
    }
    
    if (metric.key.includes('status-')) {
      const status = metric.key.replace('status-', '')
      return `    const ${metric.key.replace('-', '')} = data.filter(item => item.status === '${status}').length`
    }
    
    return `    // Custom calculation for ${metric.key}`
  }).join('\n')
}

function generateCustomMetrics(metrics) {
  return metrics.map(metric => {
    if (metric.key === 'total') return '' // Already calculated
    
    const key = metric.key.replace('-', '')
    return `      ${key}`
  }).filter(Boolean).join(',\n')
}

function generateMetricWidgets(metrics) {
  return metrics.map(metric => {
    const key = metric.key === 'total' ? 'total' : metric.key.replace('-', '')
    const value = metric.key === 'total' ? 'metrics.total' : `metrics.${key}`
    
    return `        <\${MetricCard}
          title="${metric.title}"
          value={\${${value} || 0}}
          icon="${metric.icon || '📊'}"
          color="${metric.color || 'blue'}"
        />`
  }).join('\n')
}

function generateDashboardWidgets(widgets, entityDef) {
  return widgets.map(widget => {
    switch (widget.type) {
      case 'recent-list':
        return generateRecentListWidget(widget, entityDef)
      case 'status-chart':
        return generateStatusChartWidget(widget, entityDef)
      case 'timeline':
        return generateTimelineWidget(widget, entityDef)
      default:
        return generateCustomWidget(widget)
    }
  }).join('\n\n')
}

function generateRecentListWidget(widget, entityDef) {
  const limit = widget.limit || 5
  const titleField = findTitleField(entityDef)
  
  return `        <${Card} className="dashboard-widget">
          <div class="widget-header">
            <h3>${widget.title}</h3>
            <${Button} variant="ghost" onClick={\${() => window.location.href = '/__ENTITY_LOWER__s'}}>
              View All
            </Button>
          </div>
          <div class="widget-content">
            {\${processedData.slice(0, ${limit}).map(item => html\`
              <div 
                key={\${item.id}} 
                class="recent-item"
                onClick={\${() => window.location.href = \`/__ENTITY_LOWER__s/\${item.id}\`}}
              >
                <div class="item-title">{\${item.${titleField} || item.id}}</div>
                <div class="item-meta">{\${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}}</div>
              </div>
            \`)}}
          </div>
        </Card>`
}

function generateStatusChartWidget(widget, entityDef) {
  if (!entityDef.fields.status?.type === 'enum') {
    return `        <${Card} className="dashboard-widget">
          <h3>${widget.title}</h3>
          <p>Status field not available for charting</p>
        </Card>`
  }
  
  return `        <${Card} className="dashboard-widget">
          <div class="widget-header">
            <h3>${widget.title}</h3>
          </div>
          <div class="widget-content">
            <div class="status-chart">
              {\${Object.entries(
                processedData.reduce((acc, item) => {
                  const status = item.status || 'unknown'
                  acc[status] = (acc[status] || 0) + 1
                  return acc
                }, {})
              ).map(([status, count]) => html\`
                <div key={\${status}} class="status-bar">
                  <div class="status-label">{\${status}}</div>
                  <div class="status-count">{\${count}}</div>
                  <div class="status-progress">
                    <div 
                      class="status-fill status-fill-{\${status}" 
                      style="width: {\${(count / processedData.length) * 100}}%"
                    ></div>
                  </div>
                </div>
              \`)}}
            </div>
          </div>
        </Card>`
}

function generateTimelineWidget(widget, entityDef) {
  return `        <${Card} className="dashboard-widget">
          <div class="widget-header">
            <h3>${widget.title}</h3>
          </div>
          <div class="widget-content">
            <div class="timeline">
              {\${processedData
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10)
                .map(item => html\`
                  <div key={\${item.id}} class="timeline-item">
                    <div class="timeline-date">
                      {\${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}}
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-title">{\${item.${findTitleField(entityDef)} || item.id}}</div>
                    </div>
                  </div>
                \`)}}
            </div>
          </div>
        </Card>`
}

function generateCustomWidget(widget) {
  return `        <${Card} className="dashboard-widget">
          <div class="widget-header">
            <h3>${widget.title}</h3>
          </div>
          <div class="widget-content">
            <p>Custom widget: ${widget.type}</p>
            <p>Configure in hooks or extend template</p>
          </div>
        </Card>`
}

function findTitleField(entityDef) {
  const titleFields = ['title', 'name', 'subject', 'description']
  for (const field of titleFields) {
    if (entityDef.fields[field]) {
      return field
    }
  }
  return 'id' // fallback
}

function getStatusIcon(status) {
  const icons = {
    'todo': '📋',
    'in-progress': '⏳',
    'done': '✅',
    'completed': '✅',
    'active': '🟢',
    'inactive': '⚪',
    'pending': '🟡',
    'cancelled': '❌',
    'archived': '📦'
  }
  return icons[status] || '📊'
}

function getStatusColor(status) {
  const colors = {
    'todo': 'gray',
    'in-progress': 'blue',
    'done': 'green',
    'completed': 'green',
    'active': 'green',
    'inactive': 'gray',
    'pending': 'yellow',
    'cancelled': 'red',
    'archived': 'gray'
  }
  return colors[status] || 'blue'
}