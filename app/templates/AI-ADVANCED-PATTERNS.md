# 🤖 AI Advanced Patterns: Build Complex UIs From Scratch

**⚠️ This guide is for ADVANCED cases only!** 

**First try:** Use existing skeletons (kanban, calendar, dashboard) or modify them.  
**Only use this guide when:** Building completely new UI patterns not covered by existing skeletons.

## When to Build From Scratch

### ✅ **Valid Reasons**
- **Unique interaction patterns** - Multi-touch gestures, drawing interfaces, 3D visualization
- **Specialized domains** - CAD tools, music notation, game interfaces  
- **Complex state coordination** - Real-time collaboration, distributed state machines
- **Performance-critical UIs** - High-frequency updates, virtualized rendering

### ❌ **Don't Build From Scratch For**
- **CRUD variations** - Use form/list/detail skeletons
- **Data visualization** - Use dashboard skeleton with custom widgets
- **Task management** - Use kanban skeleton
- **Scheduling** - Use calendar skeleton

## Architecture Patterns

### 🏗️ **Component-Based Architecture**

```javascript
// Main component coordinates children
export default function ComplexUIComponent() {
  const { html, useState } = window
  
  // Central state management
  const [uiState, setUIState] = useState({
    mode: 'default',
    selection: [],
    activeLayer: 0
  })
  
  // State update coordination
  const updateState = (updates) => {
    setUIState(prev => ({ ...prev, ...updates }))
    // Notify other components
    window.dispatchEvent(new CustomEvent('ui-state-change', { detail: updates }))
  }
  
  return html`
    <div class="complex-ui">
      <${Toolbar} state=${uiState} onStateChange=${updateState} />
      <${Canvas} state=${uiState} onStateChange=${updateState} />
      <${Sidebar} state=${uiState} onStateChange=${updateState} />
    </div>
  `
}
```

### 🔄 **State Management Patterns**

#### **Centralized State** (for complex coordination)
```javascript
// State manager utility
class UIStateManager {
  constructor(initialState) {
    this.state = initialState
    this.listeners = []
  }
  
  setState(updates) {
    this.state = { ...this.state, ...updates }
    this.listeners.forEach(fn => fn(this.state))
  }
  
  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }
}

// Usage in component
const stateManager = new UIStateManager({ mode: 'draw', tool: 'pen' })

export default function DrawingApp() {
  const [state, setState] = useState(stateManager.state)
  
  useEffect(() => {
    return stateManager.subscribe(setState)
  }, [])
  
  const updateUI = (updates) => stateManager.setState(updates)
}
```

#### **Event-Driven State** (for loose coupling)
```javascript
// Custom event system
const UIEvents = {
  emit(event, data) {
    window.dispatchEvent(new CustomEvent(`ui:${event}`, { detail: data }))
  },
  
  on(event, handler) {
    const listener = (e) => handler(e.detail)
    window.addEventListener(`ui:${event}`, listener)
    return () => window.removeEventListener(`ui:${event}`, listener)
  }
}

// Components communicate via events
export default function CanvasComponent() {
  const [objects, setObjects] = useState([])
  
  useEffect(() => {
    const cleanup = UIEvents.on('object-added', (obj) => {
      setObjects(prev => [...prev, obj])
    })
    return cleanup
  }, [])
  
  const addObject = (obj) => {
    UIEvents.emit('object-added', obj)
  }
}
```

### 🎛️ **Interaction Patterns**

#### **Drag & Drop System**
```javascript
// Reusable drag & drop hook
function useDragDrop(onDrop) {
  const [dragState, setDragState] = useState({ isDragging: false, dragData: null })
  
  const handleDragStart = (e, data) => {
    setDragState({ isDragging: true, dragData: data })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify(data))
  }
  
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  
  const handleDrop = (e, target) => {
    e.preventDefault()
    const data = JSON.parse(e.dataTransfer.getData('application/json'))
    onDrop(data, target)
    setDragState({ isDragging: false, dragData: null })
  }
  
  return {
    dragState,
    dragHandlers: { onDragStart: handleDragStart, onDragEnd: () => setDragState({ isDragging: false, dragData: null }) },
    dropHandlers: { onDragOver: handleDragOver, onDrop: handleDrop }
  }
}
```

