// Truth File Analysis Engine
import { AppDefinition, EntityDefinition } from '../types/index.ts';

export interface FieldUsage {
  field: string;
  usagePoints: {
    location: string;
    context: string;
    description: string;
  }[];
  impactLevel: 'low' | 'medium' | 'high';
}

export interface EntityAnalysis {
  name: string;
  fieldCount: number;
  systemFields: string[];
  userFields: string[];
  behaviorCount: number;
  uiConfigPoints: number;
  fieldUsages: FieldUsage[];
  warnings: string[];
  suggestions: string[];
}

export interface SystemAnalysis {
  entities: EntityAnalysis[];
  views: {
    name: string;
    type: string;
    route: string;
    entity?: string;
  }[];
  workflows: {
    name: string;
    trigger: string;
    hasCondition: boolean;
    actionCount: number;
  }[];
  totalComplexity: number;
  healthScore: number;
}

export class TruthAnalyzer {
  constructor(private app: AppDefinition) {}

  /**
   * Analyze the entire application structure
   */
  analyzeSystem(): SystemAnalysis {
    const entities = Object.entries(this.app.entities || {}).map(([name, entity]) => 
      this.analyzeEntity(name, entity)
    );

    const views = Object.entries(this.app.views || {}).map(([name, view]) => ({
      name,
      type: view.type || 'unknown',
      route: view.route,
      entity: view.entity
    }));

    const workflows = Object.entries(this.app.workflows || {}).map(([name, workflow]) => ({
      name,
      trigger: workflow.trigger,
      hasCondition: !!workflow.condition,
      actionCount: workflow.actions?.length || 0
    }));

    return {
      entities,
      views,
      workflows,
      totalComplexity: this.calculateComplexity(),
      healthScore: this.calculateHealthScore(entities)
    };
  }

  /**
   * Analyze a specific entity
   */
  analyzeEntity(name: string, entity: EntityDefinition): EntityAnalysis {
    const fields = Object.keys(entity.fields || {});
    const systemFields = fields.filter(f => this.isSystemField(f, entity.fields[f]));
    const userFields = fields.filter(f => !this.isSystemField(f, entity.fields[f]));
    
    const fieldUsages = fields.map(field => this.analyzeFieldUsage(field, entity));
    const uiConfigPoints = this.countUIConfigPoints(entity);
    
    return {
      name,
      fieldCount: fields.length,
      systemFields,
      userFields,
      behaviorCount: Object.keys(entity.behaviors || {}).length,
      uiConfigPoints,
      fieldUsages,
      warnings: this.generateWarnings(entity, fieldUsages),
      suggestions: this.generateSuggestions(entity, fieldUsages)
    };
  }

  /**
   * Analyze how a specific field is used across the system
   */
  analyzeFieldUsage(fieldName: string, entity: EntityDefinition): FieldUsage {
    const usagePoints: FieldUsage['usagePoints'] = [];
    const ui = entity.ui;

    // Check display configuration
    if (ui?.display?.primary === fieldName) {
      usagePoints.push({
        location: 'ui.display.primary',
        context: 'Display Configuration',
        description: 'Main identifier text in cards and lists'
      });
    }
    if (ui?.display?.secondary === fieldName) {
      usagePoints.push({
        location: 'ui.display.secondary',
        context: 'Display Configuration', 
        description: 'Secondary text shown below primary'
      });
    }
    if (ui?.display?.badge === fieldName) {
      usagePoints.push({
        location: 'ui.display.badge',
        context: 'Display Configuration',
        description: 'Colored badge indicator'
      });
    }
    if (ui?.display?.color?.field === fieldName) {
      usagePoints.push({
        location: 'ui.display.color.field',
        context: 'Display Configuration',
        description: 'Field used for color coding'
      });
    }
    if (ui?.display?.metadata?.includes(fieldName)) {
      usagePoints.push({
        location: 'ui.display.metadata',
        context: 'Display Configuration',
        description: 'Metadata text shown at bottom'
      });
    }

    // Check list configuration
    if (ui?.list?.columns?.includes(fieldName)) {
      usagePoints.push({
        location: 'ui.list.columns',
        context: 'List View',
        description: 'Table column in list view'
      });
    }
    if (ui?.list?.filterable?.includes(fieldName)) {
      usagePoints.push({
        location: 'ui.list.filterable',
        context: 'List View',
        description: 'Filter dropdown option'
      });
    }
    if (ui?.list?.searchable?.includes(fieldName)) {
      usagePoints.push({
        location: 'ui.list.searchable',
        context: 'List View',
        description: 'Searchable field'
      });
    }

    // Check form configuration
    if (ui?.form?.fields?.includes(fieldName)) {
      usagePoints.push({
        location: 'ui.form.fields',
        context: 'Form View',
        description: 'Form input field'
      });
    }

    // Check detail sections
    ui?.detail?.sections?.forEach((section, sectionIndex) => {
      if (section.fields?.includes(fieldName)) {
        usagePoints.push({
          location: `ui.detail.sections[${sectionIndex}]`,
          context: `Detail Section: ${section.title}`,
          description: 'Field shown in detail view section'
        });
      }
    });

    // Check behaviors
    Object.entries(entity.behaviors || {}).forEach(([behaviorName, behavior]) => {
      if (behavior.fields && fieldName in behavior.fields) {
        usagePoints.push({
          location: `behaviors.${behaviorName}`,
          context: 'Behavior Action',
          description: `Updated by "${behaviorName}" action`
        });
      }
    });

    return {
      field: fieldName,
      usagePoints,
      impactLevel: this.calculateImpactLevel(usagePoints.length)
    };
  }

