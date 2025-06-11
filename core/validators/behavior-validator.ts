import { ValidationContext, ValidationErrorCode, ValidationUtils } from './types.ts';

export class BehaviorValidator {
  validate(behavior: any, behaviorName: string, entityName: string, context: ValidationContext): void {
    const behaviorPath = `entities.${entityName}.behaviors.${behaviorName}`;
    
    // Behavior must be an object
    if (!behavior || typeof behavior !== 'object') {
      context.addError(context.createError(
        'BEHAVIOR_INVALID_STRUCTURE',
        `Behavior '${behaviorName}' must be an object`,
        behaviorPath,
        'Define behavior as: { type: "update", fields: [...] }'
      ));
      return;
    }
    
    // Type validation
    this.validateBehaviorType(behavior, behaviorName, behaviorPath, context);
    
    // Type-specific validation
    this.validateBehaviorTypeSpecific(behavior, behaviorName, behaviorPath, context);
    
    // General behavior properties
    this.validateBehaviorProperties(behavior, behaviorName, behaviorPath, context);
  }
  
  private validateBehaviorType(behavior: any, behaviorName: string, behaviorPath: string, context: ValidationContext): void {
    // Type is required
    if (!behavior.type) {
      context.addError(context.createError(
        ValidationErrorCode.BEHAVIOR_TYPE_INVALID,
        `Behavior '${behaviorName}' must have a type`,
        `${behaviorPath}.type`,
        'Valid types: update, custom',
        { behaviorName }
      ));
      return;
    }
    
    // Type must be valid
    if (!ValidationUtils.isValidBehaviorType(behavior.type)) {
      context.addError(context.createError(
        ValidationErrorCode.BEHAVIOR_TYPE_INVALID,
        `Behavior '${behaviorName}' has invalid type '${behavior.type}'`,
        `${behaviorPath}.type`,
        'Valid types: update, custom',
        { behaviorName, invalidType: behavior.type }
      ));
    }
  }
  
  private validateBehaviorTypeSpecific(behavior: any, behaviorName: string, behaviorPath: string, context: ValidationContext): void {
    switch (behavior.type) {
      case 'update':
        this.validateUpdateBehavior(behavior, behaviorName, behaviorPath, context);
        break;
        
      case 'custom':
        this.validateCustomBehavior(behavior, behaviorName, behaviorPath, context);
        break;
    }
  }
  
  private validateUpdateBehavior(behavior: any, behaviorName: string, behaviorPath: string, context: ValidationContext): void {
    // Update behaviors should specify which fields to update
    if (!behavior.fields) {
      context.addError(context.createError(
        ValidationErrorCode.BEHAVIOR_MISSING_FIELDS,
        `Update behavior '${behaviorName}' should specify fields to update`,
        `${behaviorPath}.fields`,
        'Add fields: { fields: { status: "completed", updatedAt: "now" } }',
        { behaviorName }
      ));
      return;
    }
    
    // Fields must be an object
    if (typeof behavior.fields !== 'object' || Array.isArray(behavior.fields)) {
      context.addError(context.createError(
        'BEHAVIOR_FIELDS_INVALID',
        `Update behavior '${behaviorName}' fields must be an object`,
        `${behaviorPath}.fields`,
        'Define fields as: { fieldName: "value", otherField: "otherValue" }'
      ));
      return;
    }
    
    // Check if fields object is empty
    if (Object.keys(behavior.fields).length === 0) {
      context.addWarning(context.createWarning(
        'BEHAVIOR_NO_FIELD_UPDATES',
        `Update behavior '${behaviorName}' has no field updates`,
        `${behaviorPath}.fields`,
        'Consider adding fields to update or using type: "custom"'
      ));
    }
    
    // Validate field update values
    for (const [fieldName, value] of Object.entries(behavior.fields)) {
      if (!ValidationUtils.isValidIdentifier(fieldName)) {
        context.addError(context.createError(
          'BEHAVIOR_FIELD_NAME_INVALID',
          `Update behavior '${behaviorName}' references invalid field '${fieldName}'`,
          `${behaviorPath}.fields.${fieldName}`,
          'Field names must be valid identifiers'
        ));
      }
    }
  }
  
