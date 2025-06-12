# 🤖 AI Guide: Extensions Directory

This directory contains **custom business logic** and **application-specific functionality** that extends the generated scaffolding.

## Purpose

Extensions provide **escape hatches** for custom logic without breaking the declarative truth-file approach. They handle:

- **Business rules** - Complex validation, calculations, workflows
- **Integrations** - Third-party APIs, external services, webhooks
- **Custom behaviors** - Application-specific logic that can't be declared
- **Performance optimizations** - Caching, batching, custom queries

## Directory Structure

```
extensions/
├── AI-EXTENSIONS-GUIDE.md  # This guide
├── [empty now]             # Your extensions go here
├── api/                    # API middleware and custom endpoints
├── workflows/              # Business process automation  
├── integrations/           # Third-party service integrations
├── validation/             # Custom validation rules
└── utils/                  # Shared utility functions
```

## Extension Types

### 🔌 **API Extensions**
**Purpose:** Custom API endpoints, middleware, request/response processing

```javascript
// extensions/api/custom-task-endpoints.js
export default {
  entity: 'Task',
  
  // Custom API endpoints
  endpoints: {
    'POST /tasks/:id/assign': async (req, res) => {
      const { id } = req.params
      const { assigneeId } = req.body
      
      // Custom assignment logic
      const task = await Task.findById(id)
      if (task.status === 'done') {
        return res.status(400).json({ error: 'Cannot assign completed tasks' })
      }
      
      await task.update({ assignedTo: assigneeId })
      await notifyAssignee(assigneeId, task)
      
      res.json({ success: true })
    },
    
    'GET /tasks/analytics': async (req, res) => {
      const analytics = await calculateTaskAnalytics()
      res.json(analytics)
    }
  },
  
  // Request middleware
  middleware: {
    before: async (req, res, next) => {
      // Rate limiting, authentication, logging
      if (req.path.includes('/tasks') && !req.user) {
        return res.status(401).json({ error: 'Authentication required' })
      }
      next()
    },
    
    after: async (req, res, data) => {
      // Response transformation, caching, analytics
      if (req.path.includes('/tasks')) {
        await logTaskAccess(req.user.id, data)
      }
      return data
    }
  }
}
```

### 🔄 **Workflow Extensions**
**Purpose:** Business process automation, event handling, background jobs

```javascript
// extensions/workflows/task-automation.js
export default {
  // Event triggers
  on: {
    'task.created': async (task) => {
      // Auto-assign based on workload
      const assignee = await findBestAssignee(task)
      if (assignee) {
        await task.update({ assignedTo: assignee.id })
        await sendNotification(assignee, 'New task assigned', task)
      }
    },
    
    'task.status.changed': async (task, oldStatus, newStatus) => {
      if (newStatus === 'done') {
        // Mark dependent tasks as ready
        await unlockDependentTasks(task.id)
        
        // Update project progress
        await updateProjectProgress(task.projectId)
        
        // Send completion notification
        await notifyStakeholders(task, 'Task completed')
      }
    },
    
    'task.overdue': async (task) => {
      // Escalation workflow
      await escalateOverdueTask(task)
      await notifyManager(task.assignedTo, task)
    }
  },
  
  // Scheduled jobs
  schedules: {
    'daily': async () => {
      await sendDailyTaskSummary()
      await archiveCompletedTasks()
    },
    
    'hourly': async () => {
      await checkOverdueTasks()
      await syncWithExternalSystems()
    }
  }
}
```

### 🔗 **Integration Extensions**
**Purpose:** Third-party service integrations, external APIs, webhooks

```javascript
// extensions/integrations/slack-integration.js
export default {
  name: 'slack',
  
  // Configuration
  config: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    channel: '#tasks',
    botName: 'TaskBot'
  },
  
  // Methods
  async sendNotification(message, channel = this.config.channel) {
    const payload = {
      channel,
      username: this.config.botName,
      text: message,
      icon_emoji: ':robot_face:'
    }
    
    await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  },
  
  async formatTaskMessage(task, action) {
    return `${action}: *${task.title}* (${task.priority} priority) assigned to ${task.assignee?.name || 'unassigned'}`
  },
  
  // Event handlers
  async onTaskCreated(task) {
    const message = await this.formatTaskMessage(task, 'New Task')
    await this.sendNotification(message)
  },
  
  async onTaskCompleted(task) {
    const message = await this.formatTaskMessage(task, 'Task Completed')
    await this.sendNotification(message)
  }
}

// extensions/integrations/email-service.js
export default {
  name: 'email',
  
  async sendTaskNotification(userId, task, type) {
    const user = await User.findById(userId)
    const template = getEmailTemplate(type)
    
    const emailData = {
      to: user.email,
      subject: template.subject.replace('{{task.title}}', task.title),
      html: template.html
        .replace('{{user.name}}', user.name)
        .replace('{{task.title}}', task.title)
        .replace('{{task.description}}', task.description)
    }
    
    await sendEmail(emailData)
  }
}
```

