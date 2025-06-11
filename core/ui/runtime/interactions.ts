// Minimal client-side interactivity runtime
// Handles common interactions without complex frameworks

export interface InteractionConfig {
  action?: string;           // 'complete', 'delete', 'toggle', etc.
  entity?: string;          // 'Task', 'User', etc.
  id?: string;              // Entity ID
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url?: string;             // Custom URL override
  confirm?: string;         // Confirmation message
  success?: 'reload' | 'remove' | 'hide' | 'redirect' | 'update';
  redirect?: string;        // URL to redirect to
  target?: string;          // CSS selector to update
}

// Add interaction props to Button component
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

// Generate the client-side runtime script
export function generateInteractionRuntime(): string {
  return `
    // Universal interaction handler
    document.addEventListener('click', async function(e) {
      const button = e.target.closest('[data-action]');
      if (!button) return;
      
      e.preventDefault();
      
      const config = {
        action: button.dataset.action,
        entity: button.dataset.entity,
        id: button.dataset.id,
        method: button.dataset.method || 'POST',
        url: button.dataset.url,
        confirm: button.dataset.confirm,
        success: button.dataset.success || 'reload',
        redirect: button.dataset.redirect,
        target: button.dataset.target
      };
      
      // Confirmation
      if (config.confirm && !confirm(config.confirm)) {
        return;
      }
      
      // Disable button during request
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Loading...';
      
      try {
        // Build URL
        let url = config.url;
        if (!url && config.entity && config.id && config.action) {
          url = \`/api/\${config.entity.toLowerCase()}/\${config.id}/\${config.action}\`;
        } else if (!url && config.entity && config.action) {
          url = \`/api/\${config.entity.toLowerCase()}/\${config.action}\`;
        }
        
        if (!url) {
          throw new Error('No URL specified for action');
        }
        
        // Make request
        const response = await fetch(url, {
          method: config.method,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(error.error || \`Request failed: \${response.status}\`);
        }
        
        // Handle success actions
        switch (config.success) {
          case 'reload':
            window.location.reload();
            break;
            
          case 'remove':
            const card = button.closest('.card, [data-entity]');
            if (card) {
              card.style.opacity = '0.5';
              setTimeout(() => card.remove(), 300);
            }
            break;
            
          case 'hide':
            const hideTarget = config.target ? 
              document.querySelector(config.target) : 
              button.closest('.card, [data-entity]');
            if (hideTarget) {
              hideTarget.style.display = 'none';
            }
            break;
            
          case 'redirect':
            if (config.redirect) {
              window.location.href = config.redirect;
            }
            break;
            
          case 'update':
            if (config.target) {
              const target = document.querySelector(config.target);
              if (target) {
                // Refresh the target element content
                window.location.reload(); // Simple for now
              }
            }
            break;
        }
        
      } catch (error) {
        alert('Error: ' + error.message);
        
        // Re-enable button
        button.disabled = false;
        button.textContent = originalText;
      }
    });
    
    // Form submission handler
    document.addEventListener('submit', async function(e) {
      const form = e.target;
      const action = form.dataset.action;
      if (!action) return;
      
      e.preventDefault();
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      try {
        const response = await fetch(form.action || window.location.pathname, {
          method: form.method || 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          const success = form.dataset.success || 'reload';
          if (success === 'reload') {
            window.location.reload();
          } else if (success === 'redirect' && form.dataset.redirect) {
            window.location.href = form.dataset.redirect;
          }
        } else {
          const error = await response.json().catch(() => ({ error: 'Submission failed' }));
          alert('Error: ' + (error.error || 'Submission failed'));
        }
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });
    
    // Simple toggle handler for checkboxes, etc.
    document.addEventListener('change', async function(e) {
      const input = e.target;
      const action = input.dataset.action;
      if (!action) return;
      
      const config = {
        action: action,
        entity: input.dataset.entity,
        id: input.dataset.id,
        method: input.dataset.method || 'PUT',
        field: input.name,
        value: input.type === 'checkbox' ? input.checked : input.value
      };
      
      try {
        const url = \`/api/\${config.entity.toLowerCase()}/\${config.id}\`;
        await fetch(url, {
          method: config.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            [config.field]: config.value
          })
        });
      } catch (error) {
        // Revert the change
        if (input.type === 'checkbox') {
          input.checked = !input.checked;
        }
        alert('Error: ' + error.message);
      }
    });
  `;
}

// Utility to add interaction props to any component
export function withInteraction(props: Record<string, any>, interaction: InteractionConfig): Record<string, any> {
  const interactionProps: Record<string, any> = {};
  
  if (interaction.action) interactionProps['data-action'] = interaction.action;
  if (interaction.entity) interactionProps['data-entity'] = interaction.entity;
  if (interaction.id) interactionProps['data-id'] = interaction.id;
  if (interaction.method) interactionProps['data-method'] = interaction.method;
  if (interaction.url) interactionProps['data-url'] = interaction.url;
  if (interaction.confirm) interactionProps['data-confirm'] = interaction.confirm;
  if (interaction.success) interactionProps['data-success'] = interaction.success;
  if (interaction.redirect) interactionProps['data-redirect'] = interaction.redirect;
  if (interaction.target) interactionProps['data-target'] = interaction.target;
  
  return { ...props, ...interactionProps };
}