  private validateCustomBehavior(behavior: any, behaviorName: string, behaviorPath: string, context: ValidationContext): void {
    // Custom behaviors should have a description
    if (!behavior.description) {
      context.addWarning(context.createWarning(
        'BEHAVIOR_NO_DESCRIPTION',
        `Custom behavior '${behaviorName}' should have a description`,
        `${behaviorPath}.description`,
        'Add description: "Performs custom logic for ..."'
      ));
    }
    
    // Custom behaviors might specify parameters
    if (behavior.parameters) {
      if (typeof behavior.parameters !== 'object' || Array.isArray(behavior.parameters)) {
        context.addError(context.createError(
          'BEHAVIOR_PARAMETERS_INVALID',
          `Custom behavior '${behaviorName}' parameters must be an object`,
          `${behaviorPath}.parameters`,
          'Define parameters as: { paramName: { type: "string", required: true } }'
        ));
      } else {
        // Validate parameter definitions
        for (const [paramName, paramDef] of Object.entries(behavior.parameters)) {
          if (!ValidationUtils.isValidIdentifier(paramName)) {
            context.addError(context.createError(
              'BEHAVIOR_PARAMETER_NAME_INVALID',
              `Custom behavior '${behaviorName}' has invalid parameter name '${paramName}'`,
              `${behaviorPath}.parameters.${paramName}`,
              'Parameter names must be valid identifiers'
            ));
          }
        }
      }
    }
  }
  
  private validateBehaviorProperties(behavior: any, behaviorName: string, behaviorPath: string, context: ValidationContext): void {
    // Validate label
    if (behavior.label !== undefined && typeof behavior.label !== 'string') {
      context.addError(context.createError(
        'BEHAVIOR_LABEL_INVALID',
        `Behavior '${behaviorName}' label must be a string`,
        `${behaviorPath}.label`
      ));
    }
    
    // Validate description
    if (behavior.description !== undefined && typeof behavior.description !== 'string') {
      context.addError(context.createError(
        'BEHAVIOR_DESCRIPTION_INVALID',
        `Behavior '${behaviorName}' description must be a string`,
        `${behaviorPath}.description`
      ));
    }
    
    // Validate permission (if present)
    if (behavior.permission !== undefined && typeof behavior.permission !== 'string') {
      context.addError(context.createError(
        'BEHAVIOR_PERMISSION_INVALID',
        `Behavior '${behaviorName}' permission must be a string expression`,
        `${behaviorPath}.permission`,
        'Use permission expression like: "user.role == \\"admin\\""'
      ));
    }
    
    // Check for reasonable behavior naming
    if (behaviorName.length < 3) {
      context.addWarning(context.createWarning(
        'BEHAVIOR_NAME_TOO_SHORT',
        `Behavior name '${behaviorName}' is very short`,
        behaviorPath,
        'Consider using more descriptive behavior names'
      ));
    }
    
    // Check for verb-like naming (behaviors should typically be actions)
    if (!this.isVerbLike(behaviorName)) {
      context.addWarning(context.createWarning(
        'BEHAVIOR_NAME_NOT_VERB',
        `Behavior name '${behaviorName}' doesn't appear to be an action`,
        behaviorPath,
        'Consider using verb-like names: activate, complete, archive, etc.'
      ));
    }
  }
  
  private isVerbLike(name: string): boolean {
    const verbPatterns = [
      /^(activate|deactivate|enable|disable)$/i,
      /^(create|update|delete|remove)$/i,
      /^(complete|finish|start|begin)$/i,
      /^(approve|reject|cancel)$/i,
      /^(publish|unpublish|archive)$/i,
      /^(send|receive|process)$/i,
      /^(assign|unassign)$/i,
      /ing$/i, // ending in -ing
      /e$/i,   // many verbs end in -e
    ];
    
    return verbPatterns.some(pattern => pattern.test(name));
  }
}