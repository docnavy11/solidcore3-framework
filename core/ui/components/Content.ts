// Content component definitions for the constrained UI system

import { BaseProps, TypographyProps } from '../types/base-props.ts';
import { buildElement, ColorToken } from '../utils/prop-utils.ts';
import { typography } from '../tokens/design-tokens.ts';

export interface TextProps extends BaseProps, TypographyProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'bold';
  color?: ColorToken;
  children: string;
  align?: 'left' | 'center' | 'right' | 'justify';
}

export function Text({ 
  size = 'md', 
  weight = 'normal', 
  color = 'inherit', 
  align = 'left',
  children,
  ...props 
}: TextProps): string {
  const fontSize = typography.size[size] || typography.size.md;
  const fontWeight = typography.weight[weight] || typography.weight.normal;
  
  const additionalStyles = `
    font-size: ${fontSize};
    font-weight: ${fontWeight};
    text-align: ${align};
  `;
  
  // Handle color properly through prop system
  const textProps = {
    color: color,
    ...props
  };
  
  return buildElement('span', textProps, children, additionalStyles);
}

export interface HeadingProps extends BaseProps, TypographyProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  children: string;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
}

export function Heading({ 
  level = 1, 
  size, 
  color = 'inherit',
  align = 'left',
  children,
  ...props 
}: HeadingProps): string {
  // Auto-size based on level if size not provided
  const defaultSizes = ['3xl', '2xl', 'xl', 'lg', 'md', 'sm'] as const;
  const actualSize = size || defaultSizes[level - 1];
  
  const fontSize = typography.size[actualSize as keyof typeof typography.size] || typography.size.lg;
  
  const additionalStyles = `
    font-size: ${fontSize};
    font-weight: 700;
    margin: 0;
    line-height: 1.25;
    text-align: ${align};
  `;
  
  const headingProps = {
    color: color,
    ...props
  };
  
  return buildElement(`h${level}`, headingProps, children, additionalStyles);
}

export interface ListProps<T = any> extends BaseProps {
  items: T[];
  renderItem?: (item: T, index: number) => string;
  virtualize?: boolean;
  ordered?: boolean;
  spacing?: 'compact' | 'comfortable' | 'spacious';
}

export function List<T>({ 
  items, 
  renderItem, 
  virtualize = false,
  ordered = false,
  spacing = 'comfortable',
  ...props 
}: ListProps<T>): string {
  const spacingMap = {
    compact: '0.25rem',
    comfortable: '0.5rem', 
    spacious: '1rem'
  };
  
  const itemSpacing = spacingMap[spacing];
  
  if (virtualize && items.length > 100) {
    const additionalStyles = `
      height: 400px;
      overflow-y: auto;
    `;
    
    const content = `
      <div style="height: ${items.length * 40}px; position: relative;">
        <!-- Virtual scrolling would be implemented here -->
        ${items.slice(0, 20).map((item, index) => 
          renderItem ? renderItem(item, index) : `<div style="padding: ${itemSpacing}; border-bottom: 1px solid #e5e7eb;">${String(item)}</div>`
        ).join('')}
      </div>
    `;
    
    return buildElement('div', { 'data-virtualized': 'true', ...props }, content, additionalStyles);
  }
  
  const content = items.map((item, index) => 
    renderItem ? renderItem(item, index) : `<${ordered ? 'li' : 'div'} style="padding: ${itemSpacing}; ${!ordered ? 'border-bottom: 1px solid #e5e7eb;' : ''}">${String(item)}</${ordered ? 'li' : 'div'}>`
  ).join('');
  
  const tagName = ordered ? 'ol' : 'div';
  const additionalStyles = ordered ? 'padding-left: 1.5rem;' : '';
  
  return buildElement(tagName, props, content, additionalStyles);
}

export interface TableProps extends BaseProps {
  data: Record<string, any>[];
  columns: { key: string; label: string; width?: string; align?: 'left' | 'center' | 'right' }[];
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
}

export function Table({ 
  data, 
  columns, 
  striped = false,
  hoverable = false,
  compact = false,
  ...props 
}: TableProps): string {
  const padding = compact ? '0.5rem' : '0.75rem';
  
  const tableStyles = `
    width: 100%;
    border-collapse: collapse;
  `;
  
  const hoverStyles = hoverable ? `
    <style>
      .table-row:hover {
        background-color: #f9fafb;
      }
    </style>
  ` : '';
  
  const content = `
    ${hoverStyles}
    <thead>
      <tr style="background-color: #f9fafb;">
        ${columns.map(col => `
          <th style="
            padding: ${padding};
            text-align: ${col.align || 'left'};
            font-weight: 600;
            border-bottom: 2px solid #e5e7eb;
            ${col.width ? `width: ${col.width};` : ''}
          ">
            ${col.label}
          </th>
        `).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map((row, index) => `
        <tr class="${hoverable ? 'table-row' : ''}" style="
          border-bottom: 1px solid #e5e7eb;
          ${striped && index % 2 === 1 ? 'background-color: #f9fafb;' : ''}
        ">
          ${columns.map(col => `
            <td style="
              padding: ${padding};
              text-align: ${col.align || 'left'};
            ">
              ${row[col.key] || ''}
            </td>
          `).join('')}
        </tr>
      `).join('')}
    </tbody>
  `;
  
  return buildElement('table', props, content, tableStyles);
}

