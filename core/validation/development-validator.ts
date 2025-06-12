// Development-time validation with enhanced warnings and tips
import { AppDefinition } from '../types/index.ts';
import { ValidationResult, ValidationContext } from '../validators/types.ts';
import { logger } from '../logging/logger.ts';

export interface DevelopmentTip {
  type: 'tip' | 'warning' | 'suggestion' | 'best-practice';
  category: 'performance' | 'security' | 'maintainability' | 'usability' | 'architecture';
  message: string;
  location: string;
  suggestion: string;
  example?: string;
  documentation?: string;
  severity: 'low' | 'medium' | 'high';
}

export class DevelopmentValidator {
  private tips: DevelopmentTip[] = [];

  validate(truth: AppDefinition): ValidationResult & { developmentTips: DevelopmentTip[] } {
    this.tips = [];
    
    // Run all development-specific validations
    this.validatePerformancePatterns(truth);
    this.validateSecurityPatterns(truth);
    this.validateMaintainabilityPatterns(truth);
    this.validateUsabilityPatterns(truth);
    this.validateArchitecturePatterns(truth);
    this.validateBestPractices(truth);

    // Log tips in development
    this.logDevelopmentTips();

    return {
      isValid: true, // Development tips don't make validation fail
      errors: [],
      warnings: [],
      developmentTips: this.tips
    };
  }

  private validatePerformancePatterns(truth: AppDefinition): void {
    // Check for potential N+1 query patterns
    for (const [entityName, entity] of Object.entries(truth.entities)) {
      if (entity.fields) {
        const relationFields = Object.entries(entity.fields)
          .filter(([_, field]) => field.type === 'relation' || field.type === 'reference');

        if (relationFields.length > 5) {
          this.addTip({
            type: 'warning',
            category: 'performance',
            message: `Entity '${entityName}' has many relation fields (${relationFields.length})`,
            location: `entities.${entityName}`,
            suggestion: 'Consider using data loader patterns or pagination for related data',
            example: 'Use lazy loading: { lazy: true } or implement pagination in views',
            severity: 'medium'
          });
        }

        // Check for missing indexes on commonly queried fields
        const searchableFields = Object.entries(entity.fields)
          .filter(([_, field]) => field.type === 'string' && field.searchable);

        if (searchableFields.length > 0) {
          this.addTip({
            type: 'suggestion',
            category: 'performance',
            message: `Consider adding database indexes for searchable fields in '${entityName}'`,
            location: `entities.${entityName}.fields`,
            suggestion: 'Add index: true to frequently searched string fields',
            example: '{ type: "string", searchable: true, index: true }',
            severity: 'low'
          });
        }
      }
    }

    // Check for views without data filtering
    if (truth.views) {
      for (const [viewName, view] of Object.entries(truth.views)) {
        if (view.type === 'list' && !view.filter && !view.limit) {
          this.addTip({
            type: 'warning',
            category: 'performance',
            message: `List view '${viewName}' has no filtering or pagination`,
            location: `views.${viewName}`,
            suggestion: 'Add default filters or pagination to prevent loading large datasets',
            example: '{ filter: "status != \\"archived\\"", limit: 50 }',
            severity: 'high'
          });
        }
      }
    }
  }

