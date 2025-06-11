// Universal prop system for all constrained components

import { Scale, Size, ColorToken, Breakpoint } from '../tokens/design-tokens.ts';

// Base props that every component should accept
export interface BaseProps {
  // Core content
  children?: string;
  
  // Spacing (0-10 scale, responsive arrays supported)
  p?: Scale | Scale[];      // padding
  m?: Scale | Scale[];      // margin  
  gap?: Scale | Scale[];    // gap between children
  
  // Layout
  width?: Size | Size[] | string;
  height?: Size | Size[] | string;
  flex?: number | string;
  
  // Visual styling
  bg?: ColorToken;          // background color
  color?: ColorToken;       // text color
  rounded?: boolean | Scale; // border radius
  shadow?: Scale;           // box shadow
  
  // Responsive visibility
  hide?: Breakpoint[];      // hide on these breakpoints
  show?: Breakpoint[];      // show only on these breakpoints
  
  // Interaction
  onClick?: string;         // JavaScript function name
  disabled?: boolean;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
  tabIndex?: number;
  
  // HTML attributes
  id?: string;
  className?: string;
  'data-testid'?: string;
}

// Layout-specific props
export interface LayoutProps extends BaseProps {
  // Flexbox/Grid properties
  direction?: 'vertical' | 'horizontal' | 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  
  // Grid-specific
  cols?: number | number[];
  rows?: number | number[];
  
  // Responsive design
  responsive?: boolean;
}

// Typography props
export interface TypographyProps extends BaseProps {
  size?: Size;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right' | 'justify';
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  decoration?: 'none' | 'underline' | 'overline' | 'line-through';
}

// Form props
export interface FormProps extends BaseProps {
  name?: string;
  value?: string | number | boolean;
  defaultValue?: string | number | boolean;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  
  // Validation
  error?: string;
  valid?: boolean;
  
  // Form-specific events
  onChange?: string;
  onFocus?: string;
  onBlur?: string;
}

// Interactive props
export interface InteractiveProps extends BaseProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  active?: boolean;
  
  // States
  hover?: boolean;
  focus?: boolean;
  pressed?: boolean;
}

// Container props
export interface ContainerProps extends BaseProps {
  // Container-specific styling
  bordered?: boolean;
  borderColor?: ColorToken;
  borderWidth?: Scale;
  
  // Overflow behavior
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  
  // Position
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
  left?: string | number;
  zIndex?: number;
}

// Utility type for component-specific props
export type ComponentProps<T = {}> = BaseProps & T;

// Helper type for responsive values
export type Responsive<T> = T | T[];

// Prop validation helpers
export function validateScale(value: unknown): value is Scale {
  return typeof value === 'number' && value >= 0 && value <= 10;
}

export function validateColorToken(value: unknown): value is ColorToken {
  return typeof value === 'string' && (
    value in ['primary', 'secondary', 'success', 'warning', 'error', 'white', 'black', 'transparent'] ||
    value.includes('gray.') ||
    value.includes('blue.')
  );
}

export function validateSize(value: unknown): value is Size {
  return typeof value === 'string' && 
    ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'].includes(value);
}