export interface StatProps extends BaseProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right';
}

export function Stat({ 
  label, 
  value, 
  change, 
  changeType = 'neutral',
  size = 'md',
  align = 'center',
  ...props 
}: StatProps): string {
  const changeColor = {
    positive: '#10b981',
    negative: '#ef4444', 
    neutral: '#6b7280'
  }[changeType];
  
  const sizeMap = {
    sm: { value: '1.5rem', label: '0.75rem', change: '0.625rem' },
    md: { value: '2rem', label: '0.875rem', change: '0.75rem' },
    lg: { value: '2.5rem', label: '1rem', change: '0.875rem' }
  };
  
  const sizes = sizeMap[size];
  
  const content = `
    <div style="
      font-size: ${sizes.label};
      color: #6b7280;
      margin-bottom: 0.5rem;
      text-align: ${align};
    ">
      ${label}
    </div>
    <div style="
      font-size: ${sizes.value};
      font-weight: 700;
      margin-bottom: 0.25rem;
      text-align: ${align};
    ">
      ${value}
    </div>
    ${change ? `
      <div style="
        font-size: ${sizes.change};
        color: ${changeColor};
        text-align: ${align};
      ">
        ${change}
      </div>
    ` : ''}
  `;
  
  const defaultProps = {
    p: props.p ?? 6,
    ...props
  };
  
  return buildElement('div', defaultProps, content);
}

export interface ImageProps extends BaseProps {
  src: string;
  alt: string;
  width?: string;
  height?: string;
  lazy?: boolean;
  fit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'full';
  aspect?: '1:1' | '4:3' | '16:9' | '3:2';
}

export function Image({ 
  src, 
  alt, 
  width, 
  height, 
  lazy = true,
  fit = 'cover',
  rounded = false,
  aspect,
  ...props 
}: ImageProps): string {
  const aspectRatios = {
    '1:1': '1 / 1',
    '4:3': '4 / 3',
    '16:9': '16 / 9',
    '3:2': '3 / 2'
  };
  
  const roundedMap = {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    full: '50%'
  };
  
  const borderRadius = rounded === true ? '0.5rem' : 
                      typeof rounded === 'string' ? roundedMap[rounded] : '0';
  
  const additionalStyles = `
    max-width: 100%;
    height: auto;
    object-fit: ${fit};
    border-radius: ${borderRadius};
    ${aspect ? `aspect-ratio: ${aspectRatios[aspect]};` : ''}
  `;
  
  const imgAttributes = {
    src,
    alt,
    ...(width && { width }),
    ...(height && { height }),
    ...(lazy && { loading: 'lazy' })
  };
  
  return buildElement('img', { ...imgAttributes, ...props }, '', additionalStyles);
}

export interface BadgeProps extends BaseProps {
  children: string;
  color?: ColorToken;
  bg?: ColorToken;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'subtle';
  rounded?: boolean | 'full';
}

export function Badge({ 
  children, 
  color, 
  bg = 'gray.100', 
  size = 'md',
  variant = 'solid',
  rounded = 'full',
  ...props
}: BadgeProps): string {
  const sizeMap = {
    sm: { fontSize: '0.625rem', padding: '0.125rem 0.5rem' },
    md: { fontSize: '0.75rem', padding: '0.25rem 0.75rem' },
    lg: { fontSize: '0.875rem', padding: '0.375rem 1rem' }
  };
  
  const { fontSize, padding } = sizeMap[size];
  
  const borderRadius = rounded === 'full' ? '1rem' : 
                      rounded === true ? '0.5rem' : '0.25rem';
  
  let additionalStyles = `
    display: inline-block;
    padding: ${padding};
    border-radius: ${borderRadius};
    font-size: ${fontSize};
    font-weight: 500;
    text-transform: capitalize;
    line-height: 1;
    white-space: nowrap;
  `;
  
  // Handle variant-specific styling
  if (variant === 'outline') {
    additionalStyles += `
      border: 1px solid currentColor;
      background: transparent;
    `;
  } else if (variant === 'subtle') {
    additionalStyles += `
      opacity: 0.8;
    `;
  }
  
  const badgeProps = {
    bg: variant === 'outline' ? 'transparent' : bg,
    color: color,
    ...props
  };
  
  return buildElement('span', badgeProps, children, additionalStyles);
}