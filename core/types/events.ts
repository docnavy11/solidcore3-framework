// Core event types - shared between core and runtime
// These are the fundamental event interfaces that don't depend on runtime implementation

export interface EventData {
  entity: string;
  entityId: string;
  behavior?: string;
  data: Record<string, any>;
  timestamp: string;
  user?: string;
}

export interface EventHandler {
  (event: EventData): Promise<void> | void;
}

// Event emission interface - implemented by runtime
export interface EventEmitterInterface {
  emit(event: string, data: EventData): void;
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
}