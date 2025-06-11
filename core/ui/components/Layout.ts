// Layout component definitions for the constrained UI system

import { LayoutProps, BaseProps } from '../types/base-props.ts';
import { processAllProps, buildElement, generateResponsiveCSS } from '../utils/prop-utils.ts';

export interface StackProps extends BaseProps, LayoutProps {
  direction?: 'vertical' | 'horizontal';
  children: string;
}

export function Stack({ 
  direction = 'vertical', 
  gap = 4,
  align = 'stretch',
  children,
  ...props 
}: StackProps): string {
  const flexDirection = direction === 'vertical' ? 'column' : 'row';
  const alignItems = align === 'stretch' ? 'stretch' : 
                    align === 'center' ? 'center' :
                    align === 'end' ? 'flex-end' : 'flex-start';
  
  const additionalStyles = `
    display: flex;
    flex-direction: ${flexDirection};
    align-items: ${alignItems};
  `;

  return buildElement('div', { gap, ...props }, children, additionalStyles);
}

export interface GridProps extends BaseProps, LayoutProps {
  children: string;
}

export function Grid({ 
  cols = 1, 
  gap = 4, 
  children,
  ...props 
}: GridProps): string {
  const columns = Array.isArray(cols) ? cols[0] : cols; // Simplified for now
  
  const additionalStyles = `
    display: grid;
    grid-template-columns: repeat(${columns}, 1fr);
  `;

  return buildElement('div', { gap, ...props }, children, additionalStyles);
}

export interface SplitProps extends BaseProps {
  side?: 'left' | 'right';
  sideWidth?: string | string[];
  children: [string, string]; // [sidebar, main]
}

export function Split({ 
  side = 'left', 
  sideWidth = '250px', 
  children,
  ...props 
}: SplitProps): string {
  const width = Array.isArray(sideWidth) ? sideWidth[0] : sideWidth;
  const [sidebar, main] = children;
  
  const additionalStyles = `
    display: flex;
    height: 100%;
  `;
  
  const sidebarStyles = `width: ${width}; flex-shrink: 0;`;
  const mainStyles = `flex: 1;`;
  
  const content = side === 'left' ? 
    `<div style="${sidebarStyles}">${sidebar}</div><div style="${mainStyles}">${main}</div>` :
    `<div style="${mainStyles}">${main}</div><div style="${sidebarStyles}">${sidebar}</div>`;

  return buildElement('div', props, content, additionalStyles);
}

export interface CenterProps extends BaseProps {
  maxWidth?: string;
  children: string;
}

export function Center({ 
  maxWidth = '1200px', 
  children,
  ...props 
}: CenterProps): string {
  const additionalStyles = `
    max-width: ${maxWidth};
    margin: 0 auto;
    padding: 0 1rem;
  `;

  return buildElement('div', props, children, additionalStyles);
}

export interface PageProps {
  title: string;
  children: string;
  appName?: string;
  scripts?: string;
  styles?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export function Page(props: PageProps): string {
  
  return `<!DOCTYPE html>
<html data-theme="${props.theme || 'light'}">
<head>
  <title>${props.title}${props.appName ? ` - ${props.appName}` : ''}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --max-width: 1200px;
      --padding: 2rem;
      --line-height: 1.6;
      --bg-color: #f9fafb;
      --text-color: #111827;
    }
    
    [data-theme="dark"] {
      --bg-color: #111827;
      --text-color: #f9fafb;
    }
    
    body { 
      font-family: var(--font-family);
      max-width: var(--max-width); 
      margin: 0 auto; 
      padding: var(--padding); 
      line-height: var(--line-height);
      background-color: var(--bg-color);
      color: var(--text-color);
    }
    
    .error { 
      color: #dc3545; 
      padding: 1rem; 
      background: #f8d7da; 
      border-radius: 4px; 
    }
    
    .success {
      color: #155724;
      padding: 1rem;
      background: #d4edda;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    
    /* Constrained component system utilities */
    ${generateResponsiveCSS()}
    
    ${props.styles || ''}
  </style>
</head>
<body>
  ${props.children}
  ${props.scripts || ''}
</body>
</html>`;
}