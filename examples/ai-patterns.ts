// AI-Friendly Component Patterns for Solidcore3 Constrained System
// This file demonstrates how AI can effectively use the constrained component library

import { 
  Stack, Grid, Card, Text, Heading, Button, Alert, Modal, 
  Input, Select, Badge, Table 
} from '../core/ui/components/index.ts';

/**
 * PATTERN 1: Simple Layout → Container → Content
 * AI learns: Outer layout, inner container, content inside
 */
export function SimpleTaskCard(task: any): string {
  return Stack({ 
    gap: 4,
    children: Card({
      p: 6,
      shadow: 2,
      bg: 'white',
      children: `
        ${Heading({ level: 3, children: task.title })}
        ${Text({ size: 'sm', color: 'gray.600', children: task.description })}
        ${Badge({ children: task.status, bg: task.status === 'done' ? 'success' : 'warning' })}
      `
    })
  });
}

/**
 * PATTERN 2: Interactive Components with Data Attributes
 * AI learns: Add data-* props for interactivity
 */
export function InteractiveTaskCard(task: any): string {
  return Card({
    p: 4,
    shadow: 1,
    rounded: true,
    children: Stack({
      gap: 3,
      children: `
        ${Heading({ level: 4, children: task.title })}
        ${Text({ children: task.description, color: 'gray.700' })}
        
        ${Stack({
          direction: 'horizontal',
          gap: 2,
          children: `
            ${Button({
              children: 'Complete',
              variant: 'primary',
              size: 'sm',
              'data-action': 'complete',
              'data-entity': 'Task',
              'data-id': task.id,
              'data-success': 'remove'
            })}
            
            ${Button({
              children: 'Edit',
              variant: 'secondary', 
              size: 'sm',
              'data-action': 'edit',
              'data-entity': 'Task',
              'data-id': task.id,
              'data-redirect': `/tasks/${task.id}/edit`
            })}
            
            ${Button({
              children: 'Delete',
              variant: 'danger',
              size: 'sm',
              'data-action': 'delete',
              'data-entity': 'Task',
              'data-id': task.id,
              'data-confirm': 'Are you sure you want to delete this task?',
              'data-success': 'remove'
            })}
          `
        })}
      `
    })
  });
}

/**
 * PATTERN 3: Responsive Grids with Props
 * AI learns: Use responsive arrays for different breakpoints
 */
export function ResponsiveTaskDashboard(tasks: any[]): string {
  return Stack({
    gap: 6,
    p: 4,
    children: `
      ${Heading({ level: 1, children: 'Task Dashboard' })}
      
      ${Alert({
        type: 'info',
        children: `You have ${tasks.filter(t => t.status !== 'done').length} tasks remaining.`
      })}
      
      ${Grid({
        cols: [1, 2, 3], // 1 on mobile, 2 on tablet, 3 on desktop
        gap: 4,
        children: tasks.map(task => InteractiveTaskCard(task)).join('')
      })}
    `
  });
}

/**
 * PATTERN 4: Form with Validation and Interaction
 * AI learns: Build forms with proper structure and validation
 */
export function TaskForm(mode: 'create' | 'edit', data?: any): string {
  return Card({
    p: 6,
    shadow: 2,
    children: Stack({
      gap: 4,
      children: `
        ${Heading({ 
          level: 2, 
          children: mode === 'create' ? 'Create New Task' : 'Edit Task' 
        })}
        
        <form data-action="submit" data-entity="Task" data-success="redirect" data-redirect="/tasks">
          ${Stack({
            gap: 4,
            children: `
              ${Input({
                name: 'title',
                label: 'Task Title',
                placeholder: 'Enter task title...',
                required: true,
                value: data?.title || ''
              })}
              
              ${Input({
                type: 'textarea',
                name: 'description',
                label: 'Description',
                placeholder: 'Describe the task...',
                value: data?.description || ''
              })}
              
              ${Select({
                name: 'status',
                label: 'Status',
                options: ['todo', 'in-progress', 'done'],
                value: data?.status || 'todo'
              })}
              
              ${Select({
                name: 'priority',
                label: 'Priority',
                options: [
                  { value: 'low', label: 'Low Priority' },
                  { value: 'medium', label: 'Medium Priority' },
                  { value: 'high', label: 'High Priority' }
                ],
                value: data?.priority || 'medium'
              })}
            `
          })}
          
          <div style="margin-top: 2rem;">
            ${Stack({
              direction: 'horizontal',
              gap: 2,
              children: `
                ${Button({
                  type: 'submit',
                  children: mode === 'create' ? 'Create Task' : 'Update Task',
                  variant: 'primary'
                })}
                
                ${Button({
                  type: 'button',
                  children: 'Cancel',
                  variant: 'secondary',
                  onClick: 'history.back()'
                })}
              `
            })}
          </div>
        </form>
      `
    })
  });
}

