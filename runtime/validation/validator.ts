// Runtime data validator - executes validation schemas

import { ValidationSchema, FieldValidation, ValidationRule, ValidationResult, ValidationError, DataValidator } from '../../core/validation/types.ts';

export class RuntimeDataValidator implements DataValidator {
  constructor(
    private db?: any // Database for unique checks and relation validation
  ) {}

  async validate(data: Record<string, any>, schema: ValidationSchema): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const sanitizedData: Record<string, any> = {};

    // Validate each field
    for (const [fieldName, fieldValidation] of Object.entries(schema.fields)) {
      const fieldErrors = await this.validateField(data[fieldName], fieldName, fieldValidation, data);
      errors.push(...fieldErrors);

      // Sanitize the data (trim strings, convert types, etc.)
      if (fieldErrors.length === 0) {
        sanitizedData[fieldName] = this.sanitizeValue(data[fieldName], fieldValidation);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  // Synchronous validation for simple rules
  validateFieldSync(value: any, fieldName: string, fieldValidation: FieldValidation, fullData?: Record<string, any>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required check
    if (fieldValidation.required && this.isEmpty(value)) {
      errors.push({
        field: fieldName,
        message: 'This field is required',
        code: 'REQUIRED',
        value
      });
      return errors; // Don't continue validation if required field is empty
    }

    // Skip other validations if field is empty and not required
    if (this.isEmpty(value) && !fieldValidation.required) {
      return errors;
    }

    // Validate each rule synchronously
    for (const rule of fieldValidation.rules) {
      const ruleError = this.validateRule(value, fieldName, rule, fullData);
      if (ruleError) {
        errors.push(ruleError);
      }
    }

    return errors;
  }

  private async validateField(value: any, fieldName: string, fieldValidation: FieldValidation, fullData?: Record<string, any>): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Required check
    if (fieldValidation.required && this.isEmpty(value)) {
      errors.push({
        field: fieldName,
        message: 'This field is required',
        code: 'REQUIRED',
        value
      });
      return errors; // Don't continue validation if required field is empty
    }

    // Skip other validations if field is empty and not required
    if (this.isEmpty(value) && !fieldValidation.required) {
      return errors;
    }

    // Validate each rule
    for (const rule of fieldValidation.rules) {
      const ruleError = await this.validateRuleAsync(value, fieldName, rule, fullData);
      if (ruleError) {
        errors.push(ruleError);
      }
    }

    return errors;
  }

  private validateRule(value: any, fieldName: string, rule: ValidationRule, fullData?: Record<string, any>): ValidationError | null {
    switch (rule.type) {
      case 'minLength':
        if (typeof value === 'string' && value.length < (rule.params?.min || 0)) {
          return {
            field: fieldName,
            message: rule.message || `Must be at least ${rule.params?.min} characters long`,
            code: 'MIN_LENGTH',
            value
          };
        }
        break;

      case 'maxLength':
        if (typeof value === 'string' && value.length > (rule.params?.max || Infinity)) {
          return {
            field: fieldName,
            message: rule.message || `Must be no more than ${rule.params?.max} characters long`,
            code: 'MAX_LENGTH',
            value
          };
        }
        break;

      case 'min':
        if (typeof value === 'number' && value < (rule.params?.min || -Infinity)) {
          return {
            field: fieldName,
            message: rule.message || `Must be at least ${rule.params?.min}`,
            code: 'MIN_VALUE',
            value
          };
        }
        break;

      case 'max':
        if (typeof value === 'number' && value > (rule.params?.max || Infinity)) {
          return {
            field: fieldName,
            message: rule.message || `Must be no more than ${rule.params?.max}`,
            code: 'MAX_VALUE',
            value
          };
        }
        break;

      case 'enum':
        if (!rule.params?.options?.includes(value)) {
          return {
            field: fieldName,
            message: rule.message || `Must be one of: ${rule.params?.options?.join(', ')}`,
            code: 'INVALID_ENUM',
            value
          };
        }
        break;

      case 'pattern':
        if (typeof value === 'string' && rule.params?.pattern) {
          const regex = new RegExp(rule.params.pattern);
          if (!regex.test(value)) {
            return {
              field: fieldName,
              message: rule.message || 'Invalid format',
              code: 'INVALID_FORMAT',
              value
            };
          }
        }
        break;

      case 'email':
        if (typeof value === 'string' && !this.isValidEmail(value)) {
          return {
            field: fieldName,
            message: rule.message || 'Must be a valid email address',
            code: 'INVALID_EMAIL',
            value
          };
        }
        break;
    }

    return null;
  }

  private async validateRuleAsync(value: any, fieldName: string, rule: ValidationRule, fullData?: Record<string, any>): Promise<ValidationError | null> {
    // First try synchronous validation
    const syncError = this.validateRule(value, fieldName, rule, fullData);
    if (syncError) return syncError;

    // Handle async validations
    switch (rule.type) {
      case 'unique':
        if (this.db && value !== undefined) {
          // Check uniqueness in database
          // This would require table name and field mapping
          // For now, just return null (implement when integrating with API generator)
        }
        break;

      case 'relation':
        if (this.db && value !== undefined && rule.params?.entity) {
          // Check if referenced entity exists
          // This would require checking the related table
          // For now, just return null (implement when integrating with API generator)
        }
        break;
    }

    return null;
  }

  private isEmpty(value: any): boolean {
    return value === null || value === undefined || 
           (typeof value === 'string' && value.trim() === '') ||
           (Array.isArray(value) && value.length === 0);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private sanitizeValue(value: any, fieldValidation: FieldValidation): any {
    // Basic sanitization - trim strings
    if (typeof value === 'string') {
      return value.trim();
    }

    // Convert string numbers to numbers if needed
    // (This could be enhanced based on field type information)

    return value;
  }
}