export type ViewType = 'list' | 'detail' | 'form' | 'custom' | 'kanban' | 'calendar' | 'dashboard' | 'auth';
export type LayoutType = 'table' | 'grid' | 'list' | 'detail' | 'form' | 'dashboard';

export interface ViewDefinition {
  type: ViewType;        // Primary view type (replaces layout)
  route: string;
  data?: string;
  layout?: LayoutType;   // Optional layout override
  title?: string;
  entity?: string;
  mode?: 'create' | 'edit' | 'login' | 'register';  // For form and auth views
  filters?: Record<string, any>;
  actions?: string[];
  
  // Kanban view properties
  groupBy?: string;      // Field to group items by (for kanban)
  columns?: Array<{id: string, title: string}>; // Custom column definitions
  cardFields?: string[]; // Fields to display on cards
  
  // Calendar view properties
  dateField?: string;    // Field containing the date (for calendar)
  titleField?: string;   // Field to use as event title
  colorField?: string;   // Field to determine event color
  eventFields?: string[]; // Fields to display in event details
  
  // Dashboard view properties
  subtitle?: string;     // Dashboard subtitle
  metrics?: Array<{key: string, title: string, icon?: string, color?: string}>; // Metrics to display
  widgets?: Array<{type: string, title: string, limit?: number}>; // Widgets to include
  
  // Custom view properties
  template?: string;     // Template name for custom views (e.g., 'about', 'help')
  content?: string;      // Static content for custom views
  component?: string;    // Component name for custom views
}