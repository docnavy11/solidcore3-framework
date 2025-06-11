// Prop processing utilities for constrained component system

import { 
  Scale, 
  Size, 
  ColorToken, 
  Breakpoint,
  getSpacing, 
  getColor, 
  getShadow, 
  getFontSize,
  responsive 
} from '../tokens/design-tokens.ts';
import { BaseProps, LayoutProps, TypographyProps } from '../types/base-props.ts';

// Utility to process base props into CSS styles
export function processBaseProps(props: BaseProps): {
  styles: string;
  attributes: string;
  classes: string[];
} {
  const styles: string[] = [];
  const attributes: string[] = [];
  const classes: string[] = [];

  // Spacing props
  if (props.p !== undefined) {
    styles.push(`padding: ${getSpacing(props.p)}`);
  }
  if (props.m !== undefined) {
    styles.push(`margin: ${getSpacing(props.m)}`);
  }

  // Layout props
  if (props.width !== undefined) {
    const width = typeof props.width === 'string' ? props.width : getFontSize(props.width as Size);
    styles.push(`width: ${width}`);
  }
  if (props.height !== undefined) {
    const height = typeof props.height === 'string' ? props.height : getFontSize(props.height as Size);
    styles.push(`height: ${height}`);
  }
  if (props.flex !== undefined) {
    styles.push(`flex: ${props.flex}`);
  }

  // Visual props
  if (props.bg !== undefined) {
    styles.push(`background-color: ${getColor(props.bg)}`);
  }
  if (props.color !== undefined) {
    styles.push(`color: ${getColor(props.color)}`);
  }
  if (props.rounded !== undefined) {
    if (typeof props.rounded === 'boolean') {
      styles.push(`border-radius: ${props.rounded ? '0.5rem' : '0'}`);
    } else {
      styles.push(`border-radius: ${getSpacing(props.rounded)}`);
    }
  }
  if (props.shadow !== undefined) {
    styles.push(`box-shadow: ${getShadow(props.shadow)}`);
  }

  // Responsive visibility (CSS classes for now)
  if (props.hide) {
    props.hide.forEach(breakpoint => {
      classes.push(`hide-${breakpoint}`);
    });
  }
  if (props.show) {
    props.show.forEach(breakpoint => {
      classes.push(`show-${breakpoint}`);
    });
  }

  // Interaction props
  if (props.onClick) {
    attributes.push(`onclick="${props.onClick}"`);
  }
  if (props.disabled) {
    attributes.push('disabled');
  }

  // Accessibility props
  if (props['aria-label']) {
    attributes.push(`aria-label="${props['aria-label']}"`);
  }
  if (props['aria-describedby']) {
    attributes.push(`aria-describedby="${props['aria-describedby']}"`);
  }
  if (props.role) {
    attributes.push(`role="${props.role}"`);
  }
  if (props.tabIndex !== undefined) {
    attributes.push(`tabindex="${props.tabIndex}"`);
  }

  // HTML attributes
  if (props.id) {
    attributes.push(`id="${props.id}"`);
  }
  if (props.className) {
    classes.push(props.className);
  }
  if (props['data-testid']) {
    attributes.push(`data-testid="${props['data-testid']}"`);
  }

  return {
    styles: styles.join('; '),
    attributes: attributes.join(' '),
    classes
  };
}

// Utility for layout-specific props
export function processLayoutProps(props: LayoutProps): string {
  const styles: string[] = [];

  // Flexbox/Grid properties
  if (props.direction) {
    const flexDirection = props.direction === 'vertical' ? 'column' : 
                         props.direction === 'horizontal' ? 'row' : props.direction;
    styles.push(`flex-direction: ${flexDirection}`);
  }

  if (props.align) {
    const alignItems = props.align === 'start' ? 'flex-start' :
                      props.align === 'end' ? 'flex-end' : props.align;
    styles.push(`align-items: ${alignItems}`);
  }

  if (props.justify) {
    const justifyContent = props.justify === 'start' ? 'flex-start' :
                          props.justify === 'end' ? 'flex-end' :
                          props.justify === 'between' ? 'space-between' :
                          props.justify === 'around' ? 'space-around' : props.justify;
    styles.push(`justify-content: ${justifyContent}`);
  }

  if (props.wrap) {
    styles.push(`flex-wrap: ${props.wrap ? 'wrap' : 'nowrap'}`);
  }

  if (props.gap !== undefined) {
    styles.push(`gap: ${getSpacing(props.gap)}`);
  }

  // Grid-specific
  if (props.cols !== undefined) {
    const columns = Array.isArray(props.cols) ? props.cols[0] : props.cols;
    styles.push(`grid-template-columns: repeat(${columns}, 1fr)`);
  }

  if (props.rows !== undefined) {
    const rows = Array.isArray(props.rows) ? props.rows[0] : props.rows;
    styles.push(`grid-template-rows: repeat(${rows}, 1fr)`);
  }

  return styles.join('; ');
}

