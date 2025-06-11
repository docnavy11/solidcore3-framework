import { TemplateContext } from '../../core/ui/templates/template-loader.ts';
import { Heading, Text, Card, Button } from '../../core/ui/components/index.ts';

/**
 * App-specific About page template
 * This overrides the core about template with TaskManager-specific content
 */
export default function taskManagerAboutTemplate(context: TemplateContext): string {
  const { app, view } = context;
  
  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 2rem;">
      ${Heading({ level: 1, children: `About ${app.name}` })}
      
      <div style="margin: 2rem 0;">
        ${Text({ 
          children: 'TaskManager is a powerful task management application built with the Solidcore3 framework. Organize your work, track progress, and boost productivity.',
          size: 'lg'
        })}
      </div>
      
      ${Card({
        children: `
          ${Heading({ level: 2, children: 'Task Management Features' })}
          <ul style="margin: 1rem 0; padding-left: 1.5rem;">
            <li style="margin: 0.5rem 0;">✅ Create and manage tasks with priorities</li>
            <li style="margin: 0.5rem 0;">📊 Track task status (todo, in-progress, done, archived)</li>
            <li style="margin: 0.5rem 0;">📅 Set due dates for better planning</li>
            <li style="margin: 0.5rem 0;">🔧 Complete CRUD operations</li>
            <li style="margin: 0.5rem 0;">⚡ Real-time updates with hot reload</li>
            <li style="margin: 0.5rem 0;">🎨 Modern, clean interface</li>
          </ul>
        `,
        p: 4,
        m: [4, 0]
      })}
      
      ${Card({
        children: `
          ${Heading({ level: 2, children: 'How to Use TaskManager' })}
          <div style="margin: 1rem 0;">
            <div style="margin: 0.5rem 0;"><strong>1. Create Tasks:</strong> Click "Create New" to add tasks</div>
            <div style="margin: 0.5rem 0;"><strong>2. Set Priorities:</strong> Choose high, medium, or low priority</div>
            <div style="margin: 0.5rem 0;"><strong>3. Track Progress:</strong> Update status as you work</div>
            <div style="margin: 0.5rem 0;"><strong>4. Set Deadlines:</strong> Add due dates to stay organized</div>
            <div style="margin: 0.5rem 0;"><strong>5. Edit & Delete:</strong> Manage your tasks easily</div>
          </div>
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
      
      <div style="margin: 3rem 0; text-align: center; display: flex; gap: 1rem; justify-content: center;">
        ${Button({ 
          children: 'View Tasks',
          variant: 'primary',
          onClick: "window.location.href='/tasks'"
        })}
        ${Button({ 
          children: 'Create New Task',
          variant: 'secondary',
          onClick: "window.location.href='/tasks/new'"
        })}
        ${view.title ? `<!-- Template for: ${view.title} -->` : ''}
      </div>
    </div>
  `;
}