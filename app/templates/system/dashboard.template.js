// Generated __VIEW_NAME__ Component
// Edit this file directly - it won't be regenerated unless deleted
//
// 🤖 AI: For structural changes (widget layout, chart types, metric calculations),
//     consider modifying the template skeleton first: app/templates/system/dashboard.template.js
//     Then touch app/app.truth.ts to regenerate all dashboards with your improvements!
import { use__ENTITY__s } from '/runtime/generated/models/__ENTITY_LOWER__.js'
import { Card, Button } from '/app/components/system/index.js'

// Optional hooks for customization
let hooks = {}
try {
  const module = await import('./__VIEW_NAME__.hooks.js')
  hooks = module.default || {}
} catch {
  // No hooks file - that's fine
}

export default function __VIEW_NAME__() {
  const { html, useState, useEffect } = window
  
  // Hook safety check for navigation transitions
  try {
    const [testState] = useState(true)
    if (testState === undefined) {
      throw new Error('Hook context not ready')
    }
  } catch (error) {
    console.warn('__VIEW_NAME__: Hook context not ready during navigation:', error.message)
    return html`
      <div style="min-height: 50vh; display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center;">
          <div class="spinner"></div>
          <p style="color: #6b7280; margin-top: 1rem;">Loading dashboard...</p>
        </div>
      </div>
    `
  }
  
  const { data, loading, error, refetch } = use__ENTITY__s()
  
  // Dashboard state
  const [refreshing, setRefreshing] = useState(false)
  const [metrics, setMetrics] = useState({})

  if (loading) return html`<div class="loading">Loading dashboard...</div>`
  if (error) return html`<div class="text-red">Error: ${error.message}</div>`

  // Apply hooks processing
  const processedData = hooks.beforeRender?.(data) || data

  // Calculate metrics
  useEffect(() => {
    const calculatedMetrics = calculateMetrics(processedData)
    const enhancedMetrics = hooks.processMetrics?.(calculatedMetrics) || calculatedMetrics
    setMetrics(enhancedMetrics)
  }, [processedData])

  const calculateMetrics = (data) => {
    if (!data || !data.length) {
      return { total: 0, recent: 0, trend: 0 }
    }

    const total = data.length
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recent = data.filter(item => 
      item.createdAt && new Date(item.createdAt) >= lastWeek
    ).length

__METRIC_CALCULATIONS__

    return {
      total,
      recent,
      trend: recent > 0 ? ((recent / total) * 100).toFixed(1) : 0,
__CUSTOM_METRICS__
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
      hooks.onRefresh?.()
    } finally {
      setRefreshing(false)
    }
  }

  const MetricCard = ({ title, value, subtitle, trend, icon, color = 'blue' }) => {
    return html`
      <${Card} className="metric-card">
        <div class="metric-header">
          <div class="metric-icon metric-icon-${color}">
            ${icon || '📊'}
          </div>
          <div class="metric-info">
            <h3 class="metric-title">${title}</h3>
            <div class="metric-value">${value}</div>
            ${subtitle && html`<p class="metric-subtitle">${subtitle}</p>`}
            ${trend && html`<div class="metric-trend ${trend >= 0 ? 'positive' : 'negative'}">${trend}%</div>`}
          </div>
        </div>
      </Card>
    `
  }

  return html`
    <div class="dashboard-view">
      ${hooks.beforeContent?.() || ''}
      
      <div class="dashboard-header">
        <div class="dashboard-title">
          <h1>__DASHBOARD_TITLE__</h1>
          <p class="dashboard-subtitle">__DASHBOARD_SUBTITLE__</p>
        </div>
        <div class="dashboard-actions">
          <${Button} 
            variant="secondary" 
            onClick=${handleRefresh}
            loading=${refreshing}
          >
            Refresh
          </${Button}>
          ${hooks.headerActions?.() || ''}
        </div>
      </div>

      <!-- Key Metrics Row -->
      <div class="metrics-grid">
__METRIC_WIDGETS__
      </div>

      <!-- Charts and Detailed Widgets -->
      <div class="dashboard-grid">
__DASHBOARD_WIDGETS__
      </div>
      
      ${hooks.afterContent?.() || ''}
    </div>
  `
}