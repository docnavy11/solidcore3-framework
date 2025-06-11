// Export all UI components for the constrained component system

// Layout Components
export * from './Layout.ts';

// Container Components  
export * from './Containers.ts';

// Content Components
export * from './Content.ts';

// Form Components
export * from './Forms.ts';

// Feedback Components
export * from './Feedback.ts';

// Entity Components
export * from './Entity.ts';

// Component registry for easy access
export const ComponentRegistry = {
  // Layout
  Stack: 'Stack',
  Grid: 'Grid', 
  Split: 'Split',
  Center: 'Center',
  Page: 'Page',
  
  // Containers
  View: 'View',
  Card: 'Card',
  Section: 'Section',
  Modal: 'Modal',
  
  // Content
  Text: 'Text',
  Heading: 'Heading',
  List: 'List',
  Table: 'Table',
  Stat: 'Stat',
  Image: 'Image',
  Badge: 'Badge',
  
  // Forms
  Form: 'Form',
  Input: 'Input',
  Select: 'Select',
  Button: 'Button',
  
  // Feedback
  Alert: 'Alert',
  Toast: 'Toast',
  
  // Entity
  EntityField: 'EntityField',
  EntityCard: 'EntityCard',
  EntityList: 'EntityList',
  EntityView: 'EntityView'
} as const;

export type ComponentName = keyof typeof ComponentRegistry;