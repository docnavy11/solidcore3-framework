// Solidcore3 UI Runtime - htm/Preact setup for no-build JSX
// This provides React-like development without compilation

import { render, hydrate } from 'https://esm.sh/preact@10.19.0'
import { useState, useEffect, useRef, useMemo, useCallback } from 'https://esm.sh/preact@10.19.0/hooks'
import { html } from 'https://esm.sh/htm@3.1.1/preact'

// Global exports for components to use
window.html = html
window.render = render
window.hydrate = hydrate
window.useState = useState
window.useEffect = useEffect
window.useRef = useRef
window.useMemo = useMemo
window.useCallback = useCallback

// Simple state store for global app state
function createStore(initialState = {}) {
  let state = { ...initialState }
  const listeners = new Set()
  
  return {
    getState: () => state,
    setState: (updates) => {
      if (typeof updates === 'function') {
        state = { ...state, ...updates(state) }
      } else {
        state = { ...state, ...updates }
      }
      listeners.forEach(listener => listener(state))
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}

// Global app store
window.appStore = createStore({
  user: null,
  notifications: [],
  loading: false
})

// Hook to use global store
window.useStore = function useStore() {
  const [state, setState] = useState(appStore.getState())
  
  useEffect(() => {
    return appStore.subscribe(setState)
  }, [])
  
  return [state, appStore.setState]
}

// Utility for API calls
window.apiClient = {
  async get(url, options = {}) {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    const result = await response.json()
    console.log('API Response:', result)
    return result
  },
  
  async post(url, data, options = {}) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(data),
      ...options
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  },
  
  async put(url, data, options = {}) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(data),
      ...options
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  },
  
  async delete(url, options = {}) {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    return response.ok
  }
}

// Toast notification system
window.toast = {
  success(message) {
    this.show(message, 'success')
  },
  
  error(message) {
    this.show(message, 'error')
  },
  
  info(message) {
    this.show(message, 'info')
  },
  
  show(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `
    
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease'
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }
}

// CSS animation styles
const style = document.createElement('style')
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`
document.head.appendChild(style)

console.log('🎨 Solidcore3 UI Runtime loaded')