  private validateSecurityPatterns(truth: AppDefinition): void {
    // Check for entities without proper permissions
    for (const [entityName, entity] of Object.entries(truth.entities)) {
      if (!entity.permissions) {
        this.addTip({
          type: 'warning',
          category: 'security',
          message: `Entity '${entityName}' has no permission rules`,
          location: `entities.${entityName}`,
          suggestion: 'Define permission rules to control access',
          example: '{ create: "authenticated", read: "authenticated", update: "owner", delete: "admin" }',
          severity: 'high'
        });
      } else {
        // Check for overly permissive rules
        if (entity.permissions.delete === 'authenticated') {
          this.addTip({
            type: 'warning',
            category: 'security',
            message: `Entity '${entityName}' allows any authenticated user to delete records`,
            location: `entities.${entityName}.permissions.delete`,
            suggestion: 'Restrict delete permissions to owners or admins',
            example: '"owner || user.role == \\"admin\\""',
            severity: 'high'
          });
        }

        // Check for missing authentication on sensitive operations
        const sensitiveOps = ['create', 'update', 'delete'];
        for (const op of sensitiveOps) {
          if (entity.permissions[op] === 'public' || entity.permissions[op] === true) {
            this.addTip({
              type: 'warning',
              category: 'security',
              message: `Entity '${entityName}' allows public ${op} operations`,
              location: `entities.${entityName}.permissions.${op}`,
              suggestion: 'Require authentication for sensitive operations',
              example: '"authenticated && (owner || user.role == \\"admin\\")"',
              severity: 'high'
            });
          }
        }
      }

      // Check for password fields without proper protection
      if (entity.fields) {
        for (const [fieldName, field] of Object.entries(entity.fields)) {
          if (fieldName.toLowerCase().includes('password') || fieldName.toLowerCase().includes('secret')) {
            if (!field.protected && !field.hashed) {
              this.addTip({
                type: 'warning',
                category: 'security',
                message: `Password field '${fieldName}' in '${entityName}' should be protected`,
                location: `entities.${entityName}.fields.${fieldName}`,
                suggestion: 'Add protection to prevent exposure in API responses',
                example: '{ type: "string", protected: true, hashed: true }',
                severity: 'high'
              });
            }
          }
        }
      }
    }
  }

  private validateMaintainabilityPatterns(truth: AppDefinition): void {
    // Check for entities with too many fields
    for (const [entityName, entity] of Object.entries(truth.entities)) {
      if (entity.fields) {
        const fieldCount = Object.keys(entity.fields).length;
        if (fieldCount > 15) {
          this.addTip({
            type: 'suggestion',
            category: 'maintainability',
            message: `Entity '${entityName}' has many fields (${fieldCount}), consider splitting`,
            location: `entities.${entityName}`,
            suggestion: 'Split large entities into related entities or use composition',
            example: 'Create separate entities for different concerns (User, UserProfile, UserSettings)',
            severity: 'medium'
          });
        }
      }
    }

    // Check for missing descriptions on custom behaviors
    for (const [entityName, entity] of Object.entries(truth.entities)) {
      if (entity.behaviors) {
        for (const [behaviorName, behavior] of Object.entries(entity.behaviors)) {
          if (behavior.type === 'custom' && !behavior.description) {
            this.addTip({
              type: 'suggestion',
              category: 'maintainability',
              message: `Custom behavior '${behaviorName}' should have a description`,
              location: `entities.${entityName}.behaviors.${behaviorName}`,
              suggestion: 'Add description to document behavior purpose',
              example: '{ description: "Marks task as complete and notifies assignee" }',
              severity: 'low'
            });
          }
        }
      }
    }

    // Check for inconsistent naming patterns
    const entityNames = Object.keys(truth.entities);
    const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/;
    const pascalCasePattern = /^[A-Z][a-zA-Z0-9]*$/;
    
    const isCamelCase = entityNames.every(name => camelCasePattern.test(name));
    const isPascalCase = entityNames.every(name => pascalCasePattern.test(name));
    
    if (!isCamelCase && !isPascalCase) {
      this.addTip({
        type: 'suggestion',
        category: 'maintainability',
        message: 'Entity names use inconsistent casing',
        location: 'entities',
        suggestion: 'Use consistent naming convention (PascalCase recommended)',
        example: 'User, TaskItem, UserProfile (not user, taskItem, user_profile)',
        severity: 'low'
      });
    }
  }

