import { UIExtension } from '../../core/types/extensions.ts';

// Example UI Extension: Task Themes
const extension: UIExtension = {
  name: 'task-themes',
  type: 'ui',
  version: '1.0.0',
  description: 'Custom themes and UI enhancements for task management',
  author: 'Solidcore3 Framework',
  target: 'Task',

  styles: `
    /* Dark theme styles */
    .theme-dark {
      background-color: #1a1a1a;
      color: #e0e0e0;
    }
    
    .theme-dark table {
      background-color: #2d2d2d;
    }
    
    .theme-dark th {
      background-color: #404040 !important;
      color: #ffffff;
    }
    
    .theme-dark .clickable-row:hover {
      background-color: #404040 !important;
    }
    
    .theme-dark .btn {
      background-color: #0066cc;
      border: 1px solid #0052a3;
    }
    
    .theme-dark .btn:hover {
      background-color: #0052a3;
    }
    
    /* Priority indicators */
    .priority-indicator {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
    }
    
    .priority-high { background-color: #dc3545; }
    .priority-medium { background-color: #ffc107; }
    .priority-low { background-color: #28a745; }
    
    /* Status badges */
    .status-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 500;
    }
    
    .status-todo { 
      background-color: #f8f9fa; 
      color: #6c757d; 
      border: 1px solid #dee2e6;
    }
    
    .status-in-progress { 
      background-color: #fff3cd; 
      color: #856404; 
      border: 1px solid #ffeaa7;
    }
    
    .status-done { 
      background-color: #d4edda; 
      color: #155724; 
      border: 1px solid #c3e6cb;
    }
    
    /* Theme toggle button */
    .theme-toggle {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: #6c757d;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.9em;
    }
    
    .theme-toggle:hover {
      background: #545b62;
    }
  `,

  scripts: `
    // Theme management
    (function() {
      const currentTheme = localStorage.getItem('task-theme') || 'light';
      document.body.classList.add('theme-' + currentTheme);
      
      // Add theme toggle button
      const toggleButton = document.createElement('button');
      toggleButton.className = 'theme-toggle';
      toggleButton.textContent = currentTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
      toggleButton.onclick = function() {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.classList.remove('theme-' + currentTheme);
        document.body.classList.add('theme-' + newTheme);
        localStorage.setItem('task-theme', newTheme);
        toggleButton.textContent = newTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
        window.location.reload(); // Reload to apply theme
      };
      
      // Add button when page loads
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          document.body.appendChild(toggleButton);
        });
      } else {
        document.body.appendChild(toggleButton);
      }
      
      // Enhanced priority display
      function enhancePriorityDisplay() {
        const priorityCells = document.querySelectorAll('td');
        priorityCells.forEach(cell => {
          const text = cell.textContent?.trim();
          if (['high', 'medium', 'low'].includes(text)) {
            cell.innerHTML = \`
              <span class="priority-indicator priority-\${text}"></span>
              <span class="status-badge priority-\${text}">\${text.toUpperCase()}</span>
            \`;
          }
        });
        
        const statusCells = document.querySelectorAll('td');
        statusCells.forEach(cell => {
          const text = cell.textContent?.trim();
          if (['todo', 'in-progress', 'done', 'archived'].includes(text)) {
            cell.innerHTML = \`<span class="status-badge status-\${text}">\${text}</span>\`;
          }
        });
      }
      
      // Apply enhancements when page loads
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhancePriorityDisplay);
      } else {
        setTimeout(enhancePriorityDisplay, 100);
      }
    })();
  `,

  components: [
    {
      name: 'enhanced-task-row',
      inject: {
        position: 'after',
        target: 'table',
        content: `
          <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
            <h4>✨ UI Enhanced by Task Themes Extension</h4>
            <p>Features:</p>
            <ul>
              <li>🌙 Dark/Light theme toggle (top-right corner)</li>
              <li>🎨 Priority indicators with colors</li>
              <li>🏷️ Status badges with styling</li>
              <li>💾 Theme preference saved in localStorage</li>
            </ul>
          </div>
        `
      }
    }
  ]
};

export default extension;

export async function init(context: any) {
  console.log('🎨 Task Themes UI extension initialized');
  console.log('   Features: Dark/Light themes, Priority indicators, Status badges');
}