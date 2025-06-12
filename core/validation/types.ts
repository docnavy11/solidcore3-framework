// Core validation types and interfaces

export interface ValidationRule {
  type: string;
  message?: string;
  params?: Record<string, any>;
}

export interface FieldValidation {
  required?: boolean;
  rules: ValidationRule[];
}

export interface ValidationSchema {
  fields: Record<string, FieldValidation>;
  businessRules?: ValidationRule[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData?: Record<string, any>;
}

// Built-in validation rule types
export type ValidationRuleType = 
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'email'
  | 'enum'
  | 'unique'
  | 'pattern'
  | 'custom';

// Validator interface that runtime implements
export interface DataValidator {
  validate(data: Record<string, any>, schema: ValidationSchema): Promise<ValidationResult>;
  validateField(value: any, fieldName: string, fieldValidation: FieldValidation): ValidationError[];
}