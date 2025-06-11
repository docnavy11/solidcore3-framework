import { TemplateContext } from './template-loader.ts';
import { Heading, Text, Card, Button } from '../components/index.ts';

/**
 * Core system template for About pages
 * This is a TypeScript template that can use the full component system
 */
export default function aboutTemplate(context: TemplateContext): string {
  const { app, view } = context;
  
  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 2rem;">
      ${Heading({ level: 1, children: `About ${app.name}` })}
      
      <div style="margin: 2rem 0;">
        ${Text({ 
          children: `Welcome to ${app.name}, a powerful application built with the Solidcore3 framework.`,
          size: 'lg'
        })}
      </div>
      
      ${Card({
        children: `
          ${Heading({ level: 2, children: 'Features' })}
          <ul style="margin: 1rem 0; padding-left: 1.5rem;">
            <li style="margin: 0.5rem 0;">Modern declarative web framework</li>
            <li style="margin: 0.5rem 0;">AI-first development approach</li>
            <li style="margin: 0.5rem 0;">Real-time hot reload</li>
            <li style="margin: 0.5rem 0;">Constrained component system</li>
            <li style="margin: 0.5rem 0;">Edge-ready deployment</li>
          </ul>
        `,
        p: 4,
        m: [4, 0]
      })}
      
      ${Card({
        children: `
          ${Heading({ level: 2, children: 'Technology Stack' })}
          <div style="margin: 1rem 0;">
            <div style="margin: 0.5rem 0;"><strong>Framework:</strong> Solidcore3 Runtime Engine</div>
            <div style="margin: 0.5rem 0;"><strong>Runtime:</strong> Deno with TypeScript</div>
            <div style="margin: 0.5rem 0;"><strong>Database:</strong> SQLite</div>
            <div style="margin: 0.5rem 0;"><strong>UI:</strong> Constrained Component System</div>
            <div style="margin: 0.5rem 0;"><strong>Hot Reload:</strong> File watching enabled</div>
          </div>
        `,
        p: 4,
        m: [4, 0]
      })}
      
      <div style="margin: 3rem 0; text-align: center;">
        ${Button({ 
          children: 'Back to Home',
          variant: 'primary',
          onClick: "window.location.href='/'"
        })}
      </div>
    </div>
  `;
}