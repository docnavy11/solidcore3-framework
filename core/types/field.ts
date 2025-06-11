export type FieldType = 
  | 'string'
  | 'text'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'json'
  | 'uuid'
  | 'enum'
  | 'relation';

export interface BaseFieldDefinition {
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  default?: any;
  description?: string;
}

export interface StringFieldDefinition extends BaseFieldDefinition {
  type: 'string';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface NumberFieldDefinition extends BaseFieldDefinition {
  type: 'number' | 'integer';
  min?: number;
  max?: number;
}

export interface EnumFieldDefinition extends BaseFieldDefinition {
  type: 'enum';
  values: string[];
}

export interface RelationFieldDefinition extends BaseFieldDefinition {
  type: 'relation';
  to: string;
  many?: boolean;
}

export type FieldDefinition = 
  | StringFieldDefinition
  | NumberFieldDefinition
  | EnumFieldDefinition
  | RelationFieldDefinition
  | BaseFieldDefinition;