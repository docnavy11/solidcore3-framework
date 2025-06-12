// Developer debugging tools and code inspection utilities
import { AppDefinition } from '../types/index.ts';
import { logger } from '../logging/logger.ts';
import { TruthFileValidator } from '../validators/truth-validator.ts';
import { DevelopmentValidator } from '../validation/development-validator.ts';

export interface DebugInfo {
  app: {
    name: string;
    version?: string;
    entityCount: number;
    viewCount: number;
    workflowCount: number;
  };
  entities: EntityDebugInfo[];
  views: ViewDebugInfo[];
  workflows: WorkflowDebugInfo[];
  validation: {
    isValid: boolean;
    errorCount: number;
    warningCount: number;
    tipCount: number;
  };
  performance: {
    complexEntities: string[];
    missingIndexes: string[];
    inefficientViews: string[];
  };
  security: {
    unprotectedEntities: string[];
    publicOperations: string[];
    missingAuthentication: string[];
  };
  statistics: AppStatistics;
}

export interface EntityDebugInfo {
  name: string;
  fieldCount: number;
  relationCount: number;
  behaviorCount: number;
  hasPermissions: boolean;
  hasTimestamps: boolean;
  complexity: 'low' | 'medium' | 'high';
  fields: FieldDebugInfo[];
  relations: RelationDebugInfo[];
  permissions?: PermissionDebugInfo;
}

export interface FieldDebugInfo {
  name: string;
  type: string;
  required: boolean;
  hasValidation: boolean;
  hasIndex: boolean;
  isUnique: boolean;
  constraints: string[];
}

export interface RelationDebugInfo {
  field: string;
  targetEntity: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  hasIndex: boolean;
  cascadeDelete: boolean;
}

export interface PermissionDebugInfo {
  create: string;
  read: string;
  update: string;
  delete: string;
  expressionComplexity: 'simple' | 'medium' | 'complex';
  usesRoles: boolean;
  usesOwnership: boolean;
}

export interface ViewDebugInfo {
  name: string;
  type: string;
  route: string;
  entityName?: string;
  hasFilters: boolean;
  hasPagination: boolean;
  complexity: 'low' | 'medium' | 'high';
}

export interface WorkflowDebugInfo {
  name: string;
  trigger: string;
  actionCount: number;
  hasCondition: boolean;
  isAsync: boolean;
  complexity: 'low' | 'medium' | 'high';
}

export interface AppStatistics {
  totalFields: number;
  totalRelations: number;
  totalBehaviors: number;
  averageFieldsPerEntity: number;
  mostComplexEntity: string;
  entityComplexityDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  permissionCoverage: number;
  timestampCoverage: number;
}

export class DebugTools {
  constructor(private app: AppDefinition) {}

  // Generate comprehensive debug information
  generateDebugInfo(): DebugInfo {
    const entities = this.analyzeEntities();
    const views = this.analyzeViews();
    const workflows = this.analyzeWorkflows();
    const validation = this.runValidation();
    const performance = this.analyzePerformance();
    const security = this.analyzeSecurity();
    const statistics = this.calculateStatistics(entities);

    return {
      app: {
        name: this.app.name,
        version: this.app.version,
        entityCount: Object.keys(this.app.entities).length,
        viewCount: this.app.views ? Object.keys(this.app.views).length : 0,
        workflowCount: this.app.workflows ? Object.keys(this.app.workflows).length : 0
      },
      entities,
      views,
      workflows,
      validation,
      performance,
      security,
      statistics
    };
  }

  // Generate entity-specific debug info
  inspectEntity(entityName: string): EntityDebugInfo | null {
    const entity = this.app.entities[entityName];
    if (!entity) return null;

    return this.analyzeEntity(entityName, entity);
  }

  // Generate field-specific debug info
  inspectField(entityName: string, fieldName: string): FieldDebugInfo | null {
    const entity = this.app.entities[entityName];
    if (!entity?.fields?.[fieldName]) return null;

    return this.analyzeField(fieldName, entity.fields[fieldName]);
  }

  // Validate specific components
  validateComponent(type: 'entity' | 'view' | 'workflow', name: string): any {
    switch (type) {
      case 'entity':
        return this.validateEntity(name);
      case 'view':
        return this.validateView(name);
      case 'workflow':
        return this.validateWorkflow(name);
      default:
        return { error: 'Unknown component type' };
    }
  }