#### **Multi-Selection System**
```javascript
function useMultiSelection(items) {
  const [selected, setSelected] = useState(new Set())
  
  const toggleSelection = (id, multiSelect = false) => {
    setSelected(prev => {
      const newSet = multiSelect ? new Set(prev) : new Set()
      
      if (prev.has(id) && multiSelect) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      
      return newSet
    })
  }
  
  const selectRange = (startId, endId) => {
    const startIndex = items.findIndex(item => item.id === startId)
    const endIndex = items.findIndex(item => item.id === endId)
    
    const [start, end] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)]
    const rangeIds = items.slice(start, end + 1).map(item => item.id)
    
    setSelected(new Set(rangeIds))
  }
  
  return {
    selected,
    isSelected: (id) => selected.has(id),
    toggleSelection,
    selectRange,
    clearSelection: () => setSelected(new Set()),
    selectedItems: items.filter(item => selected.has(item.id))
  }
}
```

#### **Undo/Redo System**
```javascript
function useUndoRedo(initialState) {
  const [history, setHistory] = useState([initialState])
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const currentState = history[currentIndex]
  
  const execute = (newState) => {
    const newHistory = history.slice(0, currentIndex + 1)
    newHistory.push(newState)
    setHistory(newHistory)
    setCurrentIndex(newHistory.length - 1)
  }
  
  const undo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }
  
  const redo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }
  
  return {
    state: currentState,
    execute,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1
  }
}
```

### 🎨 **Rendering Patterns**

