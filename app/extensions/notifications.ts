import { WorkflowExtension } from '../../core/types/extensions.ts';

// Example Workflow Extension: Enhanced Notifications
const extension: WorkflowExtension = {
  name: 'notifications',
  type: 'workflow',
  version: '1.0.0',
  description: 'Enhanced notification system with multiple channels',
  author: 'Solidcore3 Framework',

  actions: {
    'slack': {
      name: 'Send Slack notification',
      description: 'Send a message to Slack channel',
      parameters: {
        channel: { type: 'string', default: '#general' },
        message: { type: 'string', required: true }
      },
      handler: async (event, params) => {
        console.log(`💬 Slack notification to ${params?.channel || '#general'}:`);
        console.log(`   📝 ${params?.message || event.data.title}`);
        console.log(`   🔗 Task: ${event.entityId}`);
        
        // In production, integrate with Slack API
        if (params?.webhookUrl) {
          try {
            await fetch(params.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: params.message || `Task updated: ${event.data.title}`,
                channel: params.channel
              })
            });
          } catch (error) {
            console.error('Slack notification failed:', error);
          }
        }
      }
    },

    'discord': {
      name: 'Send Discord notification',
      description: 'Send a message to Discord channel',
      parameters: {
        webhookUrl: { type: 'string', required: true },
        message: { type: 'string', required: true }
      },
      handler: async (event, params) => {
        console.log(`🎮 Discord notification:`);
        console.log(`   📝 ${params?.message}`);
        
        if (params?.webhookUrl) {
          try {
            await fetch(params.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: params.message,
                embeds: [{
                  title: `Task ${event.behavior || 'Updated'}`,
                  description: event.data.title,
                  color: event.data.priority === 'high' ? 0xff0000 : 0x00ff00,
                  timestamp: event.timestamp
                }]
              })
            });
          } catch (error) {
            console.error('Discord notification failed:', error);
          }
        }
      }
    },

    'email.advanced': {
      name: 'Send advanced email',
      description: 'Send HTML email with templates',
      parameters: {
        to: { type: 'string', required: true },
        template: { type: 'string', default: 'default' },
        data: { type: 'object' }
      },
      handler: async (event, params) => {
        console.log(`📧 Advanced email to ${params?.to}:`);
        console.log(`   📋 Template: ${params?.template || 'default'}`);
        console.log(`   📝 Task: ${event.data.title}`);
        
        // Generate HTML email content
        const htmlContent = generateEmailTemplate(params?.template || 'default', {
          task: event.data,
          event: event,
          ...params?.data
        });
        
        // In production, send via email service
        console.log(`   💌 HTML content generated (${htmlContent.length} chars)`);
      }
    },

    'webhook.custom': {
      name: 'Custom webhook with retry',
      description: 'Send webhook with retry logic and custom headers',
      parameters: {
        url: { type: 'string', required: true },
        headers: { type: 'object' },
        retries: { type: 'number', default: 3 },
        timeout: { type: 'number', default: 5000 }
      },
      handler: async (event, params) => {
        const maxRetries = params?.retries || 3;
        let attempt = 0;
        
        while (attempt < maxRetries) {
          try {
            console.log(`🔗 Webhook attempt ${attempt + 1}/${maxRetries} to ${params?.url}`);
            
            const response = await fetch(params!.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...params?.headers
              },
              body: JSON.stringify({
                event: event.entity + '.' + event.behavior,
                data: event.data,
                timestamp: event.timestamp,
                entityId: event.entityId
              }),
              signal: AbortSignal.timeout(params?.timeout || 5000)
            });
            
            if (response.ok) {
              console.log(`✅ Webhook successful (${response.status})`);
              return;
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          } catch (error) {
            attempt++;
            console.error(`❌ Webhook attempt ${attempt} failed:`, error.message);
            
            if (attempt < maxRetries) {
              // Exponential backoff
              const delay = Math.pow(2, attempt) * 1000;
              console.log(`⏳ Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        console.error(`💥 Webhook failed after ${maxRetries} attempts`);
      }
    }
  },

  triggers: {
    'priority.escalation': {
      name: 'Priority escalation trigger',
      description: 'Trigger when high-priority task is overdue',
      condition: (event) => {
        return event.data.priority === 'high' && 
               event.data.dueDate && 
               new Date(event.data.dueDate) < new Date();
      },
      handler: async (event) => {
        console.log(`🚨 High-priority task overdue: ${event.data.title}`);
        // Auto-escalate or notify managers
      }
    }
  }
};

function generateEmailTemplate(template: string, data: any): string {
  const templates = {
    default: `
      <h2>Task ${data.event.behavior || 'Updated'}</h2>
      <p><strong>Title:</strong> ${data.task.title}</p>
      <p><strong>Status:</strong> ${data.task.status}</p>
      <p><strong>Priority:</strong> ${data.task.priority}</p>
      <p><strong>Updated:</strong> ${data.event.timestamp}</p>
    `,
    completion: `
      <h2>🎉 Task Completed!</h2>
      <p>Great work! The following task has been completed:</p>
      <blockquote>
        <strong>${data.task.title}</strong>
      </blockquote>
      <p>Completed on: ${data.event.timestamp}</p>
    `
  };
  
  return templates[template as keyof typeof templates] || templates.default;
}

export default extension;

export async function init(context: any) {
  console.log('🔔 Notifications extension initialized');
  
  // Register additional event listeners
  if (context.events) {
    context.events.on('task.created', async (event: any) => {
      if (event.data.priority === 'high') {
        console.log(`🚨 High-priority task created: ${event.data.title}`);
      }
    });
  }
}