  // Generate code suggestions
  generateSuggestions(): Array<{
    type: 'improvement' | 'optimization' | 'fix';
    priority: 'low' | 'medium' | 'high';
    message: string;
    location: string;
    example?: string;
  }> {
    const suggestions: any[] = [];
    
    // Analyze entities for suggestions
    for (const [entityName, entity] of Object.entries(this.app.entities)) {
      if (!entity.permissions) {
        suggestions.push({
          type: 'fix',
          priority: 'high',
          message: `Entity '${entityName}' has no permission rules`,
          location: `entities.${entityName}`,
          example: '{ create: "authenticated", read: "authenticated", update: "owner", delete: "admin" }'
        });
      }

      if (entity.fields && Object.keys(entity.fields).length > 15) {
        suggestions.push({
          type: 'improvement',
          priority: 'medium',
          message: `Entity '${entityName}' has many fields, consider splitting`,
          location: `entities.${entityName}`,
          example: 'Split into UserProfile, UserSettings, etc.'
        });
      }

      // Check for missing indexes
      if (entity.fields) {
        for (const [fieldName, field] of Object.entries(entity.fields)) {
          if ((field.type === 'relation' || field.type === 'reference') && !field.index) {
            suggestions.push({
              type: 'optimization',
              priority: 'low',
              message: `Foreign key '${fieldName}' should have an index`,
              location: `entities.${entityName}.fields.${fieldName}`,
              example: '{ type: "relation", to: "User", index: true }'
            });
          }
        }
      }
    }

    return suggestions;
  }

  // Performance analysis
  analyzeQueryComplexity(): Array<{
    entity: string;
    operation: string;
    complexity: 'low' | 'medium' | 'high';
    reason: string;
    suggestions: string[];
  }> {
    const analysis: any[] = [];

    for (const [entityName, entity] of Object.entries(this.app.entities)) {
      if (!entity.fields) continue;

      const relationCount = Object.values(entity.fields)
        .filter(field => field.type === 'relation' || field.type === 'reference').length;

      if (relationCount > 5) {
        analysis.push({
          entity: entityName,
          operation: 'list',
          complexity: 'high',
          reason: `Entity has ${relationCount} relations`,
          suggestions: [
            'Consider lazy loading for relations',
            'Implement pagination for list views',
            'Use data loader patterns to prevent N+1 queries'
          ]
        });
      }

      // Check for potential N+1 patterns in views
      if (this.app.views) {
        for (const [viewName, view] of Object.entries(this.app.views)) {
          if (view.entity === entityName && view.type === 'list' && relationCount > 3) {
            analysis.push({
              entity: entityName,
              operation: `view:${viewName}`,
              complexity: 'medium',
              reason: 'List view with multiple relations may cause N+1 queries',
              suggestions: [
                'Add explicit field selection',
                'Implement eager loading for required relations',
                'Consider using database joins'
              ]
            });
          }
        }
      }
    }

    return analysis;
  }

  // Generate development server endpoints for debugging
  getDebugEndpoints(): Array<{
    path: string;
    method: string;
    description: string;
    example: string;
  }> {
    return [
      {
        path: '/api/_debug',
        method: 'GET',
        description: 'Get comprehensive debug information',
        example: 'curl http://localhost:8000/api/_debug'
      },
      {
        path: '/api/_debug/entity/:name',
        method: 'GET',
        description: 'Inspect specific entity',
        example: 'curl http://localhost:8000/api/_debug/entity/Task'
      },
      {
        path: '/api/_debug/validate',
        method: 'GET',
        description: 'Run validation and get detailed results',
        example: 'curl http://localhost:8000/api/_debug/validate'
      },
      {
        path: '/api/_debug/performance',
        method: 'GET',
        description: 'Get performance analysis',
        example: 'curl http://localhost:8000/api/_debug/performance'
      },
      {
        path: '/api/_debug/suggestions',
        method: 'GET',
        description: 'Get improvement suggestions',
        example: 'curl http://localhost:8000/api/_debug/suggestions'
      },
      {
        path: '/api/_debug/reload',
        method: 'POST',
        description: 'Force reload truth file',
        example: 'curl -X POST http://localhost:8000/api/_debug/reload'
      }
    ];
  }

  private analyzeEntities(): EntityDebugInfo[] {
    return Object.entries(this.app.entities).map(([name, entity]) => 
      this.analyzeEntity(name, entity)
    );
  }

  private analyzeEntity(name: string, entity: any): EntityDebugInfo {
    const fields = entity.fields ? Object.entries(entity.fields) : [];
    const relations = fields.filter(([_, field]) => 
      field.type === 'relation' || field.type === 'reference'
    );
    const behaviors = entity.behaviors ? Object.keys(entity.behaviors) : [];

    const fieldCount = fields.length;
    const complexity = fieldCount > 15 ? 'high' : fieldCount > 8 ? 'medium' : 'low';

    const fieldNames = fields.map(([name]) => name.toLowerCase());
    const hasTimestamps = fieldNames.some(name => name.includes('created')) &&
                         fieldNames.some(name => name.includes('updated'));

    return {
      name,
      fieldCount,
      relationCount: relations.length,
      behaviorCount: behaviors.length,
      hasPermissions: !!entity.permissions,
      hasTimestamps,
      complexity,
      fields: fields.map(([fieldName, field]) => this.analyzeField(fieldName, field)),
      relations: relations.map(([fieldName, field]) => this.analyzeRelation(fieldName, field)),
      permissions: entity.permissions ? this.analyzePermissions(entity.permissions) : undefined
    };
  }

