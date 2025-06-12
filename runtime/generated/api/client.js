// Generated API Client
// Always regenerated - do not edit

const API_BASE = window.location.origin

export const apiClient = {
  async get(url, options = {}) {
    const { params, ...fetchOptions } = options
    
    let fullUrl = API_BASE + url
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          searchParams.append(key, String(value))
        }
      })
      if (searchParams.toString()) {
        fullUrl += '?' + searchParams.toString()
      }
    }
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        ...fetchOptions.headers 
      },
      ...fetchOptions
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    return response.json()
  },

  async post(url, data, options = {}) {
    const response = await fetch(API_BASE + url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...options.headers 
      },
      body: JSON.stringify(data),
      ...options
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    return response.json()
  },

  async put(url, data, options = {}) {
    const response = await fetch(API_BASE + url, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...options.headers 
      },
      body: JSON.stringify(data),
      ...options
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    return response.json()
  },

  async delete(url, options = {}) {
    const response = await fetch(API_BASE + url, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        ...options.headers 
      },
      ...options
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    return response.json()
  }
}