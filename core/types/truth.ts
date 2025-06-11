import { EntityDefinition } from './entity.ts';
import { ViewDefinition } from './view.ts';
import { WorkflowDefinition } from './workflow.ts';

export interface AppDefinition {
  name: string;
  version?: string;
  description?: string;
  
  entities: Record<string, EntityDefinition>;
  views?: Record<string, ViewDefinition>;
  workflows?: Record<string, WorkflowDefinition>;
  
  settings?: {
    auth?: {
      enabled: boolean;
      provider?: string;
      sessionTimeout?: number;
    };
    database?: {
      url?: string;
      migrations?: boolean;
    };
    ui?: {
      theme?: string;
      layout?: string;
    };
  };
}