  private analyzeField(name: string, field: any): FieldDebugInfo {
    const constraints: string[] = [];
    
    if (field.minLength) constraints.push(`minLength: ${field.minLength}`);
    if (field.maxLength) constraints.push(`maxLength: ${field.maxLength}`);
    if (field.min) constraints.push(`min: ${field.min}`);
    if (field.max) constraints.push(`max: ${field.max}`);
    if (field.pattern) constraints.push(`pattern: ${field.pattern}`);
    if (field.options) constraints.push(`options: ${field.options.length} choices`);

    return {
      name,
      type: field.type,
      required: !!field.required,
      hasValidation: constraints.length > 0,
      hasIndex: !!field.index,
      isUnique: !!field.unique,
      constraints
    };
  }

  private analyzeRelation(fieldName: string, field: any): RelationDebugInfo {
    return {
      field: fieldName,
      targetEntity: field.to || field.entity || 'unknown',
      type: this.determineRelationType(field),
      hasIndex: !!field.index,
      cascadeDelete: !!field.cascadeDelete
    };
  }

  private determineRelationType(field: any): RelationDebugInfo['type'] {
    if (field.many) return 'one-to-many';
    if (field.unique) return 'one-to-one';
    return 'many-to-one'; // Default
  }

  private analyzePermissions(permissions: any): PermissionDebugInfo {
    const expressions = Object.values(permissions).filter(Boolean) as string[];
    const complexity = this.calculateExpressionComplexity(expressions);
    
    const usesRoles = expressions.some(expr => 
      typeof expr === 'string' && expr.includes('role')
    );
    const usesOwnership = expressions.some(expr => 
      typeof expr === 'string' && (expr.includes('owner') || expr.includes('entity.'))
    );

    return {
      create: permissions.create || 'undefined',
      read: permissions.read || 'undefined',
      update: permissions.update || 'undefined',
      delete: permissions.delete || 'undefined',
      expressionComplexity: complexity,
      usesRoles,
      usesOwnership
    };
  }

  private calculateExpressionComplexity(expressions: string[]): 'simple' | 'medium' | 'complex' {
    const totalLength = expressions.join(' ').length;
    const hasComplexLogic = expressions.some(expr => 
      expr.includes('&&') || expr.includes('||') || expr.includes('(')
    );

    if (totalLength > 100 || hasComplexLogic) return 'complex';
    if (totalLength > 50) return 'medium';
    return 'simple';
  }

  private analyzeViews(): ViewDebugInfo[] {
    if (!this.app.views) return [];

    return Object.entries(this.app.views).map(([name, view]) => ({
      name,
      type: view.type,
      route: view.route,
      entityName: view.entity,
      hasFilters: !!(view.filter || view.where),
      hasPagination: !!(view.limit || view.pagination),
      complexity: this.calculateViewComplexity(view)
    }));
  }

  private calculateViewComplexity(view: any): 'low' | 'medium' | 'high' {
    let score = 0;
    
    if (view.filter || view.where) score += 1;
    if (view.sort || view.orderBy) score += 1;
    if (view.includes || view.relations) score += 2;
    if (view.custom || view.template) score += 2;
    
    return score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low';
  }

  private analyzeWorkflows(): WorkflowDebugInfo[] {
    if (!this.app.workflows) return [];

    return Object.entries(this.app.workflows).map(([name, workflow]) => ({
      name,
      trigger: workflow.trigger,
      actionCount: workflow.actions ? workflow.actions.length : 0,
      hasCondition: !!workflow.condition,
      isAsync: !!workflow.async,
      complexity: this.calculateWorkflowComplexity(workflow)
    }));
  }

  private calculateWorkflowComplexity(workflow: any): 'low' | 'medium' | 'high' {
    const actionCount = workflow.actions ? workflow.actions.length : 0;
    const hasCondition = !!workflow.condition;
    const hasComplexActions = workflow.actions?.some((action: any) => 
      typeof action === 'object' && action.type
    );

    if (actionCount > 5 || hasComplexActions) return 'high';
    if (actionCount > 2 || hasCondition) return 'medium';
    return 'low';
  }

