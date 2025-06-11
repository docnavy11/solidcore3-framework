// Design token system for constrained component library

export type Scale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

// Spacing scale (0.25rem increments)
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem'    // 40px
} as const;

// Color system with semantic tokens
export const colors = {
  // Semantic colors
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  
  // Neutral scale
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  
  // Gray scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  
  // Brand colors
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  }
} as const;

// Typography scale
export const typography = {
  size: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    md: '1rem',       // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem' // 30px
  },
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  }
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1024px'
} as const;

// Shadows
export const shadows = {
  0: 'none',
  1: '0 1px 3px rgba(0, 0, 0, 0.1)',
  2: '0 4px 6px rgba(0, 0, 0, 0.1)',
  3: '0 10px 15px rgba(0, 0, 0, 0.1)',
  4: '0 20px 25px rgba(0, 0, 0, 0.1)',
  5: '0 25px 50px rgba(0, 0, 0, 0.25)'
} as const;

// Border radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px'
} as const;

// Color token type for type safety
export type ColorToken = 
  | keyof typeof colors
  | `gray.${keyof typeof colors.gray}`
  | `blue.${keyof typeof colors.blue}`;

// Utility functions
export function getSpacing(scale: Scale | Scale[]): string {
  if (Array.isArray(scale)) {
    // Return first value for now, responsive implementation later
    return spacing[scale[0]];
  }
  return spacing[scale];
}

export function getColor(token: ColorToken): string {
  if (token.includes('.')) {
    const [colorFamily, shade] = token.split('.') as [keyof typeof colors, string];
    const family = colors[colorFamily];
    if (typeof family === 'object') {
      return family[shade as keyof typeof family] || colors.gray[500];
    }
  }
  return colors[token as keyof typeof colors] || colors.gray[500];
}

export function getShadow(scale: Scale): string {
  return shadows[scale];
}

export function getFontSize(size: Size): string {
  return typography.fontSize[size];
}

// Responsive utility (placeholder for future implementation)
export function responsive<T>(values: T | T[], breakpoint?: Breakpoint): T {
  if (Array.isArray(values)) {
    // For now, return the first value
    // TODO: Implement proper responsive logic
    return values[0];
  }
  return values;
}