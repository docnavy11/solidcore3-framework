import { AppDefinition } from '../types/index.ts';
import { ValidationResult, ValidationContext, ValidationErrorCode, ValidationUtils } from './types.ts';
import { EntityValidator } from './entity-validator.ts';
import { WorkflowValidator } from './workflow-validator.ts';
import { ViewValidator } from './view-validator.ts';
import { ValidationError } from '../errors/index.ts';

export class TruthFileValidator {
  private entityValidator: EntityValidator;
  private workflowValidator: WorkflowValidator;
  private viewValidator: ViewValidator;
  
  constructor() {
    this.entityValidator = new EntityValidator();
    this.workflowValidator = new WorkflowValidator();
    this.viewValidator = new ViewValidator();
  }
  
  validate(truth: AppDefinition): ValidationResult {
    const context = new ValidationContext(truth);
    
    try {
      // Stage 1: App-level validation
      this.validateAppStructure(truth, context);
      
      // Stage 2: Entity validation
      this.validateEntities(truth.entities, context);
      
      // Stage 3: View validation
      if (truth.views) {
        this.validateViews(truth.views, context);
      }
      
      // Stage 4: Workflow validation
      if (truth.workflows) {
        this.validateWorkflows(truth.workflows, context);
      }
      
      // Stage 5: Cross-reference validation
      this.validateReferences(truth, context);
      
      // Stage 6: Business logic validation
      this.validateBusinessRules(truth, context);
      
    } catch (error) {
      context.addError(context.createError(
        'VALIDATION_SYSTEM_ERROR',
        `Internal validation error: ${error instanceof Error ? error.message : String(error)}`,
        'system'
      ));
    }
    
    return context.getResult();
  }
  
  private validateAppStructure(truth: AppDefinition, context: ValidationContext): void {
    // Validate app name
    if (!truth.name) {
      context.addError(context.createError(
        ValidationErrorCode.APP_NAME_MISSING,
        'Application name is required',
        'name',
        'Add a name property to your truth file: { name: "MyApp", ... }'
      ));
    } else if (typeof truth.name !== 'string' || !ValidationUtils.isValidIdentifier(truth.name)) {
      context.addError(context.createError(
        ValidationErrorCode.APP_NAME_INVALID,
        'Application name must be a valid identifier',
        'name',
        'Use only letters, numbers, and underscores. Start with a letter.',
        { name: truth.name }
      ));
    }
    
    // Validate entities exist
    if (!truth.entities || typeof truth.entities !== 'object' || Object.keys(truth.entities).length === 0) {
      context.addError(context.createError(
        'APP_NO_ENTITIES',
        'Application must have at least one entity',
        'entities',
        'Add an entities object: { entities: { MyEntity: { fields: {...} } } }'
      ));
    }
    
    // Validate optional sections are objects if present
    if (truth.views && typeof truth.views !== 'object') {
      context.addError(context.createError(
        'APP_VIEWS_INVALID',
        'Views must be an object',
        'views'
      ));
    }
    
    if (truth.workflows && typeof truth.workflows !== 'object') {
      context.addError(context.createError(
        'APP_WORKFLOWS_INVALID',
        'Workflows must be an object',
        'workflows'
      ));
    }
  }
  
  private validateEntities(entities: Record<string, any>, context: ValidationContext): void {
    for (const [entityName, entity] of Object.entries(entities)) {
      const entityPath = `entities.${entityName}`;
      
      // Validate entity name
      if (!ValidationUtils.isValidIdentifier(entityName)) {
        context.addError(context.createError(
          ValidationErrorCode.ENTITY_NAME_INVALID,
          `Entity name '${entityName}' is not a valid identifier`,
          entityPath,
          'Use only letters, numbers, and underscores. Start with a letter.',
          { entityName }
        ));
      }
      
      // Delegate to EntityValidator
      this.entityValidator.validate(entity, entityName, context);
    }
  }
  
  private validateViews(views: Record<string, any>, context: ValidationContext): void {
    for (const [viewName, view] of Object.entries(views)) {
      const viewPath = `views.${viewName}`;
      
      // Validate view name
      if (!ValidationUtils.isValidIdentifier(viewName)) {
        context.addError(context.createError(
          ValidationErrorCode.VIEW_NAME_INVALID,
          `View name '${viewName}' is not a valid identifier`,
          viewPath,
          'Use only letters, numbers, and underscores. Start with a letter.',
          { viewName }
        ));
      }
      
      // Delegate to ViewValidator
      this.viewValidator.validate(view, viewName, context);
    }
  }
  