  /**
   * Generate visual dependency graph data
   */
  generateDependencyGraph() {
    const entities = Object.entries(this.app.entities || {});
    const nodes: any[] = [];
    const edges: any[] = [];

    entities.forEach(([entityName, entity]) => {
      // Add entity node
      nodes.push({
        id: entityName,
        type: 'entity',
        label: entityName,
        color: '#0066cc'
      });

      // Add field nodes
      Object.keys(entity.fields || {}).forEach(fieldName => {
        const fieldId = `${entityName}.${fieldName}`;
        nodes.push({
          id: fieldId,
          type: 'field',
          label: fieldName,
          parent: entityName,
          color: this.isSystemField(fieldName, entity.fields[fieldName]) ? '#6b7280' : '#10b981'
        });

        // Add usage edges
        const usage = this.analyzeFieldUsage(fieldName, entity);
        usage.usagePoints.forEach(point => {
          edges.push({
            from: fieldId,
            to: point.location,
            label: point.context,
            color: this.getImpactColor(usage.impactLevel)
          });
        });
      });
    });

    return { nodes, edges };
  }

  // Helper methods
  private isSystemField(fieldName: string, fieldDef: any): boolean {
    return fieldDef?.auto === true || ['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(fieldName);
  }

  private countUIConfigPoints(entity: EntityDefinition): number {
    let count = 0;
    const ui = entity.ui;
    
    if (ui?.display) count += Object.keys(ui.display).length;
    if (ui?.list) count += Object.keys(ui.list).length;
    if (ui?.form) count += Object.keys(ui.form).length;
    if (ui?.detail) count += (ui.detail.sections?.length || 0) + (ui.detail.actions?.length || 0);
    
    return count;
  }

  private calculateImpactLevel(usageCount: number): 'low' | 'medium' | 'high' {
    if (usageCount >= 5) return 'high';
    if (usageCount >= 3) return 'medium';
    return 'low';
  }

  private calculateComplexity(): number {
    const entityCount = Object.keys(this.app.entities || {}).length;
    const viewCount = Object.keys(this.app.views || {}).length;
    const workflowCount = Object.keys(this.app.workflows || {}).length;
    
    return entityCount * 10 + viewCount * 5 + workflowCount * 3;
  }

  private calculateHealthScore(entities: EntityAnalysis[]): number {
    let score = 100;
    
    entities.forEach(entity => {
      // Deduct for warnings
      score -= entity.warnings.length * 5;
      
      // Deduct for unused fields
      const unusedFields = entity.fieldUsages.filter(f => f.usagePoints.length === 0);
      score -= unusedFields.length * 10;
    });
    
    return Math.max(0, score);
  }

  private generateWarnings(entity: EntityDefinition, fieldUsages: FieldUsage[]): string[] {
    const warnings: string[] = [];
    
    // Check for unused fields
    const unusedFields = fieldUsages.filter(f => f.usagePoints.length === 0 && !this.isSystemField(f.field, entity.fields[f.field]));
    if (unusedFields.length > 0) {
      warnings.push(`Unused fields: ${unusedFields.map(f => f.field).join(', ')}`);
    }
    
    // Check for missing primary display
    if (!entity.ui?.display?.primary) {
      warnings.push('No primary display field configured');
    }
    
    // Check for fields referenced in UI but not in form
    const displayFields = [
      entity.ui?.display?.primary,
      entity.ui?.display?.secondary,
      entity.ui?.display?.badge
    ].filter(Boolean);
    
    const formFields = entity.ui?.form?.fields || [];
    const missingInForm = displayFields.filter(field => !formFields.includes(field!));
    
    if (missingInForm.length > 0) {
      warnings.push(`Display fields not in form: ${missingInForm.join(', ')}`);
    }
    
    return warnings;
  }

  private generateSuggestions(entity: EntityDefinition, fieldUsages: FieldUsage[]): string[] {
    const suggestions: string[] = [];
    
    // Suggest adding high-impact fields to search
    const highImpactFields = fieldUsages
      .filter(f => f.impactLevel === 'high' && f.field !== 'id')
      .map(f => f.field);
    
    const currentSearchable = entity.ui?.list?.searchable || [];
    const missingFromSearch = highImpactFields.filter(field => !currentSearchable.includes(field));
    
    if (missingFromSearch.length > 0) {
      suggestions.push(`Consider adding to searchable: ${missingFromSearch.join(', ')}`);
    }
    
    // Suggest color coding for enum fields
    const enumFields = Object.entries(entity.fields || {})
      .filter(([name, field]) => field.type === 'enum' && !entity.ui?.display?.color?.field)
      .map(([name]) => name);
    
    if (enumFields.length > 0) {
      suggestions.push(`Consider color coding enum field: ${enumFields[0]}`);
    }
    
    return suggestions;
  }

  private getImpactColor(level: 'low' | 'medium' | 'high'): string {
    switch (level) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
    }
  }
}