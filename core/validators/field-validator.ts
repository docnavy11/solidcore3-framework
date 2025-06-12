import { ValidationContext, ValidationErrorCode, ValidationUtils, VALID_FIELD_TYPES } from './types.ts';

export class FieldValidator {
  validate(field: any, fieldName: string, entityName: string, context: ValidationContext): void {
    const fieldPath = `entities.${entityName}.fields.${fieldName}`;
    
    // Field must be an object
    if (!field || typeof field !== 'object') {
      context.addError(context.createError(
        'FIELD_INVALID_STRUCTURE',
        `Field '${fieldName}' must be an object`,
        fieldPath,
        'Define field as: { type: "string", required: true, ... }'
      ));
      return;
    }
    
    // Type validation
    this.validateFieldType(field, fieldName, fieldPath, context);
    
    // Type-specific validation
    this.validateTypeSpecificProperties(field, fieldName, fieldPath, context);
    
    // General field properties validation
    this.validateFieldProperties(field, fieldName, fieldPath, context);
    
    // Business rules validation
    this.validateFieldBusinessRules(field, fieldName, fieldPath, context);
  }
  
  private validateFieldType(field: any, fieldName: string, fieldPath: string, context: ValidationContext): void {
    // Type is required
    if (!field.type) {
      context.addError(context.createError(
        ValidationErrorCode.FIELD_TYPE_MISSING,
        `Field '${fieldName}' must have a type`,
        `${fieldPath}.type`,
        `Valid types: ${VALID_FIELD_TYPES.join(', ')}`,
        { fieldName, availableTypes: VALID_FIELD_TYPES }
      ));
      return;
    }
    
    // Type must be valid
    if (!ValidationUtils.isValidFieldType(field.type)) {
      context.addError(context.createError(
        ValidationErrorCode.FIELD_TYPE_INVALID,
        `Field '${fieldName}' has invalid type '${field.type}'`,
        `${fieldPath}.type`,
        `Valid types: ${VALID_FIELD_TYPES.join(', ')}`,
        { fieldName, invalidType: field.type, availableTypes: VALID_FIELD_TYPES }
      ));
    }
  }
  
  private validateTypeSpecificProperties(field: any, fieldName: string, fieldPath: string, context: ValidationContext): void {
    switch (field.type) {
      case 'enum':
        this.validateEnumField(field, fieldName, fieldPath, context);
        break;
        
      case 'relation':
        this.validateRelationField(field, fieldName, fieldPath, context);
        break;
        
      case 'string':
        this.validateStringField(field, fieldName, fieldPath, context);
        break;
        
      case 'number':
        this.validateNumberField(field, fieldName, fieldPath, context);
        break;
        
      case 'date':
        this.validateDateField(field, fieldName, fieldPath, context);
        break;
        
      case 'boolean':
        this.validateBooleanField(field, fieldName, fieldPath, context);
        break;
    }
  }
  
  private validateEnumField(field: any, fieldName: string, fieldPath: string, context: ValidationContext): void {
    // Enum fields must have options
    if (!field.options) {
      context.addError(context.createError(
        ValidationErrorCode.FIELD_ENUM_NO_OPTIONS,
        `Enum field '${fieldName}' must have options`,
        `${fieldPath}.options`,
        'Add options: { type: "enum", options: ["option1", "option2"] }',
        { fieldName }
      ));
      return;
    }
    
    // Options must be an array
    if (!Array.isArray(field.options)) {
      context.addError(context.createError(
        'FIELD_ENUM_OPTIONS_NOT_ARRAY',
        `Enum field '${fieldName}' options must be an array`,
        `${fieldPath}.options`,
        'Define options as: options: ["value1", "value2", "value3"]'
      ));
      return;
    }
    
    // Options cannot be empty
    if (field.options.length === 0) {
      context.addError(context.createError(
        ValidationErrorCode.FIELD_ENUM_EMPTY_OPTIONS,
        `Enum field '${fieldName}' must have at least one option`,
        `${fieldPath}.options`,
        'Add options: options: ["active", "inactive"]',
        { fieldName }
      ));
      return;
    }
    
    // All options must be strings
    const invalidOptions = field.options.filter((option: any) => typeof option !== 'string');
    if (invalidOptions.length > 0) {
      context.addError(context.createError(
        'FIELD_ENUM_INVALID_OPTIONS',
        `Enum field '${fieldName}' has non-string options`,
        `${fieldPath}.options`,
        'All enum options must be strings',
        { fieldName, invalidOptions }
      ));
    }
    
    // Check for duplicate options
    const uniqueOptions = new Set(field.options);
    if (uniqueOptions.size !== field.options.length) {
      context.addWarning(context.createWarning(
        'FIELD_ENUM_DUPLICATE_OPTIONS',
        `Enum field '${fieldName}' has duplicate options`,
        `${fieldPath}.options`,
        'Remove duplicate values from the options array',
        { fieldName, options: field.options }
      ));
    }
    
    // Validate default value if present
    if (field.default !== undefined && !field.options.includes(field.default)) {
      context.addError(context.createError(
        'FIELD_ENUM_INVALID_DEFAULT',
        `Enum field '${fieldName}' default value '${field.default}' is not in options`,
        `${fieldPath}.default`,
        `Default must be one of: ${field.options.join(', ')}`,
        { fieldName, defaultValue: field.default, options: field.options }
      ));
    }
  }
  
