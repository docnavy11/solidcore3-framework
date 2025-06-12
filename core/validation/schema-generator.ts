// Generates validation schemas from truth file entity definitions

import { EntityDefinition, FieldDefinition } from '../types/index.ts';
import { ValidationSchema, FieldValidation, ValidationRule } from './types.ts';

export class ValidationSchemaGenerator {
  generateEntitySchema(entity: EntityDefinition): ValidationSchema {
    const schema: ValidationSchema = {
      fields: {}
    };

    // Generate validation for each field
    for (const [fieldName, field] of Object.entries(entity.fields)) {
      schema.fields[fieldName] = this.generateFieldValidation(fieldName, field);
    }

    return schema;
  }

  private generateFieldValidation(fieldName: string, field: FieldDefinition): FieldValidation {
    const validation: FieldValidation = {
      required: field.required === true,
      rules: []
    };

    // Add type-specific validation rules
    validation.rules.push(...this.getTypeValidationRules(field));
    
    // Add constraint validation rules
    validation.rules.push(...this.getConstraintValidationRules(field));

    return validation;
  }

  private getTypeValidationRules(field: FieldDefinition): ValidationRule[] {
    const rules: ValidationRule[] = [];

    switch (field.type) {
      case 'string':
      case 'text':
        if ('minLength' in field && field.minLength !== undefined) {
          rules.push({
            type: 'minLength',
            params: { min: field.minLength },
            message: `Must be at least ${field.minLength} characters long`
          });
        }
        if ('maxLength' in field && field.maxLength !== undefined) {
          rules.push({
            type: 'maxLength',
            params: { max: field.maxLength },
            message: `Must be no more than ${field.maxLength} characters long`
          });
        }
        break;

      case 'number':
      case 'integer':
        if ('min' in field && field.min !== undefined) {
          rules.push({
            type: 'min',
            params: { min: field.min },
            message: `Must be at least ${field.min}`
          });
        }
        if ('max' in field && field.max !== undefined) {
          rules.push({
            type: 'max',
            params: { max: field.max },
            message: `Must be no more than ${field.max}`
          });
        }
        break;

      case 'enum':
        if ('options' in field && field.options) {
          rules.push({
            type: 'enum',
            params: { options: field.options },
            message: `Must be one of: ${field.options.join(', ')}`
          });
        }
        break;

      case 'relation':
        // Relation fields should validate that the referenced entity exists
        if ('to' in field && field.to) {
          rules.push({
            type: 'relation',
            params: { entity: field.to },
            message: `Referenced ${field.to} must exist`
          });
        }
        break;
    }

    return rules;
  }

  private getConstraintValidationRules(field: FieldDefinition): ValidationRule[] {
    const rules: ValidationRule[] = [];

    // Unique constraint
    if (field.unique === true) {
      rules.push({
        type: 'unique',
        message: 'Must be unique'
      });
    }

    // Pattern validation (for string fields)
    if ('pattern' in field && field.pattern && typeof field.pattern === 'string') {
      rules.push({
        type: 'pattern',
        params: { pattern: field.pattern },
        message: 'Invalid format'
      });
    }

    return rules;
  }

  // Generate client-side validation code (JavaScript)
  generateClientValidation(entity: EntityDefinition): string {
    const schema = this.generateEntitySchema(entity);
    
    return `
// Generated validation for ${entity.name || 'Entity'}
export function validate(data) {
  const errors = [];
  
  ${Object.entries(schema.fields).map(([fieldName, fieldValidation]) => 
    this.generateFieldValidationCode(fieldName, fieldValidation)
  ).join('\n  ')}
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

${this.generateValidationHelpers()}
`;
  }

  private generateFieldValidationCode(fieldName: string, validation: FieldValidation): string {
    const checks: string[] = [];

    // Required check
    if (validation.required) {
      checks.push(`
  if (!data.${fieldName} && data.${fieldName} !== 0 && data.${fieldName} !== false) {
    errors.push({ field: '${fieldName}', message: 'This field is required', code: 'REQUIRED' });
  }`);
    }

    // Rule checks
    for (const rule of validation.rules) {
      checks.push(this.generateRuleCheck(fieldName, rule));
    }

    return checks.join('\n');
  }

  private generateRuleCheck(fieldName: string, rule: ValidationRule): string {
    switch (rule.type) {
      case 'minLength':
        return `
  if (data.${fieldName} && data.${fieldName}.length < ${rule.params?.min}) {
    errors.push({ field: '${fieldName}', message: '${rule.message}', code: 'MIN_LENGTH' });
  }`;

      case 'maxLength':
        return `
  if (data.${fieldName} && data.${fieldName}.length > ${rule.params?.max}) {
    errors.push({ field: '${fieldName}', message: '${rule.message}', code: 'MAX_LENGTH' });
  }`;

      case 'min':
        return `
  if (data.${fieldName} !== undefined && data.${fieldName} < ${rule.params?.min}) {
    errors.push({ field: '${fieldName}', message: '${rule.message}', code: 'MIN_VALUE' });
  }`;

      case 'max':
        return `
  if (data.${fieldName} !== undefined && data.${fieldName} > ${rule.params?.max}) {
    errors.push({ field: '${fieldName}', message: '${rule.message}', code: 'MAX_VALUE' });
  }`;

      case 'enum':
        const options = JSON.stringify(rule.params?.options || []);
        return `
  if (data.${fieldName} && !${options}.includes(data.${fieldName})) {
    errors.push({ field: '${fieldName}', message: '${rule.message}', code: 'INVALID_ENUM' });
  }`;

      case 'pattern':
        return `
  if (data.${fieldName} && !/${rule.params?.pattern}/.test(data.${fieldName})) {
    errors.push({ field: '${fieldName}', message: '${rule.message}', code: 'INVALID_FORMAT' });
  }`;

      default:
        return `
  // TODO: Implement validation for rule type: ${rule.type}`;
    }
  }

  private generateValidationHelpers(): string {
    return `
// Validation helper functions
function isEmail(value) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

function isValidDate(value) {
  const date = new Date(value);
  return date instanceof Date && !isNaN(date.getTime());
}
`;
  }
}