import { FieldDefinition } from './field.ts';
import { EntityUIConfig } from './ui.ts';

export interface BehaviorDefinition {
  type?: 'update' | 'custom' | 'delete';
  modifies?: Record<string, any>;
  fields?: Record<string, any>; // For type: 'update'
  emits?: string | string[];
  requires?: string;
}

export interface PermissionDefinition {
  create?: string;
  read?: string;
  update?: string;
  delete?: string;
  // Add action-specific permissions
  [action: string]: string | undefined;
}

export interface EntityDefinition {
  fields: Record<string, FieldDefinition>;
  behaviors?: Record<string, BehaviorDefinition>;
  permissions?: PermissionDefinition;
  indexes?: string[][];
  computed?: Record<string, string>;
  ui?: EntityUIConfig;
}