  private validateUsabilityPatterns(truth: AppDefinition): void {
    // Check for entities without list views
    const entityNames = Object.keys(truth.entities);
    const viewEntityNames = truth.views ? 
      Object.values(truth.views)
        .filter(view => view.type === 'list')
        .map(view => view.entity)
        .filter(Boolean) : [];

    for (const entityName of entityNames) {
      if (!viewEntityNames.includes(entityName) && entityName !== 'User') {
        this.addTip({
          type: 'suggestion',
          category: 'usability',
          message: `Entity '${entityName}' has no list view`,
          location: `entities.${entityName}`,
          suggestion: 'Add a list view to make entities accessible in UI',
          example: `${entityName}List: { type: "list", route: "/${entityName.toLowerCase()}s", entity: "${entityName}" }`,
          severity: 'medium'
        });
      }
    }

    // Check for forms without proper field ordering
    if (truth.views) {
      for (const [viewName, view] of Object.entries(truth.views)) {
        if (view.type === 'form' && !view.fieldOrder && !view.layout) {
          this.addTip({
            type: 'suggestion',
            category: 'usability',
            message: `Form view '${viewName}' has no field ordering`,
            location: `views.${viewName}`,
            suggestion: 'Define field order for better user experience',
            example: '{ fieldOrder: ["title", "description", "priority", "dueDate"] }',
            severity: 'low'
          });
        }
      }
    }

    // Check for missing help text on complex fields
    for (const [entityName, entity] of Object.entries(truth.entities)) {
      if (entity.fields) {
        for (const [fieldName, field] of Object.entries(entity.fields)) {
          if (field.type === 'enum' && field.options && field.options.length > 5 && !field.help) {
            this.addTip({
              type: 'suggestion',
              category: 'usability',
              message: `Enum field '${fieldName}' has many options but no help text`,
              location: `entities.${entityName}.fields.${fieldName}`,
              suggestion: 'Add help text to explain the options',
              example: '{ help: "Select the priority level - high for urgent tasks" }',
              severity: 'low'
            });
          }
        }
      }
    }
  }

  private validateArchitecturePatterns(truth: AppDefinition): void {
    // Check for circular references
    const references = new Map<string, string[]>();
    
    for (const [entityName, entity] of Object.entries(truth.entities)) {
      if (entity.fields) {
        const refs = Object.entries(entity.fields)
          .filter(([_, field]) => field.type === 'relation' || field.type === 'reference')
          .map(([_, field]) => field.to || field.entity)
          .filter(Boolean);
        
        references.set(entityName, refs);
      }
    }

    // Simple circular dependency detection
    for (const [entityA, refsA] of references) {
      for (const entityB of refsA) {
        const refsB = references.get(entityB) || [];
        if (refsB.includes(entityA)) {
          this.addTip({
            type: 'warning',
            category: 'architecture',
            message: `Circular reference detected between '${entityA}' and '${entityB}'`,
            location: `entities.${entityA}`,
            suggestion: 'Consider breaking circular dependencies with junction entities',
            example: 'Use a many-to-many relationship table or remove one direction',
            severity: 'medium'
          });
        }
      }
    }

    // Check for missing workflow definitions
    const hasBusinessLogic = Object.values(truth.entities).some(entity => 
      entity.behaviors && Object.keys(entity.behaviors).length > 0
    );

    if (hasBusinessLogic && (!truth.workflows || Object.keys(truth.workflows).length === 0)) {
      this.addTip({
        type: 'suggestion',
        category: 'architecture',
        message: 'Entities have behaviors but no workflows defined',
        location: 'workflows',
        suggestion: 'Define workflows to handle business logic and side effects',
        example: '{ onTaskComplete: { trigger: "task.completed", actions: ["notify", "updateStats"] } }',
        severity: 'medium'
      });
    }
  }

