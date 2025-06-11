export interface WorkflowAction {
  type: string;
  params?: Record<string, any>;
}

export interface WorkflowDefinition {
  trigger: string;
  condition?: string;
  actions: (string | WorkflowAction)[];
  async?: boolean;
}