  private runValidation(): DebugInfo['validation'] {
    const validator = new TruthFileValidator();
    const result = validator.validate(this.app);
    
    const devValidator = new DevelopmentValidator();
    const devResult = devValidator.validate(this.app);

    return {
      isValid: result.isValid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      tipCount: devResult.developmentTips.length
    };
  }

  private analyzePerformance(): DebugInfo['performance'] {
    const complexEntities: string[] = [];
    const missingIndexes: string[] = [];
    const inefficientViews: string[] = [];

    // Find complex entities
    for (const [entityName, entity] of Object.entries(this.app.entities)) {
      if (entity.fields && Object.keys(entity.fields).length > 15) {
        complexEntities.push(entityName);
      }

      // Find missing indexes
      if (entity.fields) {
        for (const [fieldName, field] of Object.entries(entity.fields)) {
          if ((field.type === 'relation' || field.type === 'reference') && !field.index) {
            missingIndexes.push(`${entityName}.${fieldName}`);
          }
        }
      }
    }

    // Find inefficient views
    if (this.app.views) {
      for (const [viewName, view] of Object.entries(this.app.views)) {
        if (view.type === 'list' && !view.filter && !view.limit) {
          inefficientViews.push(viewName);
        }
      }
    }

    return {
      complexEntities,
      missingIndexes,
      inefficientViews
    };
  }

  private analyzeSecurity(): DebugInfo['security'] {
    const unprotectedEntities: string[] = [];
    const publicOperations: string[] = [];
    const missingAuthentication: string[] = [];

    for (const [entityName, entity] of Object.entries(this.app.entities)) {
      if (!entity.permissions) {
        unprotectedEntities.push(entityName);
      } else {
        // Check for overly permissive operations
        for (const [operation, permission] of Object.entries(entity.permissions)) {
          if (permission === 'public' || permission === true) {
            publicOperations.push(`${entityName}.${operation}`);
          }
          
          if (operation === 'delete' && permission === 'authenticated') {
            missingAuthentication.push(`${entityName}.delete (too permissive)`);
          }
        }
      }
    }

    return {
      unprotectedEntities,
      publicOperations,
      missingAuthentication
    };
  }

  private calculateStatistics(entities: EntityDebugInfo[]): AppStatistics {
    const totalFields = entities.reduce((sum, entity) => sum + entity.fieldCount, 0);
    const totalRelations = entities.reduce((sum, entity) => sum + entity.relationCount, 0);
    const totalBehaviors = entities.reduce((sum, entity) => sum + entity.behaviorCount, 0);
    
    const averageFieldsPerEntity = entities.length > 0 ? totalFields / entities.length : 0;
    
    const mostComplexEntity = entities.reduce((max, entity) => 
      entity.fieldCount > (max?.fieldCount || 0) ? entity : max, entities[0]
    );

    const complexityDistribution = entities.reduce((dist, entity) => {
      dist[entity.complexity]++;
      return dist;
    }, { low: 0, medium: 0, high: 0 });

    const entitiesWithPermissions = entities.filter(e => e.hasPermissions).length;
    const permissionCoverage = entities.length > 0 ? (entitiesWithPermissions / entities.length) * 100 : 0;

    const entitiesWithTimestamps = entities.filter(e => e.hasTimestamps).length;
    const timestampCoverage = entities.length > 0 ? (entitiesWithTimestamps / entities.length) * 100 : 0;

    return {
      totalFields,
      totalRelations,
      totalBehaviors,
      averageFieldsPerEntity: Math.round(averageFieldsPerEntity * 10) / 10,
      mostComplexEntity: mostComplexEntity?.name || 'none',
      entityComplexityDistribution: complexityDistribution,
      permissionCoverage: Math.round(permissionCoverage),
      timestampCoverage: Math.round(timestampCoverage)
    };
  }

  private validateEntity(entityName: string): any {
    const entity = this.app.entities[entityName];
    if (!entity) return { error: 'Entity not found' };

    // Run entity-specific validation
    // This would integrate with the existing validators
    return { valid: true, entity: this.analyzeEntity(entityName, entity) };
  }

  private validateView(viewName: string): any {
    if (!this.app.views) return { error: 'No views defined' };
    
    const view = this.app.views[viewName];
    if (!view) return { error: 'View not found' };

    // Run view-specific validation
    return { valid: true, view: this.analyzeViews().find(v => v.name === viewName) };
  }

  private validateWorkflow(workflowName: string): any {
    if (!this.app.workflows) return { error: 'No workflows defined' };
    
    const workflow = this.app.workflows[workflowName];
    if (!workflow) return { error: 'Workflow not found' };

    // Run workflow-specific validation
    return { valid: true, workflow: this.analyzeWorkflows().find(w => w.name === workflowName) };
  }
}