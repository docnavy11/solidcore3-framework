// UI configuration types for entity display

export interface ColorMapping {
  field: string;
  map: Record<string, string>;
}

export interface EntityDisplayConfig {
  primary: string;           // Main field to display (e.g., 'title')
  secondary?: string;        // Secondary field (e.g., 'description')
  badge?: string;           // Field to show as badge (e.g., 'status')
  color?: ColorMapping;     // Color coding based on field value
  avatar?: string;          // Field for avatar/image
  subtitle?: string;        // Additional subtitle field
  metadata?: string[];      // Fields to show as metadata
}

export interface EntityListConfig {
  columns: string[];        // Fields to show as columns
  sortable?: boolean | string[];  // Which columns are sortable
  filterable?: boolean | string[]; // Which columns are filterable
  searchable?: string[];    // Fields to include in search
  pagination?: {
    pageSize: number;
    showSizeOptions: boolean;
  };
  actions?: string[];       // Available actions (edit, delete, etc.)
}

export interface EntityFormConfig {
  fields: string[];         // Fields to include in form
  layout: 'single-column' | 'two-column' | 'sections';
  sections?: Array<{
    title: string;
    fields: string[];
    collapsible?: boolean;
  }>;
  validation?: Record<string, any>;
  submitText?: string;
  cancelText?: string;
}

export interface EntityUIConfig {
  display: EntityDisplayConfig;
  list?: EntityListConfig;
  form?: EntityFormConfig;
  detail?: {
    sections?: Array<{
      title: string;
      fields: string[];
    }>;
    actions?: string[];
  };
}