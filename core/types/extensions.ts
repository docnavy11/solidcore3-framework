import { Context } from 'https://deno.land/x/hono@v4.3.11/mod.ts';
import { EventData } from './events.ts';

// Base extension interface
export interface BaseExtension {
  name: string;
  version?: string;
  description?: string;
  author?: string;
  dependencies?: string[];
}

// API Extension Types
export interface APIExtension extends BaseExtension {
  type: 'api';
  entity?: string; // Optional: bind to specific entity
  routes?: RouteExtension[];
  middleware?: MiddlewareExtension[];
  hooks?: APIHooks;
}

export interface RouteExtension {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: (c: Context) => Promise<Response> | Response;
  middleware?: string[];
  description?: string;
}

export interface MiddlewareExtension {
  name: string;
  handler: (c: Context, next: () => Promise<void>) => Promise<void>;
  routes?: string[]; // Optional: apply only to specific routes
}

export interface APIHooks {
  beforeCreate?: (data: any, context: Context) => Promise<any> | any;
  afterCreate?: (data: any, result: any, context: Context) => Promise<void> | void;
  beforeUpdate?: (id: string, data: any, context: Context) => Promise<any> | any;
  afterUpdate?: (id: string, data: any, result: any, context: Context) => Promise<void> | void;
  beforeDelete?: (id: string, context: Context) => Promise<void> | void;
  afterDelete?: (id: string, context: Context) => Promise<void> | void;
  beforeRead?: (id: string | null, context: Context) => Promise<void> | void;
  afterRead?: (data: any, context: Context) => Promise<any> | any;
}

// UI Extension Types
export interface UIExtension extends BaseExtension {
  type: 'ui';
  target?: string; // Which entity/view to extend
  components?: ComponentExtension[];
  pages?: PageExtension[];
  styles?: string; // CSS to inject
  scripts?: string; // JavaScript to inject
}

export interface ComponentExtension {
  name: string;
  wrapper?: (OriginalComponent: any) => any; // Wrap existing component
  replacement?: any; // Replace existing component entirely
  inject?: {
    position: 'before' | 'after' | 'replace';
    target: string; // CSS selector or component name
    content: string; // HTML content to inject
  };
}

export interface PageExtension {
  route: string;
  component: any;
  layout?: string;
  middleware?: string[];
}

// Workflow Extension Types
export interface WorkflowExtension extends BaseExtension {
  type: 'workflow';
  actions: Record<string, WorkflowAction>;
  triggers?: Record<string, WorkflowTrigger>;
}

export interface WorkflowAction {
  name: string;
  description?: string;
  parameters?: Record<string, any>; // Schema for parameters
  handler: (event: EventData, params?: any) => Promise<void> | void;
}

export interface WorkflowTrigger {
  name: string;
  description?: string;
  condition?: (event: EventData) => boolean;
  handler: (event: EventData) => Promise<void> | void;
}

// Combined extension type
export type Extension = APIExtension | UIExtension | WorkflowExtension;

// Extension context passed to handlers
export interface ExtensionContext {
  app: any; // AppDefinition
  db: any; // Database client
  events: any; // Event emitter
  utils: ExtensionUtils;
}

export interface ExtensionUtils {
  // Helper functions available to extensions
  validateInput: (data: any, schema: any) => any;
  hashPassword: (password: string) => Promise<string>;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  generateToken: () => string;
  sendEmail: (to: string, subject: string, body: string) => Promise<void>;
  callWebhook: (url: string, data: any) => Promise<any>;
  log: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void;
}

// Extension loader configuration
export interface ExtensionConfig {
  enabled: boolean;
  directory: string;
  autoload: boolean;
  whitelist?: string[]; // Only load these extensions
  blacklist?: string[]; // Never load these extensions
}