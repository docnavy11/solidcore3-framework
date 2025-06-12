# Constrained Component System (CCS) Documentation

The Constrained Component System is a server-side rendered UI component library designed specifically for the Solidcore3 framework. It provides a comprehensive set of type-safe, entity-aware components that render to HTML strings without requiring client-side JavaScript.

## Table of Contents

1. [Overview](#overview)
2. [Design System](#design-system)
3. [Base Props System](#base-props-system)
4. [Component Reference](#component-reference)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)

## Overview

### Key Features

- **Server-Side Rendering**: All components render to HTML strings
- **Type-Safe**: Full TypeScript support with comprehensive interfaces
- **Entity-Aware**: Automatic UI generation from entity definitions
- **Responsive**: Built-in breakpoint system for responsive designs
- **Accessible**: ARIA attributes and semantic HTML support
- **Themeable**: CSS custom properties and theme support
- **Interaction System**: Data attributes for client-side behavior

### Import Pattern

```typescript
import { 
  Stack, Grid, Card, Text, Button, Table 
} from '../core/ui/components/index.ts';
```

## Design System

### Spacing Scale

The framework uses a 0-10 spacing scale based on 0.25rem increments:

| Scale | Value | Usage |
|-------|-------|-------|
| 0 | 0 | No spacing |
| 1 | 0.25rem | Tight spacing |
| 2 | 0.5rem | Small spacing |
| 3 | 0.75rem | Compact spacing |
| 4 | 1rem | Default spacing |
| 6 | 1.5rem | Medium spacing |
| 8 | 2rem | Large spacing |
| 10 | 2.5rem | Extra large spacing |

### Size Scale

Standard size scale used across components:

- `xs`: Extra Small
- `sm`: Small  
- `md`: Medium (default)
- `lg`: Large
- `xl`: Extra Large
- `2xl`: 2X Large
- `3xl`: 3X Large

### Colors

Semantic colors and gray scale:

```typescript
// Semantic
primary, secondary, success, warning, error

// Neutrals
white, black, transparent
gray.50 → gray.900

// Brand blues
blue.50 → blue.900
```

### Breakpoints

Responsive design breakpoints:

- `mobile`: 0px - 767px
- `tablet`: 768px - 1023px  
- `desktop`: 1024px+

## Base Props System

All components share a common set of base props:

```typescript
interface BaseProps {
  // Content
  children?: string;
  
  // Spacing - accepts Scale (0-10) or [mobile, tablet, desktop]
  p?: Scale | Scale[];  // padding
  m?: Scale | Scale[];  // margin
  gap?: Scale | Scale[]; // gap between children
  
  // Layout
  width?: string;
  height?: string;
  flex?: string | number;
  
  // Visual
  bg?: ColorToken;     // background color
  color?: ColorToken;  // text color
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  shadow?: 0 | 1 | 2 | 3 | 4 | 5;
  
  // Responsive visibility
  hide?: Breakpoint[];  // Hide at breakpoints
  show?: Breakpoint[];  // Show only at breakpoints
  
  // Interaction
  onClick?: string;     // JavaScript code or function name
  disabled?: boolean;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
  tabIndex?: number;
  
  // HTML
  id?: string;
  className?: string;
  'data-testid'?: string;
}
```

### Responsive Values

Many props accept responsive arrays `[mobile, tablet, desktop]`:

```typescript
// Different padding per breakpoint
Card({ p: [2, 4, 6] })

// Different columns per breakpoint  
Grid({ cols: [1, 2, 3] })
```

## Component Reference

### Layout Components

#### Stack

Flexible container for vertical/horizontal layouts.

```typescript
Stack({
  direction?: 'vertical' | 'horizontal';
  gap?: Scale | Scale[];
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  children: string;
})
```

#### Grid

Grid-based layouts with responsive columns.

```typescript
Grid({
  cols?: number | number[];  // Responsive columns
  gap?: Scale | Scale[];
  children: string;
})
```

#### Split

Two-column layout with fixed sidebar.

```typescript
Split({
  side?: 'left' | 'right';
  sideWidth?: string;  // Default: "250px"
  gap?: Scale;
  children: [string, string];  // [sidebar, main]
})
```

#### Center

Centers content with optional max width.

```typescript
Center({
  maxWidth?: string;  // Default: "65ch"
  children: string;
})
```

#### Page

Complete HTML page wrapper.

```typescript
Page({
  title: string;
  appName?: string;
  scripts?: string;
  styles?: string;
  theme?: 'light' | 'dark' | 'system';
  children: string;
})
```

### Container Components

#### View

Basic container with all base props.

```typescript
View({
  children: string;
  // All BaseProps...
})
```

#### Card

Elevated content container.

```typescript
Card({
  children: string;
  // Defaults: p: 6, bg: 'white', shadow: 1, rounded: true
})
```

#### Section

Semantic section container.

```typescript
Section({
  children: string;
  // Defaults: p: 8
})
```

#### Modal

Overlay dialog component.

```typescript
Modal({
  open: boolean;
  title?: string;
  onClose?: string;  // JavaScript function
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: string;
})
```

### Content Components

#### Text

Text display with typography control.

```typescript
Text({
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'bold';
  color?: ColorToken;
  align?: 'left' | 'center' | 'right' | 'justify';
  children: string;
})
```

#### Heading

Semantic headings (h1-h6).

```typescript
Heading({
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: SizeScale;  // Auto-sizes if not provided
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
  children: string;
})
```

#### List

Display lists with optional virtualization.

```typescript
List<T>({
  items: T[];
  renderItem?: (item: T, index: number) => string;
  virtualize?: boolean;  // For large lists
  ordered?: boolean;
  spacing?: 'compact' | 'comfortable' | 'spacious';
})
```

#### Table

Data tables with rich features.

```typescript
Table({
  data: Record<string, any>[];
  columns: Array<{
    key: string;
    label: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
  }>;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
})
```

**Example:**
```typescript
Table({
  data: [
    { id: 1, name: 'John', role: 'Admin' },
    { id: 2, name: 'Jane', role: 'User' }
  ],
  columns: [
    { key: 'id', label: 'ID', width: '10%' },
    { key: 'name', label: 'Name', align: 'left' },
    { key: 'role', label: 'Role', align: 'center' }
  ],
  striped: true,
  hoverable: true
})
```

#### Stat

Statistical displays with change indicators.

```typescript
Stat({
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right';
})
```

#### Image

Responsive images with loading optimization.

```typescript
Image({
  src: string;
  alt: string;
  width?: string;
  height?: string;
  lazy?: boolean;
  fit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'full';
  aspect?: '1:1' | '4:3' | '16:9' | '3:2';
})
```

#### Badge

Status indicators and labels.

```typescript
Badge({
  children: string;
  color?: ColorToken;
  bg?: ColorToken;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'subtle';
  rounded?: boolean | 'full';
})
```

### Form Components

#### Form

Form container with layout support.

```typescript
Form({
  action?: string;
  method?: 'GET' | 'POST';
  onSubmit?: string;
  spacing?: Scale;
  children: string;
})
```

#### Input

Various input types with validation states.

```typescript
Input({
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | etc;
  name: string;
  label?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  error?: string;
  help?: string;
  size?: 'sm' | 'md' | 'lg';
  rows?: number;  // For textarea
})
```

#### Select

Dropdown selections.

```typescript
Select({
  name: string;
  label?: string;
  options: Array<string | { label: string; value: string }>;
  value?: string;
  multiple?: boolean;
  placeholder?: string;
  required?: boolean;
  error?: string;
  help?: string;
  size?: 'sm' | 'md' | 'lg';
})
```

#### Button

Interactive buttons with variants.

```typescript
Button({
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children: string;
  // Interaction data attributes
  'data-action'?: string;
  'data-entity'?: string;
  'data-id'?: string;
})
```

### Feedback Components

#### Alert

Inline notifications.

```typescript
Alert({
  type?: 'info' | 'success' | 'warning' | 'error';
  dismissible?: boolean;
  title?: string;
  children: string;
})
```

#### Toast

Temporary notifications with positioning.

```typescript
Toast({
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;  // Milliseconds
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  show?: boolean;
  children: string;
})

// Programmatic API
showToast(message: string, options?: ToastOptions)
showSuccess(message: string)
showError(message: string)
showWarning(message: string)
showInfo(message: string)
```

### Entity Components

#### EntityField

Display single entity field with type-aware formatting.

```typescript
EntityField({
  app: AppDefinition;
  entity: string;
  field: string;
  data: any;
  variant?: 'display' | 'badge' | 'raw';
})
```

#### EntityCard

Card display for entity data.

```typescript
EntityCard({
  app: AppDefinition;
  entity: string;
  data: any;
  actions?: string[];
  compact?: boolean;
  onClick?: string;
})
```

#### EntityList

List/grid/table views of entities.

```typescript
EntityList({
  app: AppDefinition;
  entity: string;
  data: any[];
  view?: 'list' | 'grid' | 'table';
  columns?: number;
  actions?: string[];
})
```

#### EntityView

Complete entity views (forms, lists, details).

```typescript
EntityView({
  app: AppDefinition;
  entity: string;
  view: 'list' | 'form' | 'detail';
  mode?: 'create' | 'edit' | 'view';
  data?: any;
  onSubmit?: string;
})
```

## Usage Examples

### Basic Layout

```typescript
// Simple page layout
Page({
  title: "Task Manager",
  children: Stack({
    gap: 4,
    children: 
      Heading({ level: 1, children: "My Tasks" }) +
      Card({
        children: Text({ children: "Welcome to your task manager!" })
      })
  })
})
```

### Responsive Grid

```typescript
// Responsive card grid
Grid({
  cols: [1, 2, 3],  // 1 col mobile, 2 tablet, 3 desktop
  gap: 4,
  children: 
    Card({ children: "Card 1" }) +
    Card({ children: "Card 2" }) +
    Card({ children: "Card 3" })
})
```

### Data Table

```typescript
// Task table with badges
Table({
  data: tasks,
  columns: [
    { key: 'title', label: 'Title', align: 'left' },
    { key: 'priority', label: 'Priority', align: 'center' },
    { key: 'status', label: 'Status', align: 'center' },
    { key: 'dueDate', label: 'Due Date', align: 'right' }
  ],
  striped: true,
  hoverable: true
})
```

### Form with Validation

```typescript
// Contact form
Form({
  onSubmit: "handleSubmit",
  children: Stack({
    gap: 4,
    children:
      Input({
        name: "name",
        label: "Your Name",
        required: true,
        error: errors.name
      }) +
      Input({
        type: "email",
        name: "email",
        label: "Email Address",
        required: true,
        error: errors.email
      }) +
      Input({
        type: "textarea",
        name: "message",
        label: "Message",
        rows: 4,
        required: true
      }) +
      Button({
        type: "submit",
        variant: "primary",
        children: "Send Message"
      })
  })
})
```

### Entity-Driven UI

```typescript
// Automatic task list from entity definition
EntityView({
  app: myApp,
  entity: "Task",
  view: "list",
  data: tasks
})

// Auto-generated form
EntityView({
  app: myApp,
  entity: "Task",
  view: "form",
  mode: "create",
  onSubmit: "createTask"
})
```

### Interaction System

```typescript
// Delete button with confirmation
Button({
  variant: "danger",
  size: "sm",
  children: "Delete",
  'data-action': 'delete',
  'data-entity': 'task',
  'data-id': task.id,
  'data-method': 'DELETE',
  'data-confirm': 'Are you sure?',
  'data-success': 'remove'
})
```

## Best Practices

### 1. Component Composition

Compose complex UIs by combining simple components:

```typescript
// Good: Compose components
const TaskCard = (task: Task) => Card({
  children: Stack({
    gap: 2,
    children:
      Heading({ level: 3, children: task.title }) +
      Text({ color: 'gray.600', children: task.description }) +
      Badge({ 
        children: task.priority,
        bg: task.priority === 'high' ? 'red.500' : 'gray.500'
      })
  })
});
```

### 2. Responsive Design

Use responsive arrays for breakpoint-specific values:

```typescript
// Responsive padding and columns
Card({
  p: [3, 4, 6],  // Increases with screen size
  children: Grid({
    cols: [1, 2, 3],
    gap: [2, 3, 4],
    children: items.map(renderItem).join('')
  })
})
```

### 3. Accessibility

Always provide accessibility attributes:

```typescript
Button({
  children: "×",
  'aria-label': "Close dialog",
  onClick: "closeModal()"
})

Input({
  name: "email",
  label: "Email Address",
  'aria-describedby': "email-help",
  help: "We'll never share your email"
})
```

### 4. Entity Integration

Leverage entity components for automatic UI:

```typescript
// Let the framework handle UI generation
EntityView({
  app: appDefinition,
  entity: "Task",
  view: "list"
})

// Instead of manually building tables
Table({ data: tasks, columns: [...] })
```

### 5. Consistent Spacing

Use the spacing scale consistently:

```typescript
// Good: Use scale values
Stack({ gap: 4, p: 6 })

// Avoid: Arbitrary values
Stack({ gap: "17px", p: "23px" })
```

### 6. Type Safety

Leverage TypeScript for prop validation:

```typescript
// Type-safe component usage
const myButton: string = Button({
  variant: "primary",  // TypeScript ensures valid variant
  size: "md",         // Type-checked size
  children: "Click me"
});
```

## Advanced Patterns

### Custom Layouts

Create reusable layout components:

```typescript
const DashboardLayout = (content: string, sidebar: string) => 
  Page({
    title: "Dashboard",
    children: Split({
      sideWidth: "300px",
      children: [
        Card({ p: 4, children: sidebar }),
        Stack({ gap: 4, children: content })
      ]
    })
  });
```

### Dynamic Forms

Generate forms from data:

```typescript
const DynamicForm = (fields: FieldDef[]) =>
  Form({
    children: Stack({
      gap: 3,
      children: fields.map(field => 
        Input({
          name: field.name,
          type: field.type,
          label: field.label,
          required: field.required
        })
      ).join('') +
      Button({
        type: "submit",
        variant: "primary",
        children: "Submit"
      })
    })
  });
```

### Theme Customization

Apply custom themes:

```typescript
Page({
  theme: "dark",
  styles: `
    :root {
      --color-primary: #007bff;
      --color-secondary: #6c757d;
      --spacing-base: 0.25rem;
    }
  `,
  children: content
})
```

## Conclusion

The Constrained Component System provides a complete solution for building server-rendered UIs in the Solidcore3 framework. By constraining choices to a well-designed set of components and patterns, it enables rapid development while maintaining consistency and quality.

The entity-aware components and automatic UI generation capabilities make it particularly powerful for building data-driven applications with minimal code.