import { APIExtension } from '../../core/types/extensions.ts';

// Example API Extension: Task Analytics
const extension: APIExtension = {
  name: 'task-analytics',
  type: 'api',
  version: '1.0.0',
  description: 'Provides analytics and statistics for tasks',
  author: 'Solidcore3 Framework',
  entity: 'Task',

  routes: [
    {
      method: 'GET',
      path: '/stats',
      description: 'Get task statistics',
      handler: async (c) => {
        // Return mock data for testing extension system
        return c.json({
          summary: {
            total: 5,
            completed: 2,
            highPriority: 1,
            completionRate: 40
          },
          breakdown: {
            byStatus: [
              { status: 'todo', count: 2 },
              { status: 'done', count: 2 },
              { status: 'in-progress', count: 1 }
            ],
            byPriority: [
              { priority: 'high', count: 1 },
              { priority: 'medium', count: 3 },
              { priority: 'low', count: 1 }
            ]
          },
          generatedAt: new Date().toISOString(),
          message: 'Mock data from Task Analytics extension'
        });
      }
    },
    {
      method: 'GET',
      path: '/productivity',
      description: 'Get productivity metrics',
      handler: async (c) => {
        // Return mock data for testing extension system
        return c.json({
          recentActivity: [
            { date: '2024-01-08', count: 3 },
            { date: '2024-01-09', count: 1 },
            { date: '2024-01-10', count: 2 }
          ],
          averageCompletionTime: {
            hours: 24,
            description: 'Average hours from creation to completion'
          },
          productivity: {
            trend: 'improving',
            weeklyAverage: 8.5,
            bestDay: 'Monday'
          },
          generatedAt: new Date().toISOString(),
          message: 'Mock productivity data from Task Analytics extension'
        });
      }
    }
  ],

  middleware: [
    {
      name: 'analytics-logger',
      handler: async (c, next) => {
        const start = Date.now();
        await next();
        const duration = Date.now() - start;
        console.log(`📊 Analytics API: ${c.req.method} ${c.req.path} - ${duration}ms`);
      }
    }
  ],

  hooks: {
    afterCreate: async (data, result) => {
      console.log(`📈 Task created: ${data.title} (Priority: ${data.priority})`);
    },
    
    afterUpdate: async (id, data, result) => {
      if (data.status === 'done') {
        console.log(`🎉 Task completed: ${id}`);
      }
    }
  }
};

export default extension;

// Optional initialization function
export async function init(context: any) {
  console.log('🔧 Task Analytics extension initialized');
  
  // Register custom workflow actions
  if (context.events) {
    context.events.on('task.completed', async (event: any) => {
      console.log(`📊 Analytics: Task ${event.entityId} completed`);
      // Could send data to external analytics service
    });
  }
}