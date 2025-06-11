// Feedback component definitions for the constrained UI system

import { BaseProps, InteractionProps } from '../types/base-props.ts';
import { buildElement, processInteractionProps } from '../utils/prop-utils.ts';

export interface AlertProps extends BaseProps, InteractionProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  dismissible?: boolean;
  title?: string;
  children: string;
  onDismiss?: string;
}

export function Alert({ 
  type = 'info',
  dismissible = false,
  title,
  children,
  onDismiss,
  ...props 
}: AlertProps): string {
  const typeStyles = {
    info: {
      bg: '#dbeafe',
      border: '#3b82f6',
      text: '#1e40af',
      icon: 'ℹ️'
    },
    success: {
      bg: '#dcfce7',
      border: '#16a34a',
      text: '#166534',
      icon: '✅'
    },
    warning: {
      bg: '#fef3c7',
      border: '#f59e0b',
      text: '#92400e',
      icon: '⚠️'
    },
    error: {
      bg: '#fecaca',
      border: '#dc2626',
      text: '#991b1b',
      icon: '❌'
    }
  };

  const style = typeStyles[type];
  const interactionAttributes = processInteractionProps(props);
  
  const dismissButton = dismissible ? `
    <button 
      onclick="${onDismiss || 'this.parentElement.style.display=\"none\"'}"
      style="
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: ${style.text};
        opacity: 0.7;
        line-height: 1;
      "
      aria-label="Dismiss alert"
    >
      ×
    </button>
  ` : '';

  const titleContent = title ? `
    <div style="font-weight: 600; margin-bottom: 0.5rem;">
      ${style.icon} ${title}
    </div>
  ` : '';

  const content = `
    ${titleContent}
    <div style="${title ? '' : 'display: flex; align-items: flex-start; gap: 0.5rem;'}">
      ${!title ? `<span style="flex-shrink: 0;">${style.icon}</span>` : ''}
      <div style="flex: 1;">${children}</div>
    </div>
    ${dismissButton}
  `;

  const additionalStyles = `
    background-color: ${style.bg};
    border: 1px solid ${style.border};
    color: ${style.text};
    border-radius: 0.5rem;
    padding: 1rem;
    position: relative;
    margin-bottom: 1rem;
  `;

  const alertProps = {
    className: props.className ? `alert alert-${type} ${props.className}` : `alert alert-${type}`,
    role: 'alert',
    ...props
  };

  return buildElement(
    'div',
    alertProps,
    content,
    additionalStyles,
    interactionAttributes
  );
}

export interface ToastProps extends BaseProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: string;
  duration?: number; // milliseconds
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  onDismiss?: string;
  show?: boolean;
}

export function Toast({ 
  type = 'info',
  title,
  children,
  duration = 5000,
  position = 'top-right',
  onDismiss,
  show = true,
  ...props 
}: ToastProps): string {
  if (!show) return '';

  const typeStyles = {
    info: {
      bg: '#1f2937',
      text: '#f9fafb',
      border: '#3b82f6',
      icon: 'ℹ️'
    },
    success: {
      bg: '#065f46',
      text: '#f0fdf4',
      border: '#10b981',
      icon: '✅'
    },
    warning: {
      bg: '#92400e',
      text: '#fefbf3',
      border: '#f59e0b',
      icon: '⚠️'
    },
    error: {
      bg: '#991b1b',
      text: '#fef2f2',
      border: '#dc2626',
      icon: '❌'
    }
  };

  const positionStyles = {
    'top-right': 'top: 1rem; right: 1rem;',
    'top-left': 'top: 1rem; left: 1rem;',
    'bottom-right': 'bottom: 1rem; right: 1rem;',
    'bottom-left': 'bottom: 1rem; left: 1rem;',
    'top-center': 'top: 1rem; left: 50%; transform: translateX(-50%);',
    'bottom-center': 'bottom: 1rem; left: 50%; transform: translateX(-50%);'
  };

  const style = typeStyles[type];
  const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const dismissButton = `
    <button 
      onclick="${onDismiss || `document.getElementById('${toastId}').remove()`}"
      style="
        background: none;
        border: none;
        color: ${style.text};
        font-size: 1.25rem;
        cursor: pointer;
        opacity: 0.7;
        line-height: 1;
        padding: 0;
        margin-left: 0.5rem;
      "
      aria-label="Dismiss toast"
    >
      ×
    </button>
  `;

  const titleContent = title ? `
    <div style="font-weight: 600; margin-bottom: 0.25rem;">
      ${style.icon} ${title}
    </div>
  ` : '';

  const content = `
    <div style="display: flex; align-items: flex-start; justify-content: space-between;">
      <div style="flex: 1;">
        ${titleContent}
        <div style="${title ? '' : 'display: flex; align-items: flex-start; gap: 0.5rem;'}">
          ${!title ? `<span style="flex-shrink: 0;">${style.icon}</span>` : ''}
          <div style="flex: 1; ${title ? 'margin-left: 1.5rem;' : ''}">${children}</div>
        </div>
      </div>
      ${dismissButton}
    </div>
  `;

  const additionalStyles = `
    background-color: ${style.bg};
    color: ${style.text};
    border: 1px solid ${style.border};
    border-radius: 0.5rem;
    padding: 1rem;
    position: fixed;
    ${positionStyles[position]}
    z-index: 9999;
    min-width: 300px;
    max-width: 500px;
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3);
    animation: toastSlideIn 0.3s ease-out;
  `;

  const toastProps = {
    id: toastId,
    className: props.className ? `toast toast-${type} ${props.className}` : `toast toast-${type}`,
    role: 'alert',
    'aria-live': 'polite',
    ...props
  };

  // Auto-dismiss script
  const autoDismissScript = duration > 0 ? `
    <script>
      (function() {
        const toast = document.getElementById('${toastId}');
        if (toast) {
          setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
          }, ${duration});
        }
      })();
    </script>
  ` : '';

  return buildElement(
    'div',
    toastProps,
    content,
    additionalStyles
  ) + autoDismissScript;
}

