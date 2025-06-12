import { AppDefinition, WorkflowDefinition } from '../../core/types/index.ts';
import { EventData, EventHandler, EventEmitterInterface } from '../../core/types/events.ts';
import { SafeExpressionParser } from '../../core/expression/parser.ts';
import { TemplateEngine } from '../engine/template-engine.ts';

export class EventEmitter {
  private listeners: Map<string, EventHandler[]> = new Map();
  private workflows: Map<string, WorkflowDefinition[]> = new Map();

  constructor(private app: AppDefinition) {
    this.registerWorkflows();
  }

  private registerWorkflows(): void {
    if (!this.app.workflows) return;

    try {
      for (const [workflowName, workflow] of Object.entries(this.app.workflows)) {
        const trigger = workflow.trigger;
        
        if (!this.workflows.has(trigger)) {
          this.workflows.set(trigger, []);
        }
        
        this.workflows.get(trigger)!.push({
          ...workflow,
          name: workflowName
        } as WorkflowDefinition & { name: string });
        
        console.log(`📋 Registered workflow '${workflowName}' for trigger '${trigger}'`);
      }
    } catch (error) {
      console.error('Error registering workflows:', error);
    }
  }

  on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  async emit(event: string, data: EventData): Promise<void> {
    console.log(`📡 Event emitted: ${event}`, { 
      entity: data.entity, 
      entityId: data.entityId,
      behavior: data.behavior 
    });

    // Execute registered listeners
    const handlers = this.listeners.get(event) || [];
    for (const handler of handlers) {
      try {
        await handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    }

    // Execute workflows
    await this.executeWorkflows(event, data);
  }

  private async executeWorkflows(event: string, data: EventData): Promise<void> {
    const workflows = this.workflows.get(event) || [];
    
    for (const workflow of workflows) {
      try {
        // Check condition if present
        if (workflow.condition && !this.evaluateCondition(workflow.condition, data)) {
          console.log(`⏭️  Workflow '${(workflow as any).name}' condition not met`);
          continue;
        }

        console.log(`⚙️  Executing workflow '${(workflow as any).name}'`);
        
        if (workflow.async) {
          // Execute asynchronously (don't await)
          this.executeWorkflowActions(workflow, data).catch(error => {
            console.error(`Error in async workflow '${(workflow as any).name}':`, error);
          });
        } else {
          // Execute synchronously
          await this.executeWorkflowActions(workflow, data);
        }
      } catch (error) {
        console.error(`Error executing workflow '${(workflow as any).name}':`, error);
      }
    }
  }

  private async executeWorkflowActions(workflow: WorkflowDefinition, data: EventData): Promise<void> {
    for (const action of workflow.actions) {
      try {
        if (typeof action === 'string') {
          await this.executeSimpleAction(action, data);
        } else {
          await this.executeComplexAction(action, data);
        }
      } catch (error) {
        console.error(`Error executing action in workflow:`, error);
        throw error; // Re-throw to stop workflow execution
      }
    }
  }

  private async executeSimpleAction(action: string, data: EventData): Promise<void> {
    console.log(`🔧 Executing action: ${action}`);

    switch (action) {
      case 'notify.email':
        await this.sendEmailNotification(data);
        break;
      case 'notify.slack':
        await this.sendSlackNotification(data);
        break;
      case 'log':
        console.log(`📝 Workflow log:`, data);
        break;
      case 'updateStats':
        await this.updateStatistics(data);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  private async executeComplexAction(action: any, data: EventData): Promise<void> {
    console.log(`🔧 Executing complex action:`, action.type);
    
    // Process template interpolation for the entire action
    const processedAction = TemplateEngine.processWorkflowAction(action, data);
    
    switch (processedAction.type) {
      case 'webhook':
        await this.callWebhook(processedAction.params?.url || processedAction.url, data);
        break;
      case 'database':
        await this.executeDatabaseAction(processedAction.params || processedAction, data);
        break;
      case 'email':
        await this.sendCustomEmail(processedAction.params || processedAction, data);
        break;
      default:
        console.warn(`Unknown complex action type: ${processedAction.type}`);
    }
  }

  private evaluateCondition(condition: string, data: EventData): boolean {
    try {
      // Create context for expression evaluation
      const context = {
        entity: data.entity,
        entityId: data.entityId,
        user: data.user,
        timestamp: data.timestamp,
        behavior: data.behavior,
        ...data.data // Spread entity data for easy access
      };

      // Use safe expression parser instead of new Function()
      const parser = new SafeExpressionParser();
      const result = parser.evaluate(condition, context);
      
      if (!result.success) {
        console.error(`Error evaluating condition '${condition}':`, result.error);
        return false;
      }
      
      return result.value || false;
    } catch (error) {
      console.error(`Error evaluating condition '${condition}':`, error);
      return false;
    }
  }

  // Mock action implementations - replace with real implementations
  private async sendEmailNotification(data: EventData): Promise<void> {
    console.log(`📧 Email notification sent for ${data.entity} ${data.entityId}`);
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendSlackNotification(data: EventData): Promise<void> {
    console.log(`💬 Slack notification sent for ${data.entity} ${data.entityId}`);
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async updateStatistics(data: EventData): Promise<void> {
    console.log(`📊 Statistics updated for ${data.entity} action`);
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private async callWebhook(url: string, data: EventData): Promise<void> {
    console.log(`🔗 Webhook called: ${url}`);
    try {
      // In development, just log the webhook call instead of making actual HTTP request
      console.log(`   Payload:`, JSON.stringify(data, null, 2));
      
      // Uncomment for production webhook calls:
      // await fetch(url, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // });
      
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`Webhook call failed:`, error);
      throw error;
    }
  }

  private async executeDatabaseAction(params: any, data: EventData): Promise<void> {
    console.log(`🗄️  Database action:`, params);
    // Mock implementation - would interact with database
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private async sendCustomEmail(params: any, data: EventData): Promise<void> {
    console.log(`📧 Custom email sent to ${params.to}`);
    console.log(`   Subject: ${params.subject}`);
    if (params.body) {
      console.log(`   Body: ${params.body}`);
    }
    // Mock implementation - in production would use actual email service
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}