#### **Virtual Scrolling** (for large datasets)
```javascript
function VirtualList({ items, itemHeight, containerHeight }) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(visibleStart + Math.ceil(containerHeight / itemHeight) + 1, items.length)
  const visibleItems = items.slice(visibleStart, visibleEnd)
  
  const totalHeight = items.length * itemHeight
  const offsetY = visibleStart * itemHeight
  
  return html`
    <div 
      class="virtual-list"
      style="height: ${containerHeight}px; overflow: auto;"
      onScroll=${(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style="height: ${totalHeight}px; position: relative;">
        <div style="transform: translateY(${offsetY}px);">
          ${visibleItems.map((item, index) => html`
            <div key=${item.id} style="height: ${itemHeight}px;">
              <${ListItem} item=${item} index=${visibleStart + index} />
            </div>
          `)}
        </div>
      </div>
    </div>
  `
}
```

#### **Canvas-Based Rendering** (for custom graphics)
```javascript
function CanvasRenderer({ objects, width, height }) {
  const canvasRef = useRef(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Render objects
    objects.forEach(obj => {
      ctx.save()
      ctx.translate(obj.x, obj.y)
      ctx.rotate(obj.rotation || 0)
      
      switch (obj.type) {
        case 'rectangle':
          ctx.fillStyle = obj.color
          ctx.fillRect(0, 0, obj.width, obj.height)
          break
        case 'circle':
          ctx.beginPath()
          ctx.arc(0, 0, obj.radius, 0, 2 * Math.PI)
          ctx.fillStyle = obj.color
          ctx.fill()
          break
      }
      
      ctx.restore()
    })
  }, [objects, width, height])
  
  return html`
    <canvas 
      ref=${canvasRef}
      width=${width}
      height=${height}
      style="border: 1px solid #ccc;"
    />
  `
}
```

### 🔗 **Integration Patterns**

#### **Third-Party Library Integration**
```javascript
// Wrapper for external libraries
function D3ChartWrapper({ data, config }) {
  const containerRef = useRef(null)
  
  useEffect(() => {
    if (!containerRef.current || !window.d3) return
    
    // Clear previous chart
    window.d3.select(containerRef.current).selectAll('*').remove()
    
    // Create new chart
    const svg = window.d3
      .select(containerRef.current)
      .append('svg')
      .attr('width', config.width)
      .attr('height', config.height)
    
    // D3 chart implementation
    renderChart(svg, data, config)
    
  }, [data, config])
  
  // Load D3 if not available
  useEffect(() => {
    if (!window.d3) {
      const script = document.createElement('script')
      script.src = 'https://d3js.org/d3.v7.min.js'
      document.head.appendChild(script)
    }
  }, [])
  
  return html`<div ref=${containerRef} class="d3-chart"></div>`
}
```

#### **WebSocket Integration**
```javascript
function useWebSocket(url) {
  const [socket, setSocket] = useState(null)
  const [messages, setMessages] = useState([])
  const [connected, setConnected] = useState(false)
  
  useEffect(() => {
    const ws = new WebSocket(url)
    
    ws.onopen = () => {
      setConnected(true)
      setSocket(ws)
    }
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      setMessages(prev => [...prev, message])
    }
    
    ws.onclose = () => {
      setConnected(false)
      setSocket(null)
    }
    
    return () => ws.close()
  }, [url])
  
  const sendMessage = (message) => {
    if (socket && connected) {
      socket.send(JSON.stringify(message))
    }
  }
  
  return { messages, connected, sendMessage }
}
```

### 🚀 **Performance Optimization**

#### **Memoization Patterns**
```javascript
// Expensive calculations
const MemoizedComponent = ({ data, config }) => {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data, config)
  }, [data, config])
  
  const handlers = useMemo(() => ({
    onClick: (item) => handleClick(item),
    onDrag: (item, position) => handleDrag(item, position)
  }), []) // Stable references
  
  return html`
    <${ExpensiveChild} data=${processedData} handlers=${handlers} />
  `
}
```

#### **Debounced Updates**
```javascript
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => clearTimeout(handler)
  }, [value, delay])
  
  return debouncedValue
}

// Usage for search/filter
function SearchableList({ items }) {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
  }, [items, debouncedSearch])
}
```

## Framework-Specific Considerations

### 🎯 **Preact/HTM Specifics**

#### **Event Handling**
```javascript
// Proper event binding in HTM
const handleClick = useCallback((e, data) => {
  e.preventDefault()
  // Handle click
}, [])

// In template
return html`
  <button onClick=${(e) => handleClick(e, itemData)}>
    Click me
  </button>
`
```

#### **Refs and DOM Access**
```javascript
// Using refs for DOM manipulation
import { useRef, useEffect } from 'preact/hooks'

function CustomComponent() {
  const elementRef = useRef(null)
  
  useEffect(() => {
    if (elementRef.current) {
      // Direct DOM manipulation
      elementRef.current.focus()
    }
  }, [])
  
  return html`<input ref=${elementRef} />`
}
```

#### **Context for Global State**
```javascript
// Create context
import { createContext } from 'preact'
import { useContext } from 'preact/hooks'

const UIContext = createContext()

// Provider
function UIProvider({ children }) {
  const [state, setState] = useState({})
  
  return html`
    <${UIContext.Provider} value=${{ state, setState }}>
      ${children}
    </UIContext.Provider>
  `
}

// Consumer
function ChildComponent() {
  const { state, setState } = useContext(UIContext)
  return html`<div>${state.value}</div>`
}
```

## Testing Complex UIs

### 🧪 **Component Testing**
```javascript
// Mock complex dependencies
function MockCanvas({ onRender }) {
  useEffect(() => {
    onRender({ width: 800, height: 600 })
  }, [])
  
  return html`<div data-testid="mock-canvas">Canvas Mock</div>`
}

// Test component in isolation
function TestWrapper() {
  return html`
    <${ComplexUIComponent} 
      canvas=${MockCanvas}
      data=${mockData}
    />
  `
}
```

### 📊 **Performance Testing**
```javascript
// Performance monitoring
function usePerformanceMonitor(componentName) {
  useEffect(() => {
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      console.log(`${componentName} render time: ${end - start}ms`)
    }
  })
}
```

## Deployment Considerations

### 📦 **Asset Management**
```javascript
// Dynamic asset loading
async function loadAssets() {
  const [css, js] = await Promise.all([
    import('/static/complex-ui.css'),
    import('/static/complex-ui.js')
  ])
  
  return { css, js }
}
```

### ⚡ **Code Splitting**
```javascript
// Lazy load complex components
const HeavyComponent = lazy(() => import('./HeavyComponent.js'))

function App() {
  return html`
    <${Suspense} fallback=${html`<div>Loading...</div>`}>
      <${HeavyComponent} />
    </Suspense>
  `
}
```

## Remember

**🎯 Building from scratch is POWERFUL but COMPLEX**

**✅ Prefer:** Modify existing skeletons → extend with hooks → build from scratch  
**🚨 Only build from scratch:** When existing patterns truly don't fit  
**🔄 Always consider:** Can this be achieved by customizing an existing skeleton?

**The goal is to solve the user's problem efficiently, not to build the most complex solution!** ⚡✨