  private validateWorkflows(workflows: Record<string, any>, context: ValidationContext): void {
    for (const [workflowName, workflow] of Object.entries(workflows)) {
      const workflowPath = `workflows.${workflowName}`;
      
      // Validate workflow name
      if (!ValidationUtils.isValidIdentifier(workflowName)) {
        context.addError(context.createError(
          ValidationErrorCode.WORKFLOW_NAME_INVALID,
          `Workflow name '${workflowName}' is not a valid identifier`,
          workflowPath,
          'Use only letters, numbers, and underscores. Start with a letter.',
          { workflowName }
        ));
      }
      
      // Delegate to WorkflowValidator
      this.workflowValidator.validate(workflow, workflowName, context);
    }
  }
  
  private validateReferences(truth: AppDefinition, context: ValidationContext): void {
    const entityNames = Object.keys(truth.entities);
    
    // Check entity references in fields
    for (const [entityName, entity] of Object.entries(truth.entities)) {
      if (!entity.fields) continue;
      
      for (const [fieldName, field] of Object.entries(entity.fields)) {
        if (field.type === 'reference' && field.entity) {
          if (!entityNames.includes(field.entity)) {
            context.addError(context.createError(
              ValidationErrorCode.FIELD_REFERENCE_ENTITY_NOT_FOUND,
              `Referenced entity '${field.entity}' does not exist`,
              `entities.${entityName}.fields.${fieldName}.entity`,
              `Valid entities: ${entityNames.join(', ')}`,
              { referencedEntity: field.entity, availableEntities: entityNames }
            ));
          }
        }
      }
    }
    
    // Check entity references in views
    if (truth.views) {
      for (const [viewName, view] of Object.entries(truth.views)) {
        if (view.entity && !entityNames.includes(view.entity)) {
          context.addError(context.createError(
            ValidationErrorCode.VIEW_ENTITY_NOT_FOUND,
            `View references non-existent entity '${view.entity}'`,
            `views.${viewName}.entity`,
            `Valid entities: ${entityNames.join(', ')}`,
            { referencedEntity: view.entity, availableEntities: entityNames }
          ));
        }
      }
    }
    
    // Check entity references in workflows
    if (truth.workflows) {
      for (const [workflowName, workflow] of Object.entries(truth.workflows)) {
        if (workflow.trigger && typeof workflow.trigger === 'string') {
          // Parse trigger format: "entity.behavior"
          const triggerParts = workflow.trigger.split('.');
          if (triggerParts.length >= 2) {
            const entityName = triggerParts[0];
            if (!entityNames.includes(entityName)) {
              context.addError(context.createError(
                ValidationErrorCode.WORKFLOW_TRIGGER_INVALID,
                `Workflow trigger references non-existent entity '${entityName}'`,
                `workflows.${workflowName}.trigger`,
                `Valid entities: ${entityNames.join(', ')}`,
                { trigger: workflow.trigger, referencedEntity: entityName }
              ));
            }
          }
        }
      }
    }
  }
  
  private validateBusinessRules(truth: AppDefinition, context: ValidationContext): void {
    // Check for common patterns and best practices
    
    // Warn about entities with too many fields
    for (const [entityName, entity] of Object.entries(truth.entities)) {
      if (entity.fields) {
        const fieldCount = Object.keys(entity.fields).length;
        if (fieldCount > 20) {
          context.addWarning(context.createWarning(
            'ENTITY_TOO_MANY_FIELDS',
            `Entity '${entityName}' has ${fieldCount} fields, consider splitting into related entities`,
            `entities.${entityName}`,
            'Large entities can be hard to maintain. Consider grouping related fields into separate entities.',
            { fieldCount }
          ));
        }
      }
    }
    
    // Check for missing timestamps
    for (const [entityName, entity] of Object.entries(truth.entities)) {
      if (entity.fields) {
        const fieldNames = Object.keys(entity.fields);
        const hasCreatedAt = fieldNames.some(name => name.toLowerCase().includes('created'));
        const hasUpdatedAt = fieldNames.some(name => name.toLowerCase().includes('updated'));
        
        if (!hasCreatedAt) {
          context.addWarning(context.createWarning(
            'ENTITY_MISSING_CREATED_AT',
            `Entity '${entityName}' should have a created timestamp field`,
            `entities.${entityName}.fields`,
            'Add a field like: createdAt: { type: "date", auto: true }',
            { entityName }
          ));
        }
        
        if (!hasUpdatedAt) {
          context.addWarning(context.createWarning(
            'ENTITY_MISSING_UPDATED_AT',
            `Entity '${entityName}' should have an updated timestamp field`,
            `entities.${entityName}.fields`,
            'Add a field like: updatedAt: { type: "date", auto: true }',
            { entityName }
          ));
        }
      }
    }
    
    // Warn about unused views
    if (truth.views) {
      const viewCount = Object.keys(truth.views).length;
      if (viewCount === 0) {
        context.addWarning(context.createWarning(
          'APP_NO_VIEWS',
          'Application has no views defined. The framework will generate default views.',
          'views',
          'Consider defining custom views for better user experience.'
        ));
      }
    }
  }
}