### ✅ **Validation Extensions**
**Purpose:** Complex business rules, cross-entity validation, custom constraints

```javascript
// extensions/validation/business-rules.js
export default {
  entity: 'Task',
  
  // Custom validation rules
  rules: {
    async validateTaskAssignment(task, context) {
      if (task.assignedTo) {
        const assignee = await User.findById(task.assignedTo)
        
        // Check assignee workload
        const currentTasks = await Task.count({ 
          assignedTo: task.assignedTo, 
          status: ['todo', 'in-progress'] 
        })
        
        if (currentTasks >= assignee.maxConcurrentTasks) {
          return {
            valid: false,
            message: `${assignee.name} already has ${currentTasks} active tasks`
          }
        }
        
        // Check assignee skills
        if (task.requiredSkills && !hasRequiredSkills(assignee, task.requiredSkills)) {
          return {
            valid: false,
            message: 'Assignee lacks required skills'
          }
        }
      }
      
      return { valid: true }
    },
    
    async validateTaskDependencies(task) {
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          const dependency = await Task.findById(depId)
          if (dependency.status !== 'done') {
            return {
              valid: false,
              message: `Task depends on incomplete task: ${dependency.title}`
            }
          }
        }
      }
      
      return { valid: true }
    }
  },
  
  // Validation triggers
  triggers: {
    beforeCreate: ['validateTaskAssignment', 'validateTaskDependencies'],
    beforeUpdate: ['validateTaskAssignment'],
    beforeStatusChange: ['validateTaskDependencies']
  }
}
```

### 🛠️ **Utility Extensions**
**Purpose:** Shared helper functions, common operations, data transformations

```javascript
// extensions/utils/task-utils.js
export const TaskUtils = {
  // Calculate task completion percentage
  calculateProgress(tasks) {
    if (!tasks.length) return 0
    const completed = tasks.filter(t => t.status === 'done').length
    return Math.round((completed / tasks.length) * 100)
  },
  
  // Find critical path in project
  findCriticalPath(tasks) {
    const dependencyMap = this.buildDependencyMap(tasks)
    return this.calculateLongestPath(dependencyMap)
  },
  
  // Auto-assign based on workload and skills
  async findBestAssignee(task) {
    const users = await User.findAll({ active: true })
    
    return users
      .filter(user => this.hasRequiredSkills(user, task.requiredSkills))
      .sort((a, b) => a.currentWorkload - b.currentWorkload)[0]
  },
  
  // Generate task analytics
  async generateAnalytics(dateRange = '30d') {
    const tasks = await Task.findAll({ 
      createdAt: { gte: this.getDateRange(dateRange) }
    })
    
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => this.isOverdue(t)).length,
      byPriority: this.groupBy(tasks, 'priority'),
      byAssignee: this.groupBy(tasks, 'assignedTo'),
      averageCompletionTime: this.calculateAverageCompletionTime(tasks)
    }
  },
  
  // Helper methods
  buildDependencyMap(tasks) {
    // Implementation
  },
  
  hasRequiredSkills(user, requiredSkills) {
    if (!requiredSkills?.length) return true
    return requiredSkills.every(skill => user.skills?.includes(skill))
  },
  
  isOverdue(task) {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
  }
}

// extensions/utils/notification-utils.js
export const NotificationUtils = {
  async sendBulkNotifications(users, message, type = 'info') {
    const notifications = users.map(user => ({
      userId: user.id,
      message,
      type,
      createdAt: new Date()
    }))
    
    await Notification.createMany(notifications)
    
    // Send real-time updates
    users.forEach(user => {
      this.sendRealTimeUpdate(user.id, { type: 'notification', data: message })
    })
  },
  
  async sendRealTimeUpdate(userId, data) {
    // WebSocket or Server-Sent Events implementation
    const socket = getSocketConnection(userId)
    if (socket) {
      socket.send(JSON.stringify(data))
    }
  }
}
```

