import { ValidationContext, ValidationErrorCode } from './types.ts';
import { SafeExpressionParser } from '../expression/parser.ts';

export class WorkflowValidator {
  private expressionParser: SafeExpressionParser;
  
  constructor() {
    this.expressionParser = new SafeExpressionParser();
  }
  
  validate(workflow: any, workflowName: string, context: ValidationContext): void {
    const workflowPath = `workflows.${workflowName}`;
    
    // Workflow must be an object
    if (!workflow || typeof workflow !== 'object') {
      context.addError(context.createError(
        'WORKFLOW_INVALID_STRUCTURE',
        `Workflow '${workflowName}' must be an object`,
        workflowPath,
        'Define workflow as: { trigger: "entity.behavior", condition: "...", actions: [...] }'
      ));
      return;
    }
    
    // Validate trigger (required)
    this.validateWorkflowTrigger(workflow, workflowName, workflowPath, context);
    
    // Validate condition (optional)
    if (workflow.condition) {
      this.validateWorkflowCondition(workflow, workflowName, workflowPath, context);
    }
    
    // Validate actions (required)
    this.validateWorkflowActions(workflow, workflowName, workflowPath, context);
    
    // Validate other properties
    this.validateWorkflowProperties(workflow, workflowName, workflowPath, context);
  }
  
  private validateWorkflowTrigger(workflow: any, workflowName: string, workflowPath: string, context: ValidationContext): void {
    // Trigger is required
    if (!workflow.trigger) {
      context.addError(context.createError(
        ValidationErrorCode.WORKFLOW_TRIGGER_INVALID,
        `Workflow '${workflowName}' must have a trigger`,
        `${workflowPath}.trigger`,
        'Add trigger: { trigger: "task.completed" }',
        { workflowName }
      ));
      return;
    }
    
    // Trigger must be a string
    if (typeof workflow.trigger !== 'string') {
      context.addError(context.createError(
        ValidationErrorCode.WORKFLOW_TRIGGER_INVALID,
        `Workflow '${workflowName}' trigger must be a string`,
        `${workflowPath}.trigger`,
        'Use format: "entityName.behaviorName"'
      ));
      return;
    }
    
    // Validate trigger format (entity.behavior)
    const triggerParts = workflow.trigger.split('.');
    if (triggerParts.length !== 2) {
      context.addError(context.createError(
        ValidationErrorCode.WORKFLOW_TRIGGER_INVALID,
        `Workflow '${workflowName}' trigger must be in format "entity.behavior"`,
        `${workflowPath}.trigger`,
        'Example: "task.completed" or "user.created"',
        { trigger: workflow.trigger }
      ));
      return;
    }
    
    const [entityName, behaviorName] = triggerParts;
    
    // Validate entity name format
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(entityName)) {
      context.addError(context.createError(
        ValidationErrorCode.WORKFLOW_TRIGGER_INVALID,
        `Workflow '${workflowName}' trigger has invalid entity name '${entityName}'`,
        `${workflowPath}.trigger`,
        'Entity names must be valid identifiers'
      ));
    }
    
