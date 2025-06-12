// Generated __VIEW_NAME__ Component
// Edit this file directly - it won't be regenerated unless deleted
//
// 🤖 AI: For structural changes (calendar layout, event display, navigation),
//     consider modifying the template skeleton first: app/templates/system/calendar.template.js
//     Then touch app/app.truth.ts to regenerate all calendars with your improvements!
import { use__ENTITY__s, use__ENTITY__Mutations } from '/runtime/generated/models/__ENTITY_LOWER__.js'
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
          <p style="color: #6b7280; margin-top: 1rem;">Loading calendar...</p>
        </div>
      </div>
    `
  }
  
  const { data, loading, error, refetch } = use__ENTITY__s()
  const { update__ENTITY__ } = use__ENTITY__Mutations()
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month') // month, week, day
  const [selectedEvent, setSelectedEvent] = useState(null)

  if (loading) return html`<div class="loading">Loading calendar...</div>`
  if (error) return html`<div class="text-red">Error: ${error.message}</div>`

  // Apply hooks processing
  const processedData = hooks.beforeRender?.(data) || data

  // Calendar utilities
  const getMonthStart = (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const dayOfWeek = start.getDay()
    start.setDate(start.getDate() - dayOfWeek)
    return start
  }

  const getMonthEnd = (date) => {
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    const dayOfWeek = end.getDay()
    end.setDate(end.getDate() + (6 - dayOfWeek))
    return end
  }

  const generateCalendarDays = () => {
    const start = getMonthStart(currentDate)
    const end = getMonthEnd(currentDate)
    const days = []
    
    const current = new Date(start)
    while (current <= end) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  const getEventsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0]
    return processedData.filter(item => {
      const eventDate = item.__DATE_FIELD__ ? new Date(item.__DATE_FIELD__).toISOString().split('T')[0] : null
      return eventDate === dateString
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const handleEventClick = (event) => {
    setSelectedEvent(event)
    hooks.onEventClick?.(event)
  }

  const handleDateClick = (date) => {
    hooks.onDateClick?.(date) || (() => {
      // Default: navigate to create form with pre-filled date
      const createUrl = `__CREATE_ROUTE__?date=${date.toISOString().split('T')[0]}`
      window.location.href = createUrl
    })()
  }

  const calendarDays = generateCalendarDays()
  const today = new Date().toDateString()

  return html`
    <div class="calendar-view">
      ${hooks.beforeContent?.() || ''}
      
      <div class="calendar-header">
        <div class="calendar-navigation">
          <${Button} variant="ghost" onClick=${() => navigateMonth(-1)}>‹</${Button}>
          <h2 class="calendar-title">${formatDate(currentDate)}</h2>
          <${Button} variant="ghost" onClick=${() => navigateMonth(1)}>›</${Button}>
        </div>
        
        <div class="calendar-actions">
          <${Button} variant="secondary" onClick=${() => setCurrentDate(new Date())}>
            Today
          </${Button}>
          <${Button} onClick=${() => window.location.href = '__CREATE_ROUTE__'}>
            Add __ENTITY__
          </${Button}>
          ${hooks.headerActions?.() || ''}
        </div>
      </div>

      <div class="calendar-grid">
        <!-- Day headers -->
        <div class="calendar-day-headers">
          ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => html`
            <div class="day-header">${day}</div>
          `)}
        </div>
        
        <!-- Calendar days -->
        <div class="calendar-days">
          ${calendarDays.map(day => {
            const dayEvents = getEventsForDate(day)
            const isToday = day.toDateString() === today
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
            
            return html`
              <div 
                key=${day.toISOString()}
                class="calendar-day ${isToday ? 'today' : ''} ${isCurrentMonth ? 'current-month' : 'other-month'}"
                onClick=${() => handleDateClick(day)}
              >
                <div class="day-number">${day.getDate()}</div>
                <div class="day-events">
                  ${dayEvents.slice(0, 3).map(event => html`
                    <div 
                      key=${event.id}
                      class="calendar-event __EVENT_CLASS__"
                      onClick=${(e) => { e.stopPropagation(); handleEventClick(event); }}
                      title=${event.__TITLE_FIELD__ || event.id}
                    >
__EVENT_CONTENT__
                    </div>
                  `)}
                  ${dayEvents.length > 3 ? html`
                    <div class="event-overflow">+${dayEvents.length - 3} more</div>
                  ` : ''}
                </div>
              </div>
            `
          })}
        </div>
      </div>

      <!-- Event detail modal -->
      ${selectedEvent ? html`
        <div class="event-modal-overlay" onClick=${() => setSelectedEvent(null)}>
          <div class="event-modal" onClick=${(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3>${selectedEvent.__TITLE_FIELD__ || 'Event Details'}</h3>
              <${Button} variant="ghost" onClick=${() => setSelectedEvent(null)}>×</${Button}>
            </div>
            <div class="modal-content">
__MODAL_CONTENT__
            </div>
            <div class="modal-actions">
              <${Button} 
                variant="secondary" 
                onClick=${() => window.location.href = \`/__ENTITY_LOWER__s/\${selectedEvent.id}/edit\`}
              >
                Edit
              </${Button}>
              <${Button} 
                onClick=${() => window.location.href = \`/__ENTITY_LOWER__s/\${selectedEvent.id}\`}
              >
                View Details
              </${Button}>
            </div>
          </div>
        </div>
      ` : ''}
      
      ${hooks.afterContent?.() || ''}
    </div>
  `
}