// Global toast notification system
export function generateToastCSS(): string {
  return `
    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .toast {
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .toast:hover {
      opacity: 0.95;
    }
    
    /* Toast container for programmatic toasts */
    .toast-container {
      position: fixed;
      pointer-events: none;
      z-index: 9999;
    }
    
    .toast-container.top-right {
      top: 1rem;
      right: 1rem;
    }
    
    .toast-container.top-left {
      top: 1rem;
      left: 1rem;
    }
    
    .toast-container.bottom-right {
      bottom: 1rem;
      right: 1rem;
    }
    
    .toast-container.bottom-left {
      bottom: 1rem;
      left: 1rem;
    }
    
    .toast-container.top-center {
      top: 1rem;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .toast-container.bottom-center {
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .toast-container .toast {
      pointer-events: auto;
      margin-bottom: 0.5rem;
    }
  `;
}

// JavaScript for programmatic toast creation
export function generateToastJS(): string {
  return `
    // Global toast notification system
    window.showToast = function(message, type = 'info', options = {}) {
      const defaults = {
        title: null,
        duration: 5000,
        position: 'top-right'
      };
      
      const config = { ...defaults, ...options };
      
      // Create toast container if it doesn't exist
      let container = document.querySelector(\`.toast-container.\${config.position}\`);
      if (!container) {
        container = document.createElement('div');
        container.className = \`toast-container \${config.position}\`;
        document.body.appendChild(container);
      }
      
      // Create toast element
      const toastId = \`toast-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
      const toast = document.createElement('div');
      toast.id = toastId;
      toast.className = \`toast toast-\${type}\`;
      toast.role = 'alert';
      toast.setAttribute('aria-live', 'polite');
      
      // Toast styles based on type
      const typeStyles = {
        info: { bg: '#1f2937', text: '#f9fafb', border: '#3b82f6', icon: 'ℹ️' },
        success: { bg: '#065f46', text: '#f0fdf4', border: '#10b981', icon: '✅' },
        warning: { bg: '#92400e', text: '#fefbf3', border: '#f59e0b', icon: '⚠️' },
        error: { bg: '#991b1b', text: '#fef2f2', border: '#dc2626', icon: '❌' }
      };
      
      const style = typeStyles[type] || typeStyles.info;
      
      toast.style.cssText = \`
        background-color: \${style.bg};
        color: \${style.text};
        border: 1px solid \${style.border};
        border-radius: 0.5rem;
        padding: 1rem;
        min-width: 300px;
        max-width: 500px;
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3);
        animation: toastSlideIn 0.3s ease-out;
        margin-bottom: 0.5rem;
        opacity: 0;
        transform: translateY(-20px);
      \`;
      
      // Toast content
      const dismissButton = \`
        <button 
          style="
            background: none;
            border: none;
            color: \${style.text};
            font-size: 1.25rem;
            cursor: pointer;
            opacity: 0.7;
            line-height: 1;
            padding: 0;
            margin-left: 0.5rem;
          "
          aria-label="Dismiss toast"
        >
          ×
        </button>
      \`;
      
      const titleContent = config.title ? \`
        <div style="font-weight: 600; margin-bottom: 0.25rem;">
          \${style.icon} \${config.title}
        </div>
      \` : '';
      
      toast.innerHTML = \`
        <div style="display: flex; align-items: flex-start; justify-content: space-between;">
          <div style="flex: 1;">
            \${titleContent}
            <div style="\${config.title ? '' : 'display: flex; align-items: flex-start; gap: 0.5rem;'}">
              \${!config.title ? \`<span style="flex-shrink: 0;">\${style.icon}</span>\` : ''}
              <div style="flex: 1; \${config.title ? 'margin-left: 1.5rem;' : ''}">\${message}</div>
            </div>
          </div>
          \${dismissButton}
        </div>
      \`;
      
      // Add dismiss functionality
      const dismissBtn = toast.querySelector('button');
      dismissBtn.onclick = () => dismissToast(toast);
      
      // Add to container and animate in
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      }, 10);
      
      // Auto-dismiss
      if (config.duration > 0) {
        setTimeout(() => dismissToast(toast), config.duration);
      }
      
      return toastId;
    };
    
    function dismissToast(toast) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
    
    // Convenience methods
    window.showSuccess = (message, options) => window.showToast(message, 'success', options);
    window.showError = (message, options) => window.showToast(message, 'error', options);
    window.showWarning = (message, options) => window.showToast(message, 'warning', options);
    window.showInfo = (message, options) => window.showToast(message, 'info', options);
  `;
}