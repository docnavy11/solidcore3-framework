import { TemplateContext } from './template-loader.ts';
import { Heading, Text, Card, Button } from '../components/index.ts';

/**
 * Core system template for Help pages
 */
export default function helpTemplate(context: TemplateContext): string {
  const { app } = context;
  
  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 2rem;">
      ${Heading({ level: 1, children: `${app.name} Help` })}
      
      <div style="margin: 2rem 0;">
        ${Text({ 
          children: 'Get help and learn how to use this application effectively.',
          size: 'lg'
        })}
      </div>
      
      ${Card({
        children: `
          ${Heading({ level: 2, children: 'Getting Started' })}
          <p>This application is built with Solidcore3, an AI-first web framework.</p>
          <p>All functionality is defined in the truth file and automatically generated.</p>
          <p>Navigate through the application using the menu and buttons provided.</p>
        `,
        p: 4,
        m: [2, 0]
      })}
      
      ${Card({
        children: `
          ${Heading({ level: 2, children: 'Features' })}
          <p>Explore the various features available in this application:</p>
          <ul style="margin: 1rem 0; padding-left: 1.5rem;">
            <li style="margin: 0.5rem 0;">Browse and manage your data</li>
            <li style="margin: 0.5rem 0;">Create and edit records</li>
            <li style="margin: 0.5rem 0;">Use filters and search</li>
            <li style="margin: 0.5rem 0;">Access detailed views</li>
          </ul>
        `,
        p: 4,
        m: [2, 0]
      })}
      
      ${Card({
        children: `
          ${Heading({ level: 2, children: 'Support' })}
          <p>If you need additional help:</p>
          <ul style="margin: 1rem 0; padding-left: 1.5rem;">
            <li style="margin: 0.5rem 0;">Check the documentation</li>
            <li style="margin: 0.5rem 0;">Contact your system administrator</li>
            <li style="margin: 0.5rem 0;">Visit the Solidcore3 community</li>
          </ul>
        `,
        p: 4,
        m: [2, 0]
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