  private validateBestPractices(truth: AppDefinition): void {
    // Check for missing timestamp fields
    for (const [entityName, entity] of Object.entries(truth.entities)) {
      if (entity.fields) {
        const fieldNames = Object.keys(entity.fields).map(n => n.toLowerCase());
        
        if (!fieldNames.some(name => name.includes('created'))) {
          this.addTip({
            type: 'best-practice',
            category: 'maintainability',
            message: `Entity '${entityName}' should have a created timestamp`,
            location: `entities.${entityName}.fields`,
            suggestion: 'Add created timestamp for audit trail',
            example: '{ createdAt: { type: "date", auto: true, required: true } }',
            severity: 'low'
          });
        }

        if (!fieldNames.some(name => name.includes('updated'))) {
          this.addTip({
            type: 'best-practice',
            category: 'maintainability',
            message: `Entity '${entityName}' should have an updated timestamp`,
            location: `entities.${entityName}.fields`,
            suggestion: 'Add updated timestamp for change tracking',
            example: '{ updatedAt: { type: "date", auto: true, required: true } }',
            severity: 'low'
          });
        }
      }
    }

    // Check for missing version field on important entities
    for (const [entityName, entity] of Object.entries(truth.entities)) {
      if (entity.fields && Object.keys(entity.fields).length > 10) {
        const hasVersion = Object.keys(entity.fields).some(name => 
          name.toLowerCase().includes('version') || name.toLowerCase().includes('revision')
        );

        if (!hasVersion) {
          this.addTip({
            type: 'best-practice',
            category: 'maintainability',
            message: `Large entity '${entityName}' should consider versioning`,
            location: `entities.${entityName}.fields`,
            suggestion: 'Add version field for optimistic locking',
            example: '{ version: { type: "number", auto: true, default: 1 } }',
            severity: 'low'
          });
        }
      }
    }

    // Check for missing indexes on foreign keys
    for (const [entityName, entity] of Object.entries(truth.entities)) {
      if (entity.fields) {
        for (const [fieldName, field] of Object.entries(entity.fields)) {
          if ((field.type === 'relation' || field.type === 'reference') && !field.index) {
            this.addTip({
              type: 'best-practice',
              category: 'performance',
              message: `Foreign key '${fieldName}' should have an index`,
              location: `entities.${entityName}.fields.${fieldName}`,
              suggestion: 'Add index to foreign key fields for better query performance',
              example: '{ type: "relation", to: "User", index: true }',
              severity: 'low'
            });
          }
        }
      }
    }
  }

  private addTip(tip: DevelopmentTip): void {
    this.tips.push(tip);
  }

  private logDevelopmentTips(): void {
    const highSeverityTips = this.tips.filter(tip => tip.severity === 'high');
    const mediumSeverityTips = this.tips.filter(tip => tip.severity === 'medium');

    if (highSeverityTips.length > 0) {
      logger.warn(`Found ${highSeverityTips.length} high-priority development issues`, {
        component: 'DevelopmentValidator',
        highPriorityCount: highSeverityTips.length
      });
    }

    if (mediumSeverityTips.length > 0) {
      logger.info(`Found ${mediumSeverityTips.length} medium-priority suggestions`, {
        component: 'DevelopmentValidator',
        mediumPriorityCount: mediumSeverityTips.length
      });
    }

    // Log individual tips in debug mode
    for (const tip of this.tips.filter(t => t.severity === 'high')) {
      logger.warn(tip.message, {
        component: 'DevelopmentValidator',
        location: tip.location,
        suggestion: tip.suggestion,
        category: tip.category
      });
    }
  }

  // Helper method to get tips by category
  getTipsByCategory(category: DevelopmentTip['category']): DevelopmentTip[] {
    return this.tips.filter(tip => tip.category === category);
  }

  // Helper method to get tips by severity
  getTipsBySeverity(severity: DevelopmentTip['severity']): DevelopmentTip[] {
    return this.tips.filter(tip => tip.severity === severity);
  }

  // Generate development report
  generateReport(): string {
    if (this.tips.length === 0) {
      return '✅ No development issues found!';
    }

    let report = `\n📋 Development Report\n`;
    report += `${'='.repeat(50)}\n\n`;

    const categories = ['security', 'performance', 'maintainability', 'usability', 'architecture'] as const;
    
    for (const category of categories) {
      const categoryTips = this.getTipsByCategory(category);
      if (categoryTips.length === 0) continue;

      report += `${category.toUpperCase()}\n`;
      report += `${'-'.repeat(category.length)}\n`;

      for (const tip of categoryTips) {
        const icon = tip.severity === 'high' ? '⚠️' : tip.severity === 'medium' ? '💡' : 'ℹ️';
        report += `${icon} ${tip.message}\n`;
        report += `   Location: ${tip.location}\n`;
        report += `   Suggestion: ${tip.suggestion}\n`;
        if (tip.example) {
          report += `   Example: ${tip.example}\n`;
        }
        report += '\n';
      }
    }

    return report;
  }
}