// Utility for typography props
export function processTypographyProps(props: TypographyProps): string {
  const styles: string[] = [];

  if (props.size) {
    styles.push(`font-size: ${getFontSize(props.size)}`);
  }

  if (props.weight) {
    const fontWeight = {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }[props.weight];
    styles.push(`font-weight: ${fontWeight}`);
  }

  if (props.align) {
    styles.push(`text-align: ${props.align}`);
  }

  if (props.transform) {
    styles.push(`text-transform: ${props.transform}`);
  }

  if (props.decoration) {
    styles.push(`text-decoration: ${props.decoration}`);
  }

  return styles.join('; ');
}

// Utility to combine all prop processing
export function processAllProps<T extends BaseProps>(props: T): {
  styles: string;
  attributes: string;
  classes: string[];
} {
  const baseResult = processBaseProps(props);
  
  // Check if props include layout or typography extensions
  const layoutStyles = 'direction' in props || 'align' in props || 'justify' in props ? 
    processLayoutProps(props as LayoutProps) : '';
  
  const typographyStyles = 'weight' in props || 'align' in props ? 
    processTypographyProps(props as TypographyProps) : '';

  const allStyles = [baseResult.styles, layoutStyles, typographyStyles]
    .filter(Boolean)
    .join('; ');

  return {
    styles: allStyles,
    attributes: baseResult.attributes,
    classes: baseResult.classes
  };
}

// Utility to build HTML element with processed props
export function buildElement(
  tag: string, 
  props: BaseProps, 
  children: string = '',
  additionalStyles: string = '',
  additionalAttributes: string = ''
): string {
  const processed = processAllProps(props);
  
  const allStyles = [processed.styles, additionalStyles].filter(Boolean).join('; ');
  const allAttributes = [processed.attributes, additionalAttributes].filter(Boolean).join(' ');
  const allClasses = processed.classes.join(' ');

  return `
    <${tag}
      ${allAttributes}
      ${allClasses ? `class="${allClasses}"` : ''}
      style="${allStyles}"
    >
      ${children}
    </${tag}>
  `;
}

// Utility for responsive CSS generation
export function generateResponsiveCSS(): string {
  return `
    /* Responsive utility classes */
    @media (max-width: 767px) {
      .hide-mobile { display: none !important; }
      .show-mobile { display: block !important; }
    }
    
    @media (min-width: 768px) and (max-width: 1023px) {
      .hide-tablet { display: none !important; }
      .show-tablet { display: block !important; }
    }
    
    @media (min-width: 1024px) {
      .hide-desktop { display: none !important; }
      .show-desktop { display: block !important; }
    }
    
    /* Default show/hide classes */
    .show-mobile, .show-tablet, .show-desktop {
      display: none;
    }
  `;
}

// Interaction data attributes utility
export interface InteractionProps {
  'data-action'?: string;
  'data-entity'?: string;
  'data-id'?: string | number;
  'data-method'?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  'data-url'?: string;
  'data-confirm'?: string;
  'data-success'?: 'reload' | 'remove' | 'hide' | 'redirect' | 'update';
  'data-redirect'?: string;
  'data-target'?: string;
}

export function processInteractionProps(props: InteractionProps): string {
  const attributes: string[] = [];

  if (props['data-action']) attributes.push(`data-action="${props['data-action']}"`);
  if (props['data-entity']) attributes.push(`data-entity="${props['data-entity']}"`);
  if (props['data-id']) attributes.push(`data-id="${props['data-id']}"`);
  if (props['data-method']) attributes.push(`data-method="${props['data-method']}"`);
  if (props['data-url']) attributes.push(`data-url="${props['data-url']}"`);
  if (props['data-confirm']) attributes.push(`data-confirm="${props['data-confirm']}"`);
  if (props['data-success']) attributes.push(`data-success="${props['data-success']}"`);
  if (props['data-redirect']) attributes.push(`data-redirect="${props['data-redirect']}"`);
  if (props['data-target']) attributes.push(`data-target="${props['data-target']}"`);

  return attributes.join(' ');
}

// Validation utilities
export function validateProps<T extends BaseProps>(props: T): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate scale values
  if (props.p !== undefined && !isValidScale(props.p)) {
    errors.push('Padding (p) must be a number between 0-10 or array of such numbers');
  }
  if (props.m !== undefined && !isValidScale(props.m)) {
    errors.push('Margin (m) must be a number between 0-10 or array of such numbers');
  }
  if (props.gap !== undefined && !isValidScale(props.gap)) {
    errors.push('Gap must be a number between 0-10 or array of such numbers');
  }
  if (props.shadow !== undefined && !isValidScale(props.shadow)) {
    errors.push('Shadow must be a number between 0-5');
  }

  // Validate color tokens
  if (props.bg !== undefined && !isValidColorToken(props.bg)) {
    errors.push('Background color must be a valid color token');
  }
  if (props.color !== undefined && !isValidColorToken(props.color)) {
    errors.push('Text color must be a valid color token');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function isValidScale(value: Scale | Scale[]): boolean {
  if (Array.isArray(value)) {
    return value.every(v => typeof v === 'number' && v >= 0 && v <= 10);
  }
  return typeof value === 'number' && value >= 0 && value <= 10;
}

function isValidColorToken(value: ColorToken): boolean {
  const validTokens = [
    'primary', 'secondary', 'success', 'warning', 'error',
    'white', 'black', 'transparent'
  ];
  
  return validTokens.includes(value as string) || 
         value.includes('gray.') || 
         value.includes('blue.');
}