## Extension Loading

Extensions are automatically loaded by the runtime. The loading order is:

1. **Validation extensions** - Before any data operations
2. **API extensions** - During request processing
3. **Workflow extensions** - After data changes
4. **Integration extensions** - For external communication

## Integration Patterns

### 🪝 **Using in View Hooks**
```javascript
// views/TaskList.hooks.js
import { TaskUtils } from '../extensions/utils/task-utils.js'
import SlackIntegration from '../extensions/integrations/slack-integration.js'

export default {
  beforeRender: (data) => {
    // Add computed fields
    return data.map(task => ({
      ...task,
      isOverdue: TaskUtils.isOverdue(task),
      progress: TaskUtils.calculateProgress([task])
    }))
  },
  
  customActions: [
    {
      label: 'Notify Team',
      onClick: async (task) => {
        await SlackIntegration.sendNotification(
          `Task "${task.title}" needs attention`,
          '#team-alerts'
        )
      }
    }
  ]
}
```

### 🔌 **API Integration**
```javascript
// Extensions automatically extend the generated API
// Generated: GET /api/tasks
// Extended: GET /api/tasks/analytics (from API extension)
// Extended: POST /api/tasks/:id/assign (from API extension)
```

### 🎯 **Truth File Integration**
```javascript
// Extensions can be referenced in the truth file
export const App = {
  entities: {
    Task: {
      fields: { /* ... */ },
      
      // Reference validation extensions
      validation: ['business-rules'],
      
      // Reference workflow extensions  
      workflows: ['task-automation'],
      
      // Reference integrations
      integrations: ['slack', 'email']
    }
  }
}
```

## Best Practices

### ✅ **Do**

```javascript
// ✅ Use clear, descriptive names
// extensions/workflows/task-lifecycle-automation.js

// ✅ Handle errors gracefully
async onTaskCreated(task) {
  try {
    await sendNotification(task)
  } catch (error) {
    console.error('Failed to send notification:', error)
    // Don't fail the main operation
  }
}

// ✅ Make extensions configurable
export default {
  config: {
    enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true',
    slackChannel: process.env.SLACK_CHANNEL || '#general'
  }
}

// ✅ Keep extensions focused and single-purpose
// One file = one integration or one workflow
```

### ❌ **Avoid**

```javascript
// ❌ Don't put everything in one giant file
// extensions/everything.js (400 lines of mixed concerns)

// ❌ Don't break the main application flow
async onTaskCreated(task) {
  await externalAPI.call() // If this fails, task creation fails
  // ✅ Instead: Make it non-blocking or handle errors
}

// ❌ Don't duplicate logic from generated code
// ✅ Instead: Use the generated models and APIs
```

## Common Patterns

### 📊 **Analytics Extension**
```javascript
// extensions/analytics/task-metrics.js
export default {
  async generateDashboardMetrics() {
    const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
      Task.count(),
      Task.count({ status: 'done' }),
      Task.count({ dueDate: { lt: new Date() }, status: { ne: 'done' } })
    ])
    
    return {
      completion: Math.round((completedTasks / totalTasks) * 100),
      overdue: overdueTasks,
      productivity: await this.calculateProductivityScore()
    }
  }
}
```

### 🔄 **State Machine Extension**
```javascript
// extensions/workflows/task-state-machine.js
export default {
  states: {
    todo: ['in-progress', 'cancelled'],
    'in-progress': ['done', 'blocked', 'todo'],
    blocked: ['in-progress', 'cancelled'],
    done: ['todo'], // Allow reopening
    cancelled: ['todo']
  },
  
  async validateTransition(task, newStatus) {
    const allowedTransitions = this.states[task.status] || []
    return allowedTransitions.includes(newStatus)
  }
}
```

### 🔗 **Multi-Service Integration**
```javascript
// extensions/integrations/notification-hub.js
export default {
  services: ['slack', 'email', 'sms'],
  
  async notifyAll(message, urgency = 'normal') {
    const promises = this.services.map(service => 
      this.getService(service).send(message, urgency)
    )
    
    await Promise.allSettled(promises) // Don't fail if one service is down
  }
}
```

Remember: **Extensions are your escape hatch for custom logic. Use them to add business-specific functionality without breaking the declarative architecture!** 🔌✨