/**
 * PATTERN 5: Data Tables with Actions
 * AI learns: Build tables with proper data structure
 */
export function TaskTable(tasks: any[]): string {
  const tableData = tasks.map(task => ({
    title: task.title,
    status: Badge({ 
      children: task.status,
      bg: task.status === 'done' ? 'success' : 
          task.status === 'in-progress' ? 'warning' : 'gray.500'
    }),
    priority: task.priority,
    dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—',
    actions: Stack({
      direction: 'horizontal',
      gap: 1,
      children: `
        ${Button({
          children: 'View',
          size: 'sm',
          variant: 'ghost',
          'data-action': 'view',
          'data-url': `/tasks/${task.id}`
        })}
        ${Button({
          children: 'Edit',
          size: 'sm',
          variant: 'secondary',
          'data-action': 'edit',
          'data-url': `/tasks/${task.id}/edit`
        })}
      `
    })
  }));

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'actions', label: 'Actions' }
  ];

  return Card({
    p: 0,
    shadow: 1,
    children: Table({
      data: tableData,
      columns: columns
    })
  });
}

/**
 * PATTERN 6: Modal Dialog with Complex Content
 * AI learns: Build modals for complex interactions
 */
export function TaskDetailModal(task: any, isOpen: boolean): string {
  return Modal({
    open: isOpen,
    title: 'Task Details',
    size: 'lg',
    onClose: 'closeTaskModal()',
    children: Stack({
      gap: 4,
      children: `
        ${Stack({
          gap: 3,
          children: `
            ${Heading({ level: 3, children: task.title })}
            
            ${Stack({
              direction: 'horizontal',
              gap: 4,
              children: `
                ${Badge({ 
                  children: task.status,
                  bg: task.status === 'done' ? 'success' : 'warning'
                })}
                ${Badge({ 
                  children: task.priority + ' priority',
                  bg: task.priority === 'high' ? 'error' : 
                      task.priority === 'medium' ? 'warning' : 'gray.500'
                })}
              `
            })}
            
            ${Text({ children: task.description, color: 'gray.700' })}
          `
        })}
        
        ${Stack({
          direction: 'horizontal',
          gap: 2,
          children: `
            ${Button({
              children: 'Edit Task',
              variant: 'primary',
              'data-url': `/tasks/${task.id}/edit`,
              'data-success': 'redirect'
            })}
            
            ${Button({
              children: 'Mark Complete',
              variant: 'success',
              'data-action': 'complete',
              'data-entity': 'Task',
              'data-id': task.id,
              'data-success': 'reload'
            })}
            
            ${Button({
              children: 'Close',
              variant: 'secondary',
              onClick: 'closeTaskModal()'
            })}
          `
        })}
      `
    })
  });
}

/**
 * PATTERN 7: Status Dashboard with Statistics
 * AI learns: Build dashboards with metrics and charts
 */
export function TaskStatusDashboard(stats: any): string {
  return Stack({
    gap: 6,
    children: `
      ${Heading({ level: 1, children: 'Task Analytics' })}
      
      ${Grid({
        cols: [1, 2, 4], // Responsive grid
        gap: 4,
        children: `
          ${Card({
            p: 4,
            bg: 'blue.50',
            children: Stack({
              align: 'center',
              children: `
                ${Heading({ level: 2, children: stats.total.toString(), color: 'blue.600' })}
                ${Text({ children: 'Total Tasks', color: 'blue.800', size: 'sm' })}
              `
            })
          })}
          
          ${Card({
            p: 4,
            bg: 'green.50',
            children: Stack({
              align: 'center',
              children: `
                ${Heading({ level: 2, children: stats.completed.toString(), color: 'green.600' })}
                ${Text({ children: 'Completed', color: 'green.800', size: 'sm' })}
              `
            })
          })}
          
          ${Card({
            p: 4,
            bg: 'yellow.50',
            children: Stack({
              align: 'center',
              children: `
                ${Heading({ level: 2, children: stats.inProgress.toString(), color: 'yellow.600' })}
                ${Text({ children: 'In Progress', color: 'yellow.800', size: 'sm' })}
              `
            })
          })}
          
          ${Card({
            p: 4,
            bg: 'red.50',
            children: Stack({
              align: 'center',
              children: `
                ${Heading({ level: 2, children: stats.overdue.toString(), color: 'red.600' })}
                ${Text({ children: 'Overdue', color: 'red.800', size: 'sm' })}
              `
            })
          })}
        `
      })}
      
      ${Alert({
        type: stats.overdue > 0 ? 'warning' : 'success',
        title: stats.overdue > 0 ? 'Action Required' : 'Great Work!',
        children: stats.overdue > 0 
          ? `You have ${stats.overdue} overdue tasks that need attention.`
          : 'All tasks are on track. Keep up the good work!'
      })}
    `
  });
}

