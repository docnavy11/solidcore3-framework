import { ValidationContext, ValidationErrorCode, ValidationUtils } from './types.ts';
import { FieldValidator } from './field-validator.ts';
import { PermissionValidator } from './permission-validator.ts';
import { BehaviorValidator } from './behavior-validator.ts';

export class EntityValidator {
  private fieldValidator: FieldValidator;
  private permissionValidator: PermissionValidator;
  private behaviorValidator: BehaviorValidator;
  
  constructor() {
    this.fieldValidator = new FieldValidator();
    this.permissionValidator = new PermissionValidator();
    this.behaviorValidator = new BehaviorValidator();
  }
  
  validate(entity: any, entityName: string, context: ValidationContext): void {
    const entityPath = `entities.${entityName}`;
    
    // Validate entity structure
    if (!entity || typeof entity !== 'object') {
      context.addError(context.createError(
        'ENTITY_INVALID_STRUCTURE',
        `Entity '${entityName}' must be an object`,
        entityPath,
        'Define entity as: { fields: {...}, behaviors: {...}, permissions: {...} }'
      ));
      return;
    }
    
    // Validate fields (required)
    this.validateFields(entity, entityName, context);
    
    // Validate permissions (optional)
    if (entity.permissions) {
      this.validatePermissions(entity.permissions, entityName, context);
    }
    
    // Validate behaviors (optional)
    if (entity.behaviors) {
      this.validateBehaviors(entity.behaviors, entityName, context);
    }
    
    // Validate entity-level business rules
    this.validateEntityBusinessRules(entity, entityName, context);
  }
  
  private validateFields(entity: any, entityName: string, context: ValidationContext): void {
    const fieldsPath = `entities.${entityName}.fields`;
    
    // Fields are required
    if (!entity.fields) {
      context.addError(context.createError(
        ValidationErrorCode.ENTITY_NO_FIELDS,
        `Entity '${entityName}' must have fields`,
        fieldsPath,
        'Add a fields object: { fields: { id: { type: "string", auto: true }, ... } }'
      ));
      return;
    }
    
    if (typeof entity.fields !== 'object') {
      context.addError(context.createError(
        'ENTITY_FIELDS_INVALID',
        `Entity '${entityName}' fields must be an object`,
        fieldsPath,
        'Define fields as: { fieldName: { type: "string", ... }, ... }'
      ));
      return;
    }
    
    const fieldNames = Object.keys(entity.fields);
    
    // Must have at least one field
    if (fieldNames.length === 0) {
      context.addError(context.createError(
        ValidationErrorCode.ENTITY_NO_FIELDS,
        `Entity '${entityName}' must have at least one field`,
        fieldsPath,
        'Add fields: { id: { type: "string", auto: true }, name: { type: "string" } }'
      ));
      return;
    }
    
    // Check for ID field
    const hasIdField = fieldNames.some(name => 
      name.toLowerCase() === 'id' || 
      entity.fields[name].auto === true
    );
    
    if (!hasIdField) {
      context.addWarning(context.createWarning(
        ValidationErrorCode.ENTITY_NO_ID_FIELD,
        `Entity '${entityName}' should have an ID field`,
        fieldsPath,
        'Add an ID field: id: { type: "string", auto: true }',
        { entityName }
      ));
    }
    
    // Validate each field
    const seenFieldNames = new Set<string>();
    
    for (const [fieldName, field] of Object.entries(entity.fields)) {
      const fieldPath = `${fieldsPath}.${fieldName}`;
      
      // Check for duplicate field names (case insensitive)
      const lowerFieldName = fieldName.toLowerCase();
      if (seenFieldNames.has(lowerFieldName)) {
        context.addError(context.createError(
          ValidationErrorCode.ENTITY_DUPLICATE_FIELD,
          `Duplicate field name '${fieldName}' in entity '${entityName}'`,
          fieldPath,
          'Field names must be unique (case insensitive)'
        ));
      } else {
        seenFieldNames.add(lowerFieldName);
      }
      
      // Validate field name
      if (!ValidationUtils.isValidIdentifier(fieldName)) {
        context.addError(context.createError(
          ValidationErrorCode.FIELD_NAME_INVALID,
          `Field name '${fieldName}' is not a valid identifier`,
          fieldPath,
          'Use only letters, numbers, and underscores. Start with a letter.',
          { fieldName }
        ));
      }
      
      // Delegate to FieldValidator
      this.fieldValidator.validate(field, fieldName, entityName, context);
    }
  }
  
  private validatePermissions(permissions: any, entityName: string, context: ValidationContext): void {
    const permissionsPath = `entities.${entityName}.permissions`;
    
    if (typeof permissions !== 'object') {
      context.addError(context.createError(
        'ENTITY_PERMISSIONS_INVALID',
        `Entity '${entityName}' permissions must be an object`,
        permissionsPath,
        'Define permissions as: { create: "true", read: "user.id == entityId", ... }'
      ));
      return;
    }
    
    // Delegate to PermissionValidator
    this.permissionValidator.validate(permissions, entityName, context);
  }
  
  private validateBehaviors(behaviors: any, entityName: string, context: ValidationContext): void {
    const behaviorsPath = `entities.${entityName}.behaviors`;
    
    if (typeof behaviors !== 'object') {
      context.addError(context.createError(
        'ENTITY_BEHAVIORS_INVALID',
        `Entity '${entityName}' behaviors must be an object`,
        behaviorsPath,
        'Define behaviors as: { activate: { type: "update", fields: [...] }, ... }'
      ));
      return;
    }
    
    // Validate each behavior
    for (const [behaviorName, behavior] of Object.entries(behaviors)) {
      const behaviorPath = `${behaviorsPath}.${behaviorName}`;
      
      // Validate behavior name
      if (!ValidationUtils.isValidIdentifier(behaviorName)) {
        context.addError(context.createError(
          ValidationErrorCode.BEHAVIOR_NAME_INVALID,
          `Behavior name '${behaviorName}' is not a valid identifier`,
          behaviorPath,
          'Use only letters, numbers, and underscores. Start with a letter.',
          { behaviorName }
        ));
      }
      
      // Delegate to BehaviorValidator
      this.behaviorValidator.validate(behavior, behaviorName, entityName, context);
    }
  }
  
  private validateEntityBusinessRules(entity: any, entityName: string, context: ValidationContext): void {
    // Check for common anti-patterns
    
    // Warn about entities with only auto-generated fields
    if (entity.fields) {
      const fields = Object.values(entity.fields);
      const allAutoGenerated = fields.length > 0 && fields.every((field: any) => field.auto === true);
      
      if (allAutoGenerated) {
        context.addWarning(context.createWarning(
          'ENTITY_ALL_AUTO_FIELDS',
          `Entity '${entityName}' has only auto-generated fields`,
          `entities.${entityName}.fields`,
          'Add some user-editable fields for meaningful data entry.'
        ));
      }
    }
    
    // Check for reasonable entity naming
    if (entityName.length < 3) {
      context.addWarning(context.createWarning(
        'ENTITY_NAME_TOO_SHORT',
        `Entity name '${entityName}' is very short`,
        `entities.${entityName}`,
        'Consider using more descriptive entity names for better readability.'
      ));
    }
    
    if (entityName.length > 50) {
      context.addWarning(context.createWarning(
        'ENTITY_NAME_TOO_LONG',
        `Entity name '${entityName}' is very long (${entityName.length} characters)`,
        `entities.${entityName}`,
        'Consider shorter, more concise entity names.'
      ));
    }
    
    // Check for plural entity names (often indicates design issues)
    if (entityName.endsWith('s') && entityName.length > 3) {
      context.addWarning(context.createWarning(
        'ENTITY_NAME_PLURAL',
        `Entity name '${entityName}' appears to be plural`,
        `entities.${entityName}`,
        'Entity names should typically be singular (e.g., "Task" not "Tasks").'
      ));
    }
  }
}