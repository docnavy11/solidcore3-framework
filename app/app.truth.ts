import { AppDefinition } from '../core/types/index.ts';

/**
 * 🎯 TRUTH FILE - Single Source of Application Definition
 * 
 * This file declares EVERYTHING about your app:
 * - What data exists (entities & fields)
 * - How users interact with it (UI configuration)
 * - What happens automatically (behaviors & workflows)
 * - Who can do what (permissions)
 * 
 * Change this file → entire app updates automatically
 */
export const App: AppDefinition = {
  name: 'TaskManager',
  version: '1.0.0',
  description: 'A simple task management application',

  // 📋 ENTITIES: What data your app stores
  entities: {
    // Each entity = a database table + complete UI specification
    Task: {
      
      // 🏗 FIELDS: The actual data structure (like database columns)
      fields: {
        // System fields (auto-managed)
        id: {
          type: 'string',
          unique: true,
          auto: true,        // Framework generates this automatically
        },
        createdAt: {
          type: 'date',
          auto: true,        // Framework sets this when task is created
        },
        updatedAt: {
          type: 'date',
          auto: true,        // Framework updates this when task changes
        },

        // User fields (what users actually fill in)
        title: {
          type: 'string',
          required: true,    // Must be provided
          maxLength: 200,    // Validation rule
        },
        description: {
          type: 'string',
          required: false,   // Optional field
        },
        status: {
          type: 'enum',      // Dropdown with fixed options
          options: ['todo', 'in-progress', 'done', 'archived'],
          default: 'todo',   // New tasks start as 'todo'
          required: true,
        },
        priority: {
          type: 'enum',
          options: ['low', 'medium', 'high'],
          default: 'medium', // New tasks default to medium priority
        },
        dueDate: {
          type: 'date',
          required: false,   // Optional deadline
        },
      },

      // ⚡ BEHAVIORS: One-click actions users can perform
      behaviors: {
        complete: {
          type: 'update',
          fields: { status: 'done', updatedAt: 'now' },  // What gets changed
          // Result: "Complete" button changes status to 'done'
        },
        archive: {
          type: 'update',
          fields: { status: 'archived', updatedAt: 'now' },
          // Result: "Archive" button changes status to 'archived'
        },
      },

      // 🔒 PERMISSIONS: Who can do what
      permissions: {
        create: 'authenticated',  // Only logged-in users can create tasks
        read: 'public',          // Anyone can view tasks
        update: 'authenticated', // Only logged-in users can edit tasks
        delete: 'authenticated', // Only logged-in users can delete tasks
      },

      // 🎨 UI: How tasks appear in every interface
      ui: {
        // How tasks are displayed everywhere (cards, lists, etc.)
        display: {
          primary: 'title',        // Main text that identifies the task
          secondary: 'description', // Smaller text shown below title
          badge: 'status',         // Colored badge showing task status
          color: {
            field: 'priority',     // Color tasks based on priority field
            map: { 
              high: '#ef4444',     // High priority = red
              medium: '#f59e0b',   // Medium priority = yellow  
              low: '#10b981'       // Low priority = green
            }
          },
          metadata: ['dueDate', 'createdAt']  // Small text shown at bottom
        },

        // Task list page (/tasks)
        list: {
          columns: ['title', 'status', 'priority', 'dueDate'],  // Table columns to show
          sortable: true,                                       // Enable column sorting
          filterable: ['status', 'priority'],                  // Add filter dropdowns
          searchable: ['title', 'description'],                // Search these fields
          actions: ['edit', 'delete']                          // Action buttons on each row
        },

        // Create/edit task forms
        form: {
          fields: ['title', 'description', 'status', 'priority', 'dueDate'],  // Form fields to show
          layout: 'single-column'  // How to arrange the fields
        },

        // Task detail page (/tasks/:id)
        detail: {
          sections: [  // Organize fields into logical sections
            {
              title: 'Basic Information',
              fields: ['title', 'description']  // Core task info
            },
            {
              title: 'Status & Priority', 
              fields: ['status', 'priority', 'dueDate']  // Task management info
            },
            {
              title: 'Metadata',
              fields: ['createdAt', 'updatedAt']  // System timestamps
            }
          ],
          actions: ['edit', 'delete']  // Action buttons at bottom
        }
      },
    },
  },

  // 📱 VIEWS: The actual web pages users see
  views: {
    TaskList: {
      type: 'list',           // Shows a table/list of tasks
      route: '/tasks',        // URL: yoursite.com/tasks
      entity: 'Task',         // Shows Task entities
      title: 'All Tasks',     // Page title
      filters: {
        status: ['todo', 'in-progress', 'done'],  // Filter buttons for these statuses
      },
    },
    TaskDetail: {
      type: 'detail',         // Shows single task details
      route: '/tasks/:id',    // URL: yoursite.com/tasks/123
      entity: 'Task',         // Shows a Task entity
    },
    CreateTask: {
      type: 'form',           // Shows a creation form
      route: '/tasks/new',    // URL: yoursite.com/tasks/new
      entity: 'Task',         // Creates a new Task
      mode: 'create',         // Form is for creating (not editing)
      title: 'Create New Task',
    },
    AboutPage: {
      type: 'custom',         // Custom page with no entity
      route: '/about',        // URL: yoursite.com/about
      title: 'About TaskManager',
      template: 'about'       // Uses app-specific about template
    },
    HelpPage: {
      type: 'custom',         // Custom page with no entity
      route: '/help',         // URL: yoursite.com/help
      title: 'Help & Support',
      template: 'help'        // Uses core system help template
    },
    ContactPage: {
      type: 'custom',         // Custom page with no entity
      route: '/contact',      // URL: yoursite.com/contact
      title: 'Contact Us',
      template: 'contact'     // Uses static HTML template (app/static/contact.html)
    },
  },

  // 🤖 WORKFLOWS: Things that happen automatically
  workflows: {
    // When someone creates a high-priority task → send notifications
    notifyOnHighPriority: {
      trigger: 'Task.created',    // When a new task is created
      condition: 'priority == "high"',  // Only if it's high priority
      actions: [
        { type: 'email', to: 'admin@example.com', subject: 'High Priority Task Created' },
        { type: 'webhook', url: 'https://api.example.com/webhooks/task-created' }
      ],
    },

    // When someone completes any task → log it and update stats
    celebrateCompletion: {
      trigger: 'Task.completed',  // When complete behavior is triggered
      actions: [
        { type: 'log', message: 'Task completed successfully' },
        { type: 'webhook', url: 'https://api.example.com/webhooks/task-completed' }
      ],
    },

    // When someone completes a high-priority task → extra notification
    notifyImportantCompletion: {
      trigger: 'Task.completed',
      condition: 'priority == "high"',  // Only high priority tasks
      actions: [
        { type: 'webhook', url: 'https://api.example.com/webhooks/important-task-completed' }
      ],
    },
  },
};