    // Validate behavior name format
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(behaviorName)) {
      context.addError(context.createError(
        ValidationErrorCode.WORKFLOW_TRIGGER_INVALID,
        `Workflow '${workflowName}' trigger has invalid behavior name '${behaviorName}'`,
        `${workflowPath}.trigger`,
        'Behavior names must be valid identifiers'
      ));
    }
  }
  
  private validateWorkflowCondition(workflow: any, workflowName: string, workflowPath: string, context: ValidationContext): void {
    // Condition must be a string
    if (typeof workflow.condition !== 'string') {
      context.addError(context.createError(
        ValidationErrorCode.WORKFLOW_CONDITION_INVALID,
        `Workflow '${workflowName}' condition must be a string expression`,
        `${workflowPath}.condition`,
        'Use expression like: "priority == \\"high\\""'
      ));
      return;
    }
    
    // Validate condition syntax
    const validationResult = this.expressionParser.validate(workflow.condition);
    if (!validationResult.success) {
      context.addError(context.createError(
        ValidationErrorCode.WORKFLOW_CONDITION_INVALID,
        `Workflow '${workflowName}' condition has invalid syntax: ${validationResult.error}`,
        `${workflowPath}.condition`,
        'Check expression syntax. Example: "data.priority == \\"high\\" && entity == \\"Task\\""',
        { condition: workflow.condition, syntaxError: validationResult.error }
      ));
    }
  }
  
  private validateWorkflowActions(workflow: any, workflowName: string, workflowPath: string, context: ValidationContext): void {
    // Actions are required
    if (!workflow.actions) {
      context.addError(context.createError(
        ValidationErrorCode.WORKFLOW_ACTION_INVALID,
        `Workflow '${workflowName}' must have actions`,
        `${workflowPath}.actions`,
        'Add actions: { actions: [{ type: "email", to: "admin@example.com" }] }',
        { workflowName }
      ));
      return;
    }
    
    // Actions must be an array
    if (!Array.isArray(workflow.actions)) {
      context.addError(context.createError(
        ValidationErrorCode.WORKFLOW_ACTION_INVALID,
        `Workflow '${workflowName}' actions must be an array`,
        `${workflowPath}.actions`,
        'Define actions as: actions: [{ type: "email", ... }, { type: "webhook", ... }]'
      ));
      return;
    }
    
    // Must have at least one action
    if (workflow.actions.length === 0) {
      context.addError(context.createError(
        ValidationErrorCode.WORKFLOW_ACTION_INVALID,
        `Workflow '${workflowName}' must have at least one action`,
        `${workflowPath}.actions`,
        'Add an action: actions: [{ type: "email", to: "user@example.com" }]'
      ));
      return;
    }
    
    // Validate each action
    workflow.actions.forEach((action: any, index: number) => {
      this.validateWorkflowAction(action, workflowName, `${workflowPath}.actions[${index}]`, context);
    });
  }
  
  private validateWorkflowAction(action: any, workflowName: string, actionPath: string, context: ValidationContext): void {
    // Action must be an object
    if (!action || typeof action !== 'object') {
      context.addError(context.createError(
        ValidationErrorCode.WORKFLOW_ACTION_INVALID,
        `Workflow '${workflowName}' action must be an object`,
        actionPath,
        'Define action as: { type: "email", to: "user@example.com", message: "..." }'
      ));
      return;
    }
    
    // Action must have a type
    if (!action.type) {
      context.addError(context.createError(
        ValidationErrorCode.WORKFLOW_ACTION_INVALID,
        `Workflow '${workflowName}' action must have a type`,
        `${actionPath}.type`,
        'Add type: { type: "email" } or { type: "webhook" }',
        { workflowName }
      ));
      return;
    }
    
    // Type must be a string
    if (typeof action.type !== 'string') {
      context.addError(context.createError(
        ValidationErrorCode.WORKFLOW_ACTION_INVALID,
        `Workflow '${workflowName}' action type must be a string`,
        `${actionPath}.type`
      ));
      return;
    }
    
    // Validate known action types
    this.validateActionType(action, workflowName, actionPath, context);
  }
  
  private validateActionType(action: any, workflowName: string, actionPath: string, context: ValidationContext): void {
    const knownActionTypes = ['email', 'webhook', 'log', 'custom'];
    
    if (!knownActionTypes.includes(action.type)) {
      context.addWarning(context.createWarning(
        'WORKFLOW_ACTION_TYPE_UNKNOWN',
        `Workflow '${workflowName}' uses unknown action type '${action.type}'`,
        `${actionPath}.type`,
        `Known types: ${knownActionTypes.join(', ')}. Custom types are allowed but may need extension support.`,
        { actionType: action.type, knownTypes: knownActionTypes }
      ));
    }
    
    // Type-specific validation
    switch (action.type) {
      case 'email':
        this.validateEmailAction(action, workflowName, actionPath, context);
        break;
        
      case 'webhook':
        this.validateWebhookAction(action, workflowName, actionPath, context);
        break;
        
      case 'log':
        this.validateLogAction(action, workflowName, actionPath, context);
        break;
    }
  }
  
  private validateEmailAction(action: any, workflowName: string, actionPath: string, context: ValidationContext): void {
    // Email actions should have 'to' field
    if (!action.to) {
      context.addError(context.createError(
        'WORKFLOW_EMAIL_NO_RECIPIENT',
        `Email action in workflow '${workflowName}' must have 'to' field`,
        `${actionPath}.to`,
        'Add recipient: { type: "email", to: "user@example.com" }'
      ));
    } else if (typeof action.to !== 'string') {
      context.addError(context.createError(
        'WORKFLOW_EMAIL_INVALID_RECIPIENT',
        `Email action in workflow '${workflowName}' 'to' field must be a string`,
        `${actionPath}.to`
      ));
    }
    
    // Validate email format (basic check)
    if (typeof action.to === 'string' && !action.to.includes('@')) {
      context.addWarning(context.createWarning(
        'WORKFLOW_EMAIL_INVALID_FORMAT',
        `Email action in workflow '${workflowName}' 'to' field doesn't look like an email`,
        `${actionPath}.to`,
        'Use valid email format: user@domain.com',
        { recipient: action.to }
      ));
    }
  }
  
  private validateWebhookAction(action: any, workflowName: string, actionPath: string, context: ValidationContext): void {
    // Webhook actions should have 'url' field
    if (!action.url) {
      context.addError(context.createError(
        'WORKFLOW_WEBHOOK_NO_URL',
        `Webhook action in workflow '${workflowName}' must have 'url' field`,
        `${actionPath}.url`,
        'Add URL: { type: "webhook", url: "https://api.example.com/webhook" }'
      ));
    } else if (typeof action.url !== 'string') {
      context.addError(context.createError(
        'WORKFLOW_WEBHOOK_INVALID_URL',
        `Webhook action in workflow '${workflowName}' 'url' field must be a string`,
        `${actionPath}.url`
      ));
    }
    
    // Validate URL format (basic check)
    if (typeof action.url === 'string') {
      try {
        new URL(action.url);
      } catch {
        context.addError(context.createError(
          'WORKFLOW_WEBHOOK_MALFORMED_URL',
          `Webhook action in workflow '${workflowName}' has malformed URL`,
          `${actionPath}.url`,
          'Use valid URL format: https://api.example.com/webhook',
          { url: action.url }
        ));
      }
    }
  }
  
  private validateLogAction(action: any, workflowName: string, actionPath: string, context: ValidationContext): void {
    // Log actions should have 'message' field
    if (!action.message) {
      context.addWarning(context.createWarning(
        'WORKFLOW_LOG_NO_MESSAGE',
        `Log action in workflow '${workflowName}' should have a message`,
        `${actionPath}.message`,
        'Add message: { type: "log", message: "Task completed" }'
      ));
    } else if (typeof action.message !== 'string') {
      context.addError(context.createError(
        'WORKFLOW_LOG_INVALID_MESSAGE',
        `Log action in workflow '${workflowName}' message must be a string`,
        `${actionPath}.message`
      ));
    }
  }
  
  private validateWorkflowProperties(workflow: any, workflowName: string, workflowPath: string, context: ValidationContext): void {
    // Validate description
    if (workflow.description !== undefined && typeof workflow.description !== 'string') {
      context.addError(context.createError(
        'WORKFLOW_DESCRIPTION_INVALID',
        `Workflow '${workflowName}' description must be a string`,
        `${workflowPath}.description`
      ));
    }
    
    // Validate enabled flag
    if (workflow.enabled !== undefined && typeof workflow.enabled !== 'boolean') {
      context.addError(context.createError(
        'WORKFLOW_ENABLED_INVALID',
        `Workflow '${workflowName}' enabled must be a boolean`,
        `${workflowPath}.enabled`
      ));
    }
    
    // Recommend description for complex workflows
    if (!workflow.description && workflow.condition && workflow.actions.length > 1) {
      context.addWarning(context.createWarning(
        'WORKFLOW_NO_DESCRIPTION',
        `Complex workflow '${workflowName}' should have a description`,
        `${workflowPath}.description`,
        'Add description explaining what this workflow does'
      ));
    }
  }
}