  private validateRelationField(field: any, fieldName: string, fieldPath: string, context: ValidationContext): void {
    // Relation fields must specify target entity
    if (!field.to) {
      context.addError(context.createError(
        ValidationErrorCode.FIELD_REFERENCE_NO_ENTITY,
        `Relation field '${fieldName}' must specify target entity`,
        `${fieldPath}.to`,
        'Add entity reference: { type: "relation", to: "EntityName" }',
        { fieldName }
      ));
      return;
    }
    
    // Entity name must be a string
    if (typeof field.to !== 'string') {
      context.addError(context.createError(
        'FIELD_REFERENCE_ENTITY_INVALID',
        `Relation field '${fieldName}' to must be a string`,
        `${fieldPath}.to`,
        'Specify entity as: to: "EntityName"'
      ));
    }
    
    // Entity name must be a valid identifier
    if (typeof field.to === 'string' && !ValidationUtils.isValidIdentifier(field.to)) {
      context.addError(context.createError(
        'FIELD_REFERENCE_ENTITY_NAME_INVALID',
        `Relation field '${fieldName}' entity name '${field.to}' is not valid`,
        `${fieldPath}.to`,
        'Entity names must be valid identifiers (letters, numbers, underscores)'
      ));
    }
  }
  
  private validateStringField(field: any, fieldName: string, fieldPath: string, context: ValidationContext): void {
    // Validate string-specific properties
    if (field.minLength !== undefined) {
      if (typeof field.minLength !== 'number' || field.minLength < 0) {
        context.addError(context.createError(
          'FIELD_STRING_MIN_LENGTH_INVALID',
          `String field '${fieldName}' minLength must be a non-negative number`,
          `${fieldPath}.minLength`
        ));
      }
    }
    
    if (field.maxLength !== undefined) {
      if (typeof field.maxLength !== 'number' || field.maxLength < 1) {
        context.addError(context.createError(
          'FIELD_STRING_MAX_LENGTH_INVALID',
          `String field '${fieldName}' maxLength must be a positive number`,
          `${fieldPath}.maxLength`
        ));
      }
    }
    
    // Check logical consistency
    if (field.minLength !== undefined && field.maxLength !== undefined) {
      if (field.minLength > field.maxLength) {
        context.addError(context.createError(
          'FIELD_STRING_LENGTH_INCONSISTENT',
          `String field '${fieldName}' minLength (${field.minLength}) cannot be greater than maxLength (${field.maxLength})`,
          fieldPath,
          'Ensure minLength <= maxLength'
        ));
      }
    }
    
    // Validate pattern if present
    if (field.pattern !== undefined) {
      if (typeof field.pattern !== 'string') {
        context.addError(context.createError(
          'FIELD_STRING_PATTERN_INVALID',
          `String field '${fieldName}' pattern must be a string`,
          `${fieldPath}.pattern`
        ));
      } else {
        try {
          new RegExp(field.pattern);
        } catch (error) {
          context.addError(context.createError(
            'FIELD_STRING_PATTERN_INVALID_REGEX',
            `String field '${fieldName}' pattern is not a valid regular expression`,
            `${fieldPath}.pattern`,
            'Ensure the pattern is a valid regex string',
            { pattern: field.pattern, error: error instanceof Error ? error.message : String(error) }
          ));
        }
      }
    }
  }
  
  private validateNumberField(field: any, fieldName: string, fieldPath: string, context: ValidationContext): void {
    // Validate number-specific properties
    if (field.min !== undefined && typeof field.min !== 'number') {
      context.addError(context.createError(
        'FIELD_NUMBER_MIN_INVALID',
        `Number field '${fieldName}' min must be a number`,
        `${fieldPath}.min`
      ));
    }
    
    if (field.max !== undefined && typeof field.max !== 'number') {
      context.addError(context.createError(
        'FIELD_NUMBER_MAX_INVALID',
        `Number field '${fieldName}' max must be a number`,
        `${fieldPath}.max`
      ));
    }
    
    // Check logical consistency
    if (field.min !== undefined && field.max !== undefined) {
      if (field.min > field.max) {
        context.addError(context.createError(
          'FIELD_NUMBER_RANGE_INCONSISTENT',
          `Number field '${fieldName}' min (${field.min}) cannot be greater than max (${field.max})`,
          fieldPath,
          'Ensure min <= max'
        ));
      }
    }
    
    // Validate integer constraint
    if (field.integer !== undefined && typeof field.integer !== 'boolean') {
      context.addError(context.createError(
        'FIELD_NUMBER_INTEGER_INVALID',
        `Number field '${fieldName}' integer must be a boolean`,
        `${fieldPath}.integer`
      ));
    }
  }
  
  private validateDateField(field: any, fieldName: string, fieldPath: string, context: ValidationContext): void {
    // Validate date-specific properties
    if (field.format !== undefined) {
      if (typeof field.format !== 'string') {
        context.addError(context.createError(
          'FIELD_DATE_FORMAT_INVALID',
          `Date field '${fieldName}' format must be a string`,
          `${fieldPath}.format`
        ));
      } else {
        const validFormats = ['date', 'datetime', 'time'];
        if (!validFormats.includes(field.format)) {
          context.addWarning(context.createWarning(
            'FIELD_DATE_FORMAT_UNKNOWN',
            `Date field '${fieldName}' uses unknown format '${field.format}'`,
            `${fieldPath}.format`,
            `Common formats: ${validFormats.join(', ')}`,
            { format: field.format, validFormats }
          ));
        }
      }
    }
  }
  
  private validateBooleanField(field: any, fieldName: string, fieldPath: string, context: ValidationContext): void {
    // Boolean fields are straightforward, just validate default if present
    if (field.default !== undefined && typeof field.default !== 'boolean') {
      context.addError(context.createError(
        'FIELD_BOOLEAN_DEFAULT_INVALID',
        `Boolean field '${fieldName}' default must be true or false`,
        `${fieldPath}.default`
      ));
    }
  }
  
  private validateFieldProperties(field: any, fieldName: string, fieldPath: string, context: ValidationContext): void {
    // Validate common field properties
    
    // Required property
    if (field.required !== undefined && typeof field.required !== 'boolean') {
      context.addError(context.createError(
        'FIELD_REQUIRED_INVALID',
        `Field '${fieldName}' required must be a boolean`,
        `${fieldPath}.required`
      ));
    }
    
    // Auto property
    if (field.auto !== undefined && typeof field.auto !== 'boolean') {
      context.addError(context.createError(
        'FIELD_AUTO_INVALID',
        `Field '${fieldName}' auto must be a boolean`,
        `${fieldPath}.auto`
      ));
    }
    
    // Unique property
    if (field.unique !== undefined && typeof field.unique !== 'boolean') {
      context.addError(context.createError(
        'FIELD_UNIQUE_INVALID',
        `Field '${fieldName}' unique must be a boolean`,
        `${fieldPath}.unique`
      ));
    }
    
    // Label property
    if (field.label !== undefined && typeof field.label !== 'string') {
      context.addError(context.createError(
        'FIELD_LABEL_INVALID',
        `Field '${fieldName}' label must be a string`,
        `${fieldPath}.label`
      ));
    }
    
    // Description property
    if (field.description !== undefined && typeof field.description !== 'string') {
      context.addError(context.createError(
        'FIELD_DESCRIPTION_INVALID',
        `Field '${fieldName}' description must be a string`,
        `${fieldPath}.description`
      ));
    }
  }
  
  private validateFieldBusinessRules(field: any, fieldName: string, fieldPath: string, context: ValidationContext): void {
    // Auto fields typically shouldn't be required
    if (field.auto === true && field.required === true) {
      context.addWarning(context.createWarning(
        'FIELD_AUTO_AND_REQUIRED',
        `Field '${fieldName}' is both auto-generated and required`,
        fieldPath,
        'Auto-generated fields are typically not required since they are filled automatically.'
      ));
    }
    
    // Unique auto fields are common pattern for IDs
    if (field.auto === true && field.unique !== true && fieldName.toLowerCase().includes('id')) {
      context.addWarning(context.createWarning(
        'FIELD_ID_NOT_UNIQUE',
        `ID field '${fieldName}' should probably be unique`,
        `${fieldPath}.unique`,
        'Add unique: true for ID fields'
      ));
    }
    
    // Check for reasonable field naming
    const reservedWords = ['constructor', 'prototype', 'toString', 'valueOf'];
    if (reservedWords.includes(fieldName.toLowerCase())) {
      context.addWarning(context.createWarning(
        'FIELD_NAME_RESERVED',
        `Field name '${fieldName}' is a reserved word`,
        fieldPath,
        'Consider using a different field name to avoid potential conflicts.'
      ));
    }
  }
}