/**
 * PATTERN 8: Complete Application Layout
 * AI learns: Build full application layouts with navigation
 */
export function ApplicationLayout(content: string, user: any): string {
  return Stack({
    gap: 0,
    children: `
      <!-- Header -->
      ${Card({
        p: 4,
        bg: 'primary',
        rounded: false,
        shadow: 1,
        children: Stack({
          direction: 'horizontal',
          align: 'center',
          children: `
            ${Heading({ level: 2, children: 'TaskManager', color: 'white' })}
            
            <div style="flex: 1;"></div>
            
            ${Stack({
              direction: 'horizontal',
              gap: 2,
              children: `
                ${Text({ children: \`Welcome, \${user.name}\`, color: 'white' })}
                ${Button({
                  children: 'Logout',
                  variant: 'ghost',
                  size: 'sm',
                  'data-action': 'logout',
                  'data-confirm': 'Are you sure you want to logout?'
                })}
              `
            })}
          `
        })
      })}
      
      <!-- Main Content -->
      <div style="flex: 1; padding: 2rem;">
        ${content}
      </div>
      
      <!-- Footer -->
      ${Card({
        p: 4,
        bg: 'gray.100',
        rounded: false,
        children: Text({ 
          children: '© 2024 TaskManager. Built with Solidcore3 Framework.',
          size: 'sm',
          color: 'gray.600',
          align: 'center'
        })
      })}
    `
  });
}

// Example usage for AI training
export const AIExamples = {
  
  // Example 1: AI creates a simple task list
  createTaskList: (tasks: any[]) => Stack({
    gap: 4,
    children: `
      ${Heading({ level: 2, children: 'My Tasks' })}
      ${tasks.map(task => SimpleTaskCard(task)).join('')}
    `
  }),
  
  // Example 2: AI creates a complete task management page
  createTaskPage: (tasks: any[], stats: any) => Stack({
    gap: 6,
    children: `
      ${TaskStatusDashboard(stats)}
      ${TaskTable(tasks)}
      ${Button({
        children: 'Add New Task',
        variant: 'primary',
        'data-url': '/tasks/new',
        'data-success': 'redirect'
      })}
    `
  }),
  
  // Example 3: AI creates a settings page
  createSettingsPage: (settings: any) => Stack({
    gap: 6,
    children: `
      ${Heading({ level: 1, children: 'Settings' })}
      
      ${Card({
        p: 6,
        children: Stack({
          gap: 4,
          children: `
            ${Heading({ level: 3, children: 'Preferences' })}
            
            ${Select({
              name: 'theme',
              label: 'Theme',
              options: ['light', 'dark', 'auto'],
              value: settings.theme
            })}
            
            ${Select({
              name: 'notifications',
              label: 'Email Notifications',
              options: ['enabled', 'disabled'],
              value: settings.notifications
            })}
            
            ${Button({
              children: 'Save Settings',
              variant: 'primary',
              'data-action': 'save',
              'data-entity': 'Settings'
            })}
          `
        })
      })}
    `
  })
};

/**
 * AI LEARNING SUMMARY:
 * 
 * 1. LAYOUT PATTERN: Stack → Card → Content
 * 2. PROPS PATTERN: Use semantic props (gap, p, bg, shadow, etc.)
 * 3. INTERACTION PATTERN: Add data-* attributes for behavior
 * 4. RESPONSIVE PATTERN: Use arrays for breakpoint values
 * 5. COMPOSITION PATTERN: Build complex UIs from simple parts
 * 6. CONSISTENCY PATTERN: Same components, consistent results
 * 
 * AI can now reliably generate production-quality UIs using just these patterns!
 */