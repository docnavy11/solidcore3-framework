/**
 * Template Interpolation Engine for Workflow Actions
 * 
 * Provides ${variable} syntax support for workflow action parameters,
 * enabling dynamic content based on event context.
 */

export interface TemplateContext {
  entity: string;
  entityId: string;
  behavior?: string;
  data: Record<string, any>;
  timestamp: string;
  user?: string;
  [key: string]: any;
}

export class TemplateEngine {
  /**
   * Interpolate template strings with context data
   * Supports ${variable} and ${object.property} syntax
   */
  static interpolate(template: string, context: TemplateContext): string {
    if (typeof template !== 'string') {
      return String(template);
    }

    return template.replace(/\$\{([^}]+)\}/g, (match, path) => {
      try {
        const value = this.getValueByPath(context, path.trim());
        
        // Handle undefined/null values gracefully
        if (value === undefined || value === null) {
          console.warn(`Template variable not found: ${path}`);
          return match; // Keep original ${variable} if not found
        }
        
        return String(value);
      } catch (error) {
        console.error(`Error interpolating template variable '${path}':`, error);
        return match; // Keep original on error
      }
    });
  }

  /**
   * Recursively interpolate all string values in an object
   * Useful for processing entire workflow action objects
   */
  static interpolateObject(obj: any, context: TemplateContext): any {
    if (typeof obj === 'string') {
      return this.interpolate(obj, context);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObject(item, context));
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObject(value, context);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Get value from object using dot notation path
   * Supports: data.title, user.name, data.metadata.tags[0], etc.
   */
  private static getValueByPath(obj: any, path: string): any {
    // Handle simple property access first
    if (!path.includes('.') && !path.includes('[')) {
      return obj[path];
    }

    // Split on dots and handle array access
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      // Handle array access like "tags[0]"
      if (part.includes('[') && part.includes(']')) {
        const [propName, indexPart] = part.split('[');
        const index = parseInt(indexPart.replace(']', ''), 10);
        
        current = current[propName];
        if (Array.isArray(current) && !isNaN(index)) {
          current = current[index];
        } else {
          return undefined;
        }
      } else {
        current = current[part];
      }
    }

    return current;
  }

  /**
   * Validate template syntax without interpolating
   * Returns array of variable names found in template
   */
  static extractVariables(template: string): string[] {
    if (typeof template !== 'string') {
      return [];
    }

    const variables: string[] = [];
    const regex = /\$\{([^}]+)\}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
      variables.push(match[1].trim());
    }

    return variables;
  }

  /**
   * Check if a template has valid syntax
   * Returns validation result with errors if any
   */
  static validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof template !== 'string') {
      return { valid: true, errors: [] };
    }

    // Check for unclosed template variables
    const openBraces = (template.match(/\$\{/g) || []).length;
    const closeBraces = (template.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push('Mismatched template braces: ${...}');
    }

    // Check for empty variables
    const emptyVars = template.match(/\$\{\s*\}/g);
    if (emptyVars) {
      errors.push('Empty template variables found: ${}');
    }

    // Check for nested template variables (not supported)
    const nestedVars = template.match(/\$\{[^}]*\$\{[^}]*\}/g);
    if (nestedVars) {
      errors.push('Nested template variables not supported');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a safe context for template interpolation
   * Adds helper functions and sanitizes input
   */
  static createSafeContext(eventData: any): TemplateContext {
    const safeContext: TemplateContext = {
      entity: eventData.entity || '',
      entityId: eventData.entityId || '',
      behavior: eventData.behavior,
      data: eventData.data || {},
      timestamp: eventData.timestamp || new Date().toISOString(),
      user: eventData.user || 'system',
      
      // Helper functions available in templates
      now: new Date().toISOString(),
      date: eventData.timestamp ? new Date(eventData.timestamp).toLocaleDateString() : '',
      time: eventData.timestamp ? new Date(eventData.timestamp).toLocaleTimeString() : '',
      
      // Computed values
      entityType: eventData.entity?.toLowerCase() || '',
      actionType: eventData.behavior ? `${eventData.entity}.${eventData.behavior}` : `${eventData.entity}.updated`
    };

    return safeContext;
  }

  /**
   * Process workflow action with template interpolation
   * Main entry point for workflow execution
   */
  static processWorkflowAction(action: any, eventData: any): any {
    const context = this.createSafeContext(eventData);
    return this.interpolateObject(action, context);
  }
}

/**
 * Helper function for quick template interpolation
 * Used when you just need to process a single string
 */
export function interpolateTemplate(template: string, context: TemplateContext): string {
  return TemplateEngine.interpolate(template, context);
}

/**
 * Helper function to process workflow actions
 * Convenience wrapper for the most common use case
 */
export function processWorkflowAction(action: any, eventData: any): any {
  return TemplateEngine.processWorkflowAction(action, eventData);
}