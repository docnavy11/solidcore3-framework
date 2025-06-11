import { AppDefinition, EntityDefinition, FieldDefinition } from '../types/index.ts';

export interface SchemaGenerator {
  generateSchema(app: AppDefinition): string[];
  generateTableSchema(entityName: string, entity: EntityDefinition): string;
  getSQLType(field: FieldDefinition): string;
}

export class SQLiteSchemaGenerator implements SchemaGenerator {
  generateSchema(app: AppDefinition): string[] {
    const statements: string[] = [];
    
    // Generate table schemas for each entity
    for (const [entityName, entity] of Object.entries(app.entities)) {
      statements.push(this.generateTableSchema(entityName, entity));
    }
    
    return statements;
  }

  generateTableSchema(entityName: string, entity: EntityDefinition): string {
    const columns: string[] = [];
    
    // Add default ID column if not defined
    if (!entity.fields.id) {
      columns.push('id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16)))');
    }
    
    // Generate columns for each field
    for (const [fieldName, field] of Object.entries(entity.fields)) {
      columns.push(this.generateColumnDefinition(fieldName, field));
    }
    
    // Add audit columns
    columns.push('created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    columns.push('updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    
    const createTable = `
CREATE TABLE IF NOT EXISTS ${entityName.toLowerCase()} (
  ${columns.join(',\n  ')}
);`;

    // Add update trigger
    const updateTrigger = `
CREATE TRIGGER IF NOT EXISTS ${entityName.toLowerCase()}_updated_at
AFTER UPDATE ON ${entityName.toLowerCase()}
BEGIN
  UPDATE ${entityName.toLowerCase()} 
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;`;

    // Add indexes
    let indexes = '';
    if (entity.indexes) {
      for (const indexFields of entity.indexes) {
        const indexName = `idx_${entityName.toLowerCase()}_${indexFields.join('_')}`;
        indexes += `\nCREATE INDEX IF NOT EXISTS ${indexName} ON ${entityName.toLowerCase()} (${indexFields.join(', ')});`;
      }
    }

    return createTable + updateTrigger + indexes;
  }

  private generateColumnDefinition(fieldName: string, field: FieldDefinition): string {
    let column = `${fieldName} ${this.getSQLType(field)}`;
    
    if (field.required) {
      column += ' NOT NULL';
    }
    
    if (field.unique) {
      column += ' UNIQUE';
    }
    
    if (field.default !== undefined) {
      column += ` DEFAULT ${this.formatDefaultValue(field.default, field.type)}`;
    }
    
    return column;
  }

  getSQLType(field: FieldDefinition): string {
    switch (field.type) {
      case 'string':
      case 'text':
      case 'uuid':
      case 'enum':
        return 'TEXT';
      case 'number':
        return 'REAL';
      case 'integer':
        return 'INTEGER';
      case 'boolean':
        return 'INTEGER'; // SQLite doesn't have native boolean
      case 'date':
      case 'datetime':
        return 'DATETIME';
      case 'json':
        return 'TEXT'; // Store JSON as text
      case 'relation':
        return 'TEXT'; // Foreign key as text
      default:
        return 'TEXT';
    }
  }

  private formatDefaultValue(value: any, type: string): string {
    if (value === 'now' || value === 'CURRENT_TIMESTAMP') {
      return 'CURRENT_TIMESTAMP';
    }
    
    if (value === 'auto' && type === 'uuid') {
      return '(hex(randomblob(16)))';
    }
    
    if (typeof value === 'string') {
      return `'${value}'`;
    }
    
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }
    
    return String(value);
  }
}

export function generateDatabaseSchema(app: AppDefinition): string[] {
  const generator = new SQLiteSchemaGenerator();
  return generator.generateSchema(app);
}