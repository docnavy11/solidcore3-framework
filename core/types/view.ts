export type ViewType = 'list' | 'detail' | 'form' | 'custom';
export type LayoutType = 'table' | 'grid' | 'list' | 'detail' | 'form';

export interface ViewDefinition {
  type: ViewType;        // Primary view type (replaces layout)
  route: string;
  data?: string;
  layout?: LayoutType;   // Optional layout override
  title?: string;
  entity?: string;
  mode?: 'create' | 'edit';  // For form views
  filters?: Record<string, any>;
  actions?: string[];
  
  // Custom view properties
  template?: string;     // Template name for custom views (e.g., 'about', 'help')
  content?: string;      // Static content for custom views
}