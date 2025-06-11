import { FieldDefinition } from './field.ts';
import { EntityUIConfig } from './ui.ts';

export interface BehaviorDefinition {
  modifies?: Record<string, any>;
  emits?: string | string[];
  requires?: string;
}

export interface PermissionDefinition {
  create?: string;
  read?: string;
  update?: string;
  delete?: string;
}

export interface EntityDefinition {
  fields: Record<string, FieldDefinition>;
  behaviors?: Record<string, BehaviorDefinition>;
  permissions?: PermissionDefinition;
  indexes?: string[][];
  computed?: Record<string, string>